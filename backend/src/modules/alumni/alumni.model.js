import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const ALUMNI_ID_STATUS = ['not_requested', 'requested', 'processing', 'released'];

// An alumni contact record from the "Alumni Contact Update" form. Also tracks
// the status of Alumni ID requests.
export class AlumniRecord extends Model {}

AlumniRecord.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    middleName: { type: DataTypes.STRING(80) },
    lastName: { type: DataTypes.STRING(80), allowNull: false },
    maidenName: { type: DataTypes.STRING(80) },
    birthDate: { type: DataTypes.DATEONLY },
    email: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    address: { type: DataTypes.STRING(250), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    country: { type: DataTypes.STRING(80), allowNull: false },
    studentNumber: { type: DataTypes.STRING(30) },
    course: { type: DataTypes.STRING(120), allowNull: false },
    yearGraduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    employer: { type: DataTypes.STRING(150) },
    position: { type: DataTypes.STRING(120) },
    alumniIdStatus: { type: DataTypes.ENUM(...ALUMNI_ID_STATUS), allowNull: false, defaultValue: 'not_requested' },
    consentAt: { type: DataTypes.DATE, allowNull: false },
    notes: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    modelName: 'AlumniRecord',
    tableName: 'alumni_records',
    indexes: [{ fields: ['email'] }, { fields: ['alumni_id_status'] }, { fields: ['course', 'year_graduated'] }],
  }
);
