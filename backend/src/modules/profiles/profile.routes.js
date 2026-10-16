import { Router } from 'express';
import { profileController, loadOwnProfile } from './profile.controller.js';
import {
  alumniProfileSchema,
  staffCreateProfileSchema,
  staffUpdateProfileSchema,
  listProfilesQuerySchema,
  sectionParamSchema,
  validateSectionBody,
} from './profile.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';
import { authenticateAlumni } from '../portal/portal.middleware.js';

// Staff (EAO): /api/v1/profiles
export const staffProfileRoutes = Router();
staffProfileRoutes.use(authenticate, adminPanelOnly);
staffProfileRoutes.get('/', validate(listProfilesQuerySchema, 'query'), profileController.list);
staffProfileRoutes.post('/', uploadImage('photo', 'profiles'), validate(staffCreateProfileSchema), profileController.create);
staffProfileRoutes.get('/:id', validate(idParamSchema, 'params'), profileController.get);
staffProfileRoutes.patch('/:id', validate(idParamSchema, 'params'), uploadImage('photo', 'profiles'), validate(staffUpdateProfileSchema), profileController.update);
staffProfileRoutes.delete('/:id', validate(idParamSchema, 'params'), profileController.remove);
staffProfileRoutes.get('/:id/changes', validate(idParamSchema, 'params'), profileController.changes);
staffProfileRoutes.post('/:id/:section', validate(sectionParamSchema, 'params'), validateSectionBody, profileController.addItem);
staffProfileRoutes.patch('/:id/:section/:itemId', validate(sectionParamSchema, 'params'), validateSectionBody, profileController.editItem);
staffProfileRoutes.delete('/:id/:section/:itemId', validate(sectionParamSchema, 'params'), profileController.removeItem);

// Alumni (portal): /api/v1/portal/profile — their own profile only.
export const portalProfileRoutes = Router();
portalProfileRoutes.use(authenticateAlumni, loadOwnProfile);
portalProfileRoutes.get('/', profileController.mine);
portalProfileRoutes.patch('/', uploadImage('photo', 'profiles'), validate(alumniProfileSchema), profileController.updateMine);
portalProfileRoutes.post('/:section', validate(sectionParamSchema, 'params'), validateSectionBody, profileController.addMine);
portalProfileRoutes.patch('/:section/:itemId', validate(sectionParamSchema, 'params'), validateSectionBody, profileController.editMine);
portalProfileRoutes.delete('/:section/:itemId', validate(sectionParamSchema, 'params'), profileController.removeMine);
