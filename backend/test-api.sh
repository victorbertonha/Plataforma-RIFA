#!/bin/bash
# Script para testar a API RIFA - Copie e cole os comandos no terminal

# ===== CONFIG =====
API="http://localhost:5000/api"
EMAIL="teste@example.com"
PASSWORD="senha123456"
TOKEN=""

echo "🧪 Testando API RIFA"
echo "===================="

# ===== 1. SIGNUP =====
echo ""
echo "1️⃣ Criando novo usuário..."
SIGNUP=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "'$EMAIL'",
    "phone": "11987654321",
    "cpf": "12345678901",
    "password": "'$PASSWORD'",
    "confirmPassword": "'$PASSWORD'"
  }')

echo $SIGNUP | jq .
TOKEN=$(echo $SIGNUP | jq -r '.token')
echo "✅ Token obtido: ${TOKEN:0:20}..."

# ===== 2. LOGIN =====
echo ""
echo "2️⃣ Fazendo login..."
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'"
  }')

echo $LOGIN | jq .
TOKEN=$(echo $LOGIN | jq -r '.token')

# ===== 3. GET ME =====
echo ""
echo "3️⃣ Obtendo dados do usuário autenticado..."
curl -s -X GET "$API/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .

# ===== 4. CRIAR CAMPANHA =====
echo ""
echo "4️⃣ Criando uma campanha (precisa ser admin/root)..."
# Nota: Isso vai falhar se o usuário não for admin, é esperado
curl -s -X POST "$API/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "iPhone 15 Pro",
    "description": "Sorteio de um iPhone 15 Pro 256GB",
    "imageUrl": "https://via.placeholder.com/300x300?text=iPhone",
    "category": "eletronicos",
    "totalNumbers": 100,
    "pricePerNumber": 50.00,
    "opensAt": "2024-01-16T00:00:00Z",
    "closesAt": "2024-02-16T00:00:00Z"
  }' | jq .

# ===== 5. LISTAR CAMPANHAS =====
echo ""
echo "5️⃣ Listando campanhas públicas..."
curl -s -X GET "$API/campaigns" | jq .

# ===== 6. HEALTH CHECK =====
echo ""
echo "6️⃣ Verificando saúde do servidor..."
curl -s -X GET "http://localhost:5000/api/health" | jq .

echo ""
echo "✅ Testes completos!"
