import { Router } from 'express';
import { all, get } from '../db/database.js';

export const productRoutes = Router();

productRoutes.get('/products', async (req, res, next) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY id');
    res.json(products);
  } catch (error) {
    next(error);
  }
});

productRoutes.get('/products/:productId', async (req, res, next) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = ?', [req.params.productId]);

    if (!product) {
      res.status(404).json({ error: 'Produto nao encontrado.' });
      return;
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});
