import React, { useEffect, useState } from 'react';
import { campaignsAPI, adminAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RaffleForm from '@/components/admin/RaffleForm';
import RaffleList from '@/components/admin/RaffleList';
import MetricsCard from '@/components/admin/MetricsCard';
import DashboardMetrics from '@/components/admin/DashboardMetrics';
import UsersList from '@/components/admin/UsersList';
import RecentRaffles from '@/components/admin/RecentRaffles';
import { TrendingUp, BarChart3, Shield, Ticket, ChevronDown, ChevronUp, Loader2, Search, UserCheck, Trash2, Clock, CheckCircle, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const AdminDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [campaignMetricsLoading, setCampaignMetricsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Gestão de cotas
  const [raffleOverview, setRaffleOverview] = useState<any[]>([]);
  const [raffleLoading, setRaffleLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignTickets, setCampaignTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'sold' | 'reserved' | 'available'>('all');
  const [ticketSearch, setTicketSearch] = useState('');

  // Modal state for ticket actions
  const [modal, setModal] = useState<{
    type: 'reassign' | 'confirm' | 'extend' | 'create' | null;
    campaignId: string;
    number?: number;
  }>({ type: null, campaignId: '' });
  const [modalEmail, setModalEmail] = useState('');
  const [modalHours, setModalHours] = useState('24');
  const [modalNumbers, setModalNumbers] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const closeModal = () => { setModal({ type: null, campaignId: '' }); setModalEmail(''); setModalHours('24'); setModalNumbers(''); };

  const handleRelease = async (campaignId: string, number: number) => {
    if (!confirm(`Liberar cota #${String(number).padStart(4,'0')}? Ela voltará para disponível.`)) return;
    try {
      await adminAPI.releaseTicket(campaignId, number);
      toast.success(`Cota #${String(number).padStart(4,'0')} liberada`);
      loadCampaignTickets(campaignId);
      loadRaffleOverview();
    } catch (e: any) { toast.error(e?.message || 'Erro ao liberar'); }
  };

  const handleModalSubmit = async () => {
    setModalLoading(true);
    try {
      if (modal.type === 'reassign') {
        await adminAPI.reassignTicket(modal.campaignId, modal.number!, modalEmail);
        toast.success(`Cota #${String(modal.number).padStart(4,'0')} reassinalada para ${modalEmail}`);
      } else if (modal.type === 'confirm') {
        await adminAPI.confirmTicket(modal.campaignId, modal.number!, modalEmail);
        toast.success(`Cota #${String(modal.number).padStart(4,'0')} confirmada para ${modalEmail}`);
      } else if (modal.type === 'extend') {
        await adminAPI.extendTicket(modal.campaignId, modal.number!, parseInt(modalHours) || 24);
        toast.success(`Reserva da cota #${String(modal.number).padStart(4,'0')} estendida por ${modalHours}h`);
      } else if (modal.type === 'create') {
        const nums = modalNumbers.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const res = await adminAPI.createTickets(modal.campaignId, nums);
        toast.success(`${res.count} cota(s) criada(s)`);
      }
      loadCampaignTickets(modal.campaignId);
      loadRaffleOverview();
      closeModal();
    } catch (e: any) { toast.error(e?.message || 'Erro na operação'); }
    finally { setModalLoading(false); }
  };

  const loadCampaigns = async () => {
    try {
      const data = await campaignsAPI.getAll();
      setCampaigns(data);
    } catch (err) {
      console.error('Erro ao carregar campanhas:', err);
    }
  };

  const loadMetrics = async () => {
    try {
      setCampaignMetricsLoading(true);
      const data = await adminAPI.getCampaignMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setCampaignMetricsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminAPI.getUsers();
      setAllUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const loadRaffleOverview = async () => {
    setRaffleLoading(true);
    try {
      const data = await adminAPI.getRaffleOverview();
      setRaffleOverview(data);
    } catch (err: any) {
      console.error('Erro ao carregar overview de rifas:', err);
      toast.error('Erro ao carregar campanhas: ' + (err?.message || 'tente novamente'));
    } finally {
      setRaffleLoading(false);
    }
  };

  const loadCampaignTickets = async (campaignId: string) => {
    setTicketsLoading(true);
    setCampaignTickets([]);
    try {
      const data = await adminAPI.getCampaignTickets(campaignId);
      setCampaignTickets(data.tickets);
    } catch (err: any) {
      console.error('Erro ao carregar cotas:', err);
      toast.error('Erro ao carregar cotas: ' + (err?.message || 'tente novamente'));
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleSelectCampaign = (id: string) => {
    if (selectedCampaign === id) {
      setSelectedCampaign(null);
      setCampaignTickets([]);
    } else {
      setSelectedCampaign(id);
      loadCampaignTickets(id);
    }
    setTicketSearch('');
    setTicketFilter('all');
  };

  useEffect(() => {
    loadCampaigns();
    loadMetrics();
    loadUsers();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-foreground">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const recentRaffles = campaigns.slice(0, 5);
  const recentUsers = allUsers.slice(0, 5);
  const topPerformingRaffles = [...metrics].sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue)).slice(0, 5);

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header Premium */}
      <div className="bg-card border-b border-border/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Painel Admin
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema de sorteios</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="w-full"
          onValueChange={(tab) => {
            if (tab === 'cotas' && raffleOverview.length === 0 && !raffleLoading) {
              loadRaffleOverview();
            }
          }}
        >
          <TabsList className="grid w-full max-w-xl grid-cols-4 bg-card border border-border/30 p-1 mb-8">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              📊 Visão Geral
            </TabsTrigger>
            <TabsTrigger value="raffles" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              🎰 Sorteios
            </TabsTrigger>
            <TabsTrigger value="cotas" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              🎟️ Cotas
            </TabsTrigger>
            <TabsTrigger value="crm" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              👥 CRM
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Dashboard Premium */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Métricas principais */}
            <DashboardMetrics />

            {/* Grid com Sorteios Recentes e Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sorteios Recentes - 2 colunas */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Sorteios Recentes</h2>
                    <p className="text-sm text-muted-foreground">Últimos sorteios cadastrados</p>
                  </div>
                </div>
                <RecentRaffles raffles={recentRaffles} />
              </div>

              {/* Usuários Recentes - 1 coluna */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">👥 Usuários Recentes</h3>
                <div className="space-y-3">
                  {recentUsers.map((user, idx) => (
                    <div key={user.id} className="bg-card border border-border/30 rounded-lg p-4 hover:border-primary/60 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.name || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Sorteios por Receita */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Top Sorteios</h2>
                  <p className="text-sm text-muted-foreground">Sorteios com melhor performance</p>
                </div>
              </div>
              {campaignMetricsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  </div>
                  <p className="text-muted-foreground mt-3">Carregando dados...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {topPerformingRaffles.length > 0 ? (
                    topPerformingRaffles.map((m, idx) => (
                      <div key={m.id} className="bg-card border border-border/30 rounded-lg p-4 hover:border-primary/60 transition-all">
                        <div className="text-3xl font-bold text-primary mb-1">{idx + 1}</div>
                        <p className="text-sm font-medium text-foreground truncate mb-3">{m.title}</p>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">Receita</span>
                              <span className="text-xs font-bold text-primary">R$ {Number(m.revenue).toFixed(0)}</span>
                            </div>
                            <div className="w-full bg-secondary/40 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-primary to-primary/70 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (Number(m.revenue) / (Number(topPerformingRaffles[0]?.revenue) || 1)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{m.tickets_sold}/{m.total_numbers} cotas</span>
                            <span className="text-emerald-400 font-semibold">↗ {((m.tickets_sold / m.total_numbers) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-5 bg-card border border-border/30 rounded-lg p-8 text-center">
                      <p className="text-muted-foreground">Nenhum sorteio com dados ainda</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Raffles Tab */}
          <TabsContent value="raffles" className="space-y-6 mt-0">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Criar Novo Sorteio</h2>
              <RaffleForm onCreated={() => { loadCampaigns(); loadMetrics(); }} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Sorteios Cadastrados {campaigns.length > 0 && <span className="text-primary">({campaigns.length})</span>}
              </h2>
              <RaffleList campaigns={campaigns} onUpdated={() => { loadCampaigns(); loadMetrics(); }} />
            </div>
          </TabsContent>

          {/* Cotas Tab */}
          <TabsContent value="cotas" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestão de Cotas</h2>
              <Button variant="outline" size="sm" onClick={loadRaffleOverview} disabled={raffleLoading}>
                {raffleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
              </Button>
            </div>

            {raffleLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {!raffleLoading && raffleOverview.map((camp) => {
              const soldPct = camp.total_numbers > 0 ? (camp.sold / camp.total_numbers) * 100 : 0;
              const isOpen = selectedCampaign === camp.id;

              const filteredTickets = campaignTickets
                .filter(t => ticketFilter === 'all' || t.status === ticketFilter)
                .filter(t => {
                  if (!ticketSearch) return true;
                  const q = ticketSearch.toLowerCase();
                  return String(t.number).includes(q)
                    || (t.buyer_email || '').toLowerCase().includes(q)
                    || (t.buyer_name || '').toLowerCase().includes(q);
                });

              return (
                <div key={camp.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  {/* Campaign header */}
                  <button
                    className="w-full p-5 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => handleSelectCampaign(camp.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{camp.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{camp.category} · {camp.status}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-primary">{formatCurrency(camp.revenue)}</p>
                          <p className="text-xs text-muted-foreground">receita</p>
                        </div>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-4 text-sm mb-3">
                      <span className="text-green-600 dark:text-green-400 font-medium">{camp.sold} vendidas</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">{camp.reserved} reservadas</span>
                      <span className="text-muted-foreground">{camp.available} disponíveis</span>
                      <span className="text-muted-foreground">/ {camp.total_numbers} total</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${Math.min(100, soldPct)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{soldPct.toFixed(1)}% vendido</p>
                  </button>

                  {/* Ticket drill-down */}
                  {isOpen && (
                    <div className="border-t border-border p-5">
                      {/* Filters + Create */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="relative flex-1 min-w-48">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por número ou email..."
                            className="pl-9 h-8 text-sm"
                            value={ticketSearch}
                            onChange={e => setTicketSearch(e.target.value)}
                          />
                        </div>
                        {(['all', 'sold', 'reserved', 'available'] as const).map(f => (
                          <Button
                            key={f}
                            size="sm"
                            variant={ticketFilter === f ? 'default' : 'outline'}
                            onClick={() => setTicketFilter(f)}
                          >
                            {f === 'all' ? 'Todas' : f === 'sold' ? 'Vendidas' : f === 'reserved' ? 'Reservadas' : 'Disponíveis'}
                          </Button>
                        ))}
                        <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/40"
                          onClick={() => setModal({ type: 'create', campaignId: camp.id })}>
                          <PlusCircle className="w-3.5 h-3.5" /> Criar cotas
                        </Button>
                      </div>

                      {ticketsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-3">{filteredTickets.length} cotas exibidas</p>
                          <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">#</th>
                                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Comprador / Reservador</th>
                                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Data</th>
                                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {filteredTickets.slice(0, 200).map(t => (
                                  <tr key={t.number} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-2 font-mono font-semibold text-primary">
                                      #{String(t.number).padStart(4, '0')}
                                    </td>
                                    <td className="px-4 py-2">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        t.status === 'sold'      ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                                        t.status === 'reserved' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                        'bg-muted text-muted-foreground'
                                      }`}>
                                        {t.status === 'sold' ? 'Vendida' : t.status === 'reserved' ? 'Reservada' : 'Disponível'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">
                                      {t.buyer_email ? (
                                        <div>
                                          <p className="font-medium">{t.buyer_name || '—'}</p>
                                          <p className="text-xs text-muted-foreground">{t.buyer_email}</p>
                                        </div>
                                      ) : t.reserver_email ? (
                                        <p className="text-xs text-muted-foreground italic">{t.reserver_email} (reservando)</p>
                                      ) : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground">
                                      {t.bought_at
                                        ? new Date(t.bought_at).toLocaleString('pt-BR')
                                        : t.reserved_at
                                        ? new Date(t.reserved_at).toLocaleString('pt-BR')
                                        : '—'}
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex justify-end gap-1">
                                        {t.status !== 'available' && (
                                          <button title="Liberar cota"
                                            className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"
                                            onClick={() => handleRelease(camp.id, t.number)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {t.status === 'sold' && (
                                          <button title="Reassinar para outro usuário"
                                            className="p-1.5 rounded hover:bg-blue-500/20 text-blue-500 transition-colors"
                                            onClick={() => { setModal({ type: 'reassign', campaignId: camp.id, number: t.number }); setModalEmail(t.buyer_email || ''); }}>
                                            <UserCheck className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {t.status === 'available' && (
                                          <button title="Confirmar para usuário"
                                            className="p-1.5 rounded hover:bg-green-500/20 text-green-500 transition-colors"
                                            onClick={() => setModal({ type: 'confirm', campaignId: camp.id, number: t.number })}>
                                            <CheckCircle className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {t.status === 'reserved' && (
                                          <>
                                            <button title="Estender reserva"
                                              className="p-1.5 rounded hover:bg-yellow-500/20 text-yellow-500 transition-colors"
                                              onClick={() => setModal({ type: 'extend', campaignId: camp.id, number: t.number })}>
                                              <Clock className="w-3.5 h-3.5" />
                                            </button>
                                            <button title="Confirmar para reservador"
                                              className="p-1.5 rounded hover:bg-green-500/20 text-green-500 transition-colors"
                                              onClick={() => { setModal({ type: 'confirm', campaignId: camp.id, number: t.number }); setModalEmail(t.reserver_email || ''); }}>
                                              <CheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {filteredTickets.length > 200 && (
                              <p className="text-xs text-center text-muted-foreground py-3">
                                Mostrando 200 de {filteredTickets.length}. Use o filtro para refinar.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!raffleLoading && raffleOverview.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">Nenhuma campanha encontrada</p>
                <Button variant="outline" size="sm" onClick={loadRaffleOverview}>Carregar</Button>
              </div>
            )}
          </TabsContent>

          {/* CRM Tab */}
          <TabsContent value="crm" className="space-y-6 mt-0">
            <h2 className="text-2xl font-bold text-foreground">Gestão de Usuários</h2>
            <UsersList />
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modal.type === 'reassign' && `Reassinar cota #${String(modal.number).padStart(4,'0')}`}
                {modal.type === 'confirm'  && `Confirmar cota #${String(modal.number).padStart(4,'0')}`}
                {modal.type === 'extend'   && `Estender reserva #${String(modal.number).padStart(4,'0')}`}
                {modal.type === 'create'   && 'Criar novas cotas'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {(modal.type === 'reassign' || modal.type === 'confirm') && (
                <div>
                  <label className="text-sm font-medium block mb-1">Email do usuário</label>
                  <Input
                    placeholder="usuario@exemplo.com"
                    value={modalEmail}
                    onChange={e => setModalEmail(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {modal.type === 'reassign'
                      ? 'A cota será transferida para este usuário (deve já estar cadastrado).'
                      : 'A cota será marcada como vendida para este usuário.'}
                  </p>
                </div>
              )}

              {modal.type === 'extend' && (
                <div>
                  <label className="text-sm font-medium block mb-1">Estender por quantas horas?</label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={modalHours}
                    onChange={e => setModalHours(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">A expiração será recalculada a partir de agora.</p>
                </div>
              )}

              {modal.type === 'create' && (
                <div>
                  <label className="text-sm font-medium block mb-1">Números das cotas (separados por vírgula)</label>
                  <Input
                    placeholder="ex: 1001, 1002, 1003"
                    value={modalNumbers}
                    onChange={e => setModalNumbers(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">Números já existentes serão ignorados.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={closeModal}>Cancelar</Button>
                <Button className="flex-1" onClick={handleModalSubmit} disabled={modalLoading}>
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
