from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import os

# Optional Postgres support via DATABASE_URL (Railway)
try:
    import psycopg2
    from psycopg2 import extras as psycopg2_extras
except Exception:
    psycopg2 = None
    psycopg2_extras = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'meubanco.db')
DATABASE_URL = os.getenv('DATABASE_URL')
DB_IS_POSTGRES = bool(DATABASE_URL and psycopg2 is not None)

app = Flask(__name__, static_folder='.', static_url_path='')


def get_db_connection():
    if DB_IS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_cursor(conn):
    if DB_IS_POSTGRES:
        return conn.cursor(cursor_factory=psycopg2_extras.RealDictCursor)
    return conn.cursor()


def init_db():
    # Initialize SQLite DB when using file DB, or create tables in Postgres when DATABASE_URL is set
    if DB_IS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute('''
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
        ''')
        cur.execute('''
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
        ''')
        # seed if empty
        cur.execute('SELECT COUNT(1) FROM products')
        count = cur.fetchone()[0]
        if count == 0:
            products_seed = [
                (1, 'PC Gamer RTX 4070', 'computadores', 'Processador de última geração, 32GB RAM DDR5, SSD 1TB NVMe.', 7999.00, '12x de R$ 666,58', 5.0, 'Mais Vendido', ''),
                (2, 'Notebook Dell Inspiron i5', 'notebooks', 'Perfeito para produtividade e estudos, tela Full HD, SSD rápido.', 3499.00, '10x de R$ 349,90', 5.0, 'Oferta', ''),
                (3, 'Placa de Vídeo RTX 4060', 'placas-video', 'Ray Tracing e DLSS 3 para rodar todos os games atuais com fluidez.', 2299.00, '10x de R$ 229,90', 4.0, 'Popular', ''),
                (4, 'SSD NVMe 1TB Kingston', 'ssds', 'Velocidades de leitura extremas para carregar o sistema em segundos.', 449.00, '6x de R$ 74,83', 5.0, 'Lançamento', ''),
                (5, 'Processador Ryzen 7 5700X', 'processadores', '8 núcleos e 16 threads ideais para renderização e streaming.', 1249.00, '12x de R$ 104,08', 5.0, 'Mais Vendido', ''),
                (6, 'Water Cooler RGB 240mm', 'memorias', 'Refrigeração líquida eficiente com iluminação ARGB customizável.', 399.00, '4x de R$ 99,75', 4.5, 'Oferta', '')
            ]
            cur.executemany('INSERT INTO products (id, name, category, desc, price, installment, rating, badge, image) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)', products_seed)
        conn.commit()
        conn.close()
        return

    # SQLite fallback
    if os.path.exists(DB_PATH):
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            cpf TEXT NOT NULL UNIQUE,
            address TEXT,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE products (
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
    ''')
    # Seed basic products from frontend defaults
    products_seed = [
        (1, 'PC Gamer RTX 4070', 'computadores', 'Processador de última geração, 32GB RAM DDR5, SSD 1TB NVMe.', 7999.00, '12x de R$ 666,58', 5.0, 'Mais Vendido', ''),
        (2, 'Notebook Dell Inspiron i5', 'notebooks', 'Perfeito para produtividade e estudos, tela Full HD, SSD rápido.', 3499.00, '10x de R$ 349,90', 5.0, 'Oferta', ''),
        (3, 'Placa de Vídeo RTX 4060', 'placas-video', 'Ray Tracing e DLSS 3 para rodar todos os games atuais com fluidez.', 2299.00, '10x de R$ 229,90', 4.0, 'Popular', ''),
        (4, 'SSD NVMe 1TB Kingston', 'ssds', 'Velocidades de leitura extremas para carregar o sistema em segundos.', 449.00, '6x de R$ 74,83', 5.0, 'Lançamento', ''),
        (5, 'Processador Ryzen 7 5700X', 'processadores', '8 núcleos e 16 threads ideais para renderização e streaming.', 1249.00, '12x de R$ 104,08', 5.0, 'Mais Vendido', ''),
        (6, 'Water Cooler RGB 240mm', 'memorias', 'Refrigeração líquida eficiente com iluminação ARGB customizável.', 399.00, '4x de R$ 99,75', 4.5, 'Oferta', '')
    ]
    cur.executemany('INSERT INTO products (id, name, category, desc, price, installment, rating, badge, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', products_seed)
    conn.commit()
    conn.close()


def row_to_dict(row):
    # sqlite3.Row has keys(); psycopg2 RealDictRow behaves like a dict
    try:
        return {key: row[key] for key in row.keys()}
    except Exception:
        try:
            return dict(row)
        except Exception:
            return row


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)


@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cur = get_cursor(conn)
    cur.execute('SELECT * FROM products')
    rows = cur.fetchall()
    products = [row_to_dict(row) for row in rows]
    conn.close()
    return jsonify(products)


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    cur = get_cursor(conn)
    if DB_IS_POSTGRES:
        cur.execute('SELECT * FROM products WHERE id = %s', (product_id,))
    else:
        cur.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return jsonify({'error': 'Produto não encontrado'}), 404
    return jsonify(row_to_dict(row))


@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cur = get_cursor(conn)
    cur.execute('SELECT id, name, email, phone, cpf, address, created_at FROM users')
    rows = cur.fetchall()
    users = [row_to_dict(row) for row in rows]
    conn.close()
    return jsonify(users)


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db_connection()
    cur = get_cursor(conn)
    if DB_IS_POSTGRES:
        cur.execute('SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE id = %s', (user_id,))
    else:
        cur.execute('SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE id = ?', (user_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    return jsonify(row_to_dict(row))


@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json(force=True)
    required_fields = ['name', 'email', 'password', 'phone', 'cpf', 'address']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} é obrigatório.'}), 400

    conn = get_db_connection()
    cur = get_cursor(conn)
    try:
        if DB_IS_POSTGRES:
            cur.execute(
                'INSERT INTO users (name, email, phone, cpf, address, password) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
                (data['name'], data['email'], data['phone'], data['cpf'], data['address'], data['password'])
            )
            user_id = cur.fetchone()['id']
        else:
            cur.execute(
                'INSERT INTO users (name, email, phone, cpf, address, password) VALUES (?, ?, ?, ?, ?, ?)',
                (data['name'], data['email'], data['phone'], data['cpf'], data['address'], data['password'])
            )
            user_id = cur.lastrowid
        conn.commit()
        if DB_IS_POSTGRES:
            cur.execute('SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE id = %s', (user_id,))
        else:
            cur.execute('SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE id = ?', (user_id,))
        row = cur.fetchone()
        return jsonify(row_to_dict(row)), 201
    except Exception as error:
        message = 'Email ou CPF já cadastrado.'
        return jsonify({'error': message}), 400
    finally:
        conn.close()


@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json(force=True)
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email e senha são obrigatórios.'}), 400

    conn = get_db_connection()
    cur = get_cursor(conn)
    if DB_IS_POSTGRES:
        cur.execute('SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE email = %s AND password = %s',
                    (data['email'], data['password']))
    else:
        cur.execute('SELECT id, name, email, phone, cpf, address, created_at FROM users WHERE email = ? AND password = ?',
                    (data['email'], data['password']))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return jsonify({'error': 'Email ou senha incorretos.'}), 401
    return jsonify(row_to_dict(row))


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    init_db()
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() in ('1', 'true', 'yes')
    app.run(host=host, port=port, debug=debug)
