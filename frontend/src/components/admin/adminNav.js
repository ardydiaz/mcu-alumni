// Admin sidebar. `superAdminOnly` items are hidden from Administrators (routes are guarded too).
export const adminNav = [
  {
    group: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: 'compass', end: true }],
  },
  {
    group: 'Website content',
    items: [
      { label: 'Homepage slider', to: '/admin/slides', icon: 'image' },
      { label: 'Categories', to: '/admin/categories', icon: 'tag' },
      { label: 'Scholars', to: '/admin/scholars', icon: 'award' },
      { label: 'Networks', to: '/admin/networks', icon: 'users' },
      { label: 'Partners', to: '/admin/partners', icon: 'handshake' },
      { label: 'Projects', to: '/admin/projects', icon: 'building' },
      { label: 'Reports', to: '/admin/reports', icon: 'file' },
    ],
  },
  {
    group: 'Submissions',
    items: [
      { label: 'Donations', to: '/admin/donations', icon: 'heart' },
      { label: 'Alumni records', to: '/admin/alumni', icon: 'id' },
      { label: 'Graduate tracer', to: '/admin/tracer', icon: 'rocket' },
      { label: 'Volunteers', to: '/admin/volunteers', icon: 'mic' },
      { label: 'Messages', to: '/admin/messages', icon: 'mail' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'Users', to: '/admin/users', icon: 'users', superAdminOnly: true },
      { label: 'Roles', to: '/admin/roles', icon: 'shield', superAdminOnly: true },
      { label: 'Logs', to: '/admin/logs', icon: 'clock', superAdminOnly: true },
    ],
  },
];
