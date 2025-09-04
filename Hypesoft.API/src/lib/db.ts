import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

type DBShape = {
  products: any[];
  categories: any[];
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const seed: DBShape = { products: [], categories: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
  }
}

export function readDB(): DBShape {
  try {
    ensureDir();
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as DBShape;
  } catch (err) {
    console.error('readDB error', err);
    return { products: [], categories: [] };
  }
}

export function writeDB(payload: DBShape) {
  try {
    ensureDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('writeDB error', err);
  }
}
