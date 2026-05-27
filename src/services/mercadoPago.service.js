import crypto from 'node:crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { env } from '../config/env.js';
import { splitName, toMoney } from '../utils/normalizers.js';

let paymentClient;

function getPaymentClient() {
  if (!env.mercadoPagoAccessToken) {
    const error = new Error('Configure MERCADO_PAGO_ACCESS_TOKEN no arquivo .env.');
    error.status = 500;
    throw error;
  }

  if (!paymentClient) {
    const client = new MercadoPagoConfig({
      accessToken: env.mercadoPagoAccessToken,
      options: { timeout: 10000 }
    });
    paymentClient = new Payment(client);
  }

  return paymentClient;
}

function buildNotificationUrl() {
  if (!env.publicBaseUrl) return undefined;
  return `${env.publicBaseUrl}/api/webhooks/mercado-pago?source_news=webhooks`;
}

function splitPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return {
    areaCode: digits.length > 10 ? digits.slice(0, 2) : undefined,
    number: digits.length > 10 ? digits.slice(2) : digits || undefined
  };
}

function buildPayer(order, extraPayer = {}) {
  const address = JSON.parse(order.address_json || '{}');
  const { firstName, lastName } = splitName(order.customer_name);
  const phone = splitPhone(order.customer_phone);

  return {
    email: order.customer_email,
    first_name: firstName,
    last_name: lastName,
    identification: {
      type: extraPayer.identification?.type || 'CPF',
      number: extraPayer.identification?.number || order.customer_cpf
    },
    phone: {
      area_code: phone.areaCode,
      number: phone.number
    },
    address: {
      zip_code: address.zipCode,
      street_name: address.streetName,
      street_number: address.streetNumber || 'S/N',
      neighborhood: address.neighborhood,
      city: address.city,
      federal_unit: address.state
    }
  };
}

function sanitizePayment(payment) {
  const transactionData = payment?.point_of_interaction?.transaction_data || {};
  const transactionDetails = payment?.transaction_details || {};

  return {
    id: payment?.id ? String(payment.id) : null,
    status: payment?.status || null,
    status_detail: payment?.status_detail || null,
    payment_method_id: payment?.payment_method_id || null,
    payment_type_id: payment?.payment_type_id || null,
    ticket_url: transactionData.ticket_url || transactionDetails.external_resource_url || null,
    qr_code: transactionData.qr_code || null,
    qr_code_base64: transactionData.qr_code_base64 || null,
    barcode: transactionData.barcode || transactionData.digitable_line || null
  };
}

export async function createPaymentForOrder(order, paymentData) {
  const method = paymentData.method;
  const notificationUrl = buildNotificationUrl();
  const baseBody = {
    transaction_amount: toMoney(order.total_amount),
    description: `Pedido ${order.id} - Infotec`,
    external_reference: order.id,
    payer: buildPayer(order, paymentData.payer || {})
  };

  if (notificationUrl) {
    baseBody.notification_url = notificationUrl;
  }

  let body;

  if (method === 'pix') {
    body = {
      ...baseBody,
      payment_method_id: 'pix'
    };
  } else if (method === 'boleto') {
    body = {
      ...baseBody,
      payment_method_id: 'bolbradesco',
      date_of_expiration: paymentData.dateOfExpiration
    };
  } else if (method === 'card') {
    if (!paymentData.token || !paymentData.payment_method_id) {
      const error = new Error('Token e metodo do cartao sao obrigatorios.');
      error.status = 400;
      throw error;
    }

    body = {
      ...baseBody,
      token: paymentData.token,
      installments: Number(paymentData.installments || 1),
      issuer_id: paymentData.issuer_id,
      payment_method_id: paymentData.payment_method_id,
      payer: buildPayer(order, paymentData.payer || {})
    };
  } else {
    const error = new Error('Forma de pagamento invalida.');
    error.status = 400;
    throw error;
  }

  const idempotencyKey = paymentData.idempotencyKey || crypto.randomUUID();
  const payment = await getPaymentClient().create({
    body,
    requestOptions: { idempotencyKey }
  });

  return {
    raw: payment,
    safe: sanitizePayment(payment),
    method
  };
}

export async function getPayment(paymentId) {
  const payment = await getPaymentClient().get({ id: String(paymentId) });
  return {
    raw: payment,
    safe: sanitizePayment(payment)
  };
}
