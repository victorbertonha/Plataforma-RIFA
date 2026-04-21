import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/db.js';
import authRoutes from './src/routes/auth.js';
import campaignRoutes from './src/routes/campaigns.js';
import adminRoutes from './src/routes/admin.js';
import ticketRoutes from './src/routes/tickets.js';
import paymentRoutes from './src/routes/payments.js';

dotenv.config();

// Ensure profiles table has required columns
async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Migrations OK');
  } catch (err) {
    console.warn('⚠️  Migration warning (profiles may not exist yet):', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true,
}));
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📡 CORS habilitado para ${process.env.FRONTEND_URL || 'http://localhost:8081'}`);
  });
});
