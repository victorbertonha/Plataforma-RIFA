import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ticketsAPI } from '@/services/api';
import { ArrowLeft, ShoppingBag, CheckCircle, Clock, Ticket, Loader2 } from 'lucide-react';

interface Order {
  id: string;
  campaign_id: string;
  campaign_title: string;
  ticket_numbers: number[];
  amount: number;
  tax: number;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string; Icon: typeof CheckCircle }> = {
    completed: { label: 'Confirmado', className: 'bg-green-500/20 text-green-600 dark:text-green-400', Icon: CheckCircle },
    pending:   { label: 'Pendente',   className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400', Icon: Clock },
  };
  const { label, className, Icon } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    ticketsAPI.getOrders()
      .then((data) => setOrders(data.orders))
      .catch(() => setError('Não foi possível carregar seus pedidos.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-20">
        <Button variant="ghost" size="sm" className="mb-8 -ml-2" asChild>
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            Meus Pedidos
          </h1>
          <p className="text-muted-foreground mt-2">Suas cotas compradas e histórico de pagamentos</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-destructive">{error}</div>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido realizado</h3>
            <p className="text-muted-foreground mb-6">Você ainda não comprou nenhuma cota</p>
            <Button asChild><Link to="/">Explorar Campanhas</Link></Button>
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{order.campaign_title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Cotas */}
                <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {order.ticket_numbers?.length ?? 0} cota{(order.ticket_numbers?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {order.ticket_numbers?.map((n) => (
                      <span key={n} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono font-semibold">
                        #{String(n).padStart(4, '0')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Valores */}
                <div className="space-y-1.5 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(Number(order.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa (1%)</span>
                    <span>{formatCurrency(Number(order.tax))}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(Number(order.total))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;
