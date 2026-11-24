import { DataTypes } from 'sequelize';

// Industry of each job in the Work section (EAO search and reports by industry, Step 12).

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'profile_work'))) return;
  const cols = Object.keys(await qi.describeTable('profile_work'));
  if (!cols.includes('industry')) await qi.addColumn('profile_work', 'industry', { type: DataTypes.STRING(60), allowNull: true });
}

export async function down({ context: qi }) {
  await qi.removeColumn('profile_work', 'industry');
}
