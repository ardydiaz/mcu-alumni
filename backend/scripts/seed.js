// Creates the tables, the first admin account and the initial site records.
// Safe to re-run: existing records are left untouched.
//   npm run seed -w backend
import { env } from '../src/config/env.js';
import { sequelize, connectDatabase, closeDatabase } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';
import { User } from '../src/modules/users/user.model.js';
import { ROLE_IDS } from '../src/middleware/role.middleware.js';
import '../src/modules/auth/auth.model.js';
import { Campaign } from '../src/modules/campaigns/campaign.model.js';
import '../src/modules/donations/donation.model.js';
import { Scholar } from '../src/modules/scholars/scholar.model.js';
import { Network } from '../src/modules/networks/network.model.js';
import { Partner } from '../src/modules/partners/partner.model.js';
import { Project } from '../src/modules/projects/project.model.js';
import '../src/modules/reports/report.model.js';
import '../src/modules/alumni/alumni.model.js';
import '../src/modules/tracer/tracer.model.js';
import '../src/modules/volunteers/volunteer.model.js';
import '../src/modules/messages/message.model.js';
import '../src/modules/logs/log.model.js';
import * as data from './seed-data.js';

// The first Super Admin signs in with Microsoft 365 using SEED_ADMIN_EMAIL; their
// microsoft_id is linked on first sign-in. Roles themselves come from the migrations.
async function seedAdmin() {
  const { email, fullname } = env.seedAdmin;
  if (!email) {
    logger.warn('SEED_ADMIN_EMAIL is empty; skipping the Super Admin account.');
    return;
  }
  const [admin, created] = await User.findOrCreate({
    where: { email: email.toLowerCase() },
    defaults: { email, fullname, roleId: ROLE_IDS['Super Admin'], status: 'active', department: 'Alumni Relations' },
  });
  if (created) {
    logger.info(`Super Admin created: ${admin.email} (sign in with Microsoft 365)`);
  } else if (admin.roleId !== ROLE_IDS['Super Admin'] || admin.status !== 'active') {
    // e.g. the person already signed in once and is waiting as a pending access request
    await admin.update({ roleId: ROLE_IDS['Super Admin'], status: 'active' });
    logger.info(`Existing user promoted to active Super Admin: ${admin.email}`);
  } else {
    logger.info(`Super Admin already exists: ${admin.email}`);
  }
}

// Inserts rows only when the table is empty, so staff edits are never overwritten.
async function seedIfEmpty(Model, rows) {
  if ((await Model.count()) > 0) {
    logger.info(`${Model.tableName}: already has data, skipped`);
    return;
  }
  await Model.bulkCreate(rows);
  logger.info(`${Model.tableName}: inserted ${rows.length} rows`);
}

async function seed() {
  await connectDatabase();
  await sequelize.sync();

  await seedAdmin();
  for (const campaign of data.campaigns) {
    await Campaign.findOrCreate({ where: { slug: campaign.slug }, defaults: campaign });
  }
  logger.info(`campaigns: ensured ${data.campaigns.length} campaigns`);
  await seedIfEmpty(Scholar, data.scholars);
  await seedIfEmpty(Network, data.networks);
  await seedIfEmpty(Partner, data.partners);
  await seedIfEmpty(Project, data.projects);
}

seed()
  .then(() => logger.info('Seeding complete'))
  .catch((err) => {
    logger.error('Seeding failed', err);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
