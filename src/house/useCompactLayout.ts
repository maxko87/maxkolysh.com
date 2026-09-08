import { useEffect, useState } from 'react';

// Keep in sync with mobile.css, including phones held sideways.
export const compactQuery = '(max-width: 900px), (max-height: 500px) and (pointer: coarse)';

export function useCompactLayout() {
  const [compact, setCompact] = useState(() => window.matchMedia?.(compactQuery).matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.(compactQuery);
    if (!query) return;
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return compact;
}
