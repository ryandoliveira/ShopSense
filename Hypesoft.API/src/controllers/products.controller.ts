import { Request, Response } from 'express';
import { readDB, writeDB } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../entities/Product';   // <<-- ajuste aqui



// helpers
function toNumber(v: any) { const n = Number(v); return Number.isNaN(n) ? null : n; }

export const listProducts = (req: Request, res: Response) => {
  const db = readDB();
  const page = Math.max(1, toNumber(req.query.page) ?? 1);
  const pageSize = Math.max(1, Math.min(1000, toNumber(req.query.pageSize) ?? 50));
  const q = String(req.query.q || '').toLowerCase().trim();
  const categoryId = req.query.categoryId != null ? String(req.query.categoryId) : null;

  let items = db.products.slice();

  if (q) {
    items = items.filter((p: Product) =>
      String(p.name || '').toLowerCase().includes(q) ||
      String(p.description || '').toLowerCase().includes(q)
    );
  }

  if (categoryId) {
    items = items.filter((p: Product) => String(p.categoryId) === String(categoryId));
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return res.json({ items: pageItems, total, page, pageSize });
};

export const getProduct = (req: Request, res: Response) => {
  const db = readDB();
  const id = String(req.params.id);
  const p = db.products.find((x: Product) => String(x.id) === id);
  if (!p) return res.status(404).json({ error: 'not_found' });
  return res.json(p);
};

export const createProduct = (req: Request, res: Response) => {
  const db = readDB();
  const body = req.body || {};
  // basic validation
  const name = String(body.name || '').trim();
  const price = toNumber(body.price);
  const quantity = toNumber(body.quantity);
  if (!name || price == null || quantity == null) {
    return res.status(400).json({ error: 'validation', message: 'name, price and quantity are required' });
  }

  const now = new Date().toISOString();
  const p: Product = {
    id: uuidv4(),
    name,
    description: String(body.description || ''),
    price: Number(price),
    quantity: Number(quantity),
    categoryId: body.categoryId == null ? null : body.categoryId,
    image: body.image || null,
    createdAt: now,
    updatedAt: now,
  };
  db.products.unshift(p);
  writeDB(db);
  return res.status(201).json(p);
};

export const updateProduct = (req: Request, res: Response) => {
  const db = readDB();
  const id = String(req.params.id);
  const idx = db.products.findIndex((x: Product) => String(x.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });

  const body = req.body || {};
  // allow partial updates, but validate types when present
  if ('price' in body && toNumber(body.price) == null) {
    return res.status(400).json({ error: 'validation', message: 'price invalid' });
  }
  if ('quantity' in body && toNumber(body.quantity) == null) {
    return res.status(400).json({ error: 'validation', message: 'quantity invalid' });
  }

  const existing = db.products[idx];
  const updated: Product = {
    ...existing,
    ...body,
    price: body.price != null ? Number(body.price) : existing.price,
    quantity: body.quantity != null ? Number(body.quantity) : existing.quantity,
    updatedAt: new Date().toISOString(),
  };
  db.products[idx] = updated;
  writeDB(db);
  return res.json(updated);
};

export const deleteProduct = (req: Request, res: Response) => {
  const db = readDB();
  const id = String(req.params.id);
  const idx = db.products.findIndex((x: Product) => String(x.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  db.products.splice(idx, 1);
  writeDB(db);
  return res.status(204).send();
};

// action endpoint (view/increment/decrement simple example)
export const actionProduct = (req: Request, res: Response) => {
  const db = readDB();
  const id = String(req.params.id);
  const idx = db.products.findIndex((x: Product) => String(x.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  const action = String(req.body?.action || '').toLowerCase();
  const p = db.products[idx];
  if (action === 'increment') {
    p.quantity = Number(p.quantity) + 1;
  } else if (action === 'decrement') {
    p.quantity = Math.max(0, Number(p.quantity) - 1);
  } else if (action === 'view') {
    // no-op example
  } else {
    return res.status(400).json({ error: 'unknown_action' });
  }
  p.updatedAt = new Date().toISOString();
  db.products[idx] = p;
  writeDB(db);
  return res.json(p);
};
