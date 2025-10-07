import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { z } from "zod";

const SALT_ROUNDS = 10;

// Session configuration
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
    secret: process.env.SESSION_SECRET || "marceconnect-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: sessionTtl,
      path: '/',
    },
    proxy: process.env.NODE_ENV === "production",
  });
}

// Registration schema
const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().optional(),
  accountType: z.enum(["USER", "TECHNICAL", "COMPANY", "MACHINE_REP", "SOFTWARE_REP"]).default("USER"),
  // Technical user fields
  city: z.string().optional(),
  state: z.string().optional(),
  cncBrandId: z.string().optional().nullable(),
  phoneNumber: z.string().optional(),
  cncMachine: z.string().optional(),
  specialties: z.string().optional(),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: "Conta criada com método diferente" });
          }

          if (user.isBanned) {
            return done(null, false, { message: "Esta conta foi banida. Entre em contato com o administrador." });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Este email já está cadastrado" 
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

      // Create user with all fields
      const newUser = await storage.createUser({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        accountType: validatedData.accountType,
        city: validatedData.city,
        state: validatedData.state,
        cncBrandId: validatedData.cncBrandId,
        phoneNumber: validatedData.phoneNumber,
        cncMachine: validatedData.cncMachine,
        specialties: validatedData.specialties ? [validatedData.specialties] : undefined,
      });

      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login automático" });
        }
        res.json({ 
          message: "Cadastro realizado com sucesso",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            accountType: newUser.accountType,
          }
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors 
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro no servidor" });
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Email ou senha incorretos" 
        });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Erro ao fazer login" });
        }
        
        res.json({
          message: "Login realizado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            accountType: user.accountType,
            isAdmin: user.isAdmin,
          }
        });
      });
    })(req, res, next);
  });

  // Logout endpoint (both GET and POST for compatibility)
  const logoutHandler = (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      req.session.destroy((sessionErr: any) => {
        if (sessionErr) {
          console.error("Session destroy error:", sessionErr);
        }
        res.clearCookie('connect.sid');
        // Redirect to home page for GET requests
        if (req.method === 'GET') {
          return res.redirect('/');
        }
        res.json({ message: "Logout realizado com sucesso" });
      });
    });
  };
  
  app.get("/api/logout", logoutHandler);
  app.post("/api/logout", logoutHandler);
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const user = req.user;
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        message: "Acesso negado. Apenas administradores podem realizar esta ação." 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Erro ao verificar permissões" });
  }
};

// Helper to check if user can modify a resource
export async function canModifyResource(userId: string, authorId: string): Promise<boolean> {
  if (userId === authorId) {
    return true;
  }
  
  const user = await storage.getUserById(userId);
  return user?.isAdmin || false;
}
