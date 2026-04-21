import { Link } from 'react-router-dom';
import { Campaign, getVisualStatus } from '@/data/campaigns';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Ticket } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  index?: number;
}

export const CampaignCard = ({ campaign, index = 0 }: CampaignCardProps) => {
  const visualStatus = getVisualStatus(campaign);
  const progressPercentage = (campaign.soldTickets / campaign.totalTickets) * 100;
  const remainingTickets = campaign.totalTickets - campaign.soldTickets;
  const isDisabled = campaign.status === 'finished';

  const statusBadge = {
    active: { label: 'Disponível', className: 'badge-active' },
    ending: { label: 'Últimas Cotas', className: 'badge-ending' },
    finished: { label: 'Concluído', className: 'badge-finished' },
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  return (
    <div
      className={`group card-premium rounded-2xl overflow-hidden opacity-0 animate-fade-up ${
        isDisabled ? 'opacity-60 grayscale' : ''
      }`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={campaign.images[0]}
          alt={campaign.title}
          className="w-full h-full object-cover img-zoom"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge[visualStatus].className}`}>
            {statusBadge[visualStatus].label}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-card/80 backdrop-blur-sm text-foreground/80 capitalize">
            {campaign.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-lg font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {campaign.subtitle}
          </p>
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Ticket className="w-4 h-4" />
            <span>{formatCurrency(campaign.pricePerTicket)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-xs">{campaign.endText}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="progress-premium">
            <div
              className={`progress-premium-fill ${visualStatus === 'ending' ? 'ending' : ''}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {formatNumber(campaign.soldTickets)} / {formatNumber(campaign.totalTickets)} cotas
            </span>
            <span className={`font-semibold ${
              visualStatus === 'ending' ? 'text-warning' : 'text-primary'
            }`}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Remaining */}
        {!isDisabled && (
          <p className="text-xs text-muted-foreground">
            Restam <span className="font-semibold text-foreground">{formatNumber(remainingTickets)}</span> cotas
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            asChild
            variant={isDisabled ? 'secondary' : 'default'}
            className={`flex-1 btn-press ${
              !isDisabled && visualStatus === 'ending'
                ? 'bg-warning hover:bg-warning/90 text-warning-foreground'
                : ''
            }`}
            disabled={isDisabled}
          >
            <Link to={`/campanhas/${campaign.id}`}>
              {isDisabled ? 'Concluído' : 'Participar'}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="shrink-0 btn-press"
          >
            <Link to={`/campanhas/${campaign.id}`}>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
