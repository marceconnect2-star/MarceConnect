import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AuthError() {
  const searchParams = new URLSearchParams(window.location.search);
  const errorType = searchParams.get('type') || 'unknown';
  const errorMessage = searchParams.get('message');

  const getErrorDetails = () => {
    switch (errorType) {
      case 'domain':
        return {
          title: "Erro de Domínio",
          description: "O domínio atual não está configurado para autenticação. Por favor, acesse através do domínio oficial.",
        };
      case 'callback':
        return {
          title: "Erro no Callback",
          description: "Houve um problema ao processar o retorno da autenticação. Tente novamente.",
        };
      case 'session':
        return {
          title: "Erro de Sessão",
          description: "Sua sessão expirou ou não pôde ser criada. Faça login novamente.",
        };
      default:
        return {
          title: "Erro de Autenticação",
          description: errorMessage || "Ocorreu um erro durante o processo de autenticação. Por favor, tente novamente.",
        };
    }
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl" data-testid="error-title">{errorDetails.title}</CardTitle>
          <CardDescription className="text-base mt-2" data-testid="error-description">
            {errorDetails.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-retry-login"
          >
            Tentar Novamente
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/'}
            data-testid="button-go-home"
          >
            Voltar para Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
