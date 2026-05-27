import { Router } from 'express';
import { createOrder, getOrder, updateOrderPayment } from '../services/order.service.js';
import { createPaymentForOrder, getPayment } from '../services/mercadoPago.service.js';

export const checkoutRoutes = Router();

checkoutRoutes.post('/orders', async (req, res, next) => {
  try {
    const order = await createOrder(req.body || {});
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

checkoutRoutes.get('/orders/:orderId', async (req, res, next) => {
  try {
    const order = await getOrder(req.params.orderId);

    if (!order) {
      res.status(404).json({ error: 'Pedido nao encontrado.' });
      return;
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

checkoutRoutes.get('/orders/:orderId/status', async (req, res, next) => {
  try {
    let order = await getOrder(req.params.orderId);

    if (!order) {
      res.status(404).json({ error: 'Pedido nao encontrado.' });
      return;
    }

    if (order.mercado_pago_payment_id) {
      const payment = await getPayment(order.mercado_pago_payment_id);
      order = await updateOrderPayment(order.id, payment.raw, order.payment_method);
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

checkoutRoutes.post('/orders/:orderId/payments', async (req, res, next) => {
  try {
    const order = await getOrder(req.params.orderId);

    if (!order) {
      res.status(404).json({ error: 'Pedido nao encontrado.' });
      return;
    }

    const payment = await createPaymentForOrder(order, req.body || {});
    const updatedOrder = await updateOrderPayment(order.id, payment.raw, payment.method);

    res.status(201).json({
      order: updatedOrder,
      payment: payment.safe
    });
  } catch (error) {
    next(error);
  }
});
