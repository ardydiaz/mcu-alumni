import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { SEXES, TIME_AFTER_GRADUATION, FURTHER_STUDIES_TIMING } from '../content/content.data.js';

// A Graduate Tracer survey response (Graduate Profile, Employment Information, Additional Information).
// The table is created by migration 20261008-05-tracer-graduate-profile; keep the two in step.
export class TracerResponse extends Model {}

TracerResponse.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    // Graduate profile
    fullName: { type: DataTypes.STRING(200), allowNull: false }, // "Dela Cruz, Juan Carlo, M."
    sex: { type: DataTypes.ENUM(...SEXES), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    yearGraduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    degree: { type: DataTypes.STRING(150), allowNull: false },

    // Employment information (only when currently employed)
    isEmployed: { type: DataTypes.BOOLEAN, allowNull: false },
    employer: { type: DataTypes.STRING(150) }, // last employer if retired
    jobCategories: { type: DataTypes.JSON }, // one or more of JOB_CATEGORIES
    jobCategoryOther: { type: DataTypes.STRING(120) },
    position: { type: DataTypes.STRING(120) },
    relatedToDegree: { type: DataTypes.BOOLEAN },
    timeToFirstJob: { type: DataTypes.ENUM(...TIME_AFTER_GRADUATION) },

    // Additional information
    furtherStudies: { type: DataTypes.BOOLEAN, allowNull: false },
    furtherStudiesTiming: { type: DataTypes.ENUM(...FURTHER_STUDIES_TIMING), allowNull: false },

    consentAt: { type: DataTypes.DATE, allowNull: false },

    // Set when submitted from the Alumni Portal (NULL for the public form). One row per submission = tracer history.
    alumniAccountId: { type: DataTypes.INTEGER.UNSIGNED },
  },
  {
    sequelize,
    modelName: 'TracerResponse',
    tableName: 'tracer_responses',
    indexes: [{ fields: ['degree', 'year_graduated'] }, { fields: ['is_employed'] }, { fields: ['alumni_account_id'] }],
  }
);
