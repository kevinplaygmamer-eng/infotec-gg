import { Router } from 'express';
import { findOrderByExternalReference, findOrderByPaymentId, savePaymentEvent, updateOrderPayment } from '../services/order.service.js';
import { getPayment } from '../services/mercadoPago.service.js';
import { validateMercadoPagoSignature } from '../utils/webhookSignature.js';

export const webhookRoutes = Router();

webhookRoutes.post('/webhooks/mercado-pago', async (req, res, next) => {
  try {
    if (!validateMercadoPagoSignature(req)) {
      res.status(401).json({ error: 'Assinatura do webhook invalida.' });
      return;
    }

    const type = req.body?.type || req.query.type;
    const action = req.body?.action || req.query.action;
    const paymentId = req.body?.data?.id || req.query['data.id'];

    if (type !== 'payment' || !paymentId) {
      await savePaymentEvent({ eventType: type, action, payload: req.body });
      res.sendStatus(200);
      return;
    }

    const payment = await getPayment(paymentId);
    const externalReference = payment.raw?.external_reference;
    let order = await findOrderByPaymentId(paymentId);

    if (!order && externalReference) {
      order = await findOrderByExternalReference(externalReference);
    }

    if (order) {
      await updateOrderPayment(order.id, payment.raw, order.payment_method);
    }

    await savePaymentEvent({
      orderId: order?.id,
      paymentId,
      eventType: type,
      action,
      payload: req.body
    });

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});
