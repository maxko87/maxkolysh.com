import { useEffect } from 'react';
import { useCalculator } from './useCalculator';
import { useDebounce } from './useDebounce';
import { updateHash, loadStateFromHash } from '../utils/stateCompression';

export function useUrlState() {
  const { state, dispatch } = useCalculator();

  // Debounced URL update (2 seconds)
  const debouncedUpdateHash = useDebounce(() => {
    updateHash(state);
  }, 2000);

  // Update URL when state changes
  useEffect(() => {
    debouncedUpdateHash();
  }, [state, debouncedUpdateHash]);

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
