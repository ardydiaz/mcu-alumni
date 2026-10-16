import { Joi, listQuerySchema, phone, year, validate } from '../../middleware/validation.middleware.js';
import { SEXES } from '../content/content.data.js';
import { CIVIL_STATUS } from './profile.model.js';
import { SECTIONS, SECTION_KEYS } from './profile.sections.js';

const text = (n) => Joi.string().trim().max(n).allow('', null);
const oneOf = (list) => Joi.string().valid(...list).allow('', null);
const psgcCode = () => Joi.string().trim().pattern(/^R?\d{9,10}$/).allow('', null);

// Fields alumni may change themselves (A: personal details that aren't verified, B: address).
const SELF_SERVICE = {
  maidenName: text(80),
  sex: oneOf(SEXES),
  nationality: text(60),
  religion: text(80),
  civilStatus: oneOf(CIVIL_STATUS),
  birthPlace: text(120),
  phone: phone().allow('', null),
  photo: text(500),
  houseStreet: text(200),
  regionCode: psgcCode(),
  provinceCode: psgcCode(),
  cityCode: psgcCode(),
  barangayCode: psgcCode(),
  // Outside the Philippines the address is typed in, since there are no PSGC codes.
  region: text(120),
  province: text(120),
  city: text(120),
  barangay: text(120),
  zipCode: text(10),
  country: text(60),
};

// Verified record: only the Alumni Office (EAO) changes these. The Alumni Number is system-generated.
const VERIFIED = {
  studentNumber: Joi.string().trim().max(30).pattern(/^[A-Za-z0-9-]+$/).messages({ 'string.pattern.base': 'Use letters, numbers and dashes only' }),
  surname: Joi.string().trim().max(80),
  firstName: Joi.string().trim().max(80),
  middleName: text(80),
  suffix: text(10),
  birthDate: Joi.date().iso().max('now').allow('', null),
  program: Joi.string().trim().max(150),
  yearGraduated: year(),
  email: Joi.string().trim().lowercase().email().max(120).allow('', null),
};

// Alumni may also fill in their date of birth while it is still empty (the controller enforces "only if empty").
export const alumniProfileSchema = Joi.object({ ...SELF_SERVICE, birthDate: VERIFIED.birthDate }).min(1);

export const staffUpdateProfileSchema = Joi.object({ ...VERIFIED, ...SELF_SERVICE }).min(1);

export const staffCreateProfileSchema = Joi.object({ ...VERIFIED, ...SELF_SERVICE }).fork(
  ['studentNumber', 'surname', 'firstName', 'program', 'yearGraduated'],
  (s) => s.required()
);

export const listProfilesQuerySchema = listQuerySchema.keys({
  yearGraduated: year(),
  linked: Joi.boolean(), // has an Alumni Portal account
});

export const sectionParamSchema = Joi.object({
  section: Joi.string().valid(...SECTION_KEYS).required(),
  itemId: Joi.number().integer().min(1),
  id: Joi.number().integer().min(1),
});

// Body rules for adding/editing a section entry, chosen by the :section param (validate params first).
const sectionSchemas = Object.fromEntries(Object.entries(SECTIONS).map(([key, def]) => [key, Joi.object(def.schema)]));
export const validateSectionBody = (req, res, next) => validate(sectionSchemas[req.params.section])(req, res, next);
