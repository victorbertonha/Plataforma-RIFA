import heroMercedes from '@/assets/hero-mercedes.jpg';
import porsche911 from '@/assets/porsche-911.jpg';
import bmwM4 from '@/assets/bmw-m4.jpg';
import iphone16 from '@/assets/iphone-16.jpg';
import kitGamer from '@/assets/kit-gamer.jpg';
import mustangGt from '@/assets/mustang-gt.jpg';
import macbookPro from '@/assets/macbook-pro.jpg';
import kitMilionario from '@/assets/kit-milionario.jpg';
import audiRs6 from '@/assets/audi-rs6.jpg';
import ps5Pro from '@/assets/ps5-pro.jpg';
import lamborghiniHuracan from '@/assets/lamborghini-huracan.jpg';
import smartHome from '@/assets/smart-home.jpg';

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: 'active' | 'ending' | 'finished';
  pricePerTicket: number;
  totalTickets: number;
  soldTickets: number;
  images: string[];
  category: 'carros' | 'eletronicos' | 'kits';
  featured: boolean;
  endText: string;
  regulations?: string;
  faq?: { question: string; answer: string }[];
}

export const campaigns: Campaign[] = [
  {
    id: "mercedes-amg-c63",
    title: "Mercedes-AMG C63 S Coupé",
    subtitle: "O monstro de 510cv que domina as ruas",
    description: "Uma máquina de performance incomparável. Motor V8 biturbo de 4.0L, 510cv e 700Nm de torque. Interior em couro Nappa, sistema Burmester premium, suspensão adaptativa AMG RIDE CONTROL. Apenas 45.000km rodados, revisões em concessionária.",
    status: "active",
    pricePerTicket: 2.49,
    totalTickets: 50000,
    soldTickets: 32500,
    images: [heroMercedes],
    category: "carros",
    featured: true,
    endText: "Ao esgotar as cotas",
    regulations: "Sorteio regulamentado pela CEF. Certificado SUSEP nº 15414.900000/2024-00. Resultado vinculado à Loteria Federal.",
    faq: [
      { question: "Como funciona o sorteio?", answer: "O resultado é vinculado ao número da Loteria Federal, garantindo total transparência." },
      { question: "Posso comprar várias cotas?", answer: "Sim! Quanto mais cotas, maiores suas chances de ganhar." },
      { question: "Como recebo o prêmio?", answer: "Entregamos o veículo documentado em seu nome, com IPVA e licenciamento pagos." }
    ]
  },
  {
    id: "porsche-911-gt3",
    title: "Porsche 911 GT3 2023",
    subtitle: "Puro DNA de corrida para as ruas",
    description: "O ícone definitivo da performance. Motor boxer de 4.0L com 510cv, câmbio PDK ou manual, aerodinâmica derivada da competição. Apenas 8.000km, estado de zero.",
    status: "ending",
    pricePerTicket: 4.99,
    totalTickets: 30000,
    soldTickets: 27800,
    images: [porsche911],
    category: "carros",
    featured: false,
    endText: "Últimas 2.200 cotas!",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: [
      { question: "Qual a cor do veículo?", answer: "Branco Carrara com faixas em preto, conforme fotos." }
    ]
  },
  {
    id: "bmw-m4-competition",
    title: "BMW M4 Competition",
    subtitle: "A evolução da lenda M em fibra de carbono",
    description: "Motor biturbo de 510cv, tração traseira pura, suspensão adaptativa M. Teto de carbono, escape Akrapovic, rodas forjadas de 20 polegadas.",
    status: "active",
    pricePerTicket: 1.99,
    totalTickets: 60000,
    soldTickets: 18000,
    images: [bmwM4],
    category: "carros",
    featured: false,
    endText: "Ao esgotar as cotas",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "iphone-16-pro-max",
    title: "iPhone 16 Pro Max 1TB",
    subtitle: "O smartphone mais avançado do planeta",
    description: "Chip A18 Pro, câmera de 48MP com zoom óptico 5x, tela ProMotion de 6.9 polegadas, corpo em titânio. Cor: Titanium Desert.",
    status: "active",
    pricePerTicket: 0.99,
    totalTickets: 15000,
    soldTickets: 8200,
    images: [iphone16],
    category: "eletronicos",
    featured: false,
    endText: "31/03/2025",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "kit-gamer-ultimate",
    title: "Kit Gamer Ultimate RTX 4090",
    subtitle: "Setup completo para dominar qualquer jogo",
    description: "PC com RTX 4090, i9-14900K, 64GB DDR5, SSD 4TB. Monitor OLED 4K 240Hz, periféricos Razer + cadeira ergonômica premium.",
    status: "ending",
    pricePerTicket: 1.49,
    totalTickets: 20000,
    soldTickets: 18500,
    images: [kitGamer],
    category: "eletronicos",
    featured: false,
    endText: "Últimas 1.500 cotas!",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "ford-mustang-gt",
    title: "Ford Mustang GT 5.0 V8",
    subtitle: "O muscle car americano definitivo",
    description: "Motor Coyote 5.0L V8 com 480cv, câmbio manual Tremec de 6 marchas, escape ativo, pacote Performance. Cor: Grabber Blue exclusiva.",
    status: "active",
    pricePerTicket: 1.79,
    totalTickets: 45000,
    soldTickets: 12000,
    images: [mustangGt],
    category: "carros",
    featured: false,
    endText: "Ao esgotar as cotas",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "macbook-pro-m3",
    title: "MacBook Pro 16\" M3 Max",
    subtitle: "Poder absoluto para criadores",
    description: "Chip M3 Max com 40 núcleos GPU, 128GB de memória unificada, SSD de 8TB, tela Liquid Retina XDR. O laptop mais poderoso já criado.",
    status: "finished",
    pricePerTicket: 1.99,
    totalTickets: 10000,
    soldTickets: 10000,
    images: [macbookPro],
    category: "eletronicos",
    featured: false,
    endText: "Concluído",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "kit-milionario",
    title: "Kit Milionário: Golf GTI + iPhone + R$50k",
    subtitle: "Combo dos sonhos em uma única cota",
    description: "VW Golf GTI MK8 230cv + iPhone 16 Pro Max + R$50.000 em dinheiro. O pacote mais completo já oferecido.",
    status: "active",
    pricePerTicket: 2.99,
    totalTickets: 80000,
    soldTickets: 45000,
    images: [kitMilionario],
    category: "kits",
    featured: false,
    endText: "Ao esgotar as cotas",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "audi-rs6-avant",
    title: "Audi RS6 Avant 2024",
    subtitle: "A perua mais rápida do mundo",
    description: "V8 biturbo de 600cv, tração quattro, 0-100km/h em 3.4s. Perua familiar que humilha supercarros. Interior em Alcantara, B&O 3D.",
    status: "finished",
    pricePerTicket: 3.49,
    totalTickets: 35000,
    soldTickets: 35000,
    images: [audiRs6],
    category: "carros",
    featured: false,
    endText: "Concluído",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "playstation-5-pro-kit",
    title: "PlayStation 5 Pro + 50 Jogos",
    subtitle: "O console definitivo com biblioteca completa",
    description: "PS5 Pro edição limitada, 2TB SSD, DualSense Edge, 50 jogos AAA incluindo GTA VI, biblioteca completa para anos de diversão.",
    status: "active",
    pricePerTicket: 0.79,
    totalTickets: 25000,
    soldTickets: 6000,
    images: [ps5Pro],
    category: "eletronicos",
    featured: false,
    endText: "15/04/2025",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "lamborghini-huracan",
    title: "Lamborghini Huracán EVO",
    subtitle: "O supercarro italiano dos sonhos",
    description: "V10 aspirado de 640cv, 0-100km/h em 2.9s, aerodinâmica ativa, sistema LDVI. A experiência de pilotagem mais intensa do planeta.",
    status: "ending",
    pricePerTicket: 9.99,
    totalTickets: 100000,
    soldTickets: 89000,
    images: [lamborghiniHuracan],
    category: "carros",
    featured: false,
    endText: "Últimas 11.000 cotas!",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  },
  {
    id: "kit-casa-inteligente",
    title: "Kit Casa Inteligente Completo",
    subtitle: "Transforme seu lar em uma smart home",
    description: "Apple HomePod, 10x lâmpadas Philips Hue, termostato Nest, 4x câmeras Ring, fechadura smart Yale, aspirador iRobot, purificador Dyson.",
    status: "active",
    pricePerTicket: 0.49,
    totalTickets: 12000,
    soldTickets: 3500,
    images: [smartHome],
    category: "kits",
    featured: false,
    endText: "28/02/2025",
    regulations: "Sorteio regulamentado pela CEF.",
    faq: []
  }
];

export const getStatusLabel = (status: Campaign['status'], soldPercentage: number): string => {
  if (status === 'finished') return 'Concluído';
  if (status === 'ending' || soldPercentage >= 0.85) return 'Últimas Cotas';
  return 'Disponível';
};

export const getVisualStatus = (campaign: Campaign): 'active' | 'ending' | 'finished' => {
  if (campaign.status === 'finished') return 'finished';
  const percentage = campaign.soldTickets / campaign.totalTickets;
  if (percentage >= 0.85 || campaign.status === 'ending') return 'ending';
  return 'active';
};

export const getCampaignById = (id: string): Campaign | undefined => {
  return campaigns.find(c => c.id === id);
};
