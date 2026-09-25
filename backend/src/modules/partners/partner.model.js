import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// Merchant partners give alumni-ID discounts; industry partners employ Centralinos.
export class Partner extends Model {}

Partner.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM('merchant', 'industry'), allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    offer: { type: DataTypes.STRING(500) },
    validity: { type: DataTypes.STRING(150) },
    validUntil: { type: DataTypes.DATEONLY },
    logo: { type: DataTypes.STRING(500) },
    website: { type: DataTypes.STRING(500) },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Partner',
    tableName: 'partners',
    indexes: [{ fields: ['type', 'is_active'] }],
  }
);
