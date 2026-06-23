import { STANDARD_CHECKLISTS } from "./standard-checklists";
import type { ChecklistItem, PermitPackage, PermitType } from "./types";

function checklistFor(type: PermitType, doneIds: string[] = []): ChecklistItem[] {
  return STANDARD_CHECKLISTS[type].items.map((item) => ({
    id: item.id,
    label: item.label,
    note: item.note,
    done: doneIds.includes(item.id),
    attachments: [],
  }));
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export const SEED_PACKAGES: PermitPackage[] = [
  {
    id: "pkg-001",
    reference: "PKG-2026-0141",
    client: "Suncoast Builders LLC",
    projectAddress: "2814 Mangrove Bend Dr, Cape Coral",
    countyId: "lee",
    permitType: "residential_building",
    status: "corrections",
    createdAt: daysFromNow(-34),
    submittedAt: daysFromNow(-21),
    deadline: daysFromNow(2),
    deadlineLabel: "Corrections due",
    contractor: { name: "Suncoast Builders LLC", license: "CGC1512345", phone: "(239) 555-0142" },
    subcontractors: [
      { id: "sub-1a", trade: "Electrical", name: "Bayline Electric", license: "EC13004821", phone: "(239) 555-0177" },
      { id: "sub-1b", trade: "Plumbing", name: "Caloosa Plumbing Co", license: "CFC1428990" },
      { id: "sub-1c", trade: "HVAC", name: "Gulfstream A/C & Heat", license: "CAC1813456", phone: "(239) 555-0198" },
    ],
    checklist: checklistFor("residential_building", [
      "rb-app", "rb-noc", "rb-plans", "rb-site", "rb-energy", "rb-wind",
      "rb-truss", "rb-product", "rb-license", "rb-wc",
    ]),
    activity: [
      { id: "a1", date: daysFromNow(-21), text: "Package submitted via Lee County eConnect" },
      { id: "a2", date: daysFromNow(-12), text: "Plan review started — structural & zoning" },
      { id: "a3", date: daysFromNow(-5), text: "Corrections issued: truss layout sheet S-3 missing engineer seal; flood elevation cert required" },
    ],
    notes: "Reviewer: M. Torres. Resubmit through eConnect, not email.",
  },
  {
    id: "pkg-002",
    reference: "PKG-2026-0145",
    client: "Gulfstream A/C & Heat",
    projectAddress: "1117 Sandpiper Ln, Naples",
    countyId: "collier",
    permitType: "hvac",
    status: "preparing",
    createdAt: daysFromNow(-3),
    deadline: daysFromNow(4),
    deadlineLabel: "Client promised submission",
    contractor: { name: "Gulfstream A/C & Heat", license: "CAC1813456", phone: "(239) 555-0198" },
    subcontractors: [],
    checklist: checklistFor("hvac", ["hv-app", "hv-equip"]),
    activity: [
      { id: "a1", date: daysFromNow(-3), text: "Package opened — 4-ton change-out, like-for-like" },
    ],
  },
  {
    id: "pkg-003",
    reference: "PKG-2026-0139",
    client: "Palm Coast Modular Homes",
    projectAddress: "455 Cypress Hollow Rd, Okeechobee",
    countyId: "okeechobee",
    permitType: "modular_home",
    status: "in_review",
    createdAt: daysFromNow(-40),
    submittedAt: daysFromNow(-15),
    contractor: { name: "Palm Coast Modular Homes", license: "CBC1265774", phone: "(863) 555-0133" },
    subcontractors: [
      { id: "sub-3a", trade: "Foundation", name: "Heartland Concrete Works", license: "CBC1259981" },
      { id: "sub-3b", trade: "Electrical", name: "Lakeport Electric", license: "EC13007455", phone: "(863) 555-0166" },
    ],
    checklist: checklistFor("modular_home", STANDARD_CHECKLISTS.modular_home.items.map((i) => i.id)),
    activity: [
      { id: "a1", date: daysFromNow(-15), text: "Submitted in person at county building department" },
      { id: "a2", date: daysFromNow(-8), text: "Intake complete, routed to plan review" },
    ],
  },
  {
    id: "pkg-004",
    reference: "PKG-2026-0134",
    client: "Hernandez Electric",
    projectAddress: "9023 Lakeview Terrace, Kissimmee",
    countyId: "osceola",
    permitType: "electrical",
    status: "resubmitted",
    createdAt: daysFromNow(-30),
    submittedAt: daysFromNow(-24),
    contractor: { name: "Hernandez Electric", license: "EC13009912", phone: "(407) 555-0150" },
    subcontractors: [],
    checklist: checklistFor("electrical", STANDARD_CHECKLISTS.electrical.items.map((i) => i.id)),
    activity: [
      { id: "a1", date: daysFromNow(-24), text: "Submitted — 200A service upgrade" },
      { id: "a2", date: daysFromNow(-10), text: "Corrections: load calc must include pool equipment" },
      { id: "a3", date: daysFromNow(-2), text: "Revised load calc resubmitted" },
    ],
  },
  {
    id: "pkg-005",
    reference: "PKG-2026-0128",
    client: "Big Lake Mobile Housing",
    projectAddress: "771 Old Grove Rd, Lakeland",
    countyId: "polk",
    permitType: "mobile_home",
    status: "approved",
    createdAt: daysFromNow(-55),
    submittedAt: daysFromNow(-41),
    contractor: { name: "Big Lake Mobile Housing", license: "IH-1025413", phone: "(863) 555-0119" },
    subcontractors: [
      { id: "sub-5a", trade: "Electrical", name: "Lakeland Power Services", license: "EC13002288" },
    ],
    checklist: checklistFor("mobile_home", STANDARD_CHECKLISTS.mobile_home.items.map((i) => i.id)),
    activity: [
      { id: "a1", date: daysFromNow(-41), text: "Submitted via Polk County online portal" },
      { id: "a2", date: daysFromNow(-20), text: "Approved — permit #BLD2026-18834 issued" },
    ],
    notes: "Tie-down inspection must be scheduled before skirting.",
  },
  {
    id: "pkg-006",
    reference: "PKG-2026-0146",
    client: "Hendry Sheds & Barns",
    projectAddress: "3302 Caloosa Estates Dr, LaBelle",
    countyId: "hendry",
    permitType: "shed",
    status: "submitted",
    createdAt: daysFromNow(-9),
    submittedAt: daysFromNow(-1),
    deadline: daysFromNow(13),
    deadlineLabel: "Follow up if no intake",
    contractor: { name: "Hendry Sheds & Barns", license: "CRC1334120", phone: "(863) 555-0188" },
    subcontractors: [],
    checklist: checklistFor("shed", STANDARD_CHECKLISTS.shed.items.map((i) => i.id)),
    activity: [
      { id: "a1", date: daysFromNow(-1), text: "Submitted — 12x24 pre-fab shed with FL approval #FL12345" },
    ],
  },
  {
    id: "pkg-007",
    reference: "PKG-2026-0143",
    client: "Atlantic Custom Homes",
    projectAddress: "688 Seagrape Ave, Port St. Lucie",
    countyId: "st-lucie",
    permitType: "residential_building",
    status: "in_review",
    createdAt: daysFromNow(-28),
    submittedAt: daysFromNow(-11),
    contractor: { name: "Atlantic Custom Homes", license: "CGC1527730", phone: "(772) 555-0124" },
    subcontractors: [
      { id: "sub-7a", trade: "Electrical", name: "Treasure Coast Electric", license: "EC13005530", phone: "(772) 555-0161" },
      { id: "sub-7b", trade: "HVAC", name: "St. Lucie Cooling", license: "CAC1819977" },
      { id: "sub-7c", trade: "Roofing", name: "Seabreeze Roofing", license: "CCC1331845", phone: "(772) 555-0173" },
    ],
    checklist: checklistFor("residential_building", STANDARD_CHECKLISTS.residential_building.items.map((i) => i.id)),
    activity: [
      { id: "a1", date: daysFromNow(-11), text: "Submitted — new SFR, 2,140 sq ft" },
      { id: "a2", date: daysFromNow(-4), text: "Zoning review passed; structural in progress" },
    ],
  },
];
