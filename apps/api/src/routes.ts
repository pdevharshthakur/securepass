import { errorHandler } from '$middlewares/errorHandler.js';
import { requireAuth } from '$middlewares/requireAuth.js';
import { Router } from 'express';
import { healthRouter } from '$routes/health.js';
import { addRouter } from '$routes/add.js';
import { searchRouter } from '$routes/search.js';
import { showRouter } from '$routes/show.js';

export const router = Router();

router.use(healthRouter);

// Everything below requires an authenticated session
router.use(requireAuth);
router.use(addRouter);
router.use(showRouter);
router.use(searchRouter);

router.use(errorHandler);
