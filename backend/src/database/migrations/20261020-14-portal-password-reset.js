import { DataTypes } from 'sequelize';

// Alumni Portal password reset: a one-time emailed link (only its SHA-256 is stored, valid 1 hour), and the
// time of the last password change, so sessions started before it are signed out.

export async function up({ context: qi }) {
  const cols = Object.keys(await qi.describeTable('alumni_accounts'));
  if (!cols.includes('password_reset_hash')) {
    await qi.addColumn('alumni_accounts', 'password_reset_hash', { type: DataTypes.STRING(64), allowNull: true });
    await qi.addIndex('alumni_accounts', ['password_reset_hash'], { name: 'alumni_accounts_password_reset_hash' });
  }
  if (!cols.includes('password_reset_expires_at')) await qi.addColumn('alumni_accounts', 'password_reset_expires_at', { type: DataTypes.DATE, allowNull: true });
  if (!cols.includes('password_changed_at')) await qi.addColumn('alumni_accounts', 'password_changed_at', { type: DataTypes.DATE, allowNull: true });
}

export async function down({ context: qi }) {
  await qi.removeIndex('alumni_accounts', 'alumni_accounts_password_reset_hash');
  for (const c of ['password_reset_hash', 'password_reset_expires_at', 'password_changed_at']) await qi.removeColumn('alumni_accounts', c);
}
