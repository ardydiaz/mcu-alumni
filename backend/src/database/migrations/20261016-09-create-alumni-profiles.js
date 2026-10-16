import { DataTypes } from 'sequelize';

// Step 4: Alumni Profile / Data Entry.
// alumni_profiles is the master record of a graduate (A. Profile + B. Residential information).
// The profile_* tables hold the repeatable sections (C. Family, Education, Skills, Trainings, Work, References).
// profile_changes keeps a history of every change (who, what, old -> new).
// Existing verified Alumni Portal accounts get a profile here, with an Alumni Number.

const id = () => ({ type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true });
const fk = () => ({ type: DataTypes.INTEGER.UNSIGNED, allowNull: false });
const str = (n, allowNull = true) => ({ type: DataTypes.STRING(n), allowNull });
const timestamps = () => ({
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
});

const SECTIONS = {
  profile_family: {
    name: str(150, false), relationship: str(40), phone: str(30),
    is_emergency_contact: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_alumnus: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  profile_education: {
    school: str(200, false), level: str(40), degree: str(150),
    year_started: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    year_finished: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    honors: str(150),
  },
  profile_skills: { name: str(120, false), level: str(20) },
  profile_trainings: {
    title: str(200, false), type: str(30), organizer: str(200),
    date: { type: DataTypes.DATEONLY, allowNull: true },
    hours: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    details: str(200),
  },
  profile_work: {
    company: str(200, false), position: str(120, false), job_category: str(200),
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    related_to_degree: { type: DataTypes.BOOLEAN, allowNull: true },
    source: str(20),
  },
  profile_references: { name: str(150, false), position: str(120), company: str(200), phone: str(30), email: str(120) },
};

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

// "Diaz, Ardy P." -> { surname: "Diaz", firstName: "Ardy", middleName: "P." }
function splitName(fullName = '') {
  const [surname = '', given = ''] = fullName.split(',').map((s) => s.trim());
  const words = given.split(/\s+/).filter(Boolean);
  const middle = words.length > 1 && /^[A-Za-z]\.?$/.test(words[words.length - 1]) ? words.pop() : '';
  return { surname, firstName: words.join(' ') || surname, middleName: middle || null };
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'alumni_profiles'))) {
    await qi.createTable('alumni_profiles', {
      id: id(),
      alumni_number: { type: DataTypes.STRING(30), allowNull: true, unique: true },
      alumni_account_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, unique: true },
      student_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      surname: str(80, false), first_name: str(80, false), middle_name: str(80), suffix: str(10), maiden_name: str(80),
      sex: { type: DataTypes.ENUM('Male', 'Female'), allowNull: true },
      nationality: str(60), religion: str(80),
      civil_status: { type: DataTypes.ENUM('Single', 'Married', 'Widowed', 'Separated', 'Annulled'), allowNull: true },
      birth_date: { type: DataTypes.DATEONLY, allowNull: true },
      birth_place: str(120),
      program: str(150, false),
      year_graduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      email: str(120), phone: str(30), photo: str(500),
      house_street: str(200),
      barangay: str(120), barangay_code: str(12),
      city: str(120), city_code: str(12),
      province: str(120), province_code: str(12),
      region: str(120), region_code: str(12),
      zip_code: str(10),
      country: str(60),
      verified_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps(),
    });
    await qi.addIndex('alumni_profiles', ['surname', 'first_name'], { name: 'alumni_profiles_surname_first_name' });
    await qi.addIndex('alumni_profiles', ['year_graduated'], { name: 'alumni_profiles_year_graduated' });
  }

  for (const [table, columns] of Object.entries(SECTIONS)) {
    if (await tableExists(qi, table)) continue;
    await qi.createTable(table, { id: id(), profile_id: fk(), ...columns, ...timestamps() });
    await qi.addIndex(table, ['profile_id'], { name: `${table}_profile_id` });
  }

  if (!(await tableExists(qi, 'profile_changes'))) {
    await qi.createTable('profile_changes', {
      id: id(),
      profile_id: fk(),
      actor_type: { type: DataTypes.ENUM('alumni', 'staff', 'system'), allowNull: false },
      actor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      actor_name: str(150),
      section: str(30, false),
      action: str(20, false),
      changes: { type: DataTypes.JSON, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('profile_changes', ['profile_id', 'created_at'], { name: 'profile_changes_profile_id_created_at' });
  }

  // Backfill: one profile per verified Alumni Portal account that doesn't have one yet.
  const [accounts] = await qi.sequelize.query(
    `SELECT a.* FROM alumni_accounts a LEFT JOIN alumni_profiles p ON p.alumni_account_id = a.id
     WHERE a.status = 'verified' AND p.id IS NULL`
  );
  const now = new Date();
  for (const a of accounts) {
    const name = splitName(a.full_name);
    const [existing] = await qi.sequelize.query('SELECT id FROM alumni_profiles WHERE student_number = ?', { replacements: [a.student_number] });
    if (existing.length) {
      await qi.bulkUpdate('alumni_profiles', { alumni_account_id: a.id }, { id: existing[0].id });
      continue;
    }
    await qi.bulkInsert('alumni_profiles', [{
      alumni_account_id: a.id, student_number: a.student_number,
      surname: name.surname, first_name: name.firstName, middle_name: name.middleName,
      sex: a.sex || null, nationality: 'Filipino', program: a.program, year_graduated: a.year_graduated,
      email: a.email, phone: a.phone, house_street: a.address || null, country: 'Philippines',
      verified_at: a.reviewed_at || now, created_at: now, updated_at: now,
    }]);
    const [[profile]] = await qi.sequelize.query('SELECT id FROM alumni_profiles WHERE alumni_account_id = ?', { replacements: [a.id] });
    const year = new Date(a.reviewed_at || now).getFullYear();
    await qi.bulkUpdate('alumni_profiles', { alumni_number: `MCU-A-${year}-${String(profile.id).padStart(6, '0')}` }, { id: profile.id });
    await qi.bulkInsert('profile_education', [{
      profile_id: profile.id, school: 'Manila Central University', level: 'College', degree: a.program,
      year_finished: a.year_graduated, created_at: now, updated_at: now,
    }]);
  }
}

export async function down({ context: qi }) {
  for (const table of ['profile_changes', ...Object.keys(SECTIONS), 'alumni_profiles']) {
    if (await tableExists(qi, table)) await qi.dropTable(table);
  }
}
