import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { paymentsAPI } from '@/services/api';
import { Minus, Plus, Trash2, ShoppingCart, ChevronRight, Check, HelpCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const navigate = useNavigate();
  const { items, totalPrice, totalItems, removeFromCart, updateQuantity, clearCart, syncWithBackend, isReserving, reservationErrors } = useCart();
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);


  const taxRate = 0.01; // 1%
  const taxAmount = totalPrice * taxRate;
  const finalTotal = totalPrice + taxAmount;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const handleRemoveItem = (campaignId: string) => {
    removeFromCart(campaignId);
    toast.success('Item removido do carrinho');
  };

  const handleUpdateQuantity = (campaignId: string, newQuantity: number) => {
    updateQuantity(campaignId, newQuantity);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para finalizar a compra', {
        description: 'Será redirecionado para o login em alguns segundos...',
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    setIsProcessing(true);

    try {
      // Reserva cotas não sincronizadas antes de pagar
      const unsyncedItems = items.filter((item) => !item.ticketNumbers || item.ticketNumbers.length === 0);
      if (unsyncedItems.length > 0) {
        await Promise.all(unsyncedItems.map((item) => syncWithBackend(item.campaignId)));
      }

      const { init_point, sandbox_init_point } = await paymentsAPI.createPreference();
      // Use sandbox URL when available (test token), otherwise production
      window.location.href = sandbox_init_point || init_point;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar pagamento. Tente novamente.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-24 pb-20">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Carrinho Vazio</h1>
              <p className="text-muted-foreground text-lg mb-6">
                Você ainda não adicionou nenhuma cota ao seu carrinho
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to="/">
                <ChevronRight className="w-4 h-4 mr-2" />
                Voltar para Campanhas
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-20">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              Campanhas
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Carrinho</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Seu Carrinho</h1>
                <span className="text-sm text-muted-foreground">
                  {totalItems} {totalItems === 1 ? 'cota' : 'cotas'}
                </span>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs font-medium text-primary uppercase tracking-wider">
                              {item.category}
                            </p>
                            <h3 className="font-semibold truncate">{item.title}</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.campaignId)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.pricePerTicket)} por cota
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.campaignId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.campaignId, item.quantity + 1)}
                              disabled={item.quantity >= 100}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reservation error */}
                    {reservationErrors[item.campaignId] && (
                      <p className="mt-2 text-xs text-destructive">
                        ⚠ {reservationErrors[item.campaignId]}
                      </p>
                    )}

                    {/* Item Total */}
                    <div className="mt-3 pt-3 border-t border-border flex justify-end">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Total do item</p>
                        <p className="font-bold text-lg text-primary">
                          {formatCurrency(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="h-fit">
            <div className="sticky top-24 p-6 rounded-2xl border border-border bg-card space-y-6">
              <h2 className="text-lg font-bold">Resumo do Pedido</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({totalItems} cotas)</span>
                  <span className="font-medium">{formatCurrency(totalPrice)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Taxa</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p>Taxa de processamento para manutenção da plataforma de rifa e segurança das transações.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>

                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-primary">
                    ✓ Você está com tudo pronto para comprar!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Faça login ou crie uma conta para finalizar sua compra com segurança.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full btn-press glow-primary"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin mr-2">⌛</div>
                      Processando...
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Faça Login para Comprar
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Finalizar Compra
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link to="/">Continuar Comprando</Link>
                </Button>
              </div>

              <div className="text-xs text-center text-muted-foreground space-y-2">
                <p className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    ✓
                  </span>
                  Pagamento 100% seguro
                </p>
                <p>Você receberá um e-mail de confirmação</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
