import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import CreateProject from "@/pages/create-project";
import EditProject from "@/pages/edit-project";
import Technicians from "@/pages/technicians";
import Files from "@/pages/files";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import FaqPage from "@/pages/faq";
import FaqDetailPage from "@/pages/faq-detail";
import FaqFormPage from "@/pages/faq-form";
import Profile from "@/pages/profile";
import CompleteProfile from "@/pages/complete-profile";
import AdminPanel from "@/pages/admin-panel";
import AuthError from "@/pages/auth-error";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/auth/error" component={AuthError} />
      
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Landing page - only public route */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/" component={Home} />
      )}
      
      <Route path="/home">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      
      {/* Protected routes - require authentication */}
      <Route path="/complete-profile">
        <ProtectedRoute>
          <CompleteProfile />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPanel />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin-panel">
        <ProtectedRoute>
          <AdminPanel />
        </ProtectedRoute>
      </Route>
      
      <Route path="/faq/create">
        <ProtectedRoute>
          <FaqFormPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/faq/:id/edit">
        <ProtectedRoute>
          <FaqFormPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/faq/:id">
        <ProtectedRoute>
          <FaqDetailPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/faq">
        <ProtectedRoute>
          <FaqPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/projects/:id/edit">
        <ProtectedRoute>
          <EditProject />
        </ProtectedRoute>
      </Route>
      
      <Route path="/projects/:id">
        <ProtectedRoute>
          <ProjectDetail />
        </ProtectedRoute>
      </Route>
      
      <Route path="/projects">
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      </Route>
      
      <Route path="/create-project">
        <ProtectedRoute>
          <CreateProject />
        </ProtectedRoute>
      </Route>
      
      <Route path="/files">
        <ProtectedRoute>
          <Files />
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      
      <Route path="/blog/:slug">
        <ProtectedRoute>
          <BlogPost />
        </ProtectedRoute>
      </Route>
      
      <Route path="/blog">
        <ProtectedRoute>
          <Blog />
        </ProtectedRoute>
      </Route>
      
      <Route path="/technicians">
        <ProtectedRoute>
          <Technicians />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
