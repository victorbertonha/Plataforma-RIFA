import { Link } from 'react-router-dom';
import { Campaign, getVisualStatus } from '@/data/campaigns';
import { Button } from '@/components/ui/button';
import { ArrowRight, Ticket, Users, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-mercedes.jpg';

interface HeroSectionProps {
  campaign: Campaign;
}

export const HeroSection = ({ campaign }: HeroSectionProps) => {
  const visualStatus = getVisualStatus(campaign);
  const progressPercentage = (campaign.soldTickets / campaign.totalTickets) * 100;

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

  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex items-end pb-12 md:pb-24">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={campaign.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl space-y-6 animate-fade-up">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusBadge[visualStatus].className}`}>
              {statusBadge[visualStatus].label}
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-card/80 backdrop-blur-sm border border-border">
              ⭐ Destaque
            </span>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              {campaign.title}
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-lg">
              {campaign.subtitle}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cota a partir de</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(campaign.pricePerTicket)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cotas vendidas</p>
                <p className="text-lg font-bold">{formatNumber(campaign.soldTickets)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-lg font-bold">{progressPercentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 max-w-md">
            <div className="progress-premium h-3">
              <div
                className={`progress-premium-fill ${visualStatus === 'ending' ? 'ending' : ''}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatNumber(campaign.soldTickets)} de {formatNumber(campaign.totalTickets)} cotas
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className={`text-base px-8 btn-press glow-primary ${
                visualStatus === 'ending'
                  ? 'bg-warning hover:bg-warning/90 text-warning-foreground glow-warning'
                  : ''
              }`}
            >
              <Link to={`/campanhas/${campaign.id}`}>
                Participar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base px-8 btn-press"
            >
              <Link to={`/campanhas/${campaign.id}`}>Ver Detalhes</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
