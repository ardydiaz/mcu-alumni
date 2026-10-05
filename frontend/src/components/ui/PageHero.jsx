// Page banner.
//   overlay="soft"  photos with the MCU purple tint baked in: light left-side shade only (500px tall)
//   variant="glass" 500px banner with the text on a frosted-glass panel, for photos where people
//                   or details sit behind the text (same look as the homepage slider)
export default function PageHero({ eyebrow, title, subtitle, image, overlay, variant, imagePosition, children }) {
  const glass = variant === 'glass';
  const className = ['page-hero', overlay === 'soft' && 'page-hero--soft', glass && 'page-hero--glass'].filter(Boolean).join(' ');
  const style = {
    ...(image && { '--hero-image': `url("${image}")` }),
    ...(imagePosition && { '--hero-position': imagePosition }),
  };

  const content = (
    <>
      {eyebrow && <span className="eyebrow eyebrow--light">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {children && <div className="page-hero__actions">{children}</div>}
    </>
  );

  return (
    <section className={className} style={style}>
      <div className="container page-hero__inner">
        {glass ? <div className="page-hero__panel">{content}</div> : content}
      </div>
    </section>
  );
}
