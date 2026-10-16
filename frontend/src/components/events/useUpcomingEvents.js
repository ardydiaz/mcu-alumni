import { useEffect, useState } from 'react';
import { getEvents } from '../../api/client.js';

// The next few events that haven't ended yet (homepage strip, portal dashboard).
export function useUpcomingEvents(limit = 3) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    getEvents({ upcoming: true, limit })
      .then((res) => active && setState({ data: res.data, loading: false, error: null }))
      .catch((error) => active && setState({ data: [], loading: false, error }));
    return () => {
      active = false;
    };
  }, [limit]);
  return state;
}
