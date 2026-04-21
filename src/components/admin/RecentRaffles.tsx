import React from 'react';
import { TrendingUp } from 'lucide-react';

interface RecentRafflesProps {
  raffles: any[];
}

const RecentRaffles: React.FC<RecentRafflesProps> = ({ raffles }) => {
  if (raffles.length === 0) {
    return (
      <div className="bg-card border border-border/30 rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Nenhum sorteio cadastrado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {raffles.map((raffle) => {
        const progress = raffle.total_numbers > 0 
          ? (raffle.tickets_sold / raffle.total_numbers) * 100 
          : 0;

        return (
          <div
            key={raffle.id}
            className="bg-card border border-border/30 rounded-lg p-4 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-base mb-1">{raffle.title}</h4>
                <p className="text-xs text-muted-foreground">{raffle.category}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                raffle.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : raffle.status === 'closed'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {raffle.status === 'active' ? '🔴 Ativo' : raffle.status === 'closed' ? '❌ Encerrado' : '⏳ Pendente'}
              </span>
            </div>

            {/* Informações de preço */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="bg-secondary/30 rounded p-2">
                <span className="text-muted-foreground">Cota</span>
                <p className="font-bold text-primary">R$ {Number(raffle.price_per_number).toFixed(2)}</p>
              </div>
              <div className="bg-secondary/30 rounded p-2">
                <span className="text-muted-foreground">Prêmio</span>
                <p className="font-bold text-primary">R$ {Number(raffle.prize_price).toFixed(2)}</p>
              </div>
              <div className="bg-secondary/30 rounded p-2">
                <span className="text-muted-foreground">Cotas</span>
                <p className="font-bold text-primary">{raffle.tickets_sold}/{raffle.total_numbers}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-foreground">Progressão de Vendas</span>
                <span className="text-xs font-bold text-primary">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-secondary/40 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentRaffles;
