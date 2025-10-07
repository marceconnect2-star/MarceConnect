import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { z } from 'zod';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const faqSchema = z.object({
  question: z.string().min(10, 'A pergunta deve ter pelo menos 10 caracteres'),
  answer: z.string().optional().or(z.literal('')),
  category: z.string().nullable(),
  isPublished: z.boolean().default(true),
});

type FaqFormData = z.infer<typeof faqSchema>;

const categories = [
  { value: 'NONE', label: 'Nenhuma categoria' },
  { value: 'CNC', label: 'CNC e Máquinas' },
  { value: 'SOFTWARE', label: 'Software CAM' },
  { value: 'MATERIAIS', label: 'Materiais' },
  { value: 'TECNICAS', label: 'Técnicas' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'GERAL', label: 'Geral' },
];

export default function FaqFormPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: faq, isLoading } = useQuery({
    queryKey: ['/api/faqs', id],
    enabled: isEditing,
  });

  const form = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: '',
      answer: '',
      category: 'NONE',
      isPublished: true,
    },
  });

  useEffect(() => {
    if (faq && isEditing) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'NONE',
        isPublished: faq.isPublished,
      });
    }
  }, [faq, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      const res = await apiRequest('POST', '/api/faqs', data);
      return await res.json();
    },
    onSuccess: (newFaq) => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({
        title: "Pergunta criada!",
        description: "Sua pergunta foi publicada com sucesso.",
      });
      navigate(`/faq/${newFaq.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar pergunta",
        description: error.message || "Não foi possível criar a pergunta.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      const res = await apiRequest('PUT', `/api/faqs/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs', id] });
      toast({
        title: "Pergunta atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
      navigate(`/faq/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar a pergunta.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FaqFormData) => {
    const submitData = {
      ...data,
      category: data.category === 'NONE' ? null : data.category,
    };
    
    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href={isEditing ? `/faq/${id}` : '/faq'}>
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <HelpCircle className="h-8 w-8 text-primary" />
              {isEditing ? 'Editar Pergunta' : 'Nova Pergunta'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Atualize sua pergunta e resposta' 
                : 'Compartilhe seu conhecimento e ajude outros marceneiros'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pergunta</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Como calibrar minha CNC para cortes precisos?"
                          {...field}
                          data-testid="input-faq-question"
                        />
                      </FormControl>
                      <FormDescription>
                        Seja claro e específico na sua pergunta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-faq-category">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Ajuda outros usuários a encontrar sua pergunta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resposta (Opcional)</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Escreva uma resposta ou deixe em branco para a comunidade responder..."
                        />
                      </FormControl>
                      <FormDescription>
                        Você pode deixar este campo vazio e permitir que outros usuários respondam sua pergunta. Use formatação para tornar a resposta mais clara.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Publicar pergunta
                        </FormLabel>
                        <FormDescription>
                          Torne esta pergunta visível para todos os usuários
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-faq-published"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 justify-end">
                  <Link href={isEditing ? `/faq/${id}` : '/faq'}>
                    <Button type="button" variant="outline" disabled={isPending}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isPending} data-testid="button-submit-faq">
                    {isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {isEditing ? 'Salvando...' : 'Criando...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditing ? 'Salvar Alterações' : 'Criar Pergunta'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
