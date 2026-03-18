const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'zarya-i-zerno-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true
  }
}));

const dbPath = process.env.DB_PATH || 'coffee.db';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surname TEXT DEFAULT '',
    name TEXT DEFAULT '',
    patronymic TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    birth TEXT DEFAULT '',
    city TEXT DEFAULT '',
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    loyalty_points INTEGER DEFAULT 0,
    loyalty_level INTEGER DEFAULT 1,
    discount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'drink',
    base_price REAL DEFAULT 0,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    strength INTEGER DEFAULT 0,
    slug TEXT UNIQUE,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS product_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    amount REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'г',
    min_stock REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL,
    UNIQUE(user_id, card_id)
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT DEFAULT '',
    product_image TEXT DEFAULT '',
    product_link TEXT DEFAULT '',
    product_type TEXT DEFAULT 'drink',
    strength INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    options TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_name TEXT DEFAULT '',
    product_type TEXT DEFAULT 'drink',
    price REAL DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    options TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);


const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
if (userCount === 0) {
  db.prepare(`INSERT INTO users (surname, name, email, password, role) VALUES (?, ?, ?, ?, ?)`).run('Админ', 'Админ', 'admin@coffee.ru', 'admin123', 'admin');
  db.prepare(`INSERT INTO users (surname, name, email, password, role) VALUES (?, ?, ?, ?, ?)`).run('Продавец', 'Иванов', 'seller@coffee.ru', 'seller123', 'seller');
}

const prodCount = db.prepare('SELECT COUNT(*) as cnt FROM products').get().cnt;
if (prodCount === 0) {
  const products = [
    ['Эспрессо', 'drink', 150, 'Насыщенный напиток для любителей крепкого кофе.', '/assets/images/espresso.jpg', 3, 'espresso'],
    ['Американо', 'drink', 150, 'Элегантный кофейный напиток, сбалансированный вкус.', '/assets/images/americano.jpg', 2, 'americano'],
    ['Капучино', 'drink', 150, 'Сочетание эспрессо, молока и густой пены.', '/assets/images/capuccino.jpg', 2, 'capuccino'],
    ['Латте', 'drink', 150, 'Нежный и сливочный напиток на основе эспрессо.', '/assets/images/latte.jpg', 2, 'latte'],
    ['Раф', 'drink', 150, 'Мягкий вкус и сладковатый аромат.', '/assets/images/raf.jpg', 1, 'raf'],
    ['Горячий шоколад', 'drink', 150, 'Уютный и согревающий напиток из шоколада.', '/assets/images/hot_chocolate.jpg', 0, 'hot_chocolate'],
    ['Айс капучино', 'drink', 150, 'Освежающий вариант капучино со льдом.', '/assets/images/ice_capuccino.jpg', 2, 'ice_capuccino'],
    ['Айс латте', 'drink', 150, 'Освежающий напиток с холодным молоком.', '/assets/images/ice_latte.jpg', 2, 'ice_latte'],
    ['Круассан', 'food', 120, 'Хрустящий слоеный круассан.', '/assets/images/croissant.jpg', 0, 'croissant'],
    ['Злаковые батончики', 'food', 120, 'Полезные батончики из злаков.', '/assets/images/bar.jpg', 0, 'bar'],
    ['Моти', 'food', 120, 'Японский десерт из рисового теста.', '/assets/images/mochi.jpg', 0, 'mochi'],
    ['Клаб сэндвич', 'food', 120, 'Сытный клаб сэндвич.', '/assets/images/sandwich.jpg', 0, 'sandwich'],
  ];
  const stmt = db.prepare('INSERT INTO products (name, category, base_price, description, image_url, strength, slug) VALUES (?,?,?,?,?,?,?)');
  products.forEach(p => stmt.run(...p));
}

const ingCount = db.prepare('SELECT COUNT(*) as cnt FROM ingredients').get().cnt;
if (ingCount === 0) {
  const ings = [
    ['Кофе зерновой', 2500, 'г', 1000],
    ['Молоко', 5, 'л', 3],
    ['Сахар', 2, 'кг', 2],
    ['Сироп карамельный', 1.2, 'л', 0.5],
    ['Шоколад', 1, 'кг', 0.5],
    ['Сливки', 3, 'л', 1],
    ['Корица', 200, 'г', 100],
    ['Кокосовое молоко', 2, 'л', 1],
  ];
  const stmt = db.prepare('INSERT INTO ingredients (name, quantity, unit, min_stock) VALUES (?,?,?,?)');
  ings.forEach(i => stmt.run(...i));

  const piStmt = db.prepare('INSERT INTO product_ingredients (product_id, ingredient_id, amount) VALUES (?,?,?)');
  piStmt.run(1, 1, 18); piStmt.run(1, 3, 5);
  piStmt.run(2, 1, 18); piStmt.run(2, 3, 5);
  piStmt.run(3, 1, 18); piStmt.run(3, 2, 0.15); piStmt.run(3, 3, 5);
  piStmt.run(4, 1, 18); piStmt.run(4, 2, 0.25); piStmt.run(4, 3, 5);
  piStmt.run(5, 1, 18); piStmt.run(5, 6, 0.15); piStmt.run(5, 3, 10);
  piStmt.run(6, 5, 30); piStmt.run(6, 2, 0.25); piStmt.run(6, 3, 10);
  piStmt.run(7, 1, 18); piStmt.run(7, 2, 0.15);
  piStmt.run(8, 1, 18); piStmt.run(8, 2, 0.25);
}

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Необходима авторизация' });
  next();
}
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Необходима авторизация' });
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
    if (!user || !roles.includes(user.role)) return res.status(403).json({ error: 'Нет доступа' });
    next();
  };
}

app.post('/api/register', (req, res) => {
  const { surname, name, email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
  if (typeof email !== 'string' || email.length < 5 || !email.includes('@')) {
    return res.status(400).json({ error: 'Некорректный email (мин. 5 символов)' });
  }
  if (email.length > 100) return res.status(400).json({ error: 'Email слишком длинный (макс. 100)' });
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
  }
  if (password.length > 50) return res.status(400).json({ error: 'Пароль слишком длинный (макс. 50)' });
  if (surname && surname.length < 2) return res.status(400).json({ error: 'Фамилия должна быть минимум 2 символа' });
  if (name && name.length < 2) return res.status(400).json({ error: 'Имя должно быть минимум 2 символа' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Такой email уже занят!' });

  const result = db.prepare('INSERT INTO users (surname, name, email, password) VALUES (?,?,?,?)').run(surname || '', name || '', email, password);
  req.session.userId = result.lastInsertRowid;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, user: { ...user, password: undefined } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
  if (typeof email !== 'string' || email.length < 5) return res.status(400).json({ error: 'Некорректный email' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль!' });

  req.session.userId = user.id;
  res.json({ success: true, user: { ...user, password: undefined } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: { ...user, password: undefined } });
});


app.put('/api/profile', requireAuth, (req, res) => {
  const { surname, name, patronymic, phone, email, birth, city, password } = req.body;
  const userId = req.session.userId;

  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    db.prepare('UPDATE users SET surname=?, name=?, patronymic=?, phone=?, email=?, birth=?, city=?, password=? WHERE id=?')
      .run(surname, name, patronymic, phone, email, birth, city, password, userId);
  } else {
    db.prepare('UPDATE users SET surname=?, name=?, patronymic=?, phone=?, email=?, birth=?, city=? WHERE id=?')
      .run(surname, name, patronymic, phone, email, birth, city, userId);
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ success: true, user: { ...user, password: undefined } });
});

app.get('/api/favorites', requireAuth, (req, res) => {
  const favs = db.prepare('SELECT card_id FROM favorites WHERE user_id = ?').all(req.session.userId);
  res.json(favs.map(f => f.card_id));
});

app.post('/api/favorites', requireAuth, (req, res) => {
  const { cardId } = req.body;
  try {
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, card_id) VALUES (?, ?)').run(req.session.userId, cardId);
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});

app.delete('/api/favorites/:cardId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND card_id = ?').run(req.session.userId, parseInt(req.params.cardId));
  res.json({ success: true });
});


app.get('/api/cart', requireAuth, (req, res) => {
  const items = db.prepare('SELECT * FROM cart_items WHERE user_id = ?').all(req.session.userId);
  items.forEach(i => { try { i.options = JSON.parse(i.options); } catch(e) { i.options = {}; } });
  res.json(items);
});

app.post('/api/cart', requireAuth, (req, res) => {
  const { product_id, product_name, product_image, product_link, product_type, strength, price, quantity, options } = req.body;
  db.prepare('INSERT INTO cart_items (user_id, product_id, product_name, product_image, product_link, product_type, strength, price, quantity, options) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(req.session.userId, product_id, product_name || '', product_image || '', product_link || '', product_type || 'drink', strength || 0, price || 0, quantity || 1, JSON.stringify(options || {}));
  res.json({ success: true });
});

app.delete('/api/cart/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(parseInt(req.params.id), req.session.userId);
  res.json({ success: true });
});

app.delete('/api/cart', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.session.userId);
  res.json({ success: true });
});


app.post('/api/orders', requireAuth, (req, res) => {
  const { payment_method } = req.body;
  const allowedPaymentMethods = ['card', 'sbp', 'cash', 'split'];

  if (!payment_method || !allowedPaymentMethods.includes(payment_method)) {
    return res.status(400).json({ error: 'Пожалуйста, выберите способ оплаты' });
  }

  const cartItems = db.prepare('SELECT * FROM cart_items WHERE user_id = ?').all(req.session.userId);
  if (cartItems.length === 0) return res.status(400).json({ error: 'Корзина пуста' });

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderResult = db.prepare('INSERT INTO orders (user_id, total, payment_method, status) VALUES (?,?,?,?)')
    .run(req.session.userId, total, payment_method, 'new');
  const orderId = orderResult.lastInsertRowid;

  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_name, product_type, price, quantity, options) VALUES (?,?,?,?,?,?)');
  cartItems.forEach(item => {
    insertItem.run(orderId, item.product_name, item.product_type, item.price, item.quantity, item.options);
  });

  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.session.userId);

  const pointsEarned = Math.floor(total / 10);
  db.prepare('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?').run(pointsEarned, req.session.userId);
  const user = db.prepare('SELECT loyalty_points FROM users WHERE id = ?').get(req.session.userId);
  let level = 1, discount = 0;
  if (user.loyalty_points >= 1000) { level = 3; discount = 10; }
  else if (user.loyalty_points >= 500) { level = 2; discount = 5; }
  db.prepare('UPDATE users SET loyalty_level = ?, discount = ? WHERE id = ?').run(level, discount, req.session.userId);

  res.json({
    success: true,
    orderId,
    total,
    message: 'Заказ принят'
  });
});

app.get('/api/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
  orders.forEach(o => {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
    o.items.forEach(i => { try { i.options = JSON.parse(i.options); } catch(e) { i.options = {}; } });
  });
  res.json(orders);
});

app.get('/api/orders/ready', requireAuth, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? AND status = 'ready' ORDER BY created_at DESC").all(req.session.userId);
  orders.forEach(o => {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
  });
  res.json(orders);
});


app.post('/api/questions', (req, res) => {
  const { email, message } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Заполните все поля' });
  if (message.length > 2000) return res.status(400).json({ error: 'Сообщение слишком длинное' });
  db.prepare('INSERT INTO questions (email, message) VALUES (?, ?)').run(email, message);
  res.json({ success: true });
});


app.get('/api/admin/orders', requireRole(['admin', 'seller']), (req, res) => {
  const status = req.query.status;
  let orders;
  if (status && status !== 'all') {
    orders = db.prepare('SELECT o.*, u.surname, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.status = ? ORDER BY o.created_at DESC').all(status);
  } else {
    orders = db.prepare('SELECT o.*, u.surname, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC').all();
  }
  orders.forEach(o => {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
  });
  res.json(orders);
});

const STATUS_SEQUENCE = ['new', 'cooking', 'ready', 'delivered'];

app.put('/api/admin/orders/:id/status', requireRole(['admin', 'seller']), (req, res) => {
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });

  const currentIdx = STATUS_SEQUENCE.indexOf(order.status);
  const newIdx = STATUS_SEQUENCE.indexOf(status);

  if (newIdx < 0) return res.status(400).json({ error: 'Неверный статус' });
  if (newIdx !== currentIdx + 1) {
    return res.status(400).json({ error: `Нельзя перейти из "${order.status}" в "${status}". Следующий: "${STATUS_SEQUENCE[currentIdx + 1] || 'конец'}"` });
  }

  if (status === 'cooking') {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    items.forEach(item => {
      const product = db.prepare('SELECT id FROM products WHERE name = ?').get(item.product_name);
      if (product) {
        const pIngredients = db.prepare('SELECT * FROM product_ingredients WHERE product_id = ?').all(product.id);
        pIngredients.forEach(pi => {
          db.prepare('UPDATE ingredients SET quantity = MAX(0, quantity - ?) WHERE id = ?').run(pi.amount * item.quantity, pi.ingredient_id);
        });
      }
    });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, parseInt(req.params.id));
  res.json({ success: true });
});


app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE active = 1').all();
  res.json(products);
});

app.post('/api/admin/products', requireRole(['admin']), (req, res) => {
  const { name, category, base_price, description, image_url, strength, slug } = req.body;
  const result = db.prepare('INSERT INTO products (name, category, base_price, description, image_url, strength, slug) VALUES (?,?,?,?,?,?,?)')
    .run(name, category || 'drink', base_price || 0, description || '', image_url || '', strength || 0, slug || name.toLowerCase().replace(/\s+/g, '_'));
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/admin/products/:id', requireRole(['admin']), (req, res) => {
  const { name, category, base_price, description, image_url, strength, slug } = req.body;
  db.prepare('UPDATE products SET name=?, category=?, base_price=?, description=?, image_url=?, strength=?, slug=? WHERE id=?')
    .run(name, category, base_price, description, image_url, strength, slug, parseInt(req.params.id));
  res.json({ success: true });
});

app.delete('/api/admin/products/:id', requireRole(['admin']), (req, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/admin/products/:id/ingredients', requireRole(['admin']), (req, res) => {
  const pis = db.prepare('SELECT pi.*, i.name, i.unit FROM product_ingredients pi JOIN ingredients i ON pi.ingredient_id = i.id WHERE pi.product_id = ?').all(parseInt(req.params.id));
  res.json(pis);
});

app.post('/api/admin/products/:id/ingredients', requireRole(['admin']), (req, res) => {
  const { ingredient_id, amount } = req.body;
  db.prepare('INSERT INTO product_ingredients (product_id, ingredient_id, amount) VALUES (?,?,?)').run(parseInt(req.params.id), ingredient_id, amount);
  res.json({ success: true });
});


app.get('/api/admin/ingredients', requireRole(['admin', 'seller']), (req, res) => {
  const ings = db.prepare('SELECT * FROM ingredients').all();
  res.json(ings);
});

app.post('/api/admin/ingredients', requireRole(['admin']), (req, res) => {
  const { name, quantity, unit, min_stock } = req.body;
  const result = db.prepare('INSERT INTO ingredients (name, quantity, unit, min_stock) VALUES (?,?,?,?)').run(name, quantity || 0, unit || 'г', min_stock || 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/admin/ingredients/:id', requireRole(['admin', 'seller']), (req, res) => {
  const { quantity } = req.body;
  db.prepare('UPDATE ingredients SET quantity = ? WHERE id = ?').run(quantity, parseInt(req.params.id));
  res.json({ success: true });
});

app.post('/api/admin/ingredients/:id/writeoff', requireRole(['admin']), (req, res) => {
  const { amount } = req.body;
  db.prepare('UPDATE ingredients SET quantity = MAX(0, quantity - ?) WHERE id = ?').run(amount, parseInt(req.params.id));
  const ing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(parseInt(req.params.id));
  res.json({ success: true, ingredient: ing });
});


app.get('/api/admin/users', requireRole(['admin']), (req, res) => {
  const users = db.prepare('SELECT id, surname, name, patronymic, phone, email, birth, city, role, loyalty_points, loyalty_level, discount, created_at FROM users').all();
  res.json(users);
});

app.put('/api/admin/users/:id', requireRole(['admin']), (req, res) => {
  const { role, loyalty_points, discount, surname, name, patronymic, phone, email, birth, city } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  db.prepare('UPDATE users SET role=?, loyalty_points=?, discount=?, surname=?, name=?, patronymic=?, phone=?, email=?, birth=?, city=? WHERE id=?')
    .run(role ?? user.role, loyalty_points ?? user.loyalty_points, discount ?? user.discount, surname ?? user.surname, name ?? user.name, patronymic ?? user.patronymic, phone ?? user.phone, email ?? user.email, birth ?? user.birth, city ?? user.city, parseInt(req.params.id));

  res.json({ success: true });
});

app.get('/api/admin/questions', requireRole(['admin']), (req, res) => {
  const qs = db.prepare('SELECT * FROM questions ORDER BY created_at DESC').all();
  res.json(qs);
});

app.put('/api/admin/questions/:id/read', requireRole(['admin']), (req, res) => {
  db.prepare('UPDATE questions SET is_read = 1 WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});


app.get('/api/admin/dashboard', requireRole(['admin', 'seller']), (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const ordersToday = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE date(created_at) = ?").get(today).cnt;
  const revenueToday = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE date(created_at) = ?").get(today).total;
  const avgCheck = ordersToday > 0 ? Math.round(revenueToday / ordersToday) : 0;
  const activeClients = db.prepare("SELECT COUNT(DISTINCT user_id) as cnt FROM orders WHERE created_at >= datetime('now', '-7 days')").get().cnt;
  const lowIngredients = db.prepare('SELECT * FROM ingredients WHERE quantity <= min_stock').all();
  const recentOrders = db.prepare("SELECT o.*, u.surname, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5").all();
  recentOrders.forEach(o => {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
  });
  const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;

  res.json({
    ordersToday, revenueToday, avgCheck, activeClients,
    lowIngredients, recentOrders, totalUsers
  });
});


app.get('/api/admin/reports', requireRole(['admin']), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const ordersToday = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE date(created_at) = ?").get(today).cnt;
  const revenueToday = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE date(created_at) = ?").get(today).total;
  const totalOrders = db.prepare("SELECT COUNT(*) as cnt FROM orders").get().cnt;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders").get().total;
  const ingredients = db.prepare('SELECT * FROM ingredients').all();
  const users = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('user').cnt;
  const popularProducts = db.prepare(`
    SELECT product_name, SUM(quantity) as total_qty, SUM(price * quantity) as total_revenue
    FROM order_items GROUP BY product_name ORDER BY total_qty DESC LIMIT 10
  `).all();

  res.json({
    date: today,
    ordersToday, revenueToday, totalOrders, totalRevenue,
    ingredients, users, popularProducts
  });
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(`Админ: admin@coffee.ru / admin123`);
  console.log(`Продавец: seller@coffee.ru / seller123`);
});


