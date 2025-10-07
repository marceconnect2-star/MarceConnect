import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  HelpCircle, 
  User, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2,
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface Faq {
  id: string;
  question: string;
  answer: string | null;
  category: string | null;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
}

interface FaqAnswer {
  id: string;
  faqId: string;
  authorId: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
}

const categories: Record<string, string> = {
  'CNC': 'CNC e Máquinas',
  'SOFTWARE': 'Software CAM',
  'MATERIAIS': 'Materiais',
  'TECNICAS': 'Técnicas',
  'MANUTENCAO': 'Manutenção',
  'GERAL': 'Geral',
};

const answerSchema = z.object({
  content: z.string().min(10, 'A resposta deve ter pelo menos 10 caracteres'),
});

export default function FaqDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);

  const { data: user } = useQuery<any>({ queryKey: ['/api/auth/user'] });
  const { data: faq, isLoading } = useQuery<Faq>({
    queryKey: ['/api/faqs', id],
  });
  
  const { data: answers, isLoading: answersLoading } = useQuery<FaqAnswer[]>({
    queryKey: ['/api/faqs', id, 'answers'],
    queryFn: async () => {
      const res = await fetch(`/api/faqs/${id}/answers`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch answers');
      return await res.json();
    },
  });

  const form = useForm<z.infer<typeof answerSchema>>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      content: '',
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/faqs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({
        title: "Pergunta deletada!",
        description: "A pergunta foi removida com sucesso.",
      });
      navigate('/faq');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar",
        description: error.message || "Não foi possível deletar a pergunta.",
        variant: "destructive",
      });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: (data: z.infer<typeof answerSchema>) => 
      apiRequest('POST', `/api/faqs/${id}/answers`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', id, 'answers'] });
      form.reset();
      toast({
        title: "Resposta enviada!",
        description: "Sua resposta foi publicada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar resposta",
        description: error.message || "Não foi possível enviar a resposta.",
        variant: "destructive",
      });
    },
  });

  const updateAnswerMutation = useMutation({
    mutationFn: ({ answerId, data }: { answerId: string; data: z.infer<typeof answerSchema> }) => 
      apiRequest('PUT', `/api/faqs/${id}/answers/${answerId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', id, 'answers'] });
      setEditingAnswerId(null);
      toast({
        title: "Resposta atualizada!",
        description: "Suas alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar resposta",
        description: error.message || "Não foi possível atualizar a resposta.",
        variant: "destructive",
      });
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: (answerId: string) => 
      apiRequest('DELETE', `/api/faqs/${id}/answers/${answerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', id, 'answers'] });
      toast({
        title: "Resposta deletada!",
        description: "A resposta foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar resposta",
        description: error.message || "Não foi possível deletar a resposta.",
        variant: "destructive",
      });
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: (answerId: string) => 
      apiRequest('POST', `/api/faqs/${id}/answers/${answerId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', id, 'answers'] });
      toast({
        title: "Resposta aceita!",
        description: "Esta resposta foi marcada como a melhor resposta.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aceitar resposta",
        description: error.message || "Não foi possível aceitar a resposta.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof answerSchema>) => {
    createAnswerMutation.mutate(data);
  };

  const canEditFaq = user && faq && (user.id === faq.author?.id || user.isAdmin);
  const canAcceptAnswer = user && faq && user.id === faq.author?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Pergunta não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              Esta pergunta pode ter sido removida ou não existe.
            </p>
            <Link href="/faq">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para FAQ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/faq">
            <Button variant="ghost" size="sm" data-testid="button-back-to-faq">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para FAQ
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-3 flex items-start gap-3">
                  <HelpCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  <span>{faq.question}</span>
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-3">
                  {faq.category && (
                    <Badge variant="outline" className="capitalize">
                      {categories[faq.category] || faq.category}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(faq.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {faq.viewCount} visualizações
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {answers?.length || 0} {answers?.length === 1 ? 'resposta' : 'respostas'}
                  </span>
                </CardDescription>
              </div>
              {canEditFaq && (
                <div className="flex gap-2">
                  <Link href={`/faq/${id}/edit`}>
                    <Button variant="outline" size="sm" data-testid="button-edit-faq">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-delete-faq">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A pergunta será permanentemente removida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteFaqMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {faq.answer && (
              <>
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                  data-testid="faq-answer-content"
                />

                <div className="pt-6 border-t flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={faq.author?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {(faq.author?.firstName?.[0] || faq.author?.email?.[0] || 'A').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      Pergunta e resposta por
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {faq.author?.firstName 
                        ? `${faq.author.firstName} ${faq.author.lastName || ''}`
                        : faq.author?.email || 'Anônimo'}
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {!faq.answer && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Esta pergunta ainda não tem resposta.</p>
                <p className="text-sm">Seja o primeiro a responder!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answers Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Respostas da Comunidade ({answers?.length || 0})
          </h2>

          {answersLoading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : answers && answers.length > 0 ? (
            <div className="space-y-4">
              {answers.map((answer) => {
                const isAuthor = user && answer.authorId === user.id;
                const canEdit = isAuthor || user?.isAdmin;
                const isEditing = editingAnswerId === answer.id;

                return (
                  <Card 
                    key={answer.id} 
                    className={answer.isAccepted ? 'border-green-500/50 bg-green-500/5' : ''}
                    data-testid={`answer-${answer.id}`}
                  >
                    <CardContent className="pt-6">
                      {answer.isAccepted && (
                        <div className="mb-3 flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-semibold">Melhor Resposta</span>
                        </div>
                      )}
                      
                      {isEditing ? (
                        <Form {...form}>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const content = form.getValues('content');
                            updateAnswerMutation.mutate({ answerId: answer.id, data: { content } });
                          }} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <RichTextEditor
                                      content={field.value}
                                      onChange={field.onChange}
                                      placeholder="Edite sua resposta..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2">
                              <Button 
                                type="submit" 
                                disabled={updateAnswerMutation.isPending}
                                data-testid="button-save-answer"
                              >
                                Salvar
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setEditingAnswerId(null)}
                                data-testid="button-cancel-edit"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <>
                          <div 
                            className="prose prose-invert max-w-none mb-4"
                            dangerouslySetInnerHTML={{ __html: answer.content }}
                            data-testid={`answer-content-${answer.id}`}
                          />
                          
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={answer.author?.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {(answer.author?.firstName?.[0] || answer.author?.email?.[0] || 'A').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {answer.author?.firstName 
                                    ? `${answer.author.firstName} ${answer.author.lastName || ''}`
                                    : answer.author?.email || 'Anônimo'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(answer.createdAt), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              {canAcceptAnswer && !answer.isAccepted && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => acceptAnswerMutation.mutate(answer.id)}
                                  disabled={acceptAnswerMutation.isPending}
                                  data-testid={`button-accept-answer-${answer.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aceitar
                                </Button>
                              )}
                              {canEdit && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingAnswerId(answer.id);
                                      form.setValue('content', answer.content);
                                    }}
                                    data-testid={`button-edit-answer-${answer.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        data-testid={`button-delete-answer-${answer.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Deletar resposta?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteAnswerMutation.mutate(answer.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Deletar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Ainda não há respostas para esta pergunta.</p>
                <p className="text-sm">Seja o primeiro a ajudar!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Answer Form */}
        {user ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sua Resposta</CardTitle>
              <CardDescription>
                Compartilhe seu conhecimento e ajude outros marceneiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resposta</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="Escreva sua resposta aqui... Você pode incluir formatação, imagens e links."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={createAnswerMutation.isPending}
                    data-testid="button-submit-answer"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createAnswerMutation.isPending ? 'Enviando...' : 'Enviar Resposta'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-6 border-primary/50 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold mb-2">Faça login para responder</p>
              <p className="text-sm text-muted-foreground mb-4">
                Entre na sua conta para compartilhar seu conhecimento com a comunidade
              </p>
              <Link href="/api/login">
                <Button variant="outline">
                  Fazer Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
