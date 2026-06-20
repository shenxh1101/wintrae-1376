import Taro from '@tarojs/taro';

const STORAGE_KEY = 'illustrator_app_store';

interface PersistConfig {
  key?: string;
  whitelist?: string[];
}

export const persistMiddleware = (config: PersistConfig = {}) => {
  const storageKey = config.key || STORAGE_KEY;
  const whitelist = config.whitelist;

  return (configurer) => (set, get, api) => {
    const loadedState = loadFromStorage(storageKey);

    const setState = (partial, replace) => {
      set(partial, replace);
      const state = get();
      const toPersist = whitelist
        ? whitelist.reduce((acc, key) => {
            acc[key] = state[key];
            return acc;
          }, {})
        : state;
      saveToStorage(storageKey, toPersist);
    };

    if (loadedState && Object.keys(loadedState).length > 0) {
      set(loadedState, false);
    }

    return configurer(setState, get, api);
  };
};

const loadFromStorage = (key: string): any => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
    return null;
  } catch (e) {
    console.warn('[persist] Failed to load from storage:', e);
    return null;
  }
};

const saveToStorage = (key: string, value: any): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[persist] Failed to save to storage:', e);
  }
};

export const clearPersistedStore = (key: string = STORAGE_KEY): void => {
  try {
    Taro.removeStorageSync(key);
  } catch (e) {
    console.warn('[persist] Failed to clear storage:', e);
  }
};
