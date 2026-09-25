import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// A Support-a-Centralino scholar that donors can sponsor.
export class Scholar extends Model {}

Scholar.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    college: { type: DataTypes.STRING(150), allowNull: false },
    yearLevel: { type: DataTypes.STRING(40) },
    story: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING(500) },
    videoUrl: { type: DataTypes.STRING(500) },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, modelName: 'Scholar', tableName: 'scholars' }
);
