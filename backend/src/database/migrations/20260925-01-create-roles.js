import { DataTypes } from 'sequelize';

// Fixed ids: code and data rely on them (e.g. 1 = Super Admin).
export const ROLE_ROWS = [
  { id: 1, name: 'Super Admin', description: 'Full access, including users, roles and activity logs.' },
  { id: 2, name: 'Administrator', description: 'Manages website content and alumni submissions.' },
  { id: 3, name: 'Faculty', description: 'MCU faculty. No admin dashboard access.' },
  { id: 4, name: 'Student', description: 'MCU student. No admin dashboard access.' },
];

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'roles'))) {
    await qi.createTable('roles', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }

  // Insert any missing roles (safe to re-run).
  const [existing] = await qi.sequelize.query('SELECT id FROM roles');
  const have = new Set(existing.map((r) => Number(r.id)));
  const now = new Date();
  const missing = ROLE_ROWS.filter((r) => !have.has(r.id)).map((r) => ({ ...r, created_at: now, updated_at: now }));
  if (missing.length) await qi.bulkInsert('roles', missing);
}

export async function down({ context: qi }) {
  await qi.dropTable('roles');
}
