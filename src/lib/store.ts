import { load } from '@tauri-apps/plugin-store';

let store: any = null;

export const initStore = async () => {
  if (!store) {
    store = await load('settings.json');
  }
  return store;
};
