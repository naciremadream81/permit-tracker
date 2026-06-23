import type { ChecklistTemplate, PermitType } from "./types";

/**
 * Standard permit package checklists for Florida counties.
 *
 * These are the DEFAULT templates seeded on first run. Edits made in the
 * Checklists screen are persisted by the repository and take precedence;
 * this file is only the factory baseline and the "restore defaults" source.
 */
export const STANDARD_CHECKLISTS: Record<PermitType, ChecklistTemplate> = {
  residential_building: {
    permitType: "residential_building",
    items: [
      { id: "rb-app", label: "Completed permit application (signed & notarized)" },
      { id: "rb-noc", label: "Notice of Commencement (recorded)", note: "Required when job value exceeds $5,000" },
      { id: "rb-plans", label: "Two sets of signed & sealed construction plans" },
      { id: "rb-site", label: "Site plan / survey with setbacks" },
      { id: "rb-energy", label: "Energy calculations (Form R405)" },
      { id: "rb-wind", label: "Wind load design data (per FBC & county wind zone)" },
      { id: "rb-truss", label: "Truss engineering package (signed & sealed)" },
      { id: "rb-product", label: "Florida Product Approvals / Miami-Dade NOAs", note: "Windows, doors, roofing, shutters" },
      { id: "rb-license", label: "Contractor license & certificate of insurance" },
      { id: "rb-wc", label: "Workers' comp certificate or exemption" },
      { id: "rb-septic", label: "Septic permit or sewer availability letter", note: "If applicable" },
      { id: "rb-flood", label: "Flood zone / elevation certificate", note: "If in a flood zone" },
    ],
  },
  electrical: {
    permitType: "electrical",
    items: [
      { id: "el-app", label: "Completed electrical permit application" },
      { id: "el-load", label: "Electrical load calculations" },
      { id: "el-riser", label: "Riser diagram / one-line diagram" },
      { id: "el-noc", label: "Notice of Commencement (recorded)", note: "Required when job value exceeds $5,000" },
      { id: "el-license", label: "EC license & certificate of insurance" },
      { id: "el-wc", label: "Workers' comp certificate or exemption" },
      { id: "el-power", label: "Utility / power company coordination letter", note: "Service changes & new services" },
    ],
  },
  hvac: {
    permitType: "hvac",
    items: [
      { id: "hv-app", label: "Completed mechanical permit application" },
      { id: "hv-manualj", label: "Manual J load calculation" },
      { id: "hv-equip", label: "Equipment specifications (AHRI certificate)" },
      { id: "hv-duct", label: "Duct layout / duct sizing (Manual D)", note: "New or modified duct systems" },
      { id: "hv-energy", label: "Energy form (R405) for change-outs where required" },
      { id: "hv-noc", label: "Notice of Commencement (recorded)", note: "Required when job value exceeds $15,000 (HVAC repair/replacement threshold)" },
      { id: "hv-license", label: "CAC/CMC license & certificate of insurance" },
      { id: "hv-wc", label: "Workers' comp certificate or exemption" },
    ],
  },
  mobile_home: {
    permitType: "mobile_home",
    items: [
      { id: "mh-app", label: "Completed mobile home installation permit application" },
      { id: "mh-installer", label: "Licensed installer (IH#) & decal information" },
      { id: "mh-hud", label: "HUD label numbers / data plate copy" },
      { id: "mh-site", label: "Site plan with setbacks & home placement" },
      { id: "mh-tiedown", label: "Blocking & tie-down specification (per 15C-1)" },
      { id: "mh-septic", label: "Septic permit or sewer availability letter" },
      { id: "mh-power", label: "Electrical service / power pole permit", note: "Often a separate electrical permit" },
      { id: "mh-zoning", label: "Zoning approval / mobile home park approval" },
      { id: "mh-noc", label: "Notice of Commencement (recorded)", note: "Required when job value exceeds $5,000" },
    ],
  },
  modular_home: {
    permitType: "modular_home",
    items: [
      { id: "md-app", label: "Completed building permit application" },
      { id: "md-dbpr", label: "DBPR-approved plans with Florida insignia" },
      { id: "md-found", label: "Foundation plans (signed & sealed, site-specific)" },
      { id: "md-site", label: "Site plan / survey with setbacks" },
      { id: "md-wind", label: "Wind zone compliance documentation" },
      { id: "md-energy", label: "Energy calculations (Form R405)" },
      { id: "md-septic", label: "Septic permit or sewer availability letter" },
      { id: "md-license", label: "Contractor license & certificate of insurance" },
      { id: "md-noc", label: "Notice of Commencement (recorded)", note: "Required when job value exceeds $5,000" },
    ],
  },
  shed: {
    permitType: "shed",
    items: [
      { id: "sh-app", label: "Completed permit application" },
      { id: "sh-site", label: "Site plan with setbacks & shed location" },
      { id: "sh-anchor", label: "Anchoring / tie-down specification" },
      { id: "sh-eng", label: "Engineered drawings or Florida Product Approval", note: "Pre-fab sheds: manufacturer's FL approval number" },
      { id: "sh-zoning", label: "Zoning / HOA compliance check", note: "Size and placement limits vary by county" },
      { id: "sh-elec", label: "Electrical permit if shed is powered", note: "Separate permit in most counties" },
    ],
  },
};
