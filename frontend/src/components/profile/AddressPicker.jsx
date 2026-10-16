import { useEffect, useId, useState } from 'react';
import { getPsgc } from '../../api/client.js';

// Cascading Region -> Province -> City/Municipality -> Barangay dropdowns (PSGC).
// `value` holds the codes; choosing a level clears the levels below it.
function Select({ label, value, options, onChange, disabled, error, required, placeholder }) {
  const id = useId();
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label} {required && <span className="req" aria-hidden="true">*</span>}</label>
      <select id={id} value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} aria-invalid={Boolean(error)}>
        <option value="">{disabled ? '—' : placeholder}</option>
        {options.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
      {error && <small className="field__error">{error}</small>}
    </div>
  );
}

function useList(path) {
  const [list, setList] = useState([]);
  useEffect(() => {
    let active = true;
    if (!path) return setList([]);
    getPsgc(path).then((d) => active && setList(d)).catch(() => active && setList([]));
    return () => {
      active = false;
    };
  }, [path]);
  return list;
}

export default function AddressPicker({ value, onChange, errors = {} }) {
  const regions = useList('/regions');
  const provinces = useList(value.regionCode && `/regions/${value.regionCode}/provinces`);
  const cities = useList(value.provinceCode && `/provinces/${value.provinceCode}/cities`);
  const barangays = useList(value.cityCode && `/cities/${value.cityCode}/barangays`);

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <>
      <Select label="Region" required value={value.regionCode} options={regions} placeholder="Select region…"
        onChange={(v) => set({ regionCode: v, provinceCode: '', cityCode: '', barangayCode: '' })} error={errors.regionCode} />
      <Select label="Province" required value={value.provinceCode} options={provinces} placeholder="Select province…" disabled={!value.regionCode}
        onChange={(v) => set({ provinceCode: v, cityCode: '', barangayCode: '' })} error={errors.provinceCode} />
      <Select label="City / municipality" required value={value.cityCode} options={cities} placeholder="Select city or municipality…" disabled={!value.provinceCode}
        onChange={(v) => set({ cityCode: v, barangayCode: '' })} error={errors.cityCode} />
      <Select label="Barangay" value={value.barangayCode} options={barangays} placeholder="Select barangay…" disabled={!value.cityCode}
        onChange={(v) => set({ barangayCode: v })} error={errors.barangayCode} />
    </>
  );
}
