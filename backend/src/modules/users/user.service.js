import { fn, col } from 'sequelize';
import { User } from './user.model.js';
import { Role } from '../roles/role.model.js';
import { ApiError, createCrudService } from '../../utils/helpers.js';
import { ROLE_IDS, PERMISSIONS } from '../../middleware/role.middleware.js';

const SUPER_ADMIN_ID = ROLE_IDS['Super Admin'];

const crud = createCrudService(User, {
  label: 'User',
  searchFields: ['fullname', 'email', 'department'],
  filterFields: ['roleId', 'status'],
  sortFields: ['fullname', 'email', 'roleId', 'status', 'createdAt', 'lastLoginAt'],
});

async function assertRoleExists(roleId) {
  if (roleId !== undefined && !(await Role.findByPk(roleId))) {
    throw ApiError.unprocessable(undefined, { roleId: 'Choose a valid role' });
  }
}

// There must always be at least one active Super Admin.
async function assertNotLastSuperAdmin(user) {
  if (user.roleId !== SUPER_ADMIN_ID || user.status !== 'active') return;
  const others = await User.count({ where: { roleId: SUPER_ADMIN_ID, status: 'active' } });
  if (others <= 1) throw ApiError.badRequest('At least one active Super Admin is required');
}

export const userService = {
  ...crud,

  async create(data) {
    if (await User.findOne({ where: { email: data.email } })) {
      throw ApiError.conflict('Email is already in use', { email: 'Email is already in use' });
    }
    await assertRoleExists(data.roleId);
    const user = await User.create(data);
    return User.findByPk(user.id);
  },

  async update(id, data, actor) {
    const user = await crud.getById(id, { internal: true });
    const isSelf = actor && String(actor.id) === String(id);
    const losesSuperAdmin = (data.roleId !== undefined && data.roleId !== SUPER_ADMIN_ID) || data.status === 'inactive';

    if (isSelf && losesSuperAdmin) throw ApiError.badRequest('You cannot change your own role or deactivate your own account');
    if (losesSuperAdmin) await assertNotLastSuperAdmin(user);
    if (data.email && data.email !== user.email && (await User.findOne({ where: { email: data.email } }))) {
      throw ApiError.conflict('Email is already in use', { email: 'Email is already in use' });
    }
    await assertRoleExists(data.roleId);
    await user.update(data);
    return user;
  },

  async remove(id, actor) {
    if (actor && String(actor.id) === String(id)) throw ApiError.badRequest('You cannot delete your own account');
    const user = await crud.getById(id, { internal: true });
    await assertNotLastSuperAdmin(user);
    return crud.remove(id);
  },

  // Access requests: people saved as 'pending' on their first Microsoft 365 sign-in.
  async approve(id, { roleId, department }) {
    const user = await crud.getById(id, { internal: true });
    if (user.status !== 'pending') throw ApiError.badRequest('This access request has already been handled');
    await assertRoleExists(roleId);
    await user.update({ roleId, status: 'active', ...(department !== undefined && { department }) });
    return user;
  },

  async reject(id) {
    const user = await crud.getById(id, { internal: true });
    if (user.status !== 'pending') throw ApiError.badRequest('This access request has already been handled');
    await user.update({ status: 'inactive' });
    return user;
  },

  // Roles from the `roles` table with user counts, plus the permission matrix.
  async roles() {
    const [roles, counts] = await Promise.all([
      Role.findAll({ order: [['id', 'ASC']] }),
      User.unscoped().findAll({ attributes: ['roleId', [fn('COUNT', col('id')), 'count']], group: ['roleId'], raw: true }),
    ]);
    const byRole = Object.fromEntries(counts.map((c) => [c.roleId, Number(c.count)]));
    return {
      roles: roles.map((r) => ({ id: r.id, name: r.name, description: r.description, userCount: byRole[r.id] || 0 })),
      permissions: PERMISSIONS,
    };
  },
};
