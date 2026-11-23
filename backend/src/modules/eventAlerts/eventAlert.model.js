import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// An email address from the homepage "Notify me" box (table from migration 15).
// The unsubscribe token goes only into emails; it is never sent to the admin panel.
export class EventAlert extends Model {}

EventAlert.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    unsubscribeToken: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    unsubscribedAt: { type: DataTypes.DATE },
    lastNotifiedAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'EventAlert',
    tableName: 'event_alerts',
    indexes: [{ fields: ['active'] }],
    defaultScope: { attributes: { exclude: ['unsubscribeToken'] } },
    scopes: { withToken: {} },
  }
);
