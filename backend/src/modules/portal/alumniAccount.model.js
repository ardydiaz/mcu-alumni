import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { SEXES } from '../content/content.data.js';

// email_unverified -> pending (email confirmed, waiting for the Alumni Office) -> verified | rejected
export const ACCOUNT_STATUS = ['email_unverified', 'pending', 'verified', 'rejected'];

// An Alumni Portal account (separate from staff `users`).
// The table is created by migration 20261008-06-create-alumni-accounts; keep the two in step.
export class AlumniAccount extends Model {}

AlumniAccount.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING(200), allowNull: false }, // "Dela Cruz, Juan Carlo, M."
    studentNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    program: { type: DataTypes.STRING(150), allowNull: false },
    yearGraduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    // Latest personal details, kept current from the Graduate Tracer (migration 07)
    sex: { type: DataTypes.ENUM(...SEXES) },
    address: { type: DataTypes.STRING(500) },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM(...ACCOUNT_STATUS), allowNull: false, defaultValue: 'email_unverified' },
    emailVerifiedAt: { type: DataTypes.DATE },
    emailTokenHash: { type: DataTypes.STRING(64) }, // SHA-256 of the emailed verification token
    emailTokenExpiresAt: { type: DataTypes.DATE },
    failedLogins: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    lockedUntil: { type: DataTypes.DATE },
    lastLoginAt: { type: DataTypes.DATE },
    reviewedById: { type: DataTypes.INTEGER.UNSIGNED }, // staff user who approved / rejected
    reviewedAt: { type: DataTypes.DATE },
    reviewNote: { type: DataTypes.STRING(500) }, // reason shown to the alumnus when rejected
    consentAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'AlumniAccount',
    tableName: 'alumni_accounts',
    indexes: [{ fields: ['status'] }, { fields: ['email_token_hash'] }],
    // Secrets never leave the model unless asked for with .scope('withSecrets')
    defaultScope: { attributes: { exclude: ['passwordHash', 'emailTokenHash', 'emailTokenExpiresAt'] } },
    scopes: { withSecrets: {} }, // replaces the default scope, so every column is loaded
  }
);
