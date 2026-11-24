// Alumni profile (Step 4): tabs, section fields and choices. Mirrors backend/src/modules/profiles/profile.sections.js.

export const SEXES = ['Male', 'Female'];
export const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'];
export const YES_NO = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
const RELATIONSHIP = ['Spouse', 'Child', 'Parent', 'Sibling', 'Guardian', 'Other'];
const EDUCATION_LEVEL = ['Elementary', 'High School', 'Senior High School', 'Vocational', 'College', 'Post-graduate'];
const SKILL_LEVEL = ['Basic', 'Intermediate', 'Advanced'];
const TRAINING_TYPE = ['Training', 'Seminar', 'Certification', 'Licensure exam'];

// "2016-01-04" -> "Jan 2016"
const monthYear = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : '');

// Repeatable sections (C). field types: text | select | number | date | checkbox | yesno
export const SECTIONS = [
  {
    key: 'family',
    label: 'Family',
    icon: 'users',
    intro: 'Family members and your emergency contact.',
    add: 'Add family member',
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'relationship', label: 'Relationship', type: 'select', options: RELATIONSHIP },
      { name: 'phone', label: 'Contact number', type: 'tel' },
      { name: 'isEmergencyContact', label: 'Emergency contact', type: 'checkbox' },
      { name: 'isAlumnus', label: 'Also an MCU alumnus', type: 'checkbox' },
    ],
    title: (r) => r.name,
    meta: (r) => [r.relationship, r.phone].filter(Boolean).join(' · '),
    badges: (r) => [r.isEmergencyContact && 'Emergency contact', r.isAlumnus && 'MCU alumnus'].filter(Boolean),
  },
  {
    key: 'education',
    label: 'Education',
    icon: 'book',
    intro: 'Your MCU degree is added for you. Add other schools and post-graduate studies.',
    add: 'Add education',
    fields: [
      { name: 'school', label: 'School', required: true, span: 2 },
      { name: 'level', label: 'Level', type: 'select', options: EDUCATION_LEVEL },
      { name: 'degree', label: 'Degree / course' },
      { name: 'yearStarted', label: 'Year started', type: 'number' },
      { name: 'yearFinished', label: 'Year finished', type: 'number' },
      { name: 'honors', label: 'Honors / awards', span: 2 },
    ],
    title: (r) => r.degree || r.level || r.school,
    meta: (r) => [r.school, [r.yearStarted, r.yearFinished].filter(Boolean).join(' – ')].filter(Boolean).join(' · '),
    badges: (r) => [r.honors].filter(Boolean),
  },
  {
    key: 'skills',
    label: 'Skills',
    icon: 'award',
    intro: 'Professional and technical skills.',
    add: 'Add skill',
    fields: [
      { name: 'name', label: 'Skill', required: true },
      { name: 'level', label: 'Level', type: 'select', options: SKILL_LEVEL },
    ],
    title: (r) => r.name,
    meta: (r) => r.level || '',
    badges: () => [],
  },
  {
    key: 'trainings',
    label: 'Trainings',
    icon: 'file',
    intro: 'Trainings, seminars, certifications and licensure exams.',
    add: 'Add training',
    fields: [
      { name: 'title', label: 'Title', required: true, span: 2 },
      { name: 'type', label: 'Type', type: 'select', options: TRAINING_TYPE },
      { name: 'organizer', label: 'Organizer' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'hours', label: 'Hours', type: 'number' },
      { name: 'details', label: 'Details', hint: 'e.g. license number or board rating', span: 2 },
    ],
    title: (r) => r.title,
    meta: (r) => [r.organizer, monthYear(r.date), r.hours && `${r.hours} hours`, r.details].filter(Boolean).join(' · '),
    badges: (r) => [r.type].filter(Boolean),
  },
  {
    key: 'work',
    label: 'Work',
    icon: 'building',
    intro: 'Your work history. Your current job also updates when you answer the Graduate Tracer.',
    add: 'Add work experience',
    fields: [
      { name: 'company', label: 'Company', required: true },
      { name: 'position', label: 'Position', required: true },
      { name: 'jobCategory', label: 'Job category', type: 'select', optionsFrom: 'jobCategories' },
      { name: 'industry', label: 'Industry', type: 'select', optionsFrom: 'industries' },
      { name: 'relatedToDegree', label: 'Related to your degree?', type: 'yesno' },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date', hint: 'Leave empty if this is your current job' },
      { name: 'isCurrent', label: 'This is my current job', type: 'checkbox' },
    ],
    title: (r) => r.position,
    meta: (r) => [r.company, [monthYear(r.startDate), r.isCurrent ? 'present' : monthYear(r.endDate)].filter(Boolean).join(' – '), r.industry, r.jobCategory].filter(Boolean).join(' · '),
    badges: (r) => [r.isCurrent && 'Current', r.source === 'tracer' && 'From Graduate Tracer'].filter(Boolean),
  },
  {
    key: 'references',
    label: 'References',
    icon: 'handshake',
    intro: 'People who can vouch for your work or character.',
    add: 'Add reference',
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'position', label: 'Position' },
      { name: 'company', label: 'Company' },
      { name: 'phone', label: 'Contact number', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email', span: 2 },
    ],
    title: (r) => r.name,
    meta: (r) => [r.position, r.company, r.phone, r.email].filter(Boolean).join(' · '),
    badges: () => [],
  },
];

export const LABELS = {
  alumniNumber: 'Alumni number', studentNumber: 'Student ID number', surname: 'Surname', firstName: 'First name',
  middleName: 'Middle name', suffix: 'Suffix', maidenName: 'Maiden name', sex: 'Sex', nationality: 'Nationality',
  religion: 'Religion', civilStatus: 'Civil status', birthDate: 'Date of birth', birthPlace: 'Place of birth',
  program: 'Degree / program', yearGraduated: 'Year graduated', email: 'Email', phone: 'Mobile number', photo: 'Photo',
  houseStreet: 'House no. / street', barangay: 'Barangay', city: 'City / municipality', province: 'Province',
  region: 'Region', zipCode: 'ZIP code', country: 'Country', regionCode: 'Region code', provinceCode: 'Province code',
  cityCode: 'City code', barangayCode: 'Barangay code', alumniAccountId: 'Portal account',
  // Section fields (shown in the change history)
  ...Object.fromEntries(SECTIONS.flatMap((s) => s.fields.map((f) => [f.name, f.label]))),
  name: 'Name',
};

export const fullName = (p) => [p.firstName, p.middleName, p.surname, p.suffix].filter(Boolean).join(' ');
export const initials = (p) => `${p.firstName?.[0] || ''}${p.surname?.[0] || ''}`.toUpperCase();
