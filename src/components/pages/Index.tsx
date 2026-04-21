import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/campaigns/HeroSection';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CampaignFilters, StatusFilter, SortOption } from '@/components/campaigns/CampaignFilters';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Winners } from '@/components/sections/Winners';
import { campaigns, getVisualStatus } from '@/data/campaigns';
import { Zap } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');

  // Get featured campaign for hero
  const featuredCampaign = campaigns.find(c => c.featured) || campaigns[0];

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter(c => !c.featured); // Exclude featured from grid

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.title.toLowerCase().includes(query) ||
          c.subtitle.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => {
        const visualStatus = getVisualStatus(c);
        return visualStatus === statusFilter;
      });
    }

    // Sort
    switch (sortOption) {
      case 'recent':
        // Mock: reverse order as if newer is last
        result = [...result].reverse();
        break;
      case 'popular':
        result = [...result].sort((a, b) => b.soldTickets - a.soldTickets);
        break;
      case 'price-asc':
        result = [...result].sort((a, b) => a.pricePerTicket - b.pricePerTicket);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.pricePerTicket - a.pricePerTicket);
        break;
      default:
        // Relevance: featured first, then by sold percentage
        result = [...result].sort((a, b) => {
          const aProgress = a.soldTickets / a.totalTickets;
          const bProgress = b.soldTickets / b.totalTickets;
          return bProgress - aProgress;
        });
    }

    return result;
  }, [searchQuery, statusFilter, sortOption]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <HeroSection campaign={featuredCampaign} />

      {/* Campaigns Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Campanhas Ativas</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Escolha Seu Prêmio
              </h2>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-10">
            <CampaignFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortOption={sortOption}
              onSortChange={setSortOption}
            />
          </div>

          {/* Campaign Grid */}
          {filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCampaigns.map((campaign, index) => (
                <CampaignCard key={campaign.id} campaign={campaign} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Nenhuma campanha encontrada com os filtros selecionados.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Winners */}
      <Winners />

      <Footer />
    </div>
  );
};

export default Index;
