import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowLeft, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

const EmailConfirmationPending = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState(email);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer para evitar spam de reenvio
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleResendConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!resendEmail.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    if (cooldownSeconds > 0) {
      toast.error(`Aguarde ${cooldownSeconds}s antes de reenviar`);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      });

      if (error) {
        if (error.message.includes('rate')) {
          toast.error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
          setCooldownSeconds(300); // 5 minutos de cooldown
        } else {
          toast.error(error.message || 'Erro ao reenviar email');
        }
        throw error;
      }

      toast.success('Email de confirmação reenviado! Verifique sua caixa de entrada.');
      setShowResendForm(false);
      setResendEmail(email);
      setCooldownSeconds(60); // 60 segundos de cooldown após sucesso
    } catch (error) {
      console.error('Error resending email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Prime<span className="text-primary">Luxury</span>
              </span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-card border rounded-2xl p-8 md:p-12 text-center space-y-8">
            {/* Animated Icon */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Mail className="w-12 h-12 text-primary" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Confirme seu Email!
              </h1>
              <p className="text-lg text-muted-foreground">
                Enviamos um link de confirmação para <br />
                <span className="font-semibold text-foreground">{email || 'seu email'}</span>
              </p>
            </div>

            {/* Steps */}
            <div className="bg-muted/50 rounded-xl p-6 space-y-4 text-left">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                </div>
                <div>
                  <p className="font-medium">Abra seu email</p>
                  <p className="text-sm text-muted-foreground">Procure pela mensagem da PrimeLuxury</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                </div>
                <div>
                  <p className="font-medium">Clique no link de confirmação</p>
                  <p className="text-sm text-muted-foreground">O link o levará para confirmar seu cadastro</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                </div>
                <div>
                  <p className="font-medium">Pronto! Você está confirmado</p>
                  <p className="text-sm text-muted-foreground">Retorne para fazer login em sua conta</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Não recebeu o email?
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 ml-6">
                <li>✓ Verifique a pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong></li>
                <li>✓ Aguarde alguns minutos para receber</li>
                <li>✓ Pode ser que o email chegue com atraso</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {!showResendForm ? (
                <>
                  <Button
                    onClick={() => setShowResendForm(true)}
                    variant="outline"
                    className="w-full"
                    disabled={cooldownSeconds > 0}
                  >
                    {cooldownSeconds > 0 
                      ? `Aguarde ${cooldownSeconds}s para reenviar` 
                      : 'Reenviar Email de Confirmação'}
                  </Button>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90">
                    <Link to="/login">
                      Voltar para Login
                    </Link>
                  </Button>
                </>
              ) : (
                <form onSubmit={handleResendConfirmation} className="space-y-3">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email para reenviar confirmação
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading || !resendEmail || cooldownSeconds > 0}
                      className="flex-1"
                    >
                      {isLoading ? 'Reenviando...' : 'Reenviar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowResendForm(false);
                        setResendEmail(email);
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Help */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                O link de confirmação é válido por 24 horas
              </p>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmailConfirmationPending;
