import { Router } from 'express';
import { psgc } from './psgc.service.js';
import { Joi, validate } from '../../middleware/validation.middleware.js';
import { sendSuccess } from '../../utils/response.js';

// Public, read-only address lists for the cascading Region -> Province -> City -> Barangay dropdowns.
// The lists rarely change, so browsers may cache them for a day.
const router = Router();
const code = Joi.object({ code: Joi.string().pattern(/^R?\d{9,10}$/).required() });
const cached = (res) => res.set('Cache-Control', 'public, max-age=86400');

router.get('/regions', (req, res) => sendSuccess(cached(res), { data: psgc.regions() }));
router.get('/regions/:code/provinces', validate(code, 'params'), (req, res) => sendSuccess(cached(res), { data: psgc.provinces(req.params.code) }));
router.get('/provinces/:code/cities', validate(code, 'params'), (req, res) => sendSuccess(cached(res), { data: psgc.cities(req.params.code) }));
router.get('/cities/:code/barangays', validate(code, 'params'), (req, res) => sendSuccess(cached(res), { data: psgc.barangays(req.params.code) }));

export default router;
