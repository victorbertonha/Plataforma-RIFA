import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const STATUS_CONFIG = {
  approved: {
    icon: CheckCircle,
    iconClass: 'text-green-500',
    title: 'Pagamento Confirmado!',
    description: 'Suas cotas foram reservadas com sucesso. Boa sorte!',
    bgClass: 'bg-green-500/10',
  },
  pending: {
    icon: Clock,
    iconClass: 'text-yellow-500',
    title: 'Pagamento Pendente',
    description: 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
    bgClass: 'bg-yellow-500/10',
  },
  failure: {
    icon: XCircle,
    iconClass: 'text-red-500',
    title: 'Pagamento Não Aprovado',
    description: 'Houve um problema com seu pagamento. Tente novamente.',
    bgClass: 'bg-red-500/10',
  },
};

const OrderConfirmed = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const status = (searchParams.get('status') as keyof typeof STATUS_CONFIG) || 'approved';
  const paymentId = searchParams.get('payment_id');

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.approved;
  const Icon = config.icon;

  useEffect(() => {
    if (status === 'approved') {
      clearCart();
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center space-y-6 max-w-md w-full">
          <div className={`w-24 h-24 rounded-full ${config.bgClass} flex items-center justify-center mx-auto`}>
            <Icon className={`w-12 h-12 ${config.iconClass}`} />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
            <p className="text-muted-foreground text-lg">{config.description}</p>
          </div>

          {paymentId && (
            <div className="bg-muted rounded-xl px-4 py-3 text-sm text-muted-foreground">
              ID do pagamento: <span className="font-mono font-medium text-foreground">{paymentId}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {status !== 'approved' && (
              <Button size="lg" asChild>
                <Link to="/carrinho">
                  Tentar Novamente
                </Link>
              </Button>
            )}
            <Button size="lg" variant={status === 'approved' ? 'default' : 'outline'} asChild>
              <Link to="/meus-pedidos">
                <ChevronRight className="w-4 h-4 mr-2" />
                Meus Pedidos
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">Ver Campanhas</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmed;
