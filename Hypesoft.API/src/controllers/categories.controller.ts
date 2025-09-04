import { Request, Response } from 'express';
import { readDB, writeDB } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '../entities/Category'; 


export const listCategories = (_req: Request, res: Response) => {
  const db = readDB();
  return res.json(db.categories);
};

export const createCategory = (req: Request, res: Response) => {
  const db = readDB();
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'validation', message: 'name required' });
  const exists = db.categories.find((c: Category) => String(c.name).toLowerCase() === name.toLowerCase());
  if (exists) return res.status(409).json({ error: 'exists' });
  const cat: Category = { id: uuidv4(), name };
  db.categories.push(cat);
  writeDB(db);
  return res.status(201).json(cat);
};

export const deleteCategory = (req: Request, res: Response) => {
  const db = readDB();
  const id = String(req.params.id);
  const idx = db.categories.findIndex((c: Category) => String(c.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  db.categories.splice(idx, 1);
  // unset categoryId from products
  db.products = db.products.map(p => ({ ...p, categoryId: p.categoryId === id ? null : p.categoryId }));
  writeDB(db);
  return res.status(204).send();
};
