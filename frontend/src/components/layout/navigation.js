export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Give', to: '/give' },
  { label: 'Support-a-Centralino', to: '/support-a-centralino' },
  { label: 'Campus Development', to: '/campus-development' },
  { label: 'Volunteer', to: '/volunteer' },
  {
    label: 'Partners',
    children: [
      { label: 'Merchant Partners', to: '/merchant-partners', description: 'Exclusive alumni discounts and perks' },
      { label: 'Industry Partners', to: '/industry-partners', description: 'Organizations that hire Centralinos' },
    ],
  },
  { label: 'Events', to: '/events' },
  { label: 'Networks', to: '/networks' },
  { label: 'Transparency Reports', to: '/transparency-reports' },
];

// The header account menu (one "Alumni Portal" button). Updating information and the Graduate Tracer need a
// portal account, so they live here instead of a separate "Update Your Info" menu.
export const portalMenu = [
  { label: 'Dashboard', to: '/portal/account', icon: 'compass', description: 'Your account at a glance' },
  { label: 'My profile', to: '/portal/profile', icon: 'users', description: 'Update your information' },
  { label: 'Graduate Tracer', to: '/portal/graduate-tracer', icon: 'file', description: 'Tell us where your journey has taken you' },
  { label: 'Alumni ID', to: '/portal/alumni-id', icon: 'id', description: 'Request your MCU Alumni ID' },
];

// Footer "Alumni Portal" column. The update / tracer links ask visitors to log in first.
export const portalFooter = [
  { label: 'Log in', to: '/portal/login' },
  { label: 'Create an account', to: '/portal/register' },
  { label: 'Update your information', to: '/alumni-contact-update' },
  { label: 'Graduate Tracer', to: '/graduate-tracer' },
];
