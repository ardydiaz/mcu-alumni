import { DataTypes } from 'sequelize';

// Alumni Portal tracer:
// - tracer_responses.alumni_account_id links a response to the alumnus who submitted it from the portal
//   (NULL for the public form). Every submission is kept as its own row, so the tracer history is preserved.
// - alumni_accounts.sex / address hold the alumnus's latest personal details, updated from the tracer
//   so the Alumni Office does not consolidate them by hand.
const SEXES = ['Male', 'Female'];

async function columns(qi, table) {
  return Object.keys(await qi.describeTable(table));
}

export async function up({ context: qi }) {
  const tracer = await columns(qi, 'tracer_responses');
  if (!tracer.includes('alumni_account_id')) {
    await qi.addColumn('tracer_responses', 'alumni_account_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
    await qi.addIndex('tracer_responses', ['alumni_account_id'], { name: 'tracer_responses_alumni_account_id' });
  }

  const accounts = await columns(qi, 'alumni_accounts');
  if (!accounts.includes('sex')) await qi.addColumn('alumni_accounts', 'sex', { type: DataTypes.ENUM(...SEXES), allowNull: true });
  if (!accounts.includes('address')) await qi.addColumn('alumni_accounts', 'address', { type: DataTypes.STRING(500), allowNull: true });
}

export async function down({ context: qi }) {
  await qi.removeIndex('tracer_responses', 'tracer_responses_alumni_account_id');
  await qi.removeColumn('tracer_responses', 'alumni_account_id');
  await qi.removeColumn('alumni_accounts', 'address');
  await qi.removeColumn('alumni_accounts', 'sex');
}
