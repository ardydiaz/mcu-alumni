import { Router } from 'express';

// Reserved for breaking API changes. Mount new or changed module routes here
// while v1 keeps serving existing clients, e.g.:
//   import scholarRoutesV2 from '../../modules/scholars/scholar.routes.v2.js';
//   router.use('/scholars', scholarRoutesV2);
const router = Router();

router.get('/', (req, res) => res.json({ success: true, message: 'MCU Alumni API v2 (not yet available)', data: { version: 'v2' } }));

export default router;
