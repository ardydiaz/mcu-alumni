import { DataTypes } from 'sequelize';

// alumni_accounts: Alumni Portal accounts. Kept apart from `users` (staff who sign in with
// Microsoft 365) so an alumni login can never reach the admin panel.
//
// Status flow: email_unverified -> pending (email confirmed, waiting for the Alumni Office)
//              -> verified | rejected
const STATUSES = ['email_unverified', 'pending', 'verified', 'rejected'];

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (await tableExists(qi, 'alumni_accounts')) return;

  await qi.createTable('alumni_accounts', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(200), allowNull: false },
    student_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    program: { type: DataTypes.STRING(150), allowNull: false },
    year_graduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'email_unverified' },
    email_verified_at: { type: DataTypes.DATE, allowNull: true },
    email_token_hash: { type: DataTypes.STRING(64), allowNull: true },
    email_token_expires_at: { type: DataTypes.DATE, allowNull: true },
    failed_logins: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE, allowNull: true },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    reviewed_by_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    review_note: { type: DataTypes.STRING(500), allowNull: true },
    consent_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  // Same names Sequelize gives the model's indexes
  await qi.addIndex('alumni_accounts', ['status'], { name: 'alumni_accounts_status' });
  await qi.addIndex('alumni_accounts', ['email_token_hash'], { name: 'alumni_accounts_email_token_hash' });
}

export async function down({ context: qi }) {
  await qi.dropTable('alumni_accounts');
}
