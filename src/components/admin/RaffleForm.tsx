import React, { useState } from 'react';
import { campaignsAPI } from '@/services/api';
import { toast } from 'sonner';

const RaffleForm: React.FC<{ onCreated?: () => void }> = ({ onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Eletrônicos');
  const [totalNumbers, setTotalNumbers] = useState(100);
  const [pricePerNumber, setPricePerNumber] = useState(10);
  const [prizePrice, setPrizePrice] = useState(500);
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!title.trim()) return 'Título é obrigatório';
    if (!opensAt || !closesAt) return 'Datas de abertura e fechamento são obrigatórias';
    if (new Date(closesAt) <= new Date(opensAt)) return 'Data de fechamento deve ser após abertura';
    if (totalNumbers < 1) return 'Total de números deve ser pelo menos 1';
    if (pricePerNumber < 0.01) return 'Preço deve ser maior que 0';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await campaignsAPI.create({
        title,
        description,
        category,
        totalNumbers,
        pricePerNumber,
        prizePrice,
        opensAt,
        closesAt,
      });
      toast.success('✨ Sorteio criado com sucesso!');
      setTitle('');
      setDescription('');
      setOpensAt('');
      setClosesAt('');
      setPrizePrice(500);
      if (onCreated) onCreated();
    } catch (err: any) {
      const msg = err?.message || 'Erro ao criar sorteio';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border/30 rounded-xl p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-2">Título do Sorteio *</label>
          <input
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: iPhone 15 Pro Max"
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-2">Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalhes adicionais sobre o sorteio..."
            rows={3}
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Categoria</label>
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Ex: Eletrônicos, Carros"
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Total de Cotas</label>
          <input
            type="number"
            min="1"
            value={totalNumbers}
            onChange={e => setTotalNumbers(Math.max(1, parseInt(e.target.value || '1')))}
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Preço por Cota (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={pricePerNumber}
            onChange={e => setPricePerNumber(Math.max(0.01, parseFloat(e.target.value || '0.01')))}
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Valor do Prêmio (R$)</label>
          <input
            type="number"
            step="0.01"
            value={prizePrice}
            onChange={e => setPrizePrice(Math.max(0, parseFloat(e.target.value || '0')))}
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Abertura *</label>
          <input
            type="datetime-local"
            required
            value={opensAt}
            onChange={e => setOpensAt(e.target.value)}
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Fechamento *</label>
          <input
            type="datetime-local"
            required
            value={closesAt}
            onChange={e => setClosesAt(e.target.value)}
            className="w-full px-4 py-3 bg-secondary/40 border border-border/30 rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        {error && <div className="md:col-span-2 text-destructive text-sm">{error}</div>}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 transition duration-200 active:scale-98"
          >
            {loading ? '⏳ Criando sorteio...' : '✨ Criar Sorteio'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RaffleForm;
