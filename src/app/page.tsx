import { AlarmClock, MapPin } from "lucide-react";
import { LandingCta } from "@/components/LandingCta";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFeatures } from "@/components/LandingFeatures";
import { HeroParticles } from "@/components/HeroParticles";
import "./landing.css";

const COUNTIES = ["Lee", "Collier", "Charlotte", "Sarasota", "Hendry", "Glades"];
const PERMIT_TYPES = ["Residential", "Electrical", "HVAC", "Mobile home", "Modular", "Shed"];

export default function LandingPage() {
  return (
    <div className="landing">
      <LandingHeader />

      <div className="landing-hero-band">
        <HeroParticles />
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-copy">
            <span className="landing-badge">For Florida permit expeditors</span>
            <h1 id="landing-hero-title">Permit logic.<br />Not paperwork.</h1>
            <p className="landing-lead">
              One workspace for tracking submissions, status, checklists,
              contractors, and deadlines across Southwest Florida counties.
            </p>
            <div className="landing-hero-actions">
              <LandingCta className="btn-primary landing-cta-lg" />
              <a href="#how-it-works" className="btn-secondary landing-cta-lg">
                See how it works
              </a>
            </div>
          </div>

          <div className="landing-preview" aria-hidden>
            <div className="landing-preview-win">
              <div className="landing-preview-dots">
                <span /><span /><span />
              </div>
              <span className="landing-preview-label">Packages</span>
              <span className="landing-preview-meta tnum">7 · 2 need you</span>
            </div>
            <div className="landing-preview-alert">
              <AlarmClock size={14} strokeWidth={2} />
              <span>
                <strong>Gulf Coast Builders</strong>
                Plan review · Due in 2 days
              </span>
            </div>
            <ul className="pkg-list landing-preview-pkg-list">
              <li className="pkg-list-item">
                <div className="pkg-row">
                  <div className="pkg-row-main">
                    <div className="pkg-row-top">
                      <span className="pkg-client">Gulf Coast Builders</span>
                      <span className="status-pill status-corrections">Corrections</span>
                    </div>
                    <div className="pkg-row-sub">
                      <span className="pkg-ref">RES-2241</span>
                      <span>Lee County</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="pkg-list-item">
                <div className="pkg-row">
                  <div className="pkg-row-main">
                    <div className="pkg-row-top">
                      <span className="pkg-client">Harbor View LLC</span>
                      <span className="status-pill status-review">In review</span>
                    </div>
                    <div className="pkg-row-sub">
                      <span className="pkg-ref">ELEC-1099</span>
                      <span>Collier County</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="pkg-list-item">
                <div className="pkg-row">
                  <div className="pkg-row-main">
                    <div className="pkg-row-top">
                      <span className="pkg-client">Sunrise Modular</span>
                      <span className="status-pill status-approved">Approved</span>
                    </div>
                    <div className="pkg-row-sub">
                      <span className="pkg-ref">MOD-0344</span>
                      <span>Charlotte County</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <LandingFeatures />

      <section className="landing-scope" aria-labelledby="landing-scope-title">
        <div className="landing-scope-copy">
          <h2 id="landing-scope-title">Florida counties, one workspace</h2>
          <p>
            Track packages across Southwest Florida and beyond. Filter by permit
            type, county, and status as the portfolio grows.
          </p>
        </div>
        <div className="landing-scope-data">
          <div className="landing-scope-group">
            <p className="landing-scope-label">
              <MapPin size={12} strokeWidth={2} aria-hidden />
              Active counties
            </p>
            <p className="landing-scope-counties">
              {COUNTIES.join(", ")}
            </p>
          </div>
          <div className="landing-scope-group">
            <p className="landing-scope-label">Permit types</p>
            <div className="landing-scope-types">
              {PERMIT_TYPES.map((t) => (
                <span key={t} className="landing-scope-type">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="landing-close-band">
        <section className="landing-close" aria-labelledby="landing-close-title">
          <h2 id="landing-close-title">Your permits deserve one source of truth</h2>
          <p>Dependable, precise, and calm. The way expeditors actually work.</p>
          <LandingCta className="btn-primary landing-cta-lg" />
        </section>
      </div>

      <footer className="landing-footer">
        <p>Meridian · Permit Package Tracker</p>
      </footer>
    </div>
  );
}
