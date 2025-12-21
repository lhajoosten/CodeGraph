import { EventObject, Store } from '@xstate/store';
import { StoreContext } from 'node_modules/@xstate/store/dist/declarations/src/types';

export const getInitialContext = <T extends object>(
  storageKey: string,
  keys: readonly (keyof T)[]
): Partial<T> | null => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      const output: Partial<T> = {};

      for (const key of keys) {
        if (parsed[key] === undefined) {
          continue;
        }

        output[key] = parsed[key];
      }

      // Only return if we have at least one valid key
      if (Object.keys(output).length > 0) {
        return output;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    return null;
  }
};

export const statePersist = <
  T extends StoreContext,
  TEvent extends EventObject,
  TEmitted extends EventObject,
>(
  storageKey: string,
  store: Store<T, TEvent, TEmitted>,
  keys: readonly (keyof T)[]
) => {
  // Subscribe to store changes and persist theme
  store.subscribe((snapshot) => {
    try {
      const valueToSave = keys.reduce((acc, key) => ({ ...acc, [key]: snapshot.context[key] }), {});

      localStorage.setItem(storageKey, JSON.stringify(valueToSave));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  });
};
