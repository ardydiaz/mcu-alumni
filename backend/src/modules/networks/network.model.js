import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// An alumni association / chapter (e.g. MCU Pharmacy Alumni Association).
export class Network extends Model {}

Network.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    president: { type: DataTypes.STRING(150) },
    description: { type: DataTypes.TEXT },
    logo: { type: DataTypes.STRING(500) },
    contactEmail: { type: DataTypes.STRING(120) },
    facebookUrl: { type: DataTypes.STRING(500) },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, modelName: 'Network', tableName: 'networks' }
);
