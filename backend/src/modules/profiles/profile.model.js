import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { SEXES } from '../content/content.data.js';
import { SECTIONS } from './profile.sections.js';

export const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'];

// The master record of a graduate (Step 4: A. Alumni Profile + B. Current Residential Information).
// Created when the Alumni Office verifies a portal account, or entered directly by EAO staff.
// Tables come from migration 20261016-09-create-alumni-profiles; keep the two in step.
export class AlumniProfile extends Model {}

AlumniProfile.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    alumniNumber: { type: DataTypes.STRING(30), unique: true }, // MCU-A-2026-000123, assigned on verification
    alumniAccountId: { type: DataTypes.INTEGER.UNSIGNED, unique: true }, // Alumni Portal login, if any

    // A. Alumni Profile
    studentNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    surname: { type: DataTypes.STRING(80), allowNull: false },
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    middleName: { type: DataTypes.STRING(80) },
    suffix: { type: DataTypes.STRING(10) },
    maidenName: { type: DataTypes.STRING(80) },
    sex: { type: DataTypes.ENUM(...SEXES) },
    nationality: { type: DataTypes.STRING(60) },
    religion: { type: DataTypes.STRING(80) }, // sensitive personal information (Data Privacy Act): optional, staff-only view
    civilStatus: { type: DataTypes.ENUM(...CIVIL_STATUS) }, // sensitive personal information: optional
    birthDate: { type: DataTypes.DATEONLY },
    birthPlace: { type: DataTypes.STRING(120) },
    program: { type: DataTypes.STRING(150), allowNull: false },
    yearGraduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    email: { type: DataTypes.STRING(120) },
    phone: { type: DataTypes.STRING(30) },
    photo: { type: DataTypes.STRING(500) },

    // B. Current Residential Information (PSGC codes + names; codes are empty outside the Philippines)
    houseStreet: { type: DataTypes.STRING(200) },
    barangay: { type: DataTypes.STRING(120) },
    barangayCode: { type: DataTypes.STRING(12) },
    city: { type: DataTypes.STRING(120) },
    cityCode: { type: DataTypes.STRING(12) },
    province: { type: DataTypes.STRING(120) },
    provinceCode: { type: DataTypes.STRING(12) },
    region: { type: DataTypes.STRING(120) },
    regionCode: { type: DataTypes.STRING(12) },
    zipCode: { type: DataTypes.STRING(10) },
    country: { type: DataTypes.STRING(60) },

    verifiedAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'AlumniProfile',
    tableName: 'alumni_profiles',
    indexes: [{ fields: ['surname', 'first_name'] }, { fields: ['year_graduated'] }],
  }
);

// C. Repeatable sections: one model per section, built from profile.sections.js.
export const SectionModels = Object.fromEntries(
  Object.entries(SECTIONS).map(([key, def]) => {
    const name = `Profile${key[0].toUpperCase()}${key.slice(1)}`;
    const model = sequelize.define(
      name,
      { id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, profileId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, ...def.attributes },
      { tableName: def.table, indexes: [{ fields: ['profile_id'] }] }
    );
    AlumniProfile.hasMany(model, { foreignKey: 'profileId', as: key, onDelete: 'CASCADE', constraints: false });
    model.belongsTo(AlumniProfile, { foreignKey: 'profileId', constraints: false });
    return [key, model];
  })
);

// Change history: who changed what on a profile, with old -> new values.
export class ProfileChange extends Model {}

ProfileChange.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    profileId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    actorType: { type: DataTypes.ENUM('alumni', 'staff', 'system'), allowNull: false },
    actorId: { type: DataTypes.INTEGER.UNSIGNED },
    actorName: { type: DataTypes.STRING(150) },
    section: { type: DataTypes.STRING(30), allowNull: false }, // profile | family | education | ...
    action: { type: DataTypes.STRING(20), allowNull: false }, // create | update | add | edit | remove | verify
    changes: { type: DataTypes.JSON }, // { field: [old, new] } or { title }
  },
  {
    sequelize,
    modelName: 'ProfileChange',
    tableName: 'profile_changes',
    updatedAt: false,
    indexes: [{ fields: ['profile_id', 'created_at'] }],
  }
);
