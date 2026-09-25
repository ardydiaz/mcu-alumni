import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// A monthly donation transparency report (PDF), grouped by school year.
export class Report extends Model {}

Report.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    schoolYear: { type: DataTypes.STRING(20), allowNull: false }, // e.g. "SY 2025 - 2026"
    title: { type: DataTypes.STRING(200), allowNull: false }, // e.g. "August 2025"
    periodStart: { type: DataTypes.DATEONLY },
    fileUrl: { type: DataTypes.STRING(500), allowNull: false },
    isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    indexes: [{ fields: ['school_year'] }],
  }
);
