import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// A homepage hero slide. Table created by migration 20260929-04.
export class Slide extends Model {}

Slide.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eyebrow: { type: DataTypes.STRING(80) }, // small text above the title
    title: { type: DataTypes.STRING(200), allowNull: false },
    subtitle: { type: DataTypes.STRING(300) },
    image: { type: DataTypes.STRING(500), allowNull: false },
    primaryLabel: { type: DataTypes.STRING(60) },
    primaryLink: { type: DataTypes.STRING(500) },
    secondaryLabel: { type: DataTypes.STRING(60) },
    secondaryLink: { type: DataTypes.STRING(500) },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'Slide', tableName: 'slides' }
);
