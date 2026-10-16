import { DataTypes } from 'sequelize';

// tracer_responses: rebuilt for the official Graduate Tracer form
// (Graduate Profile / Employment Information / Additional Information).
// The old table (first/last name, employment status, income...) is dropped when empty,
// or kept as tracer_responses_v1 when it already holds responses.
const SEXES = ['Male', 'Female'];
const TIME_AFTER_GRADUATION = ['Within 6 months', '7 months to 1 year', '1 to 2 years', 'More than 2 years'];
const FURTHER_STUDIES_TIMING = [...TIME_AFTER_GRADUATION, 'N/A'];
const BACKUP = 'tracer_responses_v1';

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (await tableExists(qi, 'tracer_responses')) {
    const [[{ n }]] = await qi.sequelize.query('SELECT COUNT(*) AS n FROM tracer_responses');
    if (Number(n) > 0) await qi.renameTable('tracer_responses', BACKUP);
    else await qi.dropTable('tracer_responses');
  }

  await qi.createTable('tracer_responses', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(200), allowNull: false },
    sex: { type: DataTypes.ENUM(...SEXES), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    year_graduated: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    degree: { type: DataTypes.STRING(150), allowNull: false },
    is_employed: { type: DataTypes.BOOLEAN, allowNull: false },
    employer: { type: DataTypes.STRING(150), allowNull: true },
    job_categories: { type: DataTypes.JSON, allowNull: true },
    job_category_other: { type: DataTypes.STRING(120), allowNull: true },
    position: { type: DataTypes.STRING(120), allowNull: true },
    related_to_degree: { type: DataTypes.BOOLEAN, allowNull: true },
    time_to_first_job: { type: DataTypes.ENUM(...TIME_AFTER_GRADUATION), allowNull: true },
    further_studies: { type: DataTypes.BOOLEAN, allowNull: false },
    further_studies_timing: { type: DataTypes.ENUM(...FURTHER_STUDIES_TIMING), allowNull: false },
    consent_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  // Same names Sequelize gives the model's indexes
  await qi.addIndex('tracer_responses', ['degree', 'year_graduated'], { name: 'tracer_responses_degree_year_graduated' });
  await qi.addIndex('tracer_responses', ['is_employed'], { name: 'tracer_responses_is_employed' });
}

export async function down({ context: qi }) {
  await qi.dropTable('tracer_responses');
  // Put back the previous responses if they were kept. Otherwise the old table is gone;
  // check out the previous tracer model and restart with DB_SYNC=safe to recreate it empty.
  if (await tableExists(qi, BACKUP)) await qi.renameTable(BACKUP, 'tracer_responses');
}
