import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../users/user.model.js';

export const LOG_ACTIONS = ['login', 'login_failed', 'logout', 'create', 'update', 'delete', 'password_change'];

// Audit trail of staff actions (who changed what, when, from where).
export class ActivityLog extends Model {}

ActivityLog.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED },
    action: { type: DataTypes.ENUM(...LOG_ACTIONS), allowNull: false },
    entity: { type: DataTypes.STRING(50) }, // e.g. "Scholar"
    entityId: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.STRING(500) },
    ipAddress: { type: DataTypes.STRING(45) },
    userAgent: { type: DataTypes.STRING(255) },
  },
  {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_logs',
    updatedAt: false,
    indexes: [{ fields: ['user_id'] }, { fields: ['action'] }, { fields: ['entity'] }, { fields: ['created_at'] }],
  }
);

User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs', onDelete: 'SET NULL' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
