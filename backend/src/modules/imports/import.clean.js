// Step 5: Alumni Database Migration — reading and cleaning one row of the Registrar/EAO spreadsheet.
// Pure functions (no database): the service decides what to do with each cleaned row.
//
// Each row becomes { line, data, work, errors[], warnings[] }:
//   errors   -> the row is skipped (no student number, unknown course, ...)
//   warnings -> the row is imported, but a value was corrected or left out and may need follow-up
import { DEGREE_GROUPS, SEXES } from '../content/content.data.js';
import { CIVIL_STATUS } from '../profiles/profile.model.js';
import { canonicalStudentNumber, isStandardStudentNumber } from '../../utils/studentNumber.js';

// ---- File -------------------------------------------------------------------

// Excel saves "CSV" as Windows-1252 and "CSV UTF-8" as UTF-8 (with a BOM); accept both.
export function decodeFile(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

// RFC 4180 CSV: quoted fields may contain commas, quotes ("") and line breaks.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

// Column headers -> fields. Several spellings are accepted so other offices' files work too.
export const COLUMNS = {
  yearGraduated: ['year', 'year graduated', 'batch'],
  course: ['course', 'program', 'degree'],
  surname: ['surname', 'last name', 'family name'],
  firstName: ['given name', 'first name', 'firstname'],
  middleName: ['middle name'],
  maidenName: ['maiden name'],
  phone: ['contact no.', 'contact no', 'contact number', 'mobile', 'mobile number', 'phone'],
  email: ['email address', 'email', 'e-mail'],
  address: ['home address', 'address'],
  birthDate: ['birthdate', 'birth date', 'date of birth', 'birthday'],
  sex: ['gender', 'sex'],
  civilStatus: ['civil status'],
  nationality: ['nationality', 'citizenship'],
  employmentStatus: ['employment status'],
  company: ['company name', 'company', 'employer'],
  position: ['position', 'job title'],
  studentNumber: ['student no.', 'student no', 'student number', 'student id', 'student id number'],
};
export const REQUIRED_COLUMNS = ['studentNumber', 'surname', 'firstName', 'course', 'yearGraduated'];
export const COLUMN_LABELS = { studentNumber: 'Student No.', surname: 'Surname', firstName: 'Given Name', course: 'Course', yearGraduated: 'Year' };

const headerKey = (h) => h.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*\(.*\)$/, ''); // "Birthdate (MM/DD/YYYY)" -> "birthdate"

// -> { index: { field: columnIndex }, missing: [labels], unknown: [headers] }
export function mapHeader(header) {
  const index = {};
  const unknown = [];
  header.forEach((h, i) => {
    const key = headerKey(h);
    const field = Object.keys(COLUMNS).find((f) => COLUMNS[f].includes(key));
    if (field && index[field] === undefined) index[field] = i;
    else if (key) unknown.push(h.trim());
  });
  const missing = REQUIRED_COLUMNS.filter((f) => index[f] === undefined).map((f) => COLUMN_LABELS[f]);
  return { index, missing, unknown };
}

// ---- Values -----------------------------------------------------------------

// Registrar course codes -> program names used across the system (Graduate Tracer, profiles, reports).
export const COURSE_CODES = {
  BIOLOGY: 'BS Biology',
  'BS BIOLOGY': 'BS Biology',
  'BS ACCTG': 'BS Accountancy',
  BSA: 'BS Accountancy',
  'BSBA-MARKETING': 'BSBA Marketing Management',
  'BSBA-OPERATIONS': 'BSBA Operations Management',
  'BSBA-FM': 'BSBA Financial Management',
  'BSBA-HRM': 'BSBA Human Resource Management',
  BSCS: 'BS Computer Science',
  BSIT: 'BS Information Technology',
  'BSE-ENG': 'Bachelor of Secondary Education',
  BEED: 'Bachelor of Elementary Education',
  'BS-MT': 'BS Medical Technology',
  BSMT: 'BS Medical Technology',
  BSN: 'BS Nursing',
  'BS-PHARMACY': 'BS Pharmacy',
  'BS-PSYCH': 'BS Psychology',
  'BS-PT': 'BS Physical Therapy',
  'BS-RT': 'BS Radiologic Technology',
  'BS-CRIM': 'BS Criminology',
  'BS-ND': 'BS Nutrition and Dietetics',
  DDM: 'Doctor of Dental Medicine',
  MEDICINE: 'Doctor of Medicine',
  MD: 'Doctor of Medicine',
  OPTO: 'Doctor of Optometry',
  MAED: 'Master of Arts in Education',
  MAN: 'Master of Arts in Nursing',
  MBA: 'Master in Business Administration',
  MSD: 'Master of Science in Dentistry',
};
// Full program names are accepted too (e.g. a file exported from this system).
const KNOWN_PROGRAMS = [...new Set([...DEGREE_GROUPS.flatMap((g) => g.degrees), ...Object.values(COURSE_CODES)])];
const codeKey = (s) => s.toUpperCase().replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-');

function program(raw) {
  const v = raw.trim();
  if (!v) return null;
  return COURSE_CODES[codeKey(v)] || KNOWN_PROGRAMS.find((p) => p.toLowerCase() === v.toLowerCase()) || null;
}

const PLACEHOLDER = /^(n\/?a|none|null|nil|-+|\.+|0)$/i;
const clean = (v) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s && !PLACEHOLDER.test(s) ? s : '';
};

// "NiÃ±o" / "Muã‘Oz": UTF-8 text that was saved again as Windows-1252 (often after a CAPS -> Proper case fix).
function fixEncoding(s) {
  return s.replace(/[ÃÂã]‘/g, 'Ñ').replace(/[Ãã]±/g, 'ñ').replace(/Ã©/g, 'é').replace(/Ã¡/g, 'á').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã­/g, 'í');
}

const ROMAN = /^(II|III|IV|V|VI)$/i;
// Proper-cases words typed in CAPS, lowercase or with a stray capital ("MuÑOz", "fEMALE"); leaves "McDonald" alone.
function properCase(s) {
  return s
    .split(' ')
    .map((word) => {
      if (ROMAN.test(word)) return word.toUpperCase();
      const odd = word === word.toUpperCase() || word === word.toLowerCase() || /[a-zñ][A-ZÑ]{2,}|^[a-zñ]/.test(word);
      if (!odd || /^(Mc|Mac)[A-Z][a-z]/.test(word)) return word;
      return word.toLowerCase().replace(/(^|[-'’.])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
    })
    .join(' ');
}

const SUFFIX = /\s+(jr|sr|ii|iii|iv|v|vi)\.?$/i;
const SUFFIX_FORMAT = { jr: 'Jr.', sr: 'Sr.' };
// "Luisito Jr." -> ["Luisito", "Jr."]
function splitSuffix(name) {
  const m = name.match(SUFFIX);
  if (!m) return [name, null];
  const key = m[1].toLowerCase();
  return [name.slice(0, m.index).trim(), SUFFIX_FORMAT[key] || key.toUpperCase()];
}

function name(raw) {
  const s = clean(raw);
  return s ? properCase(fixEncoding(s)) : '';
}

// -> { value, warning }
function phone(raw) {
  const s = String(raw ?? '').trim();
  if (!s || PLACEHOLDER.test(s)) return { value: null };
  if (/^\d(\.\d+)?E\+\d+$/i.test(s)) return { value: null, warning: `Contact number was damaged by Excel (${s}); ask the alumnus for it again` };
  if (s.startsWith('+') && !s.startsWith('+63')) return { value: s.replace(/[^\d+]/g, '') }; // foreign number
  let d = s.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('639')) d = `0${d.slice(2)}`;
  if (d.length === 10 && d.startsWith('9')) d = `0${d}`; // Excel dropped the leading 0
  if (/^09\d{9}$/.test(d)) return { value: d };
  if (/^\d{7,15}$/.test(d)) return { value: d, warning: `Contact number "${s}" is not a Philippine mobile number; please check` };
  return { value: null, warning: `Contact number "${s}" is not valid and was left out` };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const EMAIL_TYPOS = [[/\.con$/, '.com'], [/\.cm$/, '.com'], [/\.comm$/, '.com'], [/@gmial\.com$/, '@gmail.com'], [/@gmai\.com$/, '@gmail.com'], [/@yahoo\.co$/, '@yahoo.com']];
function email(raw) {
  let s = String(raw ?? '').trim().toLowerCase().replace(/^mailto:/, '').replace(/\s+/g, '');
  if (!s || PLACEHOLDER.test(s) || /^(na|none|n\/a)@/.test(s)) return { value: null };
  const original = s;
  for (const [typo, fix] of EMAIL_TYPOS) s = s.replace(typo, fix);
  if (!EMAIL.test(s) || s.length > 120) return { value: null, warning: `Email "${raw}" is not valid and was left out` };
  return { value: s, warning: s !== original ? `Email corrected from "${original}" to "${s}"` : undefined };
}

// MM/DD/YYYY (the template), YYYY-MM-DD, or an Excel date serial.
function birthDate(raw, gradYear) {
  const s = clean(raw);
  if (!s) return { value: null };
  let y; let m; let d;
  let match;
  if ((match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/))) [, m, d, y] = match.map(Number);
  else if ((match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, m, d] = match.map(Number);
  else if (/^\d{5}$/.test(s)) {
    const dt = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000);
    [y, m, d] = [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  } else return { value: null, warning: `Birthdate "${s}" is not a date (use MM/DD/YYYY) and was left out` };
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return { value: null, warning: `Birthdate "${s}" is not a real date and was left out` };
  const age = (gradYear || new Date().getFullYear()) - y;
  if (age < 15 || age > 90) return { value: null, warning: `Birthdate "${s}" would make the graduate ${age} years old; it was left out` };
  return { value: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
}

function choice(raw, list, aliases = {}, label) {
  const s = clean(raw).toLowerCase();
  if (!s) return { value: null };
  const found = list.find((o) => o.toLowerCase() === s) || aliases[s];
  return found ? { value: found } : { value: null, warning: `${label} "${clean(raw)}" is not one of ${list.join(', ')}; it was left out` };
}

const NATIONALITY_ALIASES = { filipina: 'Filipino', pilipino: 'Filipino', pinoy: 'Filipino', philippine: 'Filipino' };
const looksLikeNationality = (v) => /(ino|ina|ian|ese|ish|i|an)$/i.test(v) && !/employ/i.test(v);

// ---- Row --------------------------------------------------------------------

/**
 * One spreadsheet row -> cleaned profile values.
 * @param {string[]} cells  the row's cells
 * @param {object} index    mapHeader().index
 * @param {number} line     line number in the file (header = 1), shown in the report
 */
export function cleanRow(cells, index, line) {
  const get = (field) => (index[field] === undefined ? '' : String(cells[index[field]] ?? ''));
  const errors = [];
  const warnings = [];
  const warn = (w) => w && warnings.push(w);

  // Identity (required)
  const rawStudent = clean(get('studentNumber'));
  const studentNumber = rawStudent ? canonicalStudentNumber(rawStudent) : '';
  if (!studentNumber) errors.push('Student No. is empty');
  else if (!/^[A-Z0-9-]{3,30}$/.test(studentNumber)) errors.push(`Student No. "${rawStudent}" is not valid`);
  else if (!isStandardStudentNumber(studentNumber)) warn(`Student No. "${rawStudent}" is not in the usual YYYY-NNNNN format; please check`);

  let [firstName, suffixFromFirst] = splitSuffix(name(get('firstName')));
  let [surname, suffixFromLast] = splitSuffix(name(get('surname')));
  const suffix = suffixFromFirst || suffixFromLast;
  if (!surname) errors.push('Surname is empty');
  if (!firstName) errors.push('Given Name is empty');
  if (suffix) warn(`Suffix "${suffix}" moved from the name into the Suffix field`);
  if (surname.length > 80 || firstName.length > 80) errors.push('Name is too long');

  const courseRaw = clean(get('course'));
  const programName = program(courseRaw);
  if (!courseRaw) errors.push('Course is empty');
  else if (!programName) errors.push(`Course "${courseRaw}" is not a known course code; add it to the course list or use the full program name`);

  const yearRaw = clean(get('yearGraduated'));
  const yearGraduated = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
  if (!yearGraduated || yearGraduated < 1904 || yearGraduated > new Date().getFullYear() + 1) errors.push(`Year "${yearRaw}" is not a valid graduation year`);

  // Contact and personal details (optional: bad values are left out with a warning)
  const p = phone(get('phone'));
  warn(p.warning);
  const e = email(get('email'));
  warn(e.warning);
  if (!e.value && !p.value) warn('No usable email or contact number: this graduate cannot be reached yet');
  const b = birthDate(get('birthDate'), yearGraduated);
  warn(b.warning);
  const sex = choice(get('sex'), SEXES, { m: 'Male', f: 'Female' }, 'Gender');
  warn(sex.warning);
  const civil = choice(get('civilStatus'), CIVIL_STATUS, { widow: 'Widowed', widower: 'Widowed', annulled: 'Annulled' }, 'Civil status');
  warn(civil.warning);

  let nationality = name(get('nationality'));
  nationality = NATIONALITY_ALIASES[nationality.toLowerCase()] || nationality || null;

  // Employment: a nationality typed in the Employment Status column is moved back.
  let employment = name(get('employmentStatus'));
  if (employment && looksLikeNationality(employment)) {
    if (!nationality) nationality = NATIONALITY_ALIASES[employment.toLowerCase()] || employment;
    warn(`"${employment}" was in the Employment Status column; it was treated as the nationality`);
    employment = '';
  }
  const company = clean(get('company')).slice(0, 200);
  const position = clean(get('position')).slice(0, 120);
  const work = company ? { company, position: position || employment || 'Not specified', isCurrent: true } : null;
  if (!company && position) warn(`Position "${position}" has no company name, so no work entry was added`);

  // Free-text address: kept as typed (minus "NULL" fillers); the alumnus picks region/city from the lists later.
  const address = clean(fixEncoding(get('address')).replace(/\bnull\b/gi, ' ')).slice(0, 200) || null;

  return {
    line,
    errors,
    warnings,
    data: {
      studentNumber,
      surname,
      firstName,
      middleName: name(get('middleName')) || null,
      suffix,
      maidenName: name(get('maidenName')) || null,
      sex: sex.value,
      civilStatus: civil.value,
      nationality,
      birthDate: b.value,
      program: programName,
      yearGraduated,
      email: e.value,
      phone: p.value,
      houseStreet: address,
    },
    work,
  };
}
