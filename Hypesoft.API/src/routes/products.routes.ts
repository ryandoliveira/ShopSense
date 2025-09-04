import { Router } from 'express';
import * as ctrl from '../controllers/products.controller';

const router = Router();

router.get('/', ctrl.listProducts);
router.head('/', (req, res) => res.status(200).send()); // quick health for frontend detection
router.get('/:id', ctrl.getProduct);
router.post('/', ctrl.createProduct);
router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);
router.post('/:id/action', ctrl.actionProduct);

export default router;
