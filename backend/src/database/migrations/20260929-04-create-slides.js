import { DataTypes } from 'sequelize';

// slides: homepage hero slider, managed from the admin dashboard ("Homepage slider").
// Starts with the four slides that were previously hard-coded in content.data.js.
const UPLOADS = 'https://alumni.mcu.edu.ph/wp-content/uploads';

const INITIAL_SLIDES = [
  {
    eyebrow: 'Manila Central University Alumni',
    title: 'Join the 50,000+ Centralino graduates worldwide!',
    subtitle: 'Connect with your fellow Centralinos from all over the world.',
    image: `${UPLOADS}/2025/06/1-19-scaled-1-1200x800.webp`,
    primary_label: 'Stay Connected',
    primary_link: '/alumni-contact-update',
    secondary_label: 'Get Alumni ID',
    secondary_link: '/alumni-contact-update#alumni-id',
  },
  {
    eyebrow: 'Support-a-Centralino',
    title: 'Shape a future. Empower an MCU scholar.',
    subtitle: 'Help deserving students complete their academic journey.',
    image: `${UPLOADS}/2024/10/volunteer3-1024x538.webp`,
    primary_label: 'Sponsor a scholar',
    primary_link: '/give?campaign=scholarship',
    secondary_label: 'Meet our scholars',
    secondary_link: '/support-a-centralino',
  },
  {
    eyebrow: 'Campus Development',
    title: 'Build the future, leave a legacy.',
    subtitle: 'Your gift helps create spaces where innovation thrives.',
    image: `${UPLOADS}/2023/12/amphi.webp`,
    primary_label: 'Give now',
    primary_link: '/give?campaign=lrc-auditorium',
    secondary_label: 'See the projects',
    secondary_link: '/campus-development',
  },
  {
    eyebrow: 'Volunteer',
    title: 'Give back as a speaker, mentor or volunteer.',
    subtitle: 'Share your time, talent and experience with the next generation of Centralinos.',
    image: `${UPLOADS}/2025/06/472918311_122171041760109925_6942605333594892373_n-1024x768.webp`,
    primary_label: 'Volunteer',
    primary_link: '/volunteer',
    secondary_label: null,
    secondary_link: null,
  },
];

async function tableExists(qi, name) {
  const tables = await qi.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(name);
}

export async function up({ context: qi }) {
  if (!(await tableExists(qi, 'slides'))) {
    await qi.createTable('slides', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      eyebrow: { type: DataTypes.STRING(80), allowNull: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      subtitle: { type: DataTypes.STRING(300), allowNull: true },
      image: { type: DataTypes.STRING(500), allowNull: false },
      primary_label: { type: DataTypes.STRING(60), allowNull: true },
      primary_link: { type: DataTypes.STRING(500), allowNull: true },
      secondary_label: { type: DataTypes.STRING(60), allowNull: true },
      secondary_link: { type: DataTypes.STRING(500), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('slides', ['is_active', 'sort_order'], { name: 'slides_active_order' });
  }

  const [[{ n }]] = await qi.sequelize.query('SELECT COUNT(*) AS n FROM slides');
  if (Number(n) === 0) {
    const now = new Date();
    await qi.bulkInsert(
      'slides',
      INITIAL_SLIDES.map((s, i) => ({ ...s, sort_order: i + 1, is_active: true, created_at: now, updated_at: now }))
    );
  }
}

export async function down({ context: qi }) {
  await qi.dropTable('slides');
}
