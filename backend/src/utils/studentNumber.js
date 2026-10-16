// MCU student numbers: year + 5 digits + an optional unit suffix, e.g. 2021-10348C (college), 2021-10031M
// (graduate school), 2020-10045MD (medicine). Newer records may omit the dash: 202230608.
// The suffix is part of the identity (2019-10007C and 2019-10007M are different people), so it is kept.
const PATTERN = /^(\d{4})-?(\d{5})([A-Z]{0,2})$/;

// " 2021-10224c " -> "2021-10224C", "202230608" -> "2022-30608". Other formats are only trimmed and uppercased.
export function canonicalStudentNumber(value) {
  if (value === undefined || value === null) return value;
  const s = String(value).trim().toUpperCase().replace(/\s+/g, '');
  const m = s.match(PATTERN);
  return m ? `${m[1]}-${m[2]}${m[3]}` : s;
}

export const isStandardStudentNumber = (value) => PATTERN.test(String(value || '').trim().toUpperCase());
