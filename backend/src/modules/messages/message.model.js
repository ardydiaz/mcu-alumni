import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// A "Leave us a message" contact form submission.
export class Message extends Model {}

Message.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false },
    subject: { type: DataTypes.STRING(150) },
    message: { type: DataTypes.TEXT, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    readAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    indexes: [{ fields: ['is_read'] }],
  }
);
