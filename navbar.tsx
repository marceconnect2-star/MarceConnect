import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Início", icon: "fas fa-home-lg-alt" },
    { href: "/projects", label: "Projetos", icon: "fas fa-layer-group" },
    { href: "/technicians", label: "Técnicos", icon: "fas fa-user-gear" },
    { href: "/faq", label: "FAQ", icon: "fas fa-circle-question" },
    { href: "/blog", label: "Blog", icon: "fas fa-newspaper" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer" data-testid="navbar-logo">
                <img 
                  src="/logo.png" 
                  alt="CNC Marcenaria Brasil" 
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-foreground">CNC Marcenaria Brasil</h1>
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button 
                  className={`nav-item px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                    location === item.href ? 'active' : ''
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => window.open('https://chat.whatsapp.com/GulI6fhMQcRLkkjZKTtbd6', '_blank')}
              data-testid="navbar-whatsapp"
            >
              <i className="fab fa-whatsapp mr-2"></i>
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="navbar-user-menu">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "Usuário"} />
                      <AvatarFallback>
                        {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.firstName && (
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      )}
                      {user.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem data-testid="menu-profile">
                      <i className="fas fa-user-circle mr-2"></i>
                      Perfil
                    </DropdownMenuItem>
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem data-testid="menu-admin">
                        <i className="fas fa-crown mr-2 text-primary"></i>
                        <span className="text-primary font-semibold">Painel Admin</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="menu-logout"
                  >
                    <i className="fas fa-door-open mr-2"></i>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => window.location.href = '/api/login'}
                data-testid="navbar-login"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Login
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              data-testid="navbar-mobile-menu"
            >
              <i className="fas fa-bars text-lg"></i>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
