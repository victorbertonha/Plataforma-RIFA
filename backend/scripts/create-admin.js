import bcryptjs from 'bcryptjs';
import pool from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  const email = 'superadmin';
  const password = 'Maza5304B@rnei2019';
  const name = 'Super Admin';

  try {
    console.log('🔐 Criando usuário admin...\n');

    // Hash da senha
    const passwordHash = await bcryptjs.hash(password, 10);
    console.log('✅ Senha hashada com sucesso');

    // Verificar se já existe
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Usuário já existe! Removendo...');
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    // Inserir novo admin
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, passwordHash, 'root', true]
    );

    const user = result.rows[0];

    console.log('\n✨ Admin criado com sucesso!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DADOS DO ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email/Usuário: ${user.email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`👤 Nome: ${user.name}`);
    console.log(`🎯 Role: ${user.role}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`✅ Ativo: ${user.is_active}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Próximos passos:');
    console.log('1. Acesse http://localhost:8081/login');
    console.log(`2. Faça login com email: ${user.email}`);
    console.log(`3. Senha: ${password}`);
    console.log('4. Agora você tem acesso ao painel admin!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
