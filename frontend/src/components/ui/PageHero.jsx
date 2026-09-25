export default function PageHero({ eyebrow, title, subtitle, image, children }) {
  return (
    <section className="page-hero" style={image ? { '--hero-image': `url("${image}")` } : undefined}>
      <div className="container page-hero__inner">
        {eyebrow && <span className="eyebrow eyebrow--light">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children && <div className="page-hero__actions">{children}</div>}
      </div>
    </section>
  );
}
