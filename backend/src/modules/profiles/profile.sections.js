import { DataTypes } from 'sequelize';
import { Joi } from '../../middleware/validation.middleware.js';
import { JOB_CATEGORIES, INDUSTRIES } from '../content/content.data.js';

// Section C of the alumni profile: repeatable lists. One definition drives the model, the validation
// and the activity history, so a new field only needs to be added here (plus a migration column).
//   attributes: Sequelize columns (besides id, profileId, timestamps)
//   schema:     Joi rules for adding/editing an entry
//   title:      how an entry is named in the change history

const text = (n) => Joi.string().trim().max(n).allow('', null);
const year = () => Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).allow('', null);
const date = () => Joi.date().iso().allow('', null);
const oneOf = (list) => Joi.string().valid(...list).allow('', null);

export const OPTIONS = {
  relationship: ['Spouse', 'Child', 'Parent', 'Sibling', 'Guardian', 'Other'],
  educationLevel: ['Elementary', 'High School', 'Senior High School', 'Vocational', 'College', 'Post-graduate'],
  skillLevel: ['Basic', 'Intermediate', 'Advanced'],
  trainingType: ['Training', 'Seminar', 'Certification', 'Licensure exam'],
  jobCategory: JOB_CATEGORIES,
  industry: INDUSTRIES,
};

export const SECTIONS = {
  family: {
    table: 'profile_family',
    label: 'Family',
    attributes: {
      name: { type: DataTypes.STRING(150), allowNull: false },
      relationship: { type: DataTypes.STRING(40) },
      phone: { type: DataTypes.STRING(30) },
      isEmergencyContact: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      isAlumnus: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    schema: {
      name: Joi.string().trim().max(150).required(),
      relationship: oneOf(OPTIONS.relationship),
      phone: text(30),
      isEmergencyContact: Joi.boolean(),
      isAlumnus: Joi.boolean(),
    },
    title: (r) => `${r.name}${r.relationship ? ` (${r.relationship})` : ''}`,
  },
  education: {
    table: 'profile_education',
    label: 'Education',
    attributes: {
      school: { type: DataTypes.STRING(200), allowNull: false },
      level: { type: DataTypes.STRING(40) },
      degree: { type: DataTypes.STRING(150) },
      yearStarted: { type: DataTypes.SMALLINT.UNSIGNED },
      yearFinished: { type: DataTypes.SMALLINT.UNSIGNED },
      honors: { type: DataTypes.STRING(150) },
    },
    schema: {
      school: Joi.string().trim().max(200).required(),
      level: oneOf(OPTIONS.educationLevel),
      degree: text(150),
      yearStarted: year(),
      yearFinished: year(),
      honors: text(150),
    },
    title: (r) => [r.degree, r.school].filter(Boolean).join(', '),
  },
  skills: {
    table: 'profile_skills',
    label: 'Skills',
    attributes: { name: { type: DataTypes.STRING(120), allowNull: false }, level: { type: DataTypes.STRING(20) } },
    schema: { name: Joi.string().trim().max(120).required(), level: oneOf(OPTIONS.skillLevel) },
    title: (r) => r.name,
  },
  trainings: {
    table: 'profile_trainings',
    label: 'Trainings',
    attributes: {
      title: { type: DataTypes.STRING(200), allowNull: false },
      type: { type: DataTypes.STRING(30) },
      organizer: { type: DataTypes.STRING(200) },
      date: { type: DataTypes.DATEONLY },
      hours: { type: DataTypes.SMALLINT.UNSIGNED },
      details: { type: DataTypes.STRING(200) }, // e.g. license number or board rating
    },
    schema: {
      title: Joi.string().trim().max(200).required(),
      type: oneOf(OPTIONS.trainingType),
      organizer: text(200),
      date: date(),
      hours: Joi.number().integer().min(0).max(10000).allow('', null),
      details: text(200),
    },
    title: (r) => r.title,
  },
  work: {
    table: 'profile_work',
    label: 'Work',
    attributes: {
      company: { type: DataTypes.STRING(200), allowNull: false },
      position: { type: DataTypes.STRING(120), allowNull: false },
      jobCategory: { type: DataTypes.STRING(200) },
      industry: { type: DataTypes.STRING(60) }, // migration 16
      startDate: { type: DataTypes.DATEONLY },
      endDate: { type: DataTypes.DATEONLY },
      isCurrent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      relatedToDegree: { type: DataTypes.BOOLEAN },
      source: { type: DataTypes.STRING(20) }, // portal | staff | tracer
    },
    schema: {
      company: Joi.string().trim().max(200).required(),
      position: Joi.string().trim().max(120).required(),
      jobCategory: text(200),
      industry: oneOf(OPTIONS.industry),
      startDate: date(),
      endDate: date(),
      isCurrent: Joi.boolean(),
      relatedToDegree: Joi.boolean().allow(null, ''),
    },
    title: (r) => `${r.position} at ${r.company}`,
  },
  references: {
    table: 'profile_references',
    label: 'References',
    attributes: {
      name: { type: DataTypes.STRING(150), allowNull: false },
      position: { type: DataTypes.STRING(120) },
      company: { type: DataTypes.STRING(200) },
      phone: { type: DataTypes.STRING(30) },
      email: { type: DataTypes.STRING(120) },
    },
    schema: {
      name: Joi.string().trim().max(150).required(),
      position: text(120),
      company: text(200),
      phone: text(30),
      email: Joi.string().trim().lowercase().email().max(120).allow('', null),
    },
    title: (r) => r.name,
  },
};

export const SECTION_KEYS = Object.keys(SECTIONS);
