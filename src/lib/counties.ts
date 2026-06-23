import type { County, Region } from "./types";

export const REGION_LABELS: Record<Region, string> = {
  central: "Central Florida",
  south: "South Florida",
  southeast: "Southeast Florida",
  southwest: "Southwest Florida",
};

export const COUNTIES: County[] = [
  // Central
  { id: "orange", name: "Orange", region: "central" },
  { id: "osceola", name: "Osceola", region: "central" },
  { id: "seminole", name: "Seminole", region: "central" },
  { id: "lake", name: "Lake", region: "central" },
  { id: "polk", name: "Polk", region: "central" },
  { id: "volusia", name: "Volusia", region: "central" },
  { id: "brevard", name: "Brevard", region: "central" },
  { id: "sumter", name: "Sumter", region: "central" },
  { id: "marion", name: "Marion", region: "central" },
  { id: "hillsborough", name: "Hillsborough", region: "central" },
  { id: "pinellas", name: "Pinellas", region: "central" },
  { id: "pasco", name: "Pasco", region: "central" },
  // South
  { id: "miami-dade", name: "Miami-Dade", region: "south" },
  { id: "monroe", name: "Monroe", region: "south" },
  // Southeast
  { id: "broward", name: "Broward", region: "southeast" },
  { id: "palm-beach", name: "Palm Beach", region: "southeast" },
  { id: "martin", name: "Martin", region: "southeast" },
  { id: "st-lucie", name: "St. Lucie", region: "southeast" },
  { id: "indian-river", name: "Indian River", region: "southeast" },
  { id: "okeechobee", name: "Okeechobee", region: "southeast" },
  // Southwest
  { id: "lee", name: "Lee", region: "southwest" },
  { id: "collier", name: "Collier", region: "southwest" },
  { id: "charlotte", name: "Charlotte", region: "southwest" },
  { id: "sarasota", name: "Sarasota", region: "southwest" },
  { id: "manatee", name: "Manatee", region: "southwest" },
  { id: "desoto", name: "DeSoto", region: "southwest" },
  { id: "hendry", name: "Hendry", region: "southwest" },
  { id: "glades", name: "Glades", region: "southwest" },
];

export function countyById(id: string): County | undefined {
  return COUNTIES.find((c) => c.id === id);
}
