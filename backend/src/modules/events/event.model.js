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
    registrationUrl: { type: DataTypes.STRING(500) }, // optional external sign-up link (portal registration comes in phase 2)
    networkId: { type: DataTypes.INTEGER.UNSIGNED }, // chapter hosting the event
    status: { type: DataTypes.ENUM(...EVENT_STATUS), allowNull: false, defaultValue: 'draft' },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    indexes: [{ fields: ['status', 'start_at'] }, { fields: ['category'] }],
  }
);

Event.belongsTo(Network, { foreignKey: 'networkId', as: 'network', constraints: false });
