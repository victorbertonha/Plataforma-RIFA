import { Award, MapPin, Calendar, Star } from 'lucide-react';

const winners = [
  {
    name: 'Carlos M.',
    city: 'São Paulo, SP',
    prize: 'Mercedes-AMG C63',
    date: 'Janeiro 2025',
    highlight: true,
  },
  {
    name: 'Ana Paula S.',
    city: 'Curitiba, PR',
    prize: 'iPhone 15 Pro Max',
    date: 'Dezembro 2024',
    highlight: false,
  },
  {
    name: 'Roberto L.',
    city: 'Rio de Janeiro, RJ',
    prize: 'BMW M4 Competition',
    date: 'Novembro 2024',
    highlight: false,
  },
  {
    name: 'Fernanda C.',
    city: 'Belo Horizonte, MG',
    prize: 'Kit Gamer RTX 4090',
    date: 'Outubro 2024',
    highlight: false,
  },
];

export const Winners = () => {
  return (
    <section id="ganhadores" className="py-20 md:py-28 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-warning/10 text-warning mb-4">
            <Star className="w-4 h-4 inline mr-1" />
            Ganhadores Reais
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Histórias de Sucesso
          </h2>
          <p className="text-muted-foreground text-lg">
            Milhares de pessoas já realizaram seus sonhos. Veja alguns de nossos ganhadores.
          </p>
        </div>

        {/* Winners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {winners.map((winner, index) => (
            <div
              key={winner.name}
              className={`relative p-6 rounded-2xl border transition-all opacity-0 animate-fade-up ${
                winner.highlight
                  ? 'bg-gradient-to-b from-primary/10 to-transparent border-primary/30'
                  : 'bg-card border-border hover:border-primary/20'
              }`}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              {winner.highlight && (
                <div className="absolute -top-3 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    Mais Recente
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                winner.highlight ? 'bg-primary/20' : 'bg-accent'
              }`}>
                <Award className={`w-6 h-6 ${winner.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>

              {/* Name */}
              <h3 className="text-lg font-semibold mb-1">{winner.name}</h3>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>{winner.city}</span>
              </div>

              {/* Prize */}
              <p className="font-medium text-primary mb-2">{winner.prize}</p>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{winner.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          * Dados ilustrativos para demonstração. Nomes parcialmente ocultados para privacidade.
        </p>
      </div>
    </section>
  );
};
