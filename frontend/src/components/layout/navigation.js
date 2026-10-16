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

export const updateInfo = [
  { label: 'Alumni Contact Update', to: '/alumni-contact-update', description: 'Keep your details current and get your Alumni ID' },
  { label: 'Graduate Tracer', to: '/graduate-tracer', description: 'Tell us where your MCU journey has taken you' },
];
