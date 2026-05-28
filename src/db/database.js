import fs from 'node:fs/promises';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { env } from '../config/env.js';

let SQL;
let db;
let dbReady;
let writeQueue = Promise.resolve();
let usingPostgres = Boolean(env.databaseUrl && env.databaseUrl.trim());
let pool;

const productSeeds = [
  [1, 'PC Gamer RTX 4070', 'computadores', 'Processador de ultima geracao, 32GB RAM DDR5, SSD 1TB NVMe.', 7999.00, '12x de R$ 666,58', 5.0, 'Mais Vendido', 'https://http2.mlstatic.com/D_NQ_NP_2X_855780-MLB82309991799_022025-F.webp'],
  [2, 'Notebook Dell Inspiron i5', 'notebooks', 'Perfeito para produtividade e estudos, tela Full HD, SSD rapido.', 3499.00, '10x de R$ 349,90', 5.0, 'Oferta', 'https://http2.mlstatic.com/D_NQ_NP_2X_705031-MLA92611852323_092025-F.webp'],
  [3, 'Placa de Video RTX 4060', 'placas-video', 'Ray Tracing e DLSS 3 para rodar todos os games atuais com fluidez.', 2299.00, '10x de R$ 229,90', 4.0, 'Popular', 'https://m.media-amazon.com/images/I/617uDFLVAML._AC_SY300_SX300_QL70_ML2_.jpg'],
  [4, 'SSD NVMe 1TB Kingston', 'ssds', 'Velocidades de leitura extremas para carregar o sistema em segundos.', 449.00, '6x de R$ 74,83', 5.0, 'Lancamento', 'https://m.media-amazon.com/images/I/71c5uuoM1bL._AC_SX522_.jpg'],
  [5, 'Processador Ryzen 7 5700X', 'processadores', '8 nucleos e 16 threads ideais para renderizacao e streaming.', 1249.00, '12x de R$ 104,08', 5.0, 'Mais Vendido', 'https://images7.kabum.com.br/produtos/fotos/938497/processador-amd-ryzen-7-5700-3-7-ghz-4-6ghz-max-turbo-cache-20mb-8-nucleos-16-threads-am4-100-100000743sbx_1763061441_gg.jpg'],
  [6, 'Water Cooler RGB 240mm', 'memorias', 'Refrigeracao liquida eficiente com iluminacao ARGB customizavel.', 399.00, '4x de R$ 99,75', 4.5, 'Oferta', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80']
];

export function getDb() {
  return loadDatabase();
}
async function loadDatabase() {
  if (usingPostgres) {
    if (!pool) {
      const { Pool } = await import('pg');
      pool = new Pool({ connectionString: env.databaseUrl, ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false });
    }

    return pool;
  }

  if (!dbReady) {
    dbReady = (async () => {
      SQL = await initSqlJs({
        locateFile: (file) => path.join(env.rootDir, 'node_modules', 'sql.js', 'dist', file)
      });

      try {
        const fileBuffer = await fs.readFile(env.databasePath);
        db = new SQL.Database(fileBuffer);
      } catch (error) {
        db = new SQL.Database();
      }

      db.run('PRAGMA foreign_keys = ON');
    })();
  }

  await dbReady;
  return db;
}

async function persistDatabase() {
  if (usingPostgres) return;
  const data = db.export();
  await fs.mkdir(path.dirname(env.databasePath), { recursive: true });
  await fs.writeFile(env.databasePath, Buffer.from(data));
}

function sqliteQueryRows(sql, params = []) {
  const statement = db.prepare(sql);
  const rows = [];

  try {
    statement.bind(params);
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
  } finally {
    statement.free();
  }

  return rows;
}

export async function run(sql, params = []) {
  if (usingPostgres) {
    const pool = await loadDatabase();
    const client = await pool.connect();
    try {
      const res = await client.query(sql, params);
      return { lastID: res.rows?.[0]?.id || 0, changes: res.rowCount || 0 };
    } finally {
      client.release();
    }
  }

  writeQueue = writeQueue.then(async () => {
    await loadDatabase();
    db.run(sql, params);
    const meta = sqliteQueryRows('SELECT last_insert_rowid() AS lastID, changes() AS changes')[0];
    await persistDatabase();
    return {
      lastID: meta?.lastID || 0,
      changes: meta?.changes || 0
    };
  });

  return writeQueue;
}

export async function get(sql, params = []) {
  if (usingPostgres) {
    const pool = await loadDatabase();
    const res = await pool.query(sql, params);
    return res.rows[0];
  }

  await loadDatabase();
  return sqliteQueryRows(sql, params)[0];
}

export async function all(sql, params = []) {
  if (usingPostgres) {
    const pool = await loadDatabase();
    const res = await pool.query(sql, params);
    return res.rows;
  }

  await loadDatabase();
  return sqliteQueryRows(sql, params);
}

export async function initDatabase() {
  if (usingPostgres) {
    // Create tables adapted for Postgres
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        cpf TEXT NOT NULL UNIQUE,
        address TEXT,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        category TEXT,
        desc TEXT,
        price REAL,
        installment TEXT,
        rating REAL,
        badge TEXT,
        image TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        customer_cpf TEXT,
        shipping_address TEXT,
        address_json TEXT,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'created',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_status_detail TEXT,
        payment_method TEXT,
        mercado_pago_payment_id TEXT,
        ticket_url TEXT,
        qr_code TEXT,
        qr_code_base64 TEXT,
        barcode TEXT,
        external_reference TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id INTEGER,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS payment_events (
        id SERIAL PRIMARY KEY,
        order_id TEXT,
        mercado_pago_payment_id TEXT,
        event_type TEXT,
        action TEXT,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const productCount = await get('SELECT COUNT(1) AS count FROM products');
    if (!productCount || Number(productCount.count) === 0) {
      for (const product of productSeeds) {
        await run(
          'INSERT INTO products (id, name, category, desc, price, installment, rating, badge, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          product
        );
      }
    }

    for (const product of productSeeds) {
      await run(
        "UPDATE products SET image = $1 WHERE id = $2 AND (image IS NULL OR TRIM(image) = '')",
        [product[8], product[0]]
      );
    }

    return;
  }

  // fallback: sqlite behavior
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      cpf TEXT NOT NULL UNIQUE,
      address TEXT,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      category TEXT,
      desc TEXT,
      price REAL,
      installment TEXT,
      rating REAL,
      badge TEXT,
      image TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      customer_cpf TEXT,
      shipping_address TEXT,
      address_json TEXT,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_status_detail TEXT,
      payment_method TEXT,
      mercado_pago_payment_id TEXT,
      ticket_url TEXT,
      qr_code TEXT,
      qr_code_base64 TEXT,
      barcode TEXT,
      external_reference TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS payment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      mercado_pago_payment_id TEXT,
      event_type TEXT,
      action TEXT,
      payload TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const productCount = await get('SELECT COUNT(1) AS count FROM products');
  if (!productCount || productCount.count === 0) {
    for (const product of productSeeds) {
      await run(
        'INSERT INTO products (id, name, category, desc, price, installment, rating, badge, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        product
      );
    }
  }

  for (const product of productSeeds) {
    await run(
      "UPDATE products SET image = ? WHERE id = ? AND (image IS NULL OR TRIM(image) = '')",
      [product[8], product[0]]
    );
  }
}
