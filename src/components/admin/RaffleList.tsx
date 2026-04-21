import React from 'react';
import { campaignsAPI } from '@/services/api';
import { toast } from 'sonner';
import { Trash2, Link2 } from 'lucide-react';

const RaffleList: React.FC<{ campaigns: any[]; onUpdated?: () => void }> = ({ campaigns, onUpdated }) => {
  const remove = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que quer remover "${title}"?`)) return;
    try {
      await campaignsAPI.delete(id);
      toast.success('✓ Sorteio removido com sucesso!');
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover sorteio');
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="bg-card border border-border/30 rounded-xl p-12 text-center">
        <p className="text-5xl mb-3">🎰</p>
        <p className="text-muted-foreground">Nenhum sorteio criado ainda</p>
        <p className="text-sm text-muted-foreground mt-1">Crie o primeiro sorteio acima!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/40">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Título</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Categoria</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Cotas</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Preço</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {campaigns.map((c, idx) => (
              <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{c.title}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{c.category || '—'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{c.total_numbers}</td>
                <td className="px-6 py-4 text-sm text-primary font-semibold">R$ {Number(c.price_per_number).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                    {c.status || 'draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3 flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + '/campanhas/' + c.id);
                      toast.success('✓ Link copiado!');
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition"
                    title="Copiar link"
                  >
                    <Link2 className="w-4 h-4" />
                    Link
                  </button>
                  <button
                    onClick={() => remove(c.id, c.title)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 transition"
                    title="Remover sorteio"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-secondary/20 border-t border-border/30 text-sm text-muted-foreground">
        Total: <span className="text-primary font-semibold">{campaigns.length}</span> sorteio{campaigns.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default RaffleList;
