import { Router } from 'express';
import * as ctrl from '../controllers/categories.controller';

const router = Router();

router.get('/', ctrl.listCategories);
router.post('/', ctrl.createCategory);
router.delete('/:id', ctrl.deleteCategory);

export default router;
