import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Role } from '../roles/role.model.js';

// users: id, microsoft_id, email, fullname, role_id, department, status, created_at
// (+ updated_at, last_login_at). Schema is managed by migration 20260925-02.
// Everyone signs in with Microsoft 365; the role comes from this table.
export class User extends Model {
  get roleName() {
    return this.role?.name ?? null;
  }

  get isActive() {
    return this.status === 'active';
  }

  toJSON() {
    const { microsoftId, role, ...rest } = this.get();
    return { ...rest, role: this.roleName, microsoftLinked: Boolean(microsoftId) };
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    microsoftId: { type: DataTypes.STRING(64), unique: true }, // Entra ID object id ("oid" claim)
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true, validate: { isEmail: true } },
    fullname: { type: DataTypes.STRING(150), allowNull: false },
    roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    department: { type: DataTypes.STRING(120) },
    // pending = signed in with Microsoft 365, waiting for a Super Admin to approve (migration 20260925-03)
    status: { type: DataTypes.ENUM('pending', 'active', 'inactive'), allowNull: false, defaultValue: 'active' },
    lastLoginAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeSave: (user) => {
        if (user.changed('email')) user.email = user.email.toLowerCase().trim();
      },
    },
  }
);

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Always load the role so req.user.roleName and the JWT role claim are available.
User.addScope('defaultScope', { include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }] }, { override: true });

// Reload the role after changing role_id so the instance reflects the new role.
User.addHook('afterSave', async (user) => {
  if (user.role?.id === user.roleId) return;
  const role = await Role.findByPk(user.roleId, { attributes: ['id', 'name'] });
  user.role = role;
  user.setDataValue('role', role);
});
