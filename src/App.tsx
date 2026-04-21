import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CampaignDetail from "./pages/CampaignDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyAccount from "./pages/MyAccount";
import MyOrders from "./pages/MyOrders";
import EmailConfirmationPending from "./pages/EmailConfirmationPending";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import OrderConfirmed from "./pages/OrderConfirmed";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CacheCleaner from "@/components/CacheCleaner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner position="top-center" richColors closeButton />
          <CacheCleaner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/campanhas/:id" element={<CampaignDetail />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Signup />} />
              <Route path="/email-confirmation-pending" element={<EmailConfirmationPending />} />
              <Route path="/minha-conta" element={<MyAccount />} />
              <Route path="/meus-pedidos" element={<MyOrders />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/pedido-confirmado" element={<OrderConfirmed />} />
              <Route path="/pedido-pendente" element={<OrderConfirmed />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
