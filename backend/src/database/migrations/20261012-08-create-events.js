import { DataTypes } from 'sequelize';

// events: Alumni Events and Activities calendar (Step 8), managed from the admin panel.
const CATEGORIES = ['alumni', 'homecoming', 'chapter', 'program'];
const STATUSES = ['draft', 'published', 'cancelled'];

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (await tableExists(qi, 'events')) return;

  await qi.createTable('events', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
    summary: { type: DataTypes.STRING(300), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.ENUM(...CATEGORIES), allowNull: false, defaultValue: 'alumni' },
    start_at: { type: DataTypes.DATE, allowNull: false },
    end_at: { type: DataTypes.DATE, allowNull: true },
    all_day: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    venue: { type: DataTypes.STRING(200), allowNull: true },
    online_url: { type: DataTypes.STRING(500), allowNull: true },
    image: { type: DataTypes.STRING(500), allowNull: true },
    registration_deadline: { type: DataTypes.DATE, allowNull: true },
    capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    registration_url: { type: DataTypes.STRING(500), allowNull: true },
    network_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'draft' },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  // Same names Sequelize gives the model's indexes
  await qi.addIndex('events', ['status', 'start_at'], { name: 'events_status_start_at' });
  await qi.addIndex('events', ['category'], { name: 'events_category' });
}

export async function down({ context: qi }) {
  await qi.dropTable('events');
}
