import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { runMigrations } from '../database/migrator.js';

const { host, port, name, user, password } = env.db;

export const sequelize = new Sequelize(name, user, password, {
  host,
  port,
  dialect: 'mysql',
  timezone: '+08:00',
  logging: env.db.logging ? (sql) => logger.debug(sql) : false,
  define: {
    underscored: true, // snake_case columns (created_at, campaign_id...)
    timestamps: true,
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

// Creates the database on first run so local setup is just "start MySQL".
async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({ host, port, user, password });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

export async function connectDatabase() {
  if (!env.isProduction) await ensureDatabaseExists();
  await sequelize.authenticate();
  logger.info(`MySQL connected: ${user}@${host}:${port}/${name}`);

  await runMigrations(sequelize);

  if (env.db.sync === 'safe' || env.db.sync === 'alter') {
    await sequelize.sync({ alter: env.db.sync === 'alter' });
    logger.info(`Database tables synced (${env.db.sync})`);
  }
}

export async function closeDatabase() {
  await sequelize.close();
}
