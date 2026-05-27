import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { all, get, run } from '../db/database.js';
import { normalizeCpf, normalizeEmail } from '../utils/normalizers.js';

export const authRoutes = Router();

authRoutes.get('/users', async (req, res, next) => {
  try {
    const users = await all('SELECT id, name, email, phone, cpf, address, created_at FROM users');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

authRoutes.get('/users/:userId', async (req, res, next) => {
  try {
    const user = await get(
      'SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE id = ?',
      [req.params.userId]
    );

    if (!user) {
      res.status(404).json({ error: 'Usuario nao encontrado.' });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/register', async (req, res, next) => {
  try {
    const data = req.body || {};
    const name = String(data.name || '').trim();
    const email = normalizeEmail(data.email);
    const password = String(data.password || '');
    const phone = String(data.phone || '').trim();
    const cpf = normalizeCpf(data.cpf);
    const address = String(data.address || '').trim();

    if (!name || !email || !password || !phone || !cpf || !address) {
      res.status(400).json({ error: 'Preencha todos os campos obrigatorios.' });
      return;
    }

    if (cpf.length !== 11) {
      res.status(400).json({ error: 'CPF deve ter 11 digitos.' });
      return;
    }

    const existing = await get(
      "SELECT id FROM users WHERE LOWER(email) = ? OR REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?",
      [email, cpf]
    );

    if (existing) {
      res.status(400).json({ error: 'Email ou CPF ja cadastrado.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await run(
      'INSERT INTO users (name, email, phone, cpf, address, password) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, cpf, address, passwordHash]
    );

    const user = await get(
      'SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha sao obrigatorios.' });
      return;
    }

    const user = await get(
      'SELECT id, name, email, phone, cpf, address, password, created_at FROM users WHERE LOWER(email) = ?',
      [email]
    );

    if (!user) {
      res.status(401).json({ error: 'Email incorreto.' });
      return;
    }

    const isHash = String(user.password || '').startsWith('$2');
    const passwordMatches = isHash
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!passwordMatches) {
      res.status(401).json({ error: 'Senha incorreta.' });
      return;
    }

    delete user.password;
    res.json(user);
  } catch (error) {
    next(error);
  }
});
