import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Campaign } from '../campaigns/campaign.model.js';

export const DONATION_STATUS = ['pledged', 'confirmed', 'cancelled'];

// A donation pledge submitted from the Give page. Staff mark it "confirmed"
// once the bank deposit is verified.
export class Donation extends Model {}

Donation.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    campaignId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    lastName: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    course: { type: DataTypes.STRING(120), allowNull: false },
    country: { type: DataTypes.STRING(80), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currency: { type: DataTypes.ENUM('PHP', 'USD'), allowNull: false, defaultValue: 'PHP' },
    message: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM(...DONATION_STATUS), allowNull: false, defaultValue: 'pledged' },
    referenceNo: { type: DataTypes.STRING(80) },
    notes: { type: DataTypes.TEXT },
    confirmedAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'Donation',
    tableName: 'donations',
    indexes: [{ fields: ['status'] }, { fields: ['email'] }],
  }
);

Campaign.hasMany(Donation, { foreignKey: 'campaignId', as: 'donations', onDelete: 'RESTRICT' });
Donation.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
