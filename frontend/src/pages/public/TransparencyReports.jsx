import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { assetUrl } from '../../api/client.js';

export default function TransparencyReports() {
  const info = useContent('transparency');
  const years = useContent('transparency-reports');

  return (
    <>
      <PageHero
        eyebrow="Transparency Reports"
        title="Accountability in every gift"
        subtitle="Monthly reports of the donations received by Manila Central University."
      />

      <section className="section">
        <div className="container narrow">
          <AsyncContent state={info} skeleton={2}>
            {(data) => (
              <>
                <p className="lead">{data.intro}</p>
                <div className="grid grid-2 mt-md">
                  <div className="card info-card"><Icon name="calendar" /> <p>{data.schedule}</p></div>
                  <div className="card info-card"><Icon name="shield" /> <p>{data.retention}</p></div>
                </div>
              </>
            )}
          </AsyncContent>

          <div className="mt-lg">
            <AsyncContent state={years} skeleton={3}>
              {(groups) =>
                groups.length ? (
                  <div className="accordion">
                    {groups.map((y, i) => (
                      <details key={y.schoolYear} className="accordion__item" open={i === 0}>
                        <summary>
                          <span>{y.schoolYear}</span>
                          <Icon name="chevronDown" />
                        </summary>
                        <div className="accordion__body">
                          <ul className="report-list">
                            {y.reports.map((r) => (
                              <li key={r.id}>
                                <a href={assetUrl(r.fileUrl)} target="_blank" rel="noreferrer">
                                  <Icon name="file" /> {r.title} <Icon name="external" size={15} />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="empty">Reports will be posted here once they are published.</p>
                )
              }
            </AsyncContent>
          </div>
        </div>
      </section>
    </>
  );
}
