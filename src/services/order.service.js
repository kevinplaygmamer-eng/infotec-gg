import crypto from 'node:crypto';
import { all, get, run } from '../db/database.js';
import { normalizeCpf, normalizeEmail, toMoney } from '../utils/normalizers.js';

function createOrderId() {
  return `INF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function buildAddressText(address = {}) {
  const parts = [
    address.streetName,
    address.streetNumber,
    address.neighborhood,
    address.city,
    address.state,
    address.zipCode
  ];
  return parts.filter(Boolean).join(', ');
}

export async function createOrder({ items, payer, address }) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Carrinho vazio.');
    error.status = 400;
    throw error;
  }

  const email = normalizeEmail(payer?.email);
  const cpf = normalizeCpf(payer?.cpf);
  const customerName = String(payer?.name || '').trim();

  if (!customerName || !email || !cpf) {
    const error = new Error('Nome, email e CPF sao obrigatorios.');
    error.status = 400;
    throw error;
  }

  const normalizedItems = items.map((item) => ({
    id: Number(item.id),
    quantity: Math.max(1, Number(item.quantity || 1))
  })).filter((item) => Number.isInteger(item.id) && item.id > 0);

  if (normalizedItems.length === 0) {
    const error = new Error('Itens do pedido invalidos.');
    error.status = 400;
    throw error;
  }

  const placeholders = normalizedItems.map(() => '?').join(',');
  const products = await all(`SELECT * FROM products WHERE id IN (${placeholders})`, normalizedItems.map((item) => item.id));
  const productMap = new Map(products.map((product) => [Number(product.id), product]));

  const orderItems = normalizedItems.map((item) => {
    const product = productMap.get(item.id);
    if (!product) {
      const error = new Error(`Produto ${item.id} nao encontrado.`);
      error.status = 404;
      throw error;
    }

    const unitPrice = toMoney(product.price);
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice: toMoney(unitPrice * item.quantity)
    };
  });

  const totalAmount = toMoney(orderItems.reduce((sum, item) => sum + item.totalPrice, 0));
  const orderId = createOrderId();
  const user = await get('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
  const addressJson = JSON.stringify(address || {});
  const shippingAddress = buildAddressText(address) || String(payer?.address || '').trim();

  await run(
    `INSERT INTO orders (
      id, user_id, customer_name, customer_email, customer_phone, customer_cpf,
      shipping_address, address_json, total_amount, external_reference
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      user?.id || null,
      customerName,
      email,
      String(payer?.phone || '').trim(),
      cpf,
      shippingAddress,
      addressJson,
      totalAmount,
      orderId
    ]
  );

  for (const item of orderItems) {
    await run(
      `INSERT INTO order_items (order_id, product_id, name, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, item.productId, item.name, item.quantity, item.unitPrice, item.totalPrice]
    );
  }

  return getOrder(orderId);
}

export async function getOrder(orderId) {
  const order = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) return null;

  const items = await all('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [orderId]);
  return { ...order, items };
}

export async function updateOrderPayment(orderId, payment, method) {
  const transactionData = payment?.point_of_interaction?.transaction_data || {};
  const transactionDetails = payment?.transaction_details || {};
  const orderStatus = payment?.status === 'approved'
    ? 'paid'
    : ['rejected', 'cancelled'].includes(payment?.status)
      ? 'payment_failed'
      : 'awaiting_payment';

  await run(
    `UPDATE orders SET
      status = ?,
      payment_status = ?,
      payment_status_detail = ?,
      payment_method = ?,
      mercado_pago_payment_id = ?,
      ticket_url = ?,
      qr_code = ?,
      qr_code_base64 = ?,
      barcode = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      orderStatus,
      payment?.status || 'pending',
      payment?.status_detail || null,
      method || payment?.payment_method_id || null,
      payment?.id ? String(payment.id) : null,
      transactionData.ticket_url || transactionDetails.external_resource_url || null,
      transactionData.qr_code || null,
      transactionData.qr_code_base64 || null,
      transactionData.barcode || transactionData.digitable_line || null,
      orderId
    ]
  );

  return getOrder(orderId);
}

export async function findOrderByPaymentId(paymentId) {
  return get('SELECT * FROM orders WHERE mercado_pago_payment_id = ?', [String(paymentId)]);
}

export async function findOrderByExternalReference(externalReference) {
  return get('SELECT * FROM orders WHERE external_reference = ?', [externalReference]);
}

export async function savePaymentEvent({ orderId, paymentId, eventType, action, payload }) {
  await run(
    `INSERT INTO payment_events (order_id, mercado_pago_payment_id, event_type, action, payload)
     VALUES (?, ?, ?, ?, ?)`,
    [
      orderId || null,
      paymentId ? String(paymentId) : null,
      eventType || null,
      action || null,
      JSON.stringify(payload || {})
    ]
  );
}
