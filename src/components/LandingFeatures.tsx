"use client";

import { Layers, ClipboardList, CheckSquare, AlarmClock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const FEATURES = [
  {
    icon: Layers,
    title: "Grouped by who has the ball",
    body: "Action needed, with the county, and closed: see what needs you first, not a flat spreadsheet.",
    lead: true,
    wide: false,
  },
  {
    icon: ClipboardList,
    title: "County-ready checklists",
    body: "Residential building, electrical, HVAC, mobile home, modular, and shed packages seed the standard document list for each permit type.",
    lead: false,
    wide: false,
  },
  {
    icon: CheckSquare,
    title: "Batch status when the portal moves",
    body: "Select packages on the portfolio view, move them forward together, and undo if you mis-clicked.",
    lead: false,
    wide: false,
  },
  {
    icon: AlarmClock,
    title: "Deadline tracking across the portfolio",
    body: "Flag items due soon without opening each file. Overdue and upcoming deadlines surface at the top of every session.",
    lead: false,
    wide: true,
  },
] as const;

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function LandingFeatures() {
  const reduce = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="landing-features"
      aria-labelledby="landing-features-title"
    >
      <motion.div
        className="landing-features-intro"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h2 id="landing-features-title">Built for the morning sweep</h2>
        <p>
          Open Meridian, see what needs attention today, and act without the
          cognitive overhead of scattered threads and county logins.
        </p>
      </motion.div>

      <div className="landing-feature-grid">
        {FEATURES.map(({ icon: Icon, title, body, lead, wide }, i) => (
          <motion.div
            key={title}
            className={[
              "landing-feature-card",
              lead && "landing-feature-card--lead",
              wide && "landing-feature-card--wide",
            ]
              .filter(Boolean)
              .join(" ")}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.55, delay: i * 0.06, ease: EASE }}
          >
            <span className="landing-feature-icon" aria-hidden>
              <Icon size={18} strokeWidth={2} />
            </span>
            <div className="landing-feature-text">
              <h3>{title}</h3>
              <p>{body}</p>
            </div>

            {lead && (
              <div className="landing-feature-lead-visual" aria-hidden>
                <div className="landing-feature-lead-row">
                  <span className="status-pill status-corrections">Corrections</span>
                  <span className="landing-feature-lead-count tnum">2 packages</span>
                </div>
                <div className="landing-feature-lead-row">
                  <span className="status-pill status-review">In review</span>
                  <span className="landing-feature-lead-count tnum">3 packages</span>
                </div>
                <div className="landing-feature-lead-row">
                  <span className="status-pill status-approved">Approved</span>
                  <span className="landing-feature-lead-count tnum">8 packages</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
