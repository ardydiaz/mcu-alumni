// Icon per giving campaign (by slug); used on the homepage and the Give page.
export const campaignIcons = {
  'lrc-auditorium': 'building',
  scholarship: 'award',
  athletics: 'trophy',
  'education-research': 'book',
  community: 'handshake',
  mission: 'flag',
};

export const campaignIcon = (slug) => campaignIcons[slug] || 'heart';
