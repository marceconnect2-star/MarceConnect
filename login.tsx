import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", {
        email: data.email,
        password: data.password,
      });

      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado.",
      });

      setTimeout(() => {
        setLocation("/home");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Email ou senha incorretos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.05), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 107, 0, 0.05), transparent 50%)'
      }}></div>

      {/* Logo/Brand at top left */}
      <div className="absolute top-8 left-8 flex items-center space-x-3 z-10">
        <img 
          src="/logo.png" 
          alt="MarceConnect" 
          className="w-12 h-12 object-contain rounded-lg"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight">MarceConnect</h1>
          <p className="text-xs text-muted-foreground">Conectando Marceneiros</p>
        </div>
      </div>

      {/* Back to landing button */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="absolute top-8 right-8 z-10"
        data-testid="button-back-to-landing"
      >
        <i className="fas fa-arrow-left mr-2"></i>
        Voltar
      </Button>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm border-border/50 shadow-2xl">
        <CardContent className="pt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <i className="fas fa-sign-in-alt text-3xl text-primary"></i>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center">
                      <i className="fas fa-envelope mr-2 text-primary"></i>
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center">
                      <i className="fas fa-lock mr-2 text-primary"></i>
                      Senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Sua senha"
                        className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  className="h-12 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Entrando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Entrar
                    </>
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Ou
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full border-border/50 hover:bg-accent/50 transition-colors"
                  onClick={() => setLocation("/register")}
                  data-testid="button-go-to-register"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  Criar nova conta
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos termos de serviço
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </div>
  );
}
