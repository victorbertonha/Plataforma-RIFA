import React, { createContext, useContext, useState, useEffect } from 'react';
import { ticketsAPI } from '@/services/api';

export interface CartItem {
  id: string;
  campaignId: string;
  title: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  image: string;
  category: string;
  ticketNumbers?: number[]; // Números reservados no backend
  reservedAt?: string;
  expiresAt?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isReserving: boolean;
  reservationErrors: Record<string, string>; // Erros por campaignId
  addToCart: (item: Omit<CartItem, 'totalPrice'>) => void;
  removeFromCart: (campaignId: string) => void;
  updateQuantity: (campaignId: string, quantity: number) => void;
  clearCart: () => void;
  getItemByCampaignId: (campaignId: string) => CartItem | undefined;
  syncWithBackend: (campaignId: string) => Promise<void>; // Sincronizar com backend
  confirmPurchase: (campaignId: string, paymentId: string, paymentMethod: string) => Promise<any>;
  cancelReservation: (campaignId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  const [isReserving, setIsReserving] = useState(false);
  const [reservationErrors, setReservationErrors] = useState<Record<string, string>>({});

  // Salvar no localStorage quando items mudam
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
      console.log('Cart saved to localStorage:', items);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const addToCart = (item: Omit<CartItem, 'totalPrice'>) => {
    console.log('Adding to cart:', item);
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.campaignId === item.campaignId);

      if (existingItem) {
        const updated = prevItems.map((i) =>
          i.campaignId === item.campaignId
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                totalPrice: (i.quantity + item.quantity) * i.pricePerTicket,
              }
            : i
        );
        return updated;
      }

      const newCart = [
        ...prevItems,
        {
          ...item,
          totalPrice: item.quantity * item.pricePerTicket,
        },
      ];
      return newCart;
    });
  };

  const removeFromCart = (campaignId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.campaignId !== campaignId));
    setReservationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[campaignId];
      return newErrors;
    });
  };

  const updateQuantity = (campaignId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(campaignId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.campaignId === campaignId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.pricePerTicket,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setReservationErrors({});
  };

  const getItemByCampaignId = (campaignId: string) => {
    return items.find((item) => item.campaignId === campaignId);
  };

  // Sincronizar carrinho local com reservas no backend
  const syncWithBackend = async (campaignId: string) => {
    const item = getItemByCampaignId(campaignId);
    if (!item) return;

    setIsReserving(true);
    try {
      // Buscar números disponíveis reais no backend
      const { available } = await ticketsAPI.getAvailable(campaignId, item.quantity);
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const numbersToReserve = shuffled.slice(0, item.quantity);

      if (numbersToReserve.length < item.quantity) {
        throw new Error(`Apenas ${numbersToReserve.length} cotas disponíveis nessa campanha`);
      }

      const response = await ticketsAPI.reserve(campaignId, numbersToReserve);

      // Atualizar item com dados do backend
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.campaignId === campaignId
            ? {
                ...i,
                ticketNumbers: response.reserved.numbers,
                reservedAt: new Date().toISOString(),
                expiresAt: response.reserved.expiresAt,
              }
            : i
        )
      );

      setReservationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[campaignId];
        return newErrors;
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao reservar cotas';
      setReservationErrors((prev) => ({
        ...prev,
        [campaignId]: errorMessage,
      }));
      console.error('Erro ao sincronizar com backend:', errorMessage);
      throw error;
    } finally {
      setIsReserving(false);
    }
  };

  // Confirmar compra após pagamento
  const confirmPurchase = async (
    campaignId: string,
    paymentId: string,
    paymentMethod: string
  ) => {
    setIsReserving(true);
    try {
      const response = await ticketsAPI.confirmPurchase(
        campaignId,
        paymentId,
        paymentMethod
      );

      // Remover item do carrinho após compra bem-sucedida
      removeFromCart(campaignId);

      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao confirmar compra';
      setReservationErrors((prev) => ({
        ...prev,
        [campaignId]: errorMessage,
      }));
      console.error('Erro ao confirmar compra:', errorMessage);
      throw error;
    } finally {
      setIsReserving(false);
    }
  };

  // Cancelar reserva no backend
  const cancelReservation = async (campaignId: string) => {
    setIsReserving(true);
    try {
      await ticketsAPI.cancelReservation(campaignId);
      removeFromCart(campaignId);
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao cancelar reserva';
      setReservationErrors((prev) => ({
        ...prev,
        [campaignId]: errorMessage,
      }));
      console.error('Erro ao cancelar reserva:', errorMessage);
      throw error;
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isReserving,
        reservationErrors,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemByCampaignId,
        syncWithBackend,
        confirmPurchase,
        cancelReservation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
