import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../users/user.model.js';

// Issued refresh tokens. Only a SHA-256 hash is stored, so a leaked table
// cannot be used to log in. Rotated on every refresh; revoked on logout.
export class RefreshToken extends Model {
  get isValid() {
    return !this.revokedAt && this.expiresAt > new Date();
  }
}

RefreshToken.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    jti: { type: DataTypes.STRING(36), allowNull: false, unique: true },
    tokenHash: { type: DataTypes.STRING(64), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE },
    userAgent: { type: DataTypes.STRING(255) },
    ipAddress: { type: DataTypes.STRING(45) },
  },
  { sequelize, modelName: 'RefreshToken', tableName: 'refresh_tokens', updatedAt: false }
);

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// One-time ticket handed to the React app after Microsoft 365 sign-in. The app
// exchanges it (once, within 60 seconds) for our JWTs, so no token ever appears in a URL.
export class LoginTicket extends Model {}

LoginTicket.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    ticketHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: { type: DataTypes.DATE },
  },
  { sequelize, modelName: 'LoginTicket', tableName: 'login_tickets', updatedAt: false }
);

User.hasMany(LoginTicket, { foreignKey: 'userId', as: 'loginTickets', onDelete: 'CASCADE' });
LoginTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });
