export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function isAuthenticationError(error: Error): boolean {
  return /^(401|403): /.test(error.message);
}

export function handleAuthError(error: Error, toast: any): boolean {
  if (isUnauthorizedError(error)) {
    toast({
      title: "Sessão expirada",
      description: "Você será redirecionado para fazer login novamente...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 1000);
    return true;
  }
  return false;
}