import { Request, Response, NextFunction } from 'express';
import * as MelbourneService from '../services/melbourne.service';

export const handleGetSensors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await MelbourneService.getSensorsWithDuration());
  } catch (err) { next(err); }
};

export const handleGetPriorityZones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await MelbourneService.getPriorityZones());
  } catch (err) { next(err); }
};

export const handleRefresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const synced = await MelbourneService.fetchAndSync();
    res.json({ synced });
  } catch (err) { next(err); }
};
