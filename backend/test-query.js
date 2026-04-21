import dotenv from 'dotenv';
import pool from './src/db.js';

dotenv.config();

console.log('🧪 Testando queries...\n');

try {
  console.log('1️⃣ Testando listagem de campanhas...');
  const result = await pool.query(`
    SELECT 
      c.id, c.title, c.description, c.image_url, c.category,
      c.total_numbers, c.price_per_number, c.status,
      c.opens_at, c.closes_at, c.winner_number, c.winner_id,
      COALESCE(COUNT(CASE WHEN t.status = 'sold' THEN 1 END), 0) as numbers_sold,
      u.name as winner_name
    FROM campaigns c
    LEFT JOIN tickets t ON c.id = t.campaign_id
    LEFT JOIN users u ON c.winner_id = u.id
    WHERE c.status IN ('open', 'finished')
    GROUP BY c.id, u.name
    ORDER BY c.opens_at DESC
  `);
  console.log('✅ Query executada com sucesso!');
  console.log(`   Campanhas encontradas: ${result.rows.length}`);
  console.log(`   Dados: ${JSON.stringify(result.rows.slice(0, 1), null, 2)}`);
} catch (error) {
  console.error('❌ Erro na query:', error.message);
  console.error('   Detalhes:', error);
}

process.exit(0);
