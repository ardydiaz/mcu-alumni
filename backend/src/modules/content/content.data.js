// Static site content, taken from the current https://alumni.mcu.edu.ph/ site.
// Records that staff edit (campaigns, scholars, partners...) live in MySQL instead;
// see scripts/seed-data.js for their initial values.
export const UPLOADS = 'https://alumni.mcu.edu.ph/wp-content/uploads';

export const COURSES = [
  'Grade School',
  'Junior High School',
  'Senior High School',
  'College of Arts and Sciences',
  'College of Business and Accountancy',
  'College of Computer Studies',
  'College of Criminology',
  'College of Dentistry',
  'College of Engineering',
  'College of Medical Technology',
  'College of Medicine',
  'College of Midwifery',
  'College of Nursing',
  'College of Nutrition and Dietetics',
  'College of Optometry',
  'College of Pharmacy',
  'College of Physical Therapy',
  'College of Psychology',
  'College of Radiologic Technology',
  'College of Respiratory Therapy',
  'College of Teacher Education',
  'Graduate School - Masters',
  'Graduate School - PhD / Doctorate',
  'Other',
];

// ---- Graduate Tracer choices ----------------------------------------------
export const SEXES = ['Male', 'Female'];

// "Recent Course / Degree Completed", grouped by college for the dropdown.
// Graduates whose degree is not listed pick "Other" and type it in.
export const DEGREE_GROUPS = [
  { college: 'College of Arts and Sciences', degrees: ['AB Communication', 'AB Political Science', 'BS Biology'] },
  { college: 'College of Business and Accountancy', degrees: ['BS Accountancy', 'BSBA Financial Management', 'BSBA Human Resource Management', 'BSBA Marketing Management', 'BSBA Operations Management'] },
  { college: 'College of Computer Studies', degrees: ['BS Computer Science', 'BS Information Technology'] },
  { college: 'College of Criminology', degrees: ['BS Criminology'] },
  { college: 'College of Dentistry', degrees: ['Doctor of Dental Medicine'] },
  { college: 'College of Engineering', degrees: ['BS Civil Engineering', 'BS Electrical Engineering', 'BS Mechanical Engineering'] },
  { college: 'College of Medical Technology', degrees: ['BS Medical Technology'] },
  { college: 'College of Medicine', degrees: ['Doctor of Medicine'] },
  { college: 'College of Midwifery', degrees: ['BS Midwifery', 'Diploma in Midwifery'] },
  { college: 'College of Nursing', degrees: ['BS Nursing'] },
  { college: 'College of Nutrition and Dietetics', degrees: ['BS Nutrition and Dietetics'] },
  { college: 'College of Optometry', degrees: ['Doctor of Optometry'] },
  { college: 'College of Pharmacy', degrees: ['BS Pharmacy'] },
  { college: 'College of Physical Therapy', degrees: ['BS Physical Therapy'] },
  { college: 'College of Psychology', degrees: ['BS Psychology'] },
  { college: 'College of Radiologic Technology', degrees: ['BS Radiologic Technology'] },
  { college: 'College of Respiratory Therapy', degrees: ['BS Respiratory Therapy'] },
  { college: 'College of Teacher Education', degrees: ['Bachelor of Elementary Education', 'Bachelor of Secondary Education'] },
  {
    college: 'Graduate School',
    degrees: ['Master of Arts in Education', 'Master of Arts in Nursing', 'Master in Business Administration', 'Master of Science in Dentistry', "Master's Degree", 'Doctorate / PhD'],
  },
];

export const JOB_CATEGORIES = [
  'Entry Level / Associate',
  'Supervisor / Manager',
  'Head / Director',
  'Senior Executive (e.g., CEO, VP, President)',
  'Academic / Educator',
  'Other',
];
export const TIME_AFTER_GRADUATION = ['Within 6 months', '7 months to 1 year', '1 to 2 years', 'More than 2 years'];
// "If No, choose N/A"
export const FURTHER_STUDIES_TIMING = [...TIME_AFTER_GRADUATION, 'N/A'];

export const VOLUNTEER_ROLES = ['expertise', 'community', 'mentor'];

export const sections = {
  site: {
    name: 'MCU Alumni',
    university: 'Manila Central University',
    address: 'Manila Central University, EDSA, Caloocan City 1400',
    phone: '(+63) 917 104 6520',
    email: 'alumni@mcu.edu.ph',
    logo: `${UPLOADS}/2023/11/header-logo.png`,
    logoWhite: `${UPLOADS}/2023/12/mcu-logo-white.png`,
    alumniIdImage: `${UPLOADS}/2024/10/alumni-id-1024x614.webp`,
    socials: [
      { name: 'Facebook', url: 'https://www.facebook.com/MCU1904' },
      { name: 'Instagram', url: 'https://www.instagram.com/mcu1904' },
      { name: 'TikTok', url: 'https://www.tiktok.com/@mcu1904' },
      { name: 'YouTube', url: 'https://www.youtube.com/@mcu1904' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com/school/mcu1904' },
    ],
  },

  home: {
    hero: {
      title: 'Join the 50,000+ Centralino graduates worldwide!',
      subtitle: 'Connect with your fellow Centralinos from all over the world.',
      image: `${UPLOADS}/2025/06/1-19-scaled-1-1200x800.webp`,
    },
    stats: [
      { value: '50,000+', label: 'Centralino graduates' },
      { value: '1904', label: 'Founded legacy' },
      { value: '7', label: 'Alumni networks' },
      { value: '40+', label: 'Merchant partners' },
    ],
    pillars: [
      { key: 'connect', title: 'Connect', text: 'Reconnect with former classmates, professors, and acquaintances.' },
      { key: 'engage', title: 'Engage', text: 'Stay connected to your Alma Mater through alumni events.' },
      { key: 'empower', title: 'Empower', text: 'Gain access to personal and professional growth resources.' },
      { key: 'give', title: 'Give Back', text: "Join fellow MCU Alumni in contributing to the university's progress." },
    ],
    features: [
      {
        title: 'Alumni E-Newsletter',
        tag: 'Newsletter', tone: 'purple', cover: '/images/networks-banner.webp', cta: 'Read newsletter',
        text: 'Stories, milestones, and updates from the Centralino community.',
        image: `${UPLOADS}/2025/06/ChatGPT-Image-Jun-25-2025-01_12_14-PM.webp`,
        url: 'https://alumni.mcu.edu.ph/alumni-e-newsletter/',
      },
      {
        title: 'Centralino Spotlight',
        tag: 'Spotlight', tone: 'gold', cover: '/images/industry-partners-banner.webp', cta: 'Read story',
        text: 'Meet alumni making a difference in their fields and communities.',
        image: `${UPLOADS}/2025/06/IN-MEMORIAM-3.webp`,
        url: 'https://alumni.mcu.edu.ph/centralino-spotlight',
      },
      {
        title: 'News and Updates',
        tag: 'Campus News', tone: 'purple', cover: '/images/campus-development-banner.webp', cta: 'Read updates',
        text: 'The latest announcements, events, and reunions.',
        image: `${UPLOADS}/2025/06/EAO-WEBSITE.webp`,
        url: 'https://alumni.mcu.edu.ph/news-and-updates',
      },
      {
        title: 'In Memoriam',
        tag: 'In Memoriam', tone: 'dark', cta: 'Read tributes',
        text: 'Honoring the Centralinos who have gone before us.',
        image: `${UPLOADS}/2025/06/IN-MEMORIAM.webp`,
        url: 'https://alumni.mcu.edu.ph/in-memoriam/',
      },
    ],
  },

  give: {
    intro:
      'At MCU, our commitment to excellence in education has been unwavering since our founding. We believe in creating meaningful learning experiences that empower our students to make a difference in the world.',
    image: `${UPLOADS}/2023/12/room.webp`,
    banks: [
      {
        bank: 'BPI',
        logo: `${UPLOADS}/2023/11/2069471-1.webp`,
        accountName: 'Manila Central University',
        accounts: [
          { type: 'Savings (PHP)', number: '4641-1001-32' },
          { type: 'Dollar (USD)', number: '5074-0144-12', swift: 'BOPIPHMM' },
        ],
      },
      {
        bank: 'PNB',
        logo: `${UPLOADS}/2023/11/pnb-1.webp`,
        accountName: 'Manila Central University',
        accounts: [{ type: 'Savings (PHP)', number: '103510034410' }],
      },
    ],
  },

  volunteer: {
    roles: [
      {
        key: 'expertise',
        title: 'Share your Expertise',
        text: 'Whether you are a business leader, a teacher, or an expert in a particular field, you have valuable knowledge and wisdom to share with others. By volunteering as a speaker, you can help others learn and grow, and you can make a positive impact on the world around you.',
        image: `${UPLOADS}/2025/06/472918311_122171041760109925_6942605333594892373_n-1024x768.webp`,
      },
      {
        key: 'community',
        title: 'Community Service Volunteer',
        text: 'Engaging in volunteer work within our local community reflects our dedication to transforming the principles of integrity, compassion, and service into impactful actions that resonate deeply within our community and the industries we serve.',
        image: `${UPLOADS}/2025/06/1-19-scaled-1-1200x800.webp`,
      },
      {
        key: 'mentor',
        title: 'Be a Mentor',
        text: "Mentoring a student is one of the most rewarding ways to give back to your community and make a difference in another person's life. As a mentor, you can share your knowledge, experience, and wisdom to help a student succeed academically, personally, and professionally.",
        image: `${UPLOADS}/2024/10/volunteer3-1024x538.webp`,
      },
    ],
  },

  transparency: {
    intro:
      "As part of Manila Central University's commitment to transparency, we provide detailed reports on the donations received by the university.",
    schedule: 'Reports are typically updated around the tenth working day after the last day of the month.',
    retention: 'We maintain at least three years of data on this website, beginning with the year 2023 transactions.',
  },

  courses: COURSES,

  'form-options': {
    sexes: SEXES,
    degreeGroups: DEGREE_GROUPS,
    jobCategories: JOB_CATEGORIES,
    timeToFirstJob: TIME_AFTER_GRADUATION,
    furtherStudiesTiming: FURTHER_STUDIES_TIMING,
  },
};
