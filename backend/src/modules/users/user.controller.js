import { userService } from './user.service.js';
import { logService } from '../logs/log.service.js';
import { asyncHandler, createCrudController, displayName } from '../../utils/helpers.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';

const crud = createCrudController(userService, { label: 'User' });

export const userController = {
  ...crud,

  update: asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.body, req.user);
    const changes = Object.keys(req.body).map((k) => (k === 'password' ? 'password' : k)).join(', ');
    await logService.record(req, { action: 'update', entity: 'User', entityId: user.id, description: `Updated user ${displayName(user)} (${changes})` });
    sendSuccess(res, { data: user, message: 'User updated successfully' });
  }),

  remove: asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id);
    await userService.remove(req.params.id, req.user);
    await logService.record(req, { action: 'delete', entity: 'User', entityId: user.id, description: `Deleted user ${displayName(user)}` });
    sendNoContent(res);
  }),

  approve: asyncHandler(async (req, res) => {
    const user = await userService.approve(req.params.id, req.body);
    await logService.record(req, { action: 'update', entity: 'User', entityId: user.id, description: `Approved access for ${user.email} as ${user.roleName}` });
    sendSuccess(res, { data: user, message: `${user.fullname} approved as ${user.roleName}` });
  }),

  reject: asyncHandler(async (req, res) => {
    const user = await userService.reject(req.params.id);
    await logService.record(req, { action: 'update', entity: 'User', entityId: user.id, description: `Rejected access request from ${user.email}` });
    sendSuccess(res, { data: user, message: `Access request from ${user.fullname} rejected` });
  }),

  roles: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await userService.roles() });
  }),
};
