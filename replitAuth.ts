import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  const getStrategyName = (hostname: string): string | null => {
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const matchingDomain = domains.find(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    
    if (matchingDomain) {
      console.log(`[Auth] Using strategy for domain: ${matchingDomain}`);
      return `replitauth:${matchingDomain}`;
    }
    
    console.log(`[Auth] No matching strategy for hostname ${hostname}. Available domains: ${domains.join(', ')}`);
    return null;
  };

  const handleAuthError = (req: any, res: any, message: string, errorType: string) => {
    console.error(`[Auth] ${message} (hostname: ${req.hostname})`);
    const errorUrl = `/auth/error?type=${errorType}&message=${encodeURIComponent(message)}`;
    res.redirect(errorUrl);
  };

  app.get("/api/login", (req, res, next) => {
    try {
      const strategyName = getStrategyName(req.hostname);
      
      if (!strategyName) {
        return handleAuthError(
          req,
          res,
          "Domínio não autorizado. Por favor, acesse através de um domínio oficial.",
          "domain"
        );
      }
      
      console.log(`[Auth] Login attempt from ${req.hostname} using strategy ${strategyName}`);
      
      passport.authenticate(strategyName, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } catch (error) {
      console.error(`[Auth] Login error for ${req.hostname}:`, error);
      handleAuthError(
        req,
        res,
        "Erro ao iniciar autenticação",
        "unknown"
      );
    }
  });

  app.get("/api/callback", (req, res, next) => {
    try {
      const strategyName = getStrategyName(req.hostname);
      
      if (!strategyName) {
        return handleAuthError(
          req,
          res,
          "Domínio não autorizado para callback. Por favor, acesse através de um domínio oficial.",
          "domain"
        );
      }
      
      console.log(`[Auth] Callback from ${req.hostname} using strategy ${strategyName}`);
      
      passport.authenticate(strategyName, (err: any, user: any, info: any) => {
        if (err) {
          console.error(`[Auth] Passport authentication error:`, err);
          return handleAuthError(req, res, "Erro durante autenticação", "callback");
        }
        
        if (!user) {
          console.error(`[Auth] No user returned from authentication. Info:`, info);
          return handleAuthError(req, res, "Falha na autenticação", "callback");
        }
        
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error(`[Auth] Session login error:`, loginErr);
            return handleAuthError(req, res, "Erro ao criar sessão", "session");
          }
          
          console.log(`[Auth] User logged in successfully: ${user.claims?.sub}`);
          res.redirect("/");
        });
      })(req, res, next);
    } catch (error) {
      console.error(`[Auth] Callback error for ${req.hostname}:`, error);
      handleAuthError(req, res, "Erro no callback de autenticação", "callback");
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUserById(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Erro ao verificar permissões" });
  }
};

export async function canModifyResource(userId: string, authorId: string): Promise<boolean> {
  if (userId === authorId) {
    return true;
  }
  
  const user = await storage.getUserById(userId);
  return user?.isAdmin || false;
}
