import {
  AlarmClock,
  CheckSquare,
  ClipboardList,
  Layers,
  MapPin,
} from "lucide-react";
import { LandingCta } from "@/components/LandingCta";
import { LandingHeader } from "@/components/LandingHeader";
import "./landing.css";

const FEATURES = [
  {
    icon: Layers,
    title: "Grouped by who has the ball",
    body: "Action needed, with the county, and closed — so you see what needs you first, not a flat spreadsheet.",
  },
  {
    icon: ClipboardList,
    title: "County-ready checklists",
    body: "Residential building, electrical, HVAC, mobile home, modular, and shed packages seed the standard document list for each permit type.",
  },
  {
    icon: CheckSquare,
    title: "Batch status when the portal moves",
    body: "Select packages on the portfolio view, move them forward together, and undo if you mis-clicked.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="landing">
      <LandingHeader />

      <div className="landing-hero-band">
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">For Florida permit expeditors</p>
          <h1 id="landing-hero-title">Every permit package. One calm view.</h1>
          <p className="landing-lead">
            Meridian is the portfolio instrument for tracking submissions across
            counties — status, checklists, contractors, and deadlines without
            digging through email and municipal portals.
          </p>
          <div className="landing-hero-actions">
            <LandingCta className="btn-primary landing-cta-lg" />
            <a href="#how-it-works" className="btn-secondary landing-cta-lg">
              See how it works
            </a>
          </div>
        </div>

        <div className="landing-preview" aria-hidden>
          <div className="landing-preview-chrome">
            <span className="landing-preview-label">Packages</span>
            <span className="landing-preview-meta tnum">7 · 2 need you</span>
          </div>
          <div className="landing-preview-strip">
            <AlarmClock size={14} strokeWidth={2} />
            <span>
              <strong>Gulf Coast Builders</strong>
              <span className="landing-preview-deadline tnum">Plan review · Due in 2 days</span>
            </span>
          </div>
          <ul className="landing-preview-list">
            <li>
              <span className="landing-preview-client">Gulf Coast Builders</span>
              <span className="landing-preview-pill landing-preview-pill--action">Corrections</span>
            </li>
            <li>
              <span className="landing-preview-client">Harbor View LLC</span>
              <span className="landing-preview-pill landing-preview-pill--wait">In review</span>
            </li>
            <li>
              <span className="landing-preview-client">Sunrise Modular</span>
              <span className="landing-preview-pill landing-preview-pill--wait">Submitted</span>
            </li>
          </ul>
        </div>
      </section>
      </div>

      <section
        id="how-it-works"
        className="landing-features"
        aria-labelledby="landing-features-title"
      >
        <div className="landing-features-intro">
          <h2 id="landing-features-title">Built for the morning sweep</h2>
          <p>
            Open Meridian, see what needs attention today, and act — without the
            cognitive overhead of scattered threads and county logins.
          </p>
        </div>
        <ol className="landing-feature-list">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="landing-feature-item">
              <span className="landing-feature-icon" aria-hidden>
                <Icon size={18} strokeWidth={2} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-scope" aria-labelledby="landing-scope-title">
        <div className="landing-scope-copy">
          <h2 id="landing-scope-title">Florida counties, one workspace</h2>
          <p>
            Track packages across Southwest Florida and beyond — Lee, Collier,
            Charlotte, and the counties you work every week. Filter by permit
            type, county, and status when the portfolio grows.
          </p>
        </div>
        <p className="landing-scope-note">
          <MapPin size={15} strokeWidth={2} aria-hidden />
          Residential building, electrical, HVAC, mobile home, modular home, and
          shed permits — each with its own checklist template.
        </p>
      </section>

      <section className="landing-close" aria-labelledby="landing-close-title">
        <h2 id="landing-close-title">Your permits deserve one source of truth</h2>
        <p>Dependable, precise, calm — the way expeditors actually work.</p>
        <LandingCta className="btn-primary landing-cta-lg" />
      </section>

      <footer className="landing-footer">
        <p>Meridian · Permit Package Tracker</p>
      </footer>
    </div>
  );
}
