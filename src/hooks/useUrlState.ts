import { useEffect, useRef } from 'react';
import { useCalculator } from './useCalculator';
import { useDebounce } from './useDebounce';
import { updateHash, loadStateFromHash } from '../utils/stateCompression';

export function useUrlState() {
  const { state, dispatch } = useCalculator();
  const hasUserMadeChanges = useRef(false);
  const isInitialMount = useRef(true);

  // Debounced URL update (2 seconds)
  const debouncedUpdateHash = useDebounce(() => {
    if (hasUserMadeChanges.current) {
      updateHash(state);
    }
  }, 2000);

  // Update URL when state changes (but only after user has made changes)
  useEffect(() => {
    // Skip the initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Mark that user has made changes
    hasUserMadeChanges.current = true;
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
