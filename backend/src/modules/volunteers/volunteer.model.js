import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { VOLUNTEER_ROLES } from '../content/content.data.js';

export const VOLUNTEER_STATUS = ['new', 'contacted', 'active', 'inactive'];

// An alumni volunteer sign-up (speaker, community service, or mentor).
export class Volunteer extends Model {}

Volunteer.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    lastName: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    course: { type: DataTypes.STRING(120), allowNull: false },
    yearGraduated: { type: DataTypes.SMALLINT.UNSIGNED },
    role: { type: DataTypes.ENUM(...VOLUNTEER_ROLES), allowNull: false },
    expertise: { type: DataTypes.STRING(250) },
    message: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM(...VOLUNTEER_STATUS), allowNull: false, defaultValue: 'new' },
    notes: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    modelName: 'Volunteer',
    tableName: 'volunteers',
    indexes: [{ fields: ['status'] }, { fields: ['role'] }],
  }
);
