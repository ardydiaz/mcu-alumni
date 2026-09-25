import { DataTypes } from 'sequelize';

// users: id, microsoft_id, email, fullname, role_id, department, status, created_at
// (+ updated_at, last_login_at). Creates the table on a fresh install, or upgrades
// the previous schema (first_name, last_name, password, role enum, is_active,
// microsoft_oid) in place, keeping every user and their id.
//
// Every step checks the current schema first, so a partly-applied run (MySQL DDL
// cannot be rolled back) can simply be run again.

const LEGACY_ROLE_TO_ID = { admin: 1, staff: 2 }; // admin -> Super Admin, staff -> Administrator
const LEGACY_COLUMNS = ['first_name', 'last_name', 'password', 'microsoft_oid', 'role', 'is_active'];
const ROLE_FK = 'users_role_id_fk';

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

async function hasIndexOn(qi, column) {
  const indexes = await qi.showIndex('users');
  return indexes.some((i) => i.fields?.some((f) => (f.attribute || f.name) === column));
}

async function hasForeignKey(qi) {
  const refs = await qi.getForeignKeyReferencesForTable('users');
  return refs.some((r) => r.columnName === 'role_id' && r.referencedTableName === 'roles');
}

async function addRoleForeignKey(qi) {
  if (await hasForeignKey(qi)) return;
  await qi.addConstraint('users', {
    fields: ['role_id'],
    type: 'foreign key',
    name: ROLE_FK,
    references: { table: 'roles', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'users'))) {
    await qi.createTable('users', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      microsoft_id: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      fullname: { type: DataTypes.STRING(150), allowNull: false },
      role_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      department: { type: DataTypes.STRING(120), allowNull: true },
      status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('users', ['role_id'], { name: 'users_role_id' });
    return;
  }

  // ---- Upgrade the previous schema ------------------------------------------
  let cols = await qi.describeTable('users');

  if (!cols.microsoft_id) await qi.addColumn('users', 'microsoft_id', { type: DataTypes.STRING(64), allowNull: true });
  if (!cols.fullname) await qi.addColumn('users', 'fullname', { type: DataTypes.STRING(150), allowNull: true });
  if (!cols.role_id) await qi.addColumn('users', 'role_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  if (!cols.department) await qi.addColumn('users', 'department', { type: DataTypes.STRING(120), allowNull: true });
  if (!cols.status) {
    await qi.addColumn('users', 'status', { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' });
  }

  // Copy data from the legacy columns.
  const [rows] = await qi.sequelize.query('SELECT * FROM users');
  for (const r of rows) {
    const values = {
      fullname: r.fullname || [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || r.email,
      role_id: r.role_id || LEGACY_ROLE_TO_ID[r.role] || 2,
      microsoft_id: r.microsoft_id || r.microsoft_oid || null,
    };
    if ('is_active' in r) values.status = r.is_active === true || Number(r.is_active) === 1 ? 'active' : 'inactive';
    await qi.bulkUpdate('users', values, { id: r.id });
  }

  // Tighten constraints now that every row has values.
  cols = await qi.describeTable('users');
  if (cols.fullname.allowNull) await qi.changeColumn('users', 'fullname', { type: DataTypes.STRING(150), allowNull: false });
  if (cols.role_id.allowNull) await qi.changeColumn('users', 'role_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: false });
  if (!(await hasIndexOn(qi, 'microsoft_id'))) await qi.addIndex('users', ['microsoft_id'], { unique: true, name: 'users_microsoft_id_unique' });
  await addRoleForeignKey(qi);
  if (!(await hasIndexOn(qi, 'role_id'))) await qi.addIndex('users', ['role_id'], { name: 'users_role_id' });

  // Drop the legacy columns (their single-column indexes go with them).
  cols = await qi.describeTable('users');
  for (const column of LEGACY_COLUMNS) {
    if (cols[column]) await qi.removeColumn('users', column);
  }
}

// Restores the previous column layout. Passwords cannot be restored (they were
// removed with Microsoft 365-only sign-in), so password is left empty.
export async function down({ context: qi }) {
  const cols = await qi.describeTable('users');
  const add = async (name, spec) => !cols[name] && qi.addColumn('users', name, spec);
  await add('first_name', { type: DataTypes.STRING(80), allowNull: true });
  await add('last_name', { type: DataTypes.STRING(80), allowNull: true });
  await add('password', { type: DataTypes.STRING(100), allowNull: true });
  await add('microsoft_oid', { type: DataTypes.STRING(64), allowNull: true });
  await add('role', { type: DataTypes.ENUM('admin', 'staff'), allowNull: false, defaultValue: 'staff' });
  await add('is_active', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });

  const [rows] = await qi.sequelize.query('SELECT * FROM users');
  for (const r of rows) {
    const parts = String(r.fullname || '').trim().split(/\s+/);
    await qi.bulkUpdate(
      'users',
      {
        first_name: parts.slice(0, -1).join(' ') || parts[0] || r.email,
        last_name: parts.length > 1 ? parts.at(-1) : '-',
        microsoft_oid: r.microsoft_id,
        role: Number(r.role_id) === 1 ? 'admin' : 'staff',
        is_active: r.status === 'active',
      },
      { id: r.id }
    );
  }

  // MySQL needs the foreign key dropped before its column (SQLite reports no constraint names).
  const refs = await qi.getForeignKeyReferencesForTable('users');
  for (const ref of refs.filter((x) => x.columnName === 'role_id' && x.constraintName)) await qi.removeConstraint('users', ref.constraintName);
  for (const column of ['microsoft_id', 'fullname', 'role_id', 'department', 'status']) {
    if ((await qi.describeTable('users'))[column]) await qi.removeColumn('users', column);
  }
}
