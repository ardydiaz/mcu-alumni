import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// roles: 1 Super Admin, 2 Administrator, 3 Faculty, 4 Student (created by migration 20260925-01).
export class Role extends Model {}

Role.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255) },
  },
  { sequelize, modelName: 'Role', tableName: 'roles' }
);
