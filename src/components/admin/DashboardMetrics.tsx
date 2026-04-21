import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/services/api';
import { Users, TrendingUp, Ticket, DollarSign } from 'lucide-react';

const DashboardMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0,
    totalCampaigns: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await adminAPI.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border/30 p-6 animate-pulse">
            <div className="h-4 bg-secondary/30 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-secondary/30 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      icon: Users,
      label: 'Total de Usuários',
      value: (metrics.totalUsers ?? 0).toLocaleString('pt-BR'),
      subtext: 'Cadastrados no sistema',
      color: 'blue',
      trend: '+12%',
    },
    {
      icon: TrendingUp,
      label: 'Campanhas',
      value: (metrics.totalCampaigns ?? 0).toLocaleString('pt-BR'),
      subtext: 'Total de campanhas',
      color: 'primary',
      trend: '+8%',
    },
    {
      icon: Ticket,
      label: 'Cotas Vendidas',
      value: (metrics.totalTicketsSold ?? 0).toLocaleString('pt-BR'),
      subtext: 'Vendidas até agora',
      color: 'purple',
      trend: '+24%',
    },
    {
      icon: DollarSign,
      label: 'Receita Total',
      value: `R$ ${Number(metrics.totalRevenue ?? 0).toFixed(0)}`,
      subtext: 'Faturamento geral',
      color: 'emerald',
      trend: '+18%',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; text: string; lightBg: string } } = {
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', lightBg: 'bg-blue-500/10' },
      primary: { bg: 'bg-primary/20', text: 'text-primary', lightBg: 'bg-primary/10' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', lightBg: 'bg-purple-500/10' },
      emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', lightBg: 'bg-emerald-500/10' },
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricsData.map((metric, idx) => {
        const Icon = metric.icon;
        const colors = getColorClasses(metric.color);

        return (
          <div
            key={idx}
            className="bg-card border border-border/30 rounded-xl p-6 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${colors.bg} rounded-lg group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                {metric.trend}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-2">{metric.label}</p>
            <h3 className="text-3xl font-bold text-foreground mb-2">{metric.value}</h3>
            <p className="text-xs text-muted-foreground">{metric.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardMetrics;
