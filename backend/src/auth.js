import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from './db.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function verifySupabaseToken(token) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Token inválido ou expirado');
  }

  return response.json(); // { id, email, ... }
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const supabaseUser = await verifySupabaseToken(token);

    // Fetch real role from profiles table
    let role = 'user';
    try {
      const profileResult = await pool.query(
        'SELECT role FROM profiles WHERE id = $1',
        [supabaseUser.id]
      );
      if (profileResult.rows.length > 0 && profileResult.rows[0].role) {
        role = profileResult.rows[0].role;
      }
    } catch (_) {
      // profiles may not have role column - default to 'user'
    }

    req.user = { id: supabaseUser.id, email: supabaseUser.email, role };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão negada' });
    }
    next();
  };
}
