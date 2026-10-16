import { DataTypes } from 'sequelize';

// Activity logs: an "export" action, so downloading alumni personal data (Step 5 export) is on the audit trail.
// On a fresh database the table doesn't exist yet; sync() then creates it with the new list.
const BEFORE = ['login', 'login_failed', 'logout', 'create', 'update', 'delete', 'password_change'];
const AFTER = [...BEFORE, 'export'];

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'activity_logs'))) return;
  await qi.changeColumn('activity_logs', 'action', { type: DataTypes.ENUM(...AFTER), allowNull: false });
}

export async function down({ context: qi }) {
  if (!(await tableExists(qi, 'activity_logs'))) return;
  await qi.sequelize.query("UPDATE activity_logs SET action = 'update' WHERE action = 'export'");
  await qi.changeColumn('activity_logs', 'action', { type: DataTypes.ENUM(...BEFORE), allowNull: false });
}
