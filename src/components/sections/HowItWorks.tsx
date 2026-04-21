import { Search, CreditCard, Eye, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Escolha a Campanha',
    description: 'Navegue pelos prêmios disponíveis e escolha o que mais deseja.',
  },
  {
    icon: CreditCard,
    title: 'Adquira Suas Cotas',
    description: 'Compre a quantidade de cotas que desejar de forma segura.',
  },
  {
    icon: Eye,
    title: 'Acompanhe o Progresso',
    description: 'Veja em tempo real o preenchimento das cotas e a data do sorteio.',
  },
  {
    icon: Trophy,
    title: 'Resultado Transparente',
    description: 'Sorteio vinculado à Loteria Federal com total transparência.',
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
            Simples e Transparente
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como Funciona
          </h2>
          <p className="text-muted-foreground text-lg">
            Participar é fácil. Siga os passos abaixo e concorra aos melhores prêmios.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
