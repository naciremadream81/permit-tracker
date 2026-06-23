export type Region = "central" | "south" | "southeast" | "southwest";

export interface County {
  id: string;
  name: string;
  region: Region;
  portalUrl?: string;
}

export type PermitType =
  | "residential_building"
  | "electrical"
  | "hvac"
  | "mobile_home"
  | "modular_home"
  | "shed";

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  residential_building: "Residential Building",
  electrical: "Electrical",
  hvac: "HVAC / Mechanical",
  mobile_home: "Mobile Home",
  modular_home: "Modular Home",
  shed: "Shed / Accessory Structure",
};

export type PackageStatus =
  | "preparing" // assembling the package, not yet submitted
  | "submitted" // delivered to the county, awaiting intake
  | "in_review" // county plan review underway
  | "corrections" // county issued comments; action needed
  | "resubmitted" // corrections answered, back with the county
  | "approved" // permit issued
  | "closed"; // finaled / archived

export const STATUS_LABELS: Record<PackageStatus, string> = {
  preparing: "Preparing",
  submitted: "Submitted",
  in_review: "In Review",
  corrections: "Corrections",
  resubmitted: "Resubmitted",
  approved: "Approved",
  closed: "Closed",
};

/** Statuses where the ball is in the expeditor's court. */
export const ACTION_STATUSES: PackageStatus[] = ["preparing", "corrections"];

export interface Attachment {
  /** Also the key of the blob in IndexedDB. */
  id: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string; // ISO
}

export interface ChecklistItem {
  id: string;
  label: string;
  /** Optional clarifying note, e.g. "Required when job value exceeds $5,000". */
  note?: string;
  done: boolean;
  attachments: Attachment[];
}

export interface ChecklistTemplateItem {
  id: string;
  label: string;
  note?: string;
}

export interface ChecklistTemplate {
  permitType: PermitType;
  items: ChecklistTemplateItem[];
}

export interface Contractor {
  name: string;
  /** State license number, e.g. CGC1512345, EC13004821, CAC1813456, IH-1025413. */
  license?: string;
  phone?: string;
}

export interface Subcontractor extends Contractor {
  id: string;
  /** Trade, e.g. "Electrical", "Plumbing", "HVAC", "Roofing". */
  trade: string;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  license?: string;
  phone?: string;
  /** Trades this contractor is known for, e.g. ["Electrical"]. Empty for general contractors. */
  trades: string[];
}

/** Parcel record pulled from the Florida statewide cadastral layer (DOR tax roll). */
export interface PropertyInfo {
  parcelId: string;
  owner: string;
  siteAddress: string;
  city: string;
  zip: string;
  /** DOR use code, e.g. "01" single family. */
  useCode: string;
  useLabel: string;
  yearBuilt?: number;
  /** Just (market) value from the tax roll, in dollars. */
  justValue?: number;
  legal?: string;
  /** ISO timestamp of when this was fetched. */
  fetchedAt: string;
  source: "fl-statewide-cadastral";
}

export interface ActivityEntry {
  id: string;
  date: string; // ISO
  text: string;
}

export interface PermitPackage {
  id: string;
  /** e.g. "PKG-2026-0142" */
  reference: string;
  client: string;
  projectAddress: string;
  countyId: string;
  permitType: PermitType;
  status: PackageStatus;
  /** ISO date the package was created in the tracker. */
  createdAt: string;
  /** ISO date of submission to the county, if submitted. */
  submittedAt?: string;
  /** ISO date of the next hard deadline (corrections due, expiry, etc.). */
  deadline?: string;
  /** What the deadline is for, e.g. "Corrections due". */
  deadlineLabel?: string;
  /** Main (prime) contractor pulling the permit. */
  contractor?: Contractor;
  /** Parcel data looked up from the property appraiser roll. */
  property?: PropertyInfo;
  subcontractors: Subcontractor[];
  checklist: ChecklistItem[];
  activity: ActivityEntry[];
  notes?: string;
}

export interface NewPackageInput {
  client: string;
  projectAddress: string;
  countyId: string;
  permitType: PermitType;
  contractor?: Contractor;
  deadline?: string;
  deadlineLabel?: string;
}
