# 🛒 Funcionalidade de Carrinho - Documentação

## Resumo das Mudanças

Implementei uma funcionalidade completa de carrinho para sua aplicação de RIFA. O carrinho agora funciona adequadamente com persistência de dados.

---

## 📁 Arquivos Criados/Modificados

### 1. **CartContext** (`src/context/CartContext.tsx`) - NOVO
Um contexto React que gerencia todo o estado do carrinho:

**Funcionalidades:**
- ✅ Adicionar itens ao carrinho
- ✅ Remover itens do carrinho
- ✅ Atualizar quantidade de itens
- ✅ Limpar o carrinho completamente
- ✅ Calcular automaticamente o total de items e preço
- ✅ Persistir dados no localStorage (o carrinho não é perdido ao recarregar)

**Interface CartItem:**
```typescript
{
  id: string;
  campaignId: string;
  title: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  image: string;
  category: string;
}
```

### 2. **Página Cart** (`src/pages/Cart.tsx`) - NOVO
Página completa do carrinho com:
- 📝 Listagem de itens adicionados
- ➕➖ Botões para aumentar/diminuir quantidade
- 🗑️ Botão para remover items
- 💰 Resumo do pedido com total
- ✅ Botão para finalizar compra (simula processamento de pagamento)
- 📱 Design responsivo para mobile e desktop

### 3. **CampaignDetail** (`src/components/pages/CampaignDetail.tsx`) - MODIFICADO
- Importa o hook `useCart`
- Função `handleAddToCart` agora realmente adiciona itens ao carrinho usando o contexto
- Reseta a quantidade após adicionar ao carrinho

### 4. **Header** (`src/components/layout/Header.tsx`) - MODIFICADO
- Importa o hook `useCart`
- Badge do carrinho agora mostra o número real de itens (dinâmico)
- Botão do carrinho agora é um link para a página `/carrinho`
- Badge desaparece quando o carrinho está vazio

### 5. **App.tsx** - MODIFICADO
- Adiciona `CartProvider` para envolver toda a aplicação
- Nova rota `/carrinho` que renderiza o componente Cart
- Importa o `Cart` component

---

## 🎯 Como Usar

### Para Usuários:
1. **Adicionar ao Carrinho**: Clique no botão "Adicionar ao Carrinho" em qualquer campanha
2. **Visualizar Carrinho**: Clique no ícone do carrinho no header (mostra a quantidade de itens)
3. **Gerenciar Items**: Na página do carrinho, você pode:
   - Aumentar/diminuir quantidade com os botões ➕ ➖
   - Remover items com o botão 🗑️
   - Ver o resumo do pedido
4. **Finalizar Compra**: Clique em "Finalizar Compra" para processar o pedido

### Para Desenvolvedores:
```typescript
import { useCart } from '@/context/CartContext';

const MyComponent = () => {
  const { items, totalPrice, totalItems, addToCart, removeFromCart, updateQuantity } = useCart();
  
  // Usar as funções conforme necessário
  addToCart({
    id: 'unique-id',
    campaignId: 'campaign-123',
    title: 'Campanha X',
    quantity: 5,
    pricePerTicket: 100,
    image: 'url-da-imagem',
    category: 'Eletrônicos'
  });
};
```

---

## 💾 Armazenamento Persistente

O carrinho é automaticamente salvo no `localStorage` do navegador. Isso significa:
- ✅ Os itens não serão perdidos ao recarregar a página
- ✅ Os itens não serão perdidos ao fechar o navegador
- ✅ Cada navegador tem seu próprio carrinho independente

---

## 🎨 Features Implementadas

| Feature | Status |
|---------|--------|
| Adicionar items ao carrinho | ✅ |
| Remover items do carrinho | ✅ |
| Aumentar/diminuir quantidade | ✅ |
| Persistência de dados | ✅ |
| Contador dinâmico no header | ✅ |
| Página de carrinho responsiva | ✅ |
| Cálculo automático de totais | ✅ |
| Toast notifications | ✅ |
| Simulação de checkout | ✅ |

---

## 🔄 Fluxo de Dados

```
CampaignDetail (addToCart) 
    ↓
CartContext (armazena items)
    ↓
localStorage (persistência)
    ↓
Header (exibe totalItems)
    ↓
Cart Page (visualiza e gerencia)
```

---

## 📝 Notas Importantes

1. O carrinho limpa automaticamente após um checkout bem-sucedido
2. O processamento de pagamento é simulado (espera 2 segundos)
3. Todos os valores são formatados em Real (BRL)
4. O design segue a paleta de cores e componentes da sua aplicação

---

## 🚀 Próximas Melhorias Possíveis

- [ ] Integrar com gateway de pagamento real
- [ ] Adicionar cupom de desconto
- [ ] Histórico de pedidos
- [ ] Carrinho compartilhado entre dispositivos (com autenticação)
- [ ] Integração com email para confirmação de pedido
- [ ] Avaliação de campanhas após compra
