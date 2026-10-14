/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */
import { CourseCatalog } from "./course-catalog";
import { MentorshipSlider } from "./mentorship-slider";
import { getPublicTeam } from "@/lib/queries/team";

export const revalidate = 300;

const PRICING = [
  {
    title: "K–8 Tutoring",
    subtitle: "Elementary & Middle School",
    price: 25,
    header: "foundation",
    features: ["All K–8 subjects", "Homework & study skills support", "Foundation building"],
  },
  {
    title: "9–12 Courses",
    subtitle: "Regular & Honors High School Classes",
    price: 30,
    header: "standard",
    features: ["All non-AP/IB classes", "Homework & exam review", "Foundation through advanced"],
  },
  {
    title: "Test Prep & AP/IB",
    subtitle: "SAT, AP/IB & Entrance Exams",
    price: 35,
    header: "testprep",
    features: ["SAT, ACT & AP/IB exam prep", "BCA / Bergen Tech entrance exam", "Targeted strategies & practice"],
  },
  {
    title: "Specialized",
    subtitle: "Engineering, Competition Math & College Consulting",
    price: 60,
    header: "premium",
    featured: true,
    features: ["Engineering tutoring", "Competition math (AMC, AIME)", "College consulting & essays"],
  },
];

const TICKER = [
  ["AP Calculus AB", "AP Calculus BC", "AP Statistics", "Algebra 1 & 2", "Geometry", "Precalculus", "AP Biology", "AP Chemistry", "AP Physics", "Middle school math"],
  ["AP English Language", "AP English Literature", "AP U.S. History", "AP World History", "AP Psychology", "SAT", "ACT", "AP Music Theory", "College essays"],
  ["Middle school science", "Essay writing", "Test prep", "BCA exam prep", "AP Computer Science", "Python", "Java"],
];

export default async function HomePage() {
  const team = await getPublicTeam();

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
              <li><a href="/login">Log in</a></li>
              <li><a href="/get-started" className="btn-nav">Book Now</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section id="hero">
          <div className="container hero-content">
            <p className="hero-brand">Bergen County Learns</p>
            <h1>Achieve Your Academic Goals with Confidence</h1>
            <p className="hero-sub">
              Expert tutoring and consulting from highly <br />
              qualified students at the <strong>Bergen County Academies</strong>. <br />
              We&apos;ve been where you are, and know how to help you succeed.
            </p>
            <a href="/get-started" className="btn-primary">Book Now</a>
          </div>
        </section>

        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">1500+</div>
                <div className="stat-label">All tutors scored at least 1500 on the SAT</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">40+</div>
                <div className="stat-label">Course offerings across all subjects</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10+</div>
                <div className="stat-label">A network of more than 10 experienced tutors and consultants</div>
              </div>
            </div>
          </div>
        </section>

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
                  <p>
                    We tutor <strong>K–12 students</strong> across humanities, STEM, music, computer
                    science, and more. From building middle school foundations to mastering advanced
                    coursework, we break down complex concepts into clear, manageable steps.
                  </p>
                </div>
              </article>

              <div className="course-ticker" aria-hidden="true">
                {TICKER.map((row, i) => (
                  <div className="course-ticker-row" key={i}>
                    <div className={`course-ticker-track course-ticker-track--${i + 1}`}>
                      {[...row, ...row].map((name, j) => (
                        <span key={j}>{name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

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
                  <p>
                    Prepare for the <strong>SAT</strong>, <strong>PSAT</strong>, <strong>ACT</strong>,{" "}
                    <strong>AP</strong>, and <strong>IB</strong> exams with tutors who understand the
                    material <em>and</em> the test. We&apos;ve earned 5s on AP exams in our teaching
                    subjects, so we know what it takes to perform under pressure.
                  </p>
                </div>
              </article>
            </div>

            <MentorshipSlider />
          </div>
        </section>

        <section id="catalog">
          <div className="container">
            <div className="catalog-header">
              <h2 className="catalog-title">Course Catalog</h2>
              <p className="catalog-subtitle">
                Browse our full course catalog below—over 65 courses from elementary school through AP
                and IB. Use the search to find exactly what you need.
              </p>
            </div>
            <CourseCatalog />
          </div>
        </section>

        <section id="about">
          <div className="container">
            <h2 className="section-title">Meet The Team</h2>
            <div className="tutor-card about-card">
              <p className="tutor-bio">
                We are <strong>high school seniors</strong> from <strong>Bergen County Academies</strong>{" "}
                who have spent years tutoring through the National Honor Society. We believe in making
                complex concepts accessible through patience, clear explanations, and genuine enthusiasm
                for helping students succeed.
              </p>
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
                We&apos;d love to meet you. Tell us a little about your student and what you&apos;re
                looking for, or shoot us a text at{" "}
                <a href="tel:+12019517942" className="schedule-phone">(201) 951-7942</a>. We&apos;ll
                reach out within 24–48 hours to match you with a tutor.
              </p>
              <div className="booking-cta">
                <ol className="booking-steps">
                  <li><span>1</span>Tell us about your student</li>
                  <li><span>2</span>We match you with a tutor</li>
                  <li><span>3</span>Get your family portal and start learning</li>
                </ol>
                <a href="/get-started" className="btn-primary">Start onboarding</a>
                <p className="booking-apply">
                  Are you a BCA student who wants to tutor? <a href="/apply">Apply to join the team</a>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="container">
            <h2 className="section-title">Pricing</h2>
            <div className="pricing-grid">
              {PRICING.map((p) => (
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
      </main>

      <footer>
        <div className="container footer-content">
          <p>&copy; {new Date().getFullYear()} Bergen County Learns. All rights reserved.</p>
          <p>
            Bergen County Learns is a network of tutors, not a business. We are not affiliated with the
            Bergen County Academies.
          </p>
          <p>
            Contact: <a href="mailto:contact.bclearns@gmail.com">contact.bclearns@gmail.com | 201-951-7942</a>
          </p>
          <p>
            <a href="/login">Tutor &amp; family login</a> · <a href="/apply">Become a tutor</a>
          </p>
        </div>
      </footer>
    </>
  );
}
