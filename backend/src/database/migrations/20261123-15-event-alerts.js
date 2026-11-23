import { DataTypes } from 'sequelize';

// Event alerts: emails from the homepage "Notify me" box (subscribers are emailed once when a Homecoming
// event is published), and events.alerts_sent_at so each event is announced only once.

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'event_alerts'))) {
    await qi.createTable('event_alerts', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      unsubscribe_token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      unsubscribed_at: { type: DataTypes.DATE, allowNull: true },
      last_notified_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('event_alerts', ['active'], { name: 'event_alerts_active' });
  }
  if (await tableExists(qi, 'events')) {
    const cols = Object.keys(await qi.describeTable('events'));
    if (!cols.includes('alerts_sent_at')) await qi.addColumn('events', 'alerts_sent_at', { type: DataTypes.DATE, allowNull: true });
  }
}

export async function down({ context: qi }) {
  await qi.dropTable('event_alerts');
  await qi.removeColumn('events', 'alerts_sent_at');
}
