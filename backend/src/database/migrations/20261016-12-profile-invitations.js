import { DataTypes } from 'sequelize';

// Portal invitations for imported / EAO-encoded graduates: an emailed one-time link to activate their
// Alumni Portal account (set a password) without registering. Only the SHA-256 of the link's token is stored.

export async function up({ context: qi }) {
  const columns = Object.keys(await qi.describeTable('alumni_profiles'));
  if (!columns.includes('invite_token_hash')) {
    await qi.addColumn('alumni_profiles', 'invite_token_hash', { type: DataTypes.STRING(64), allowNull: true });
    await qi.addIndex('alumni_profiles', ['invite_token_hash'], { name: 'alumni_profiles_invite_token_hash' });
  }
  if (!columns.includes('invite_expires_at')) await qi.addColumn('alumni_profiles', 'invite_expires_at', { type: DataTypes.DATE, allowNull: true });
  if (!columns.includes('invited_at')) await qi.addColumn('alumni_profiles', 'invited_at', { type: DataTypes.DATE, allowNull: true });
  if (!columns.includes('invite_count')) {
    await qi.addColumn('alumni_profiles', 'invite_count', { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 });
  }
}

export async function down({ context: qi }) {
  await qi.removeIndex('alumni_profiles', 'alumni_profiles_invite_token_hash');
  for (const c of ['invite_token_hash', 'invite_expires_at', 'invited_at', 'invite_count']) await qi.removeColumn('alumni_profiles', c);
}
