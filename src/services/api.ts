import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Get current session token from Supabase
export async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

// Fazer requisições com token automaticamente
async function fetchAPI(endpoint, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(data.error || 'Erro na requisição', response.status);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new APIError('Tempo limite atingido. Tente novamente.', 408);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ===== CAMPAIGNS =====
export const campaignsAPI = {
  getAll: () => fetchAPI('/campaigns'),

  getById: (id) => fetchAPI(`/campaigns/${id}`),

  create: (campaignData) =>
    fetchAPI('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    }),

  update: (id, campaignData) =>
    fetchAPI(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    }),

  delete: (id) =>
    fetchAPI(`/campaigns/${id}`, {
      method: 'DELETE',
    }),
};

// ===== TICKETS =====
export const ticketsAPI = {
  // Listar cotas disponíveis
  getAvailable: (campaignId, limit = 100) =>
    fetchAPI(`/tickets/campaign/${campaignId}/available?limit=${limit}`),

  // Reservar cotas no carrinho (24h válida)
  reserve: (campaignId, numbers) =>
    fetchAPI('/tickets/reserve', {
      method: 'POST',
      body: JSON.stringify({ campaignId, numbers }),
    }),

  // Confirmar pagamento e finalizar compra
  confirmPurchase: (campaignId, paymentId, paymentMethod) =>
    fetchAPI('/tickets/confirm-purchase', {
      method: 'POST',
      body: JSON.stringify({ campaignId, paymentId, paymentMethod }),
    }),

  // Cancelar reserva (sair do carrinho)
  cancelReservation: (campaignId) =>
    fetchAPI('/tickets/cancel-reservation', {
      method: 'POST',
      body: JSON.stringify({ campaignId }),
    }),

  // Ver cotas compradas (pagas)
  getPurchased: (campaignId) =>
    fetchAPI(`/tickets/user/purchased/${campaignId}`),

  // Ver cotas reservadas (no carrinho)
  getReserved: (campaignId) =>
    fetchAPI(`/tickets/user/reserved/${campaignId}`),

  // Stats de todas as campanhas (público)
  getCampaignsStats: () =>
    fetchAPI('/tickets/campaigns/stats'),

  // Ver status da campanha (disponíveis, reservadas, vendidas)
  getStatus: (campaignId) =>
    fetchAPI(`/tickets/campaign/${campaignId}/status`),

  // Ver histórico de compras
  getTransactions: (campaignId) =>
    fetchAPI(`/tickets/user/transactions/${campaignId}`),

  // Todos os pedidos do usuário
  getOrders: () => fetchAPI('/tickets/user/orders'),

  // Legacy: compatibilidade com código antigo
  getUserTickets: (campaignId) =>
    fetchAPI(`/tickets/user/campaign/${campaignId}`),
};

// ===== PAYMENTS =====
export const paymentsAPI = {
  createPreference: () =>
    fetchAPI('/payments/create-preference', { method: 'POST' }),
};

// ===== ADMIN =====
export const adminAPI = {
  getDashboardMetrics: () =>
    fetchAPI('/admin/dashboard/metrics'),

  getUsers: () =>
    fetchAPI('/admin/users'),

  changeUserRole: (userId, role) =>
    fetchAPI(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  toggleUserStatus: (userId, isActive) =>
    fetchAPI(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  getAuditLogs: () =>
    fetchAPI('/admin/audit-logs'),

  getRevenueReport: (startDate, endDate) =>
    fetchAPI(`/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`),
  getCampaignMetrics: () =>
    fetchAPI('/admin/campaigns/metrics'),
  getRaffleOverview: () =>
    fetchAPI('/admin/raffle/overview'),
  getCampaignTickets: (campaignId: string, status?: string) =>
    fetchAPI(`/admin/raffle/campaigns/${campaignId}/tickets${status ? `?status=${status}` : ''}`),

  releaseTicket: (campaignId: string, number: number) =>
    fetchAPI(`/admin/raffle/tickets/${campaignId}/${number}/release`, { method: 'PUT' }),

  reassignTicket: (campaignId: string, number: number, email: string) =>
    fetchAPI(`/admin/raffle/tickets/${campaignId}/${number}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ email }),
    }),

  confirmTicket: (campaignId: string, number: number, email: string) =>
    fetchAPI(`/admin/raffle/tickets/${campaignId}/${number}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ email }),
    }),

  extendTicket: (campaignId: string, number: number, hours: number) =>
    fetchAPI(`/admin/raffle/tickets/${campaignId}/${number}/extend`, {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    }),

  createTickets: (campaignId: string, numbers: number[]) =>
    fetchAPI(`/admin/raffle/campaigns/${campaignId}/tickets/create`, {
      method: 'POST',
      body: JSON.stringify({ numbers }),
    }),
};

