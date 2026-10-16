import { DataTypes } from 'sequelize';

// Step 5: Alumni Database Migration.
// import_batches: one row per imported file (who, when, counts, issues), so an import can be reviewed or undone.
// alumni_profiles.source / import_batch_id: where a profile came from (portal | eao | import) and which file.

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'import_batches'))) {
    await qi.createTable('import_batches', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      file_name: { type: DataTypes.STRING(255), allowNull: false },
      mode: { type: DataTypes.STRING(20), allowNull: false }, // fill | skip (what to do with existing records)
      total_rows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      updated_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      skipped_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      warning_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      report: { type: DataTypes.JSON, allowNull: true }, // rows that were skipped or need attention
      imported_by_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      imported_by_name: { type: DataTypes.STRING(150), allowNull: true },
      undone_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }
  const columns = Object.keys(await qi.describeTable('alumni_profiles'));
  if (!columns.includes('source')) await qi.addColumn('alumni_profiles', 'source', { type: DataTypes.STRING(20), allowNull: true });
  if (!columns.includes('import_batch_id')) {
    await qi.addColumn('alumni_profiles', 'import_batch_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
    await qi.addIndex('alumni_profiles', ['import_batch_id'], { name: 'alumni_profiles_import_batch_id' });
  }
  // Existing profiles: portal-linked ones came from the portal, the rest were encoded by EAO.
  await qi.sequelize.query("UPDATE alumni_profiles SET source = CASE WHEN alumni_account_id IS NULL THEN 'eao' ELSE 'portal' END WHERE source IS NULL");
}

export async function down({ context: qi }) {
  await qi.removeIndex('alumni_profiles', 'alumni_profiles_import_batch_id');
  await qi.removeColumn('alumni_profiles', 'import_batch_id');
  await qi.removeColumn('alumni_profiles', 'source');
  await qi.dropTable('import_batches');
}
