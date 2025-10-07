import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().optional(),
  accountType: z.enum(["USER", "TECHNICAL", "COMPANY", "MACHINE_REP", "SOFTWARE_REP"]),
  city: z.string().optional(),
  state: z.string().optional(),
  cncBrandId: z.string().optional(),
  phoneNumber: z.string().optional(),
  cncMachine: z.string().optional(),
  specialties: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cncBrands, setCncBrands] = useState<any[]>([]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      accountType: "USER",
      city: "",
      state: "",
      cncBrandId: "",
      phoneNumber: "",
      cncMachine: "",
      specialties: "",
    },
  });

  const accountType = form.watch("accountType");

  useEffect(() => {
    if (accountType === "TECHNICAL") {
      fetch("/api/cnc-brands")
        .then((res) => res.json())
        .then((data) => setCncBrands(data))
        .catch((error) => console.error("Erro ao carregar marcas CNC:", error));
    }
  }, [accountType]);

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        accountType: data.accountType,
        ...(data.accountType === "TECHNICAL" && {
          city: data.city,
          state: data.state,
          cncBrandId: data.cncBrandId || null,
          phoneNumber: data.phoneNumber,
          cncMachine: data.cncMachine,
          specialties: data.specialties,
        }),
      });

      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para fazer login.",
      });

      setTimeout(() => {
        setLocation("/login");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const accountTypeIcons = {
    USER: "fa-user",
    TECHNICAL: "fa-wrench",
    COMPANY: "fa-building",
    MACHINE_REP: "fa-cogs",
    SOFTWARE_REP: "fa-laptop-code",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12 relative overflow-hidden">
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

      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="absolute top-8 right-8 z-10"
        data-testid="button-back-to-landing"
      >
        <i className="fas fa-arrow-left mr-2"></i>
        Voltar
      </Button>

      {/* Register Card */}
      <Card className="w-full max-w-3xl relative z-10 bg-card/95 backdrop-blur-sm border-border/50 shadow-2xl">
        <CardContent className="pt-8 px-8 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <i className="fas fa-user-plus text-3xl text-primary"></i>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Criar sua conta
            </h2>
            <p className="text-muted-foreground">
              Junte-se à maior comunidade CNC do Brasil
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center text-primary">
                  <i className="fas fa-user-circle mr-2"></i>
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Seu primeiro nome"
                            className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                            data-testid="input-firstname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Sobrenome (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Seu sobrenome"
                            className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                            data-testid="input-lastname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center text-primary">
                  <i className="fas fa-shield-alt mr-2"></i>
                  Segurança
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Senha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Digite a senha novamente"
                            className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center text-primary">
                  <i className="fas fa-id-badge mr-2"></i>
                  Tipo de Conta
                </h3>
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        data-testid="select-account-type"
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors">
                            <SelectValue placeholder="Selecione o tipo de conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USER">
                            <div className="flex items-center">
                              <i className={`fas ${accountTypeIcons.USER} mr-2 text-primary`}></i>
                              Usuário Comum
                            </div>
                          </SelectItem>
                          <SelectItem value="TECHNICAL">
                            <div className="flex items-center">
                              <i className={`fas ${accountTypeIcons.TECHNICAL} mr-2 text-secondary`}></i>
                              Técnico/Marceneiro
                            </div>
                          </SelectItem>
                          <SelectItem value="COMPANY">
                            <div className="flex items-center">
                              <i className={`fas ${accountTypeIcons.COMPANY} mr-2 text-blue-400`}></i>
                              Empresa/Fornecedor
                            </div>
                          </SelectItem>
                          <SelectItem value="MACHINE_REP">
                            <div className="flex items-center">
                              <i className={`fas ${accountTypeIcons.MACHINE_REP} mr-2 text-orange-400`}></i>
                              Representante de Máquinas
                            </div>
                          </SelectItem>
                          <SelectItem value="SOFTWARE_REP">
                            <div className="flex items-center">
                              <i className={`fas ${accountTypeIcons.SOFTWARE_REP} mr-2 text-green-400`}></i>
                              Representante de Software
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Technical User Additional Fields */}
              {accountType === "TECHNICAL" && (
                <div className="space-y-4 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="text-lg font-semibold flex items-center text-primary">
                    <i className="fas fa-tools mr-2"></i>
                    Informações Técnicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Cidade</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: São Paulo"
                              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                              data-testid="input-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Estado</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: SP"
                              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                              data-testid="input-state"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            <i className="fas fa-phone mr-2 text-primary"></i>
                            Telefone
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="(XX) XXXXX-XXXX"
                              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cncMachine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Máquina CNC</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: Router CNC 3040"
                              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                              data-testid="input-cnc-machine"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cncBrandId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Marca CNC</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            data-testid="select-cnc-brand"
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors">
                                <SelectValue placeholder="Selecione a marca" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cncBrands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Especialidades</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: Móveis, Esculturas"
                              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                              data-testid="input-specialties"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  className="h-12 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket mr-2"></i>
                      Criar Conta
                    </>
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Já tem uma conta?
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full border-border/50 hover:bg-accent/50 transition-colors"
                  onClick={() => setLocation("/login")}
                  data-testid="button-go-to-login"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Fazer login
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Ao criar sua conta, você concorda com nossos termos de serviço
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </div>
  );
}
