import { useEffect, useState } from 'react';
import { getContent } from '../api/client.js';

// Content rarely changes during a visit, so cache each section's request.
const cache = new Map();

function load(section) {
  if (!cache.has(section)) {
    cache.set(
      section,
      getContent(section).catch((err) => {
        cache.delete(section);
        throw err;
      })
    );
  }
  return cache.get(section);
}

export function useContent(section) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    load(section)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
  }, [section]);

  return state;
}
