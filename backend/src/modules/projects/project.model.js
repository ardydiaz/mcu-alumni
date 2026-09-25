import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// A campus development project shown on the Campus Development page.
export class Project extends Model {}

Project.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING(500) },
    status: { type: DataTypes.ENUM('planned', 'ongoing', 'completed'), allowNull: false, defaultValue: 'planned' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, modelName: 'Project', tableName: 'projects' }
);
