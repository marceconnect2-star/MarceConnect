import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Search, 
  Plus, 
  Eye, 
  User, 
  Calendar,
  Filter,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

const categories = [
  { value: 'all', label: 'Todas as Categorias' },
  { value: 'CNC', label: 'CNC e Máquinas' },
  { value: 'SOFTWARE', label: 'Software CAM' },
  { value: 'MATERIAIS', label: 'Materiais' },
  { value: 'TECNICAS', label: 'Técnicas' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'GERAL', label: 'Geral' },
];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: user } = useQuery<any>({ queryKey: ['/api/auth/user'] });
  const { data: faqs, isLoading } = useQuery<Faq[]>({
    queryKey: ['/api/faqs', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory && selectedCategory !== 'all' 
        ? `/api/faqs?category=${selectedCategory}`
        : '/api/faqs';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch FAQs');
      return await res.json();
    },
  });

  const filteredFaqs = faqs?.filter((faq) => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col gap-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home" className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Início
            </Button>
          </Link>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
                <HelpCircle className="h-10 w-10" />
                Perguntas Frequentes
              </h1>
              <p className="text-muted-foreground mt-2">
                Tire suas dúvidas sobre marcenaria CNC, máquinas, software e técnicas
              </p>
            </div>
            {user && (
              <Link href="/faq/create">
                <Button size="lg" data-testid="button-create-faq">
                  <Plus className="h-5 w-5 mr-2" />
                  Nova Pergunta
                </Button>
              </Link>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar perguntas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-faqs"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[240px]" data-testid="select-faq-category">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!user && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> Faça login para criar suas próprias perguntas e ajudar a comunidade!
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredFaqs && filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <Link key={faq.id} href={`/faq/${faq.id}`}>
                  <Card 
                    className="hover:border-primary transition-colors cursor-pointer"
                    data-testid={`card-faq-${faq.id}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2 flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-circle-question text-primary"></i>
                            </div>
                            <span>{faq.question}</span>
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                            {faq.category && (
                              <Badge variant="outline" className="capitalize flex items-center gap-1.5">
                                <i className={`fas ${
                                  faq.category === 'machines' ? 'fa-cogs text-blue-500' :
                                  faq.category === 'software' ? 'fa-laptop-code text-purple-500' :
                                  faq.category === 'materials' ? 'fa-cube text-orange-500' :
                                  faq.category === 'maintenance' ? 'fa-wrench text-green-500' :
                                  faq.category === 'techniques' ? 'fa-graduation-cap text-secondary' :
                                  'fa-circle-question text-muted-foreground'
                                } text-xs`}></i>
                                {categories.find((c) => c.value === faq.category)?.label || faq.category}
                              </Badge>
                            )}
                            <span className="flex items-center gap-1.5">
                              <i className="fas fa-user text-primary text-xs"></i>
                              {faq.author?.firstName || faq.author?.email || 'Anônimo'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <i className="fas fa-calendar text-secondary text-xs"></i>
                              {format(new Date(faq.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <i className="fas fa-eye text-blue-500 text-xs"></i>
                              {faq.viewCount} visualizações
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {faq.answer.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HelpCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Nenhuma pergunta encontrada' 
                    : 'Ainda não há perguntas'}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Tente ajustar seus filtros de busca'
                    : 'Seja o primeiro a fazer uma pergunta!'}
                </p>
                {user && (
                  <Link href="/faq/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Pergunta
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
