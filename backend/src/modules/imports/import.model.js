import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

// One imported file (Step 5: Alumni Database Migration). Table from migration 20261016-10-create-import-batches.
export class ImportBatch extends Model {}

ImportBatch.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    mode: { type: DataTypes.STRING(20), allowNull: false }, // fill: complete empty fields of existing records | skip: leave them
    totalRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    createdCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    updatedCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    skippedCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    warningCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    // { rows: [{ line, studentNumber, name, status, errors, warnings }], fills: [{ profileId, fields }] }
    report: { type: DataTypes.JSON },
    importedById: { type: DataTypes.INTEGER.UNSIGNED },
    importedByName: { type: DataTypes.STRING(150) },
    undoneAt: { type: DataTypes.DATE },
  },
  { sequelize, modelName: 'ImportBatch', tableName: 'import_batches' }
);
