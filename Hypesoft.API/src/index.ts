import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import productsRoutes from './routes/products.routes';
import categoriesRoutes from './routes/categories.routes';


dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONT_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || '*';

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: FRONT_ORIGIN === '*' ? true : FRONT_ORIGIN }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));


// health
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// mount API under /api
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);

// fallback
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'internal_error', message: String(err?.message || err) });
});

app.listen(PORT, () => {
  console.log(`Shopsense API running on http://localhost:${PORT} (mounted /api/*)`);
});
