/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */
import type { ReactNode } from "react";
import { CourseCatalog } from "./course-catalog";
import { MentorshipSlider } from "./mentorship-slider";
import { getSiteContent } from "@/lib/queries/site";
import { getPublicTeam } from "@/lib/queries/team";

export const revalidate = 300;

function formatInline(text: string) {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] != null) nodes.push(<strong key={i++}>{match[1]}</strong>);
    else nodes.push(<em key={i++}>{match[2]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function Formatted({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <p className={className}>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {formatInline(line)}
        </span>
      ))}
    </p>
  );
}

export default async function HomePage() {
  const [site, autoTeam] = await Promise.all([getSiteContent(), getPublicTeam()]);
  const team = site.customTutors && site.tutors.length ? site.tutors : autoTeam;
  const ticker = site.ticker
    .map((row) => row.split(",").map((name) => name.trim()).filter(Boolean))
    .filter((row) => row.length > 0);

  return (
    <>
      <header>
        <div className="container nav-container">
          <a href="#" className="logo">
            BCLearns
          </a>
          <nav>
            <ul>
              <li><a href="#services">What We Offer</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="/get-started" className="btn-nav">Book Now</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section id="hero">
          <div className="container hero-content">
            <p className="hero-brand">{site.heroBrand}</p>
            <h1>{site.heroTitle}</h1>
            <Formatted text={site.heroSubtitle} className="hero-sub" />
            <a href="/get-started" className="btn-primary">Book Now</a>
          </div>
        </section>

        {site.stats.length ? (
          <section className="stats-section">
            <div className="container">
              <div className="stats-grid">
                {site.stats.map((stat) => (
                  <div className="stat-item" key={`${stat.value}-${stat.label}`}>
                    <div className="stat-number">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="services">
          <div className="container">
            <h2 className="section-title">What We Offer</h2>
            <div className="offer-blocks">
              <article className="offer-block">
                <div className="offer-block-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop"
                    alt=""
                    width={600}
                    height={400}
                  />
                </div>
                <div className="offer-block-content">
                  <h3 className="offer-block-title">Academic Tutoring</h3>
                  <Formatted text={site.tutoringBlurb} />
                </div>
              </article>

              {ticker.length ? (
                <div className="course-ticker" aria-hidden="true">
                  {ticker.map((row, i) => (
                    <div className="course-ticker-row" key={i}>
                      <div className={`course-ticker-track course-ticker-track--${(i % 3) + 1}`}>
                        {[...row, ...row].map((name, j) => (
                          <span key={j}>{name}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <article className="offer-block offer-block--reverse">
                <div className="offer-block-img-wrap">
                  <img
                    src="https://plus.unsplash.com/premium_photo-1681248156496-550d1ad34c65?q=80&w=1470&auto=format&fit=crop"
                    alt=""
                    width={600}
                    height={400}
                  />
                </div>
                <div className="offer-block-content">
                  <h3 className="offer-block-title">Test Prep</h3>
                  <Formatted text={site.testPrepBlurb} />
                </div>
              </article>
            </div>

            <MentorshipSlider slides={site.mentorship} />
          </div>
        </section>

        <section id="catalog">
          <div className="container">
            <div className="catalog-header">
              <h2 className="catalog-title">Course Catalog</h2>
              <p className="catalog-subtitle">{site.catalogSubtitle}</p>
            </div>
            <CourseCatalog groups={site.catalog} collegeNote={site.collegeNote} />
          </div>
        </section>

        <section id="about">
          <div className="container">
            <h2 className="section-title">Meet The Team</h2>
            <div className="tutor-card about-card">
              <Formatted text={site.aboutBlurb} className="tutor-bio" />
            </div>
            <div className="tutors-grid">
              {team.map((t) => (
                <div className="tutor-card" key={t.name}>
                  {t.photo ? (
                    <img src={t.photo} alt={t.name} className="tutor-img" />
                  ) : (
                    <div className="tutor-img-placeholder">Photo</div>
                  )}
                  <h3>{t.name}</h3>
                  <p className="tutor-role">{t.role}</p>
                  <p className="tutor-bio">{t.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="scheduling">
          <div className="container">
            <h2 className="section-title">Book a Session</h2>
            <div id="first-time-booking" className="schedule-option schedule-option--new">
              <div className="schedule-option-header">
                <span className="schedule-option-badge">New to us</span>
                <h3 className="schedule-option-title">Get started</h3>
              </div>
              <p className="schedule-option-desc">
                Tell us about your student and we&apos;ll match you with a tutor. Questions? Email{" "}
                <a href="mailto:hello@bclearns.com" className="schedule-phone">hello@bclearns.com</a>.
              </p>
              <div className="booking-cta">
                <a href="/get-started" className="btn-primary">Book Now</a>
              </div>
            </div>
          </div>
        </section>

        {site.pricing.length ? (
        <section id="pricing">
          <div className="container">
            <h2 className="section-title">Pricing</h2>
            <div className="pricing-grid">
              {site.pricing.map((p) => (
                <div className={`pricing-card${p.featured ? " pricing-card--featured" : ""}`} key={p.title}>
                  <div className={`pricing-card-header pricing-card-header--${p.header}`}>
                    <h3 className="pricing-card-title">{p.title}</h3>
                    <p className="pricing-card-subtitle">{p.subtitle}</p>
                  </div>
                  <div className="pricing-card-body">
                    <div className="pricing-amount">
                      <span className="pricing-dollar">$</span>
                      <span className="pricing-value">{p.price}</span>
                      <span className="pricing-period">/hr</span>
                    </div>
                    <ul className="pricing-features">
                      {p.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <a
                      href="/get-started"
                      className={`pricing-cta${p.featured ? " pricing-cta--featured" : ""}`}
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        ) : null}
      </main>

      <footer>
        <div className="container footer-content">
          <p>&copy; {new Date().getFullYear()} Bergen County Learns. All rights reserved.</p>
          <p>
            Bergen County Learns is a network of tutors, not a business. We are not affiliated with the
            Bergen County Academies.
          </p>
          <p>
            Contact: <a href="mailto:hello@bclearns.com">hello@bclearns.com</a>
          </p>
          <p className="footer-admin">
            <a href="/login">Admin</a>
          </p>
        </div>
      </footer>
    </>
  );
}
