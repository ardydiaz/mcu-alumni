import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// A giving campaign donors can choose (e.g. "Enabling Excellence: Support Scholarship").
export class Campaign extends Model {}

Campaign.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    area: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.TEXT },
    goalAmount: { type: DataTypes.DECIMAL(14, 2) },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, modelName: 'Campaign', tableName: 'campaigns' }
);
