import { useEffect } from 'react';
import { useCalculator } from './useCalculator';
import { loadStateFromHash } from '../utils/stateCompression';

export function useUrlState() {
  const { dispatch } = useCalculator();

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const loadedState = loadStateFromHash();
      if (loadedState) {
        dispatch({ type: 'SET_STATE', payload: loadedState });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [dispatch]);
}
