import { DataTypes } from 'sequelize';

// Step 11 (EAO admin):
//   alumni_profiles.alumni_updated_at  last time the alumnus updated their own record (My Profile or Graduate
//                                      Tracer), so EAO can monitor updated / not-updated profiles.
//   events.portal_registration         alumni register for the event inside the Alumni Portal
//   event_registrations                who registered (and attended)

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  const profileCols = Object.keys(await qi.describeTable('alumni_profiles'));
  if (!profileCols.includes('alumni_updated_at')) {
    await qi.addColumn('alumni_profiles', 'alumni_updated_at', { type: DataTypes.DATE, allowNull: true });
    await qi.addIndex('alumni_profiles', ['alumni_updated_at'], { name: 'alumni_profiles_alumni_updated_at' });
    // Backfill from the change history: the alumnus's own edits and Graduate Tracer submissions.
    await qi.sequelize.query(`
      UPDATE alumni_profiles SET alumni_updated_at = (
        SELECT MAX(c.created_at) FROM profile_changes c
        WHERE c.profile_id = alumni_profiles.id AND (c.actor_type = 'alumni' OR (c.actor_type = 'system' AND c.actor_name = 'Graduate Tracer')) AND c.action <> 'verify'
      )`);
  }

  if (await tableExists(qi, 'events')) {
    const eventCols = Object.keys(await qi.describeTable('events'));
    if (!eventCols.includes('portal_registration')) {
      await qi.addColumn('events', 'portal_registration', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    }
  }

  if (!(await tableExists(qi, 'event_registrations'))) {
    await qi.createTable('event_registrations', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      event_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      alumni_account_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'registered' }, // registered | attended | cancelled
      cancelled_at: { type: DataTypes.DATE, allowNull: true },
      attended_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('event_registrations', ['event_id', 'alumni_account_id'], { unique: true, name: 'event_registrations_event_account' });
    await qi.addIndex('event_registrations', ['alumni_account_id'], { name: 'event_registrations_account' });
  }
}

export async function down({ context: qi }) {
  await qi.dropTable('event_registrations');
  await qi.removeColumn('events', 'portal_registration');
  await qi.removeIndex('alumni_profiles', 'alumni_profiles_alumni_updated_at');
  await qi.removeColumn('alumni_profiles', 'alumni_updated_at');
}
