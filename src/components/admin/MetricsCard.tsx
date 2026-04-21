import React from 'react';

const MetricsCard: React.FC<{ metric: any }> = ({ metric }) => {
  const { title, revenue, prize_price, profit, total_numbers, tickets_sold } = metric;
  const percentageSold = ((tickets_sold / total_numbers) * 100).toFixed(1);
  const isProfitable = profit > 0;

  return (
    <div className="bg-card border border-border/30 rounded-xl p-6 hover:border-primary/60 transition-all group">
      <div className="mb-6">
        <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{title}</h4>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Progresso de vendas</span>
            <span className="text-sm font-semibold text-primary">{percentageSold}%</span>
          </div>
          <div className="w-full bg-secondary/40 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, percentageSold)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{tickets_sold}/{total_numbers} cotas vendidas</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-secondary/40 rounded-lg p-3 border border-border/20">
          <p className="text-xs text-muted-foreground mb-1">Receita</p>
          <p className="text-base font-bold text-primary">R$ {Number(revenue).toFixed(0)}</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3 border border-border/20">
          <p className="text-xs text-muted-foreground mb-1">Prêmio</p>
          <p className="text-base font-bold text-warning">R$ {Number(prize_price).toFixed(0)}</p>
        </div>
        <div className={`rounded-lg p-3 border ${isProfitable ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
          <p className="text-xs text-muted-foreground mb-1">Lucro</p>
          <p className={`text-base font-bold ${isProfitable ? 'text-emerald-400' : 'text-destructive'}`}>
            R$ {Number(profit).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-border/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Situação:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isProfitable 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-destructive/20 text-destructive border border-destructive/30'
          }`}>
            {isProfitable ? '✓ Rentável' : '! Prejuízo'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
