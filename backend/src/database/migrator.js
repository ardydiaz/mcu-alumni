import { Umzug, SequelizeStorage } from 'umzug';
import { logger } from '../utils/logger.js';
import * as createRoles from './migrations/20260925-01-create-roles.js';
import * as usersMicrosoftRoles from './migrations/20260925-02-users-microsoft-roles.js';
import * as usersPendingStatus from './migrations/20260925-03-users-pending-status.js';
import * as createSlides from './migrations/20260929-04-create-slides.js';

// Versioned schema migrations, applied in order and recorded in `schema_migrations`.
// Add new migrations to the end of this list; never rename or reorder applied ones.
const MIGRATIONS = [
  ['20260925-01-create-roles', createRoles],
  ['20260925-02-users-microsoft-roles', usersMicrosoftRoles],
  ['20260925-03-users-pending-status', usersPendingStatus],
  ['20260929-04-create-slides', createSlides],
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
