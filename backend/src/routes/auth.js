import express from 'express';
import pool from '../db.js';
import { generateToken } from '../auth.js';
import { validateEmail, validateCPF, hashPassword, comparePassword } from '../utils.js';

const router = express.Router();

// Registro de usuário
router.post('/signup', async (req, res) => {
  const { name, email, phone, cpf, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Senhas não correspondem' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (cpf && !validateCPF(cpf)) {
    return res.status(400).json({ error: 'CPF inválido' });
  }

  try {
    // Verificar se email já existe
    const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Verificar se CPF já existe
    if (cpf) {
      const existingCPF = await pool.query('SELECT id FROM users WHERE cpf = $1', [cpf]);
      if (existingCPF.rows.length > 0) {
        return res.status(409).json({ error: 'CPF já cadastrado' });
      }
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      'INSERT INTO users (name, email, phone, cpf, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role',
      [name, email, phone || null, cpf || null, passwordHash, 'user']
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Erro no signup:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Obter dados do usuário autenticado
router.get('/me', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const { verifyToken } = await import('../src/auth.js');
    const decoded = verifyToken(token);
    const result = await pool.query('SELECT id, name, email, phone, cpf, role, created_at FROM users WHERE id = $1', [
      decoded.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
});

export default router;
