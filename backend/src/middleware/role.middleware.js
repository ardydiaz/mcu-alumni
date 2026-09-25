import { ApiError } from '../utils/helpers.js';

// Role names as stored in the `roles` table (ids are fixed by the migration).
export const ROLES = Object.freeze({
  SUPER_ADMIN: 'Super Admin',
  ADMINISTRATOR: 'Administrator',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
});

export const ROLE_IDS = Object.freeze({ 'Super Admin': 1, Administrator: 2, Faculty: 3, Student: 4 });

// Roles allowed into the admin dashboard.
export const ADMIN_PANEL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMINISTRATOR];

// What each role may do per module; shown on the admin Roles page and mirrored
// by the route guards below.
const MANAGE = ['view', 'create', 'edit', 'delete'];
const PROCESS = ['view', 'edit', 'delete'];
const both = (actions) => ({ 'Super Admin': actions, Administrator: actions, Faculty: [], Student: [] });

export const PERMISSIONS = [
  { module: 'Dashboard', ...both(['view']) },
  { module: 'Campaigns', ...both(MANAGE) },
  { module: 'Scholars', ...both(MANAGE) },
  { module: 'Networks', ...both(MANAGE) },
  { module: 'Partners', ...both(MANAGE) },
  { module: 'Projects', ...both(MANAGE) },
  { module: 'Transparency reports', ...both(MANAGE) },
  { module: 'Donations', ...both(PROCESS) },
  { module: 'Alumni records', ...both(PROCESS) },
  { module: 'Volunteers', ...both(PROCESS) },
  { module: 'Messages', ...both(PROCESS) },
  { module: 'Graduate tracer', ...both(['view', 'delete']) },
  { module: 'Users', 'Super Admin': MANAGE, Administrator: [], Faculty: [], Student: [] },
  { module: 'Roles', 'Super Admin': ['view', 'edit'], Administrator: [], Faculty: [], Student: [] },
  { module: 'Activity logs', 'Super Admin': ['view'], Administrator: [], Faculty: [], Student: [] },
];

export const canAccessAdminPanel = (user) => Boolean(user && ADMIN_PANEL_ROLES.includes(user.roleName));

// Use after `authenticate`: authorize(ROLES.SUPER_ADMIN) or authorize(...ADMIN_PANEL_ROLES)
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.roleName)) {
      return next(ApiError.forbidden(`Your role (${req.user.roleName || 'none'}) does not have access to this`));
    }
    next();
  };

// Super Admin + Administrator: the admin dashboard and its content/submissions.
export const adminPanelOnly = authorize(...ADMIN_PANEL_ROLES);
// Super Admin only: users, roles and activity logs.
export const superAdminOnly = authorize(ROLES.SUPER_ADMIN);
