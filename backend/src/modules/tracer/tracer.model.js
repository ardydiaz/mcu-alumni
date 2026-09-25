import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { EMPLOYMENT_STATUS, TIME_TO_FIRST_JOB, INCOME_RANGES } from '../content/content.data.js';

// A Graduate Tracer survey response.
export class TracerResponse extends Model {}

TracerResponse.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    lastName: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    course: { type: DataTypes.STRING(120), allowNull: false },
    yearGraduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    employmentStatus: { type: DataTypes.ENUM(...EMPLOYMENT_STATUS), allowNull: false },
    employer: { type: DataTypes.STRING(150) },
    position: { type: DataTypes.STRING(120) },
    industry: { type: DataTypes.STRING(120) },
    workLocation: { type: DataTypes.STRING(120) },
    relatedToCourse: { type: DataTypes.BOOLEAN },
    timeToFirstJob: { type: DataTypes.ENUM(...TIME_TO_FIRST_JOB) },
    monthlyIncome: { type: DataTypes.ENUM(...INCOME_RANGES) },
    licensure: { type: DataTypes.STRING(150) },
    feedback: { type: DataTypes.TEXT },
    consentAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'TracerResponse',
    tableName: 'tracer_responses',
    indexes: [{ fields: ['course', 'year_graduated'] }, { fields: ['employment_status'] }],
  }
);
