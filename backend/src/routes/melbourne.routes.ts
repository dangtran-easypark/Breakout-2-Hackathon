import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  handleGetSensors,
  handleGetPriorityZones,
  handleRefresh,
} from '../controllers/melbourne.controller';

const router = Router();

// GET /api/melbourne/sensors
router.get('/sensors', asyncHandler(handleGetSensors));

// GET /api/melbourne/priority-zones
router.get('/priority-zones', asyncHandler(handleGetPriorityZones));

// POST /api/melbourne/refresh
router.post('/refresh', asyncHandler(handleRefresh));

export default router;
