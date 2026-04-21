import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getCampaignById, getVisualStatus } from '@/data/campaigns';
import { useCart } from '@/context/CartContext';
import { 
  ArrowLeft,
  Minus,
  Plus,
  Ticket,
  Clock,
  Users,
  TrendingUp,
  Shield,
  ChevronRight,
  Check,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const campaign = id ? getCampaignById(id) : undefined;

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
          <Button asChild>
            <Link to="/">Voltar para Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const visualStatus = getVisualStatus(campaign);
  const progressPercentage = (campaign.soldTickets / campaign.totalTickets) * 100;
  const remainingTickets = campaign.totalTickets - campaign.soldTickets;
  const isDisabled = campaign.status === 'finished';
  const totalPrice = quantity * campaign.pricePerTicket;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const statusBadge = {
    active: { label: 'Disponível', className: 'badge-active' },
    ending: { label: 'Últimas Cotas', className: 'badge-ending animate-pulse-glow' },
    finished: { label: 'Concluído', className: 'badge-finished' },
  };

  const handleAddToCart = () => {
    if (!campaign) return;

    addToCart({
      id: campaign.id,
      campaignId: campaign.id,
      title: campaign.title,
      quantity,
      pricePerTicket: campaign.pricePerTicket,
      image: campaign.images[0],
      category: campaign.category,
    });

    toast.success(`${quantity} cota(s) adicionada(s) ao carrinho!`, {
      description: `${campaign.title} - ${formatCurrency(totalPrice)}`,
    });

    // Reset quantity
    setQuantity(1);
  };

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, remainingTickets));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));
  const addQuantity = (amount: number) => setQuantity(prev => Math.min(prev + amount, remainingTickets));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="pt-24 pb-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              Campanhas
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{campaign.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-card">
                {isLoading ? (
                  <div className="w-full h-full skeleton-premium" />
                ) : (
                  <img
                    src={campaign.images[0]}
                    alt={campaign.title}
                    className="w-full h-full object-cover animate-fade-in"
                  />
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusBadge[visualStatus].className}`}>
                    {statusBadge[visualStatus].label}
                  </span>
                </div>
              </div>

              {/* Thumbnail Gallery (placeholder for multiple images) */}
              <div className="hidden md:flex gap-3">
                {[1, 2, 3, 4].map((_, i) => (
                  <div
                    key={i}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      i === 0 ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={campaign.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Back Button (Mobile) */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden -ml-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {/* Title */}
              <div>
                <span className="text-sm font-medium text-primary uppercase tracking-wider">
                  {campaign.category}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mt-2">{campaign.title}</h1>
                <p className="text-lg text-muted-foreground mt-2">{campaign.subtitle}</p>
              </div>

              {/* Description */}
              <p className="text-foreground/80 leading-relaxed">{campaign.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(campaign.pricePerTicket)}
                  </p>
                  <p className="text-xs text-muted-foreground">por cota</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold">{formatNumber(campaign.soldTickets)}</p>
                  <p className="text-xs text-muted-foreground">vendidas</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-bold">{campaign.endText}</p>
                  <p className="text-xs text-muted-foreground">término</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso da Campanha</span>
                  <span className={`text-sm font-bold ${
                    visualStatus === 'ending' ? 'text-warning' : 'text-primary'
                  }`}>
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-premium h-3">
                  <div
                    className={`progress-premium-fill ${visualStatus === 'ending' ? 'ending' : ''}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(campaign.soldTickets)} de {formatNumber(campaign.totalTickets)} cotas vendidas
                  {!isDisabled && (
                    <span className="ml-2">
                      • Restam <span className="text-foreground font-medium">{formatNumber(remainingTickets)}</span>
                    </span>
                  )}
                </p>
              </div>

              {/* Quantity Selector & CTA */}
              {!isDisabled && (
                <div className="space-y-4 p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Quantidade de Cotas</span>
                      <span className="inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full btn-press"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full btn-press"
                        onClick={incrementQuantity}
                        disabled={quantity >= remainingTickets}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {[10, 100, 1000].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          className="h-9 rounded-full btn-press text-sm font-semibold px-3"
                          onClick={() => addQuantity(amount)}
                          disabled={quantity >= remainingTickets}
                        >
                          +{amount}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full btn-press"
                        onClick={() => setShowCustomInput(v => !v)}
                        title="Quantidade personalizada"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {showCustomInput && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={remainingTickets}
                        placeholder={`Ex: 300 (máx. ${remainingTickets})`}
                        className="rounded-xl"
                        autoFocus
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) {
                            setQuantity(Math.min(val, remainingTickets));
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between py-4 border-t border-border">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className={`w-full text-base btn-press glow-primary ${
                      visualStatus === 'ending'
                        ? 'bg-warning hover:bg-warning/90 text-warning-foreground glow-warning'
                        : ''
                    }`}
                    onClick={handleAddToCart}
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Adicionar ao Carrinho
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Pagamento 100% seguro</span>
                  </div>
                </div>
              )}

              {isDisabled && (
                <div className="p-6 rounded-2xl bg-muted border border-border text-center">
                  <p className="text-lg font-semibold text-muted-foreground">
                    Esta campanha foi encerrada
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Confira outras campanhas ativas
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/">Ver Campanhas</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Regulations & FAQ */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Regulations */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="text-xl font-bold mb-4">Regulamento</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="regulations">
                  <AccordionTrigger>Ver regulamento completo</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {campaign.regulations || 'Regulamento em elaboração.'}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                      A participação implica na aceitação integral do regulamento. 
                      Os prêmios serão entregues conforme especificações. 
                      Imagens meramente ilustrativas. 
                      O sorteio será realizado após o preenchimento total das cotas ou na data limite, o que ocorrer primeiro.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* FAQ */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="text-xl font-bold mb-4">Perguntas Frequentes</h3>
              <Accordion type="single" collapsible>
                {campaign.faq && campaign.faq.length > 0 ? (
                  campaign.faq.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <AccordionItem value="faq-default">
                    <AccordionTrigger>Como funciona o sorteio?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        O resultado é vinculado ao número da Loteria Federal, garantindo total transparência e imparcialidade.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CampaignDetail;
