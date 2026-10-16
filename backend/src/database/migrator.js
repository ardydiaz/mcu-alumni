import { Umzug, SequelizeStorage } from 'umzug';
import { logger } from '../utils/logger.js';
import * as createRoles from './migrations/20260925-01-create-roles.js';
import * as usersMicrosoftRoles from './migrations/20260925-02-users-microsoft-roles.js';
import * as usersPendingStatus from './migrations/20260925-03-users-pending-status.js';
import * as createSlides from './migrations/20260929-04-create-slides.js';
import * as tracerGraduateProfile from './migrations/20261008-05-tracer-graduate-profile.js';
import * as createAlumniAccounts from './migrations/20261008-06-create-alumni-accounts.js';
import * as tracerAccountLink from './migrations/20261012-07-tracer-account-link.js';
import * as createEvents from './migrations/20261012-08-create-events.js';
import * as createAlumniProfiles from './migrations/20261016-09-create-alumni-profiles.js';
import * as createImportBatches from './migrations/20261016-10-create-import-batches.js';
import * as logExportAction from './migrations/20261016-11-log-export-action.js';
import * as profileInvitations from './migrations/20261016-12-profile-invitations.js';
import * as eaoMonitoring from './migrations/20261016-13-eao-monitoring-event-registrations.js';

// Versioned schema migrations, applied in order and recorded in `schema_migrations`.
// Add new migrations to the end of this list; never rename or reorder applied ones.
const MIGRATIONS = [
  ['20260925-01-create-roles', createRoles],
  ['20260925-02-users-microsoft-roles', usersMicrosoftRoles],
  ['20260925-03-users-pending-status', usersPendingStatus],
  ['20260929-04-create-slides', createSlides],
  ['20261008-05-tracer-graduate-profile', tracerGraduateProfile],
  ['20261008-06-create-alumni-accounts', createAlumniAccounts],
  ['20261012-07-tracer-account-link', tracerAccountLink],
  ['20261012-08-create-events', createEvents],
  ['20261016-09-create-alumni-profiles', createAlumniProfiles],
  ['20261016-10-create-import-batches', createImportBatches],
  ['20261016-11-log-export-action', logExportAction],
  ['20261016-12-profile-invitations', profileInvitations],
  ['20261016-13-eao-monitoring-event-registrations', eaoMonitoring],
];

export function createMigrator(sequelize) {
  return new Umzug({
    migrations: MIGRATIONS.map(([name, m]) => ({ name, up: m.up, down: m.down })),
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
    logger: {
      info: (e) => e.event === 'migrated' && logger.info(`Migration applied: ${e.name}`),
      warn: (e) => logger.warn(`Migration: ${JSON.stringify(e)}`),
      error: (e) => logger.error(`Migration failed: ${JSON.stringify(e)}`),
      debug: () => {},
    },
  });
}

export async function runMigrations(sequelize) {
  return createMigrator(sequelize).up();
}
