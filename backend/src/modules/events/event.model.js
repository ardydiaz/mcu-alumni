import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Network } from '../networks/network.model.js';

export const EVENT_CATEGORIES = ['alumni', 'homecoming', 'chapter', 'program'];
export const EVENT_STATUS = ['draft', 'published', 'cancelled'];

// An alumni event or activity on the calendar. Draft events are visible to staff only;
// cancelled events stay on the calendar, marked as cancelled.
// The table is created by migration 20261012-08-create-events; keep the two in step.
export class Event extends Model {}

Event.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(220), allowNull: false, unique: true }, // public URL: /events/:slug
    summary: { type: DataTypes.STRING(300) },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.ENUM(...EVENT_CATEGORIES), allowNull: false, defaultValue: 'alumni' },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE },
    allDay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    venue: { type: DataTypes.STRING(200) },
    onlineUrl: { type: DataTypes.STRING(500) },
    image: { type: DataTypes.STRING(500) },
    registrationDeadline: { type: DataTypes.DATE },
    capacity: { type: DataTypes.INTEGER.UNSIGNED },
    registrationUrl: { type: DataTypes.STRING(500) }, // optional external sign-up link
    portalRegistration: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // alumni register in the portal (migration 13)
    networkId: { type: DataTypes.INTEGER.UNSIGNED }, // chapter hosting the event
    status: { type: DataTypes.ENUM(...EVENT_STATUS), allowNull: false, defaultValue: 'draft' },
    alertsSentAt: { type: DataTypes.DATE }, // when "Notify me" subscribers were emailed about it (migration 15)
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    indexes: [{ fields: ['status', 'start_at'] }, { fields: ['category'] }],
  }
);

Event.belongsTo(Network, { foreignKey: 'networkId', as: 'network', constraints: false });

export const REGISTRATION_STATUS = ['registered', 'attended', 'cancelled'];

// An alumnus registered for an event through the Alumni Portal (table from migration 13).
export class EventRegistration extends Model {}

EventRegistration.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    alumniAccountId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'registered' },
    cancelledAt: { type: DataTypes.DATE },
    attendedAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'EventRegistration',
    tableName: 'event_registrations',
    indexes: [{ unique: true, fields: ['event_id', 'alumni_account_id'] }, { fields: ['alumni_account_id'] }],
  }
);

Event.hasMany(EventRegistration, { foreignKey: 'eventId', as: 'registrations', constraints: false });
EventRegistration.belongsTo(Event, { foreignKey: 'eventId', as: 'event', constraints: false });
