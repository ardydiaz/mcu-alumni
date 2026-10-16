import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Philippine Standard Geographic Code (PSGC) lists from the Philippine Statistics Authority,
// stored in src/data/psgc (built from psgc.gitlab.io). Loaded once, on first use.
// Cities without a province (all of Metro Manila and a few independent cities) hang off a
// placeholder "province" whose code is "R" + the region code.
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/psgc');
let data = null;

function load() {
  if (data) return data;
  const read = (name) => JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), 'utf8'));
  const regions = read('regions');
  const provinces = read('provinces');
  const cities = read('cities');
  const barangays = read('barangays'); // { cityCode: [[code, name], ...] }
  const index = (list) => new Map(list.map((x) => [x.code, x]));
  data = { regions, provinces, cities, barangays, byCode: { region: index(regions), province: index(provinces), city: index(cities) } };
  return data;
}

export const psgc = {
  regions: () => load().regions.map(({ code, name, label }) => ({ code, name: label ? `${label} - ${name}` : name })),
  provinces: (regionCode) => load().provinces.filter((p) => p.regionCode === regionCode).map(({ code, name }) => ({ code, name })),
  cities: (provinceCode) => load().cities.filter((c) => c.provinceCode === provinceCode).map(({ code, name }) => ({ code, name })),
  barangays: (cityCode) => (load().barangays[cityCode] || []).map(([code, name]) => ({ code, name })),

  // Names for the chosen codes, checked to belong together (barangay in city, city in province, ...).
  // Returns null when a code is unknown or does not match its parent.
  resolve({ regionCode, provinceCode, cityCode, barangayCode }) {
    const d = load();
    const region = d.byCode.region.get(regionCode);
    const province = d.byCode.province.get(provinceCode);
    const city = d.byCode.city.get(cityCode);
    if (!region || !province || !city || province.regionCode !== region.code || city.provinceCode !== province.code) return null;
    const barangay = barangayCode ? (d.barangays[city.code] || []).find(([code]) => code === barangayCode) : null;
    if (barangayCode && !barangay) return null;
    return {
      region: region.label ? `${region.label} - ${region.name}` : region.name,
      province: province.name,
      city: city.name,
      barangay: barangay ? barangay[1] : null,
    };
  },
};
