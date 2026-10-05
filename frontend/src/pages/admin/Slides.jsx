import ResourcePage from '../../components/admin/ResourcePage.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import { Truncate } from '../../components/admin/cells.jsx';
import { assetUrl } from '../../api/client.js';

// Homepage hero slider. Slides show in "Display order" (lowest first); hidden slides stay saved.
function SlideThumb({ slide }) {
  return (
    <div className="slide-thumb">
      <img src={assetUrl(slide.image)} alt="" loading="lazy" />
      <span className="slide-thumb__text">
        <strong>{slide.title}</strong>
        {slide.eyebrow && <small>{slide.eyebrow}</small>}
      </span>
    </div>
  );
}

const buttonText = (label, link) => (label ? `${label} → ${link}` : null);

export default function Slides() {
  return (
    <ResourcePage
      title="Homepage slider"
      description="The large rotating banner at the top of the homepage. Slides appear in display order; hide a slide to take it off the homepage without deleting it."
      endpoint="/slides"
      entityLabel="slide"
      searchPlaceholder="Search slides"
      columns={[
        { key: 'sortOrder', label: 'Order', className: 'num' },
        { key: 'slide', label: 'Slide', render: (r) => <SlideThumb slide={r} /> },
        { key: 'subtitle', label: 'Text', render: (r) => <Truncate text={r.subtitle} max={70} /> },
        {
          key: 'buttons',
          label: 'Buttons',
          render: (r) =>
            [buttonText(r.primaryLabel, r.primaryLink), buttonText(r.secondaryLabel, r.secondaryLink)].filter(Boolean).join(' · ') || '—',
        },
        { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} on="Showing" off="Hidden" /> },
      ]}
      filters={[{ name: 'isActive', label: 'Status', options: [{ value: 'true', label: 'Showing' }, { value: 'false', label: 'Hidden' }] }]}
      initialValues={{ isActive: true, sortOrder: 0 }}
      fields={[
        {
          name: 'image',
          label: 'Background image',
          type: 'image',
          required: true,
          hint: 'Wide landscape photo, at least 1600 × 900 px (JPG, PNG or WEBP, up to 5 MB). The text sits on the left, so photos with a calmer, darker left side read best.',
        },
        { name: 'eyebrow', label: 'Small heading', placeholder: 'Manila Central University Alumni', span: 2 },
        { name: 'title', label: 'Title', required: true, placeholder: 'Join the 50,000+ Centralino graduates worldwide!', span: 2 },
        { name: 'subtitle', label: 'Text', type: 'textarea', placeholder: 'Connect with your fellow Centralinos from all over the world.' },
        { name: 'primaryLabel', label: 'Main button text', placeholder: 'Stay Connected' },
        { name: 'primaryLink', label: 'Main button link', placeholder: '/alumni-contact-update', hint: 'A page like /give, or a full https:// link' },
        { name: 'secondaryLabel', label: 'Second button text (optional)', placeholder: 'Get Alumni ID' },
        { name: 'secondaryLink', label: 'Second button link', placeholder: '/alumni-contact-update#alumni-id' },
        { name: 'sortOrder', label: 'Display order', type: 'number', hint: 'Lower numbers show first' },
        { name: 'isActive', label: 'Show on the homepage', type: 'checkbox' },
      ]}
    />
  );
}
