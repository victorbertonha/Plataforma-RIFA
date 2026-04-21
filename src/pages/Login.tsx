import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, ChevronRight, Zap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { clearAllCache } from '@/components/CacheCleaner';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearAllCache();
      toast.success('Cache limpo! Recarregando...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      toast.error('Erro ao limpar cache');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Prime<span className="text-primary">Luxury</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Faça login para acessar sua conta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full btn-press glow-primary mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Ou</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            asChild
          >
            <Link to="/cadastro">
              Criar nova conta
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>

          {/* Clear Cache Button - Hidden but accessible */}
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            className="w-full mt-3 px-3 py-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 hover:bg-secondary/30 rounded-md"
            title="Clique aqui se estiver preso em carregamento infinito"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isClearing ? 'Limpando...' : 'Limpar Cache'}
          </button>

          {/* Footer Text */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            Ao entrar, você concorda com nossos{' '}
            <a href="#" className="text-primary hover:underline">
              Termos de Serviço
            </a>
            {' '}e{' '}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
