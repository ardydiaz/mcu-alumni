// Initial records copied from the current https://alumni.mcu.edu.ph/ site.
// Images still point to the old WordPress uploads; replace them by uploading
// new files through the API.
import { UPLOADS } from '../src/modules/content/content.data.js';

export const campaigns = [
  { slug: 'lrc-auditorium', area: 'Infrastructure', title: 'Build the Future, Leave a Legacy', description: 'Support the LRC Auditorium.' },
  { slug: 'scholarship', area: 'Scholarships', title: 'Enabling Excellence', description: 'Support scholarships for deserving Centralinos.' },
  { slug: 'athletics', area: 'Athletics', title: 'Empower Dreams, Fuel Victories', description: 'Support MCU athletics.' },
  { slug: 'education-research', area: 'Education and Research', title: 'Fostering Excellence', description: 'Advance education and research.' },
  { slug: 'community', area: 'Community Building', title: 'Stronger Together', description: 'Build a thriving community.' },
  { slug: 'mission', area: 'University Mission', title: 'Sustaining Our Legacy', description: 'Support the MCU mission.' },
].map((c, i) => ({ ...c, sortOrder: i + 1 }));

export const scholars = [
  ['Alicante, Ivanlys Marie Namilit', 'College of Medical Technology', null], // no photo on the current site
  ['Alivio, Ashley Jane Prado', 'College of Nursing', 'Alivio-Photo-e1740920668623.webp'],
  ['An, Gianina Tacla', 'College of Nursing', 'An-Photo-scaled-1.webp'],
  ['Balubal, Jomar Talledo', 'College of Optometry', 'Balubal-Photo-e1740920197756.webp'],
  ['Cagol, Jhea Marie Diocos', 'College of Nursing', 'Cagol-Photo-e1748959561885.webp'],
  ['Crespo, Princess Capariño', 'College of Nursing', 'Crespo-Photo-e1740920406921.webp'],
  ['De Leon, Erich San Miguel', 'College of Nursing', 'De-Leon-Photo.webp'],
  ['Desabille, Cedric Justin Buemia', 'College of Nursing', 'Desabille-Photo.webp'],
  ['Joven, Marianne Shanley Limbo', 'College of Nursing', 'Joven-Photo.webp'],
  ['Legaspi, Karylle Anne Buenaflor', 'College of Nursing', 'Legaspi-Photo-scaled-1.webp'],
  ['Manangan, Shaira Mae Negrillo', 'College of Nursing', 'Manangan-Photo-scaled-2.webp'],
  ['Nadongga, Alyssa May Trajan', 'College of Nursing', 'Nadongga-Photo-scaled-1.webp'],
  ['Panganiban, Angela May Cunanan', 'College of Nursing', 'Panganiban-Photo-scaled-1.webp'],
  ['Raymundo, Raymond Tugade', 'College of Nursing', 'Raymundo-Photo-e1748960706275.webp'],
  ['Reyes, Mariah Dewi-Dennise Mendiola', 'College of Arts and Sciences - BS Psychology', 'Reyes-Photo-scaled-1.webp'],
  ['Ridad, Alesha Mae Cadiz', 'College of Nursing', 'Ridad-Photo.webp'],
  ['Salazar, Felicity Gayle Cruz', 'College of Medical Technology', 'Salazar-Photo-scaled-1.webp'],
  ['Sapno, Alliana Jhane Luntayao', 'College of Nursing', 'Sapno-Photo-e1748961049968.webp'],
  ['Sunga, Ericalyne Galang', 'College of Nursing', 'Sunga-Photo-scaled-1.webp'],
  ['Zarate, Leica Janelle Dy', 'College of Nursing', 'Zarate-Photo-scaled-1.webp'],
].map(([name, college, file], i) => ({ name, college, image: file ? `${UPLOADS}/2025/06/${file}` : null, sortOrder: i + 1 }));

export const projects = [
  { title: 'Elevated and Standard Classrooms', description: 'Modern learning spaces designed for collaboration and technology-enabled teaching.', image: `${UPLOADS}/2023/12/room.webp` },
  { title: 'LRC Amphitheatre', description: 'A venue for lectures, performances, and university gatherings at the Learning Resource Center.', image: `${UPLOADS}/2023/12/amphi.webp` },
  { title: 'PGT Science Building', description: 'Laboratories and facilities that support science and health education.', image: `${UPLOADS}/2023/12/PGT-Science-Bldg.webp` },
  { title: 'Basic Education Playground', description: 'A safe, vibrant play area for our youngest Centralinos.', image: `${UPLOADS}/2023/12/playground.webp` },
].map((p, i) => ({ ...p, status: 'planned', sortOrder: i + 1 }));

export const networks = [
  { name: 'College of Medicine Alumni Association, Inc.', president: 'Dr. Marissa V. Nualla', logo: `${UPLOADS}/2025/06/MCU-COMAA-Logo.webp` },
  { name: 'Pharmacy Alumni Association', president: 'Mr. Rodel Samonte', logo: `${UPLOADS}/2025/06/MCUPAA-logo.webp` },
  { name: 'College of Optometry Alumni Association', president: 'Dr. Evelyn Abarintos', logo: `${UPLOADS}/2025/06/COO-Logo-768x771.webp` },
  { name: 'Medical Technology Alumni Association', president: 'Prof. Ma. Cecilia C. Calisang', logo: `${UPLOADS}/2025/06/Logo.webp` },
  { name: 'Medical Alumni Foundation, Inc.', president: 'Dr. Emma Nagar-Arella', logo: `${UPLOADS}/2025/06/MCUMAF-Logo.webp` },
  { name: 'Teacher Education Alumni Chapter', president: 'Ms. Maxeen Ira R. Magbiray', logo: `${UPLOADS}/2025/06/TEACH-LOGO-768x768.webp` },
  { name: 'Dentistry Alumni Association', president: 'Dr. Glenn V. Juson', logo: `${UPLOADS}/2025/06/Dent-Logo.webp` },
].map((n, i) => ({ ...n, sortOrder: i + 1 }));

const merchantPartners = [
  { name: 'Star City', offer: 'PHP 200 off on Star Pass tickets', validity: 'May 7 - June 7, 2026 (Tue-Sun)', validUntil: '2026-06-07', logo: `${UPLOADS}/2026/05/Star_City_park_logo.svg-300x170.png` },
  { name: 'Hotel Partner', offer: '20% off best available room rates, plus 20% off food and beverages at La Plaza and Buenavista', validity: 'Until May 2027', validUntil: '2027-05-31', logo: `${UPLOADS}/2026/05/1631311869095.jpg` },
  { name: 'Pet Clinic', offer: '20% off vet consultations; 5% off pet products and pharmaceuticals', validity: 'Until September 1, 2026', validUntil: '2026-09-01', logo: `${UPLOADS}/2026/05/images-1.jpg` },
  { name: 'Guest House', offer: '10% off guest rooms; 5% off food and beverages', validity: 'Until December 31, 2026', validUntil: '2026-12-31', logo: `${UPLOADS}/2026/05/images-2.jpg` },
  { name: 'Shinagawa Diagnostic', offer: '10% off all individual services', logo: `${UPLOADS}/2026/05/ShinagwaDiagnosticPreventiveCare_TiffanyBlue-768x191-2.png` },
  { name: 'Great Image', offer: '10% off regular packages and a la carte prints', validity: 'Until May 8, 2026', validUntil: '2026-05-08', logo: `${UPLOADS}/2025/07/great-image-300x300.jpg` },
  { name: 'Metro Dental Clinics', offer: 'Up to 35% off selected services', logo: `${UPLOADS}/2025/07/metrodental-300x300.png` },
  { name: 'SLACC', offer: '30% to 50% off published rates for services', logo: `${UPLOADS}/2026/05/slacc-300x300.jpg` },
  { name: 'Spa Partner', offer: '50% off during your birth month (with 3 paying guests); 15% off on your birthday', logo: `${UPLOADS}/2026/05/650849193_18310407154259380_9012826079984232998_n-300x300.jpg` },
  { name: 'Splendid Brews', offer: '5% off all drinks, plus a free iced Americano on your birthday', logo: `${UPLOADS}/2024/10/splendid-300x300.webp` },
  { name: 'TD&Co.', offer: '10% off at any TD&Co. store (minimum PHP 500 purchase)', logo: `${UPLOADS}/2025/07/TDCO-300x300.jpg` },
  { name: 'E-Kart Raceway', offer: '10% off all rides and simulator packages', validity: 'Until April 30, 2027', validUntil: '2027-04-30', logo: `${UPLOADS}/2026/05/images-5.png` },
].map((p, i) => ({ ...p, type: 'merchant', sortOrder: i + 1 }));

const industryPartners = [
  ['Ambica', 'https://ambicaint.com'],
  ['American Eye', 'https://americaneye.com.ph'],
  ['Asian Eye Institute', 'https://asianeyeinstitute.com'],
  ['Belo Medical', 'https://belomed.com'],
  ['Betondis Asia Pacific', 'https://www.linkedin.com/in/betondis-asia-pacific'],
  ['Delex Pharma', 'https://delexpharma.com'],
  ['Executive Optical', 'https://eo-executiveoptical.com'],
  ['Hi-Precision', 'https://hi-precision.com.ph'],
  ['Hobli', 'https://hobli.com.ph'],
  ['Intellicare', 'https://site.intellicare.com.ph'],
  ['Keralty Care Center', 'https://carecenter.clinic'],
  ['Lifestrong', 'https://lifestrong.com.ph'],
  ['Maxicare', 'https://maxicare.com.ph'],
  ['MCU Hospital', 'https://mcuhospital.org'],
  ['Mercury Drug', 'https://mercurydrug.com'],
  ['National Center for Mental Health', 'https://ncmh.gov.ph'],
  ['Optum', 'https://optum.com'],
  ['OwnDays', 'https://owndays.com/ph'],
  ['People Dynamics', 'https://peopledynamics.co'],
  ['Philippine Society of Tuberculosis Doctors', 'https://pstd.org'],
  ['Polyhealth', 'https://polyhealth.ph'],
  ['Prosweal', 'https://facebook.com/ProswealCares'],
  ['RB Global Medical', 'https://rbgm-medical.com'],
  ['RGP', 'https://rgp.com'],
  ['RV Groups', 'https://rvgroups.co'],
  ['Shearwater Health', 'https://shearwaterhealth.com'],
  ['Shinagawa', 'https://shinagawa.ph'],
  ['SM Center Sangandaan', 'https://facebook.com/smcentersangandaan'],
  ['SM Grand Central', 'https://facebook.com/smgrandcentral'],
  ['Southstar Drug', 'https://southstardrug.com.ph'],
  ["St. Luke's Medical Center", 'https://stlukes.com.ph'],
  ['The Medical City', 'https://themedicalcityclinic.com'],
  ['Zurer RX Drug', 'https://zurerxdrug.com'],
].map(([name, website]) => ({ type: 'industry', name, website }));

export const partners = [...merchantPartners, ...industryPartners];
