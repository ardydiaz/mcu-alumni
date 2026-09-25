import { Router } from 'express';
import { sequelize } from '../config/database.js';
import v1Routes from './v1/index.js';
import v2Routes from './v2/index.js';

const router = Router();

router.get('/health', async (req, res) => {
  let database = 'up';
  try {
    await sequelize.authenticate();
  } catch {
    database = 'down';
  }
  res.status(database === 'up' ? 200 : 503).json({
    success: database === 'up',
    message: database === 'up' ? 'OK' : 'Database unavailable',
    data: { status: database === 'up' ? 'ok' : 'degraded', database, uptime: Math.round(process.uptime()) },
  });
});

router.use('/v1', v1Routes);
router.use('/v2', v2Routes);

export default router;
