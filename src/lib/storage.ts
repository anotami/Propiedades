import { AppData } from '../types';
import { initialData } from './initialData';

const STORAGE_KEY = 'propiedades_data';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = { ...initialData, lastUpdated: new Date().toISOString() };
      saveData(data);
      return data;
    }
    const parsed = JSON.parse(raw) as AppData;
    return parsed;
  } catch {
    const data = { ...initialData, lastUpdated: new Date().toISOString() };
    saveData(data);
    return data;
  }
}

export function saveData(data: AppData): void {
  const toSave: AppData = { ...data, lastUpdated: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function exportData(): string {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): AppData {
  const parsed = JSON.parse(json) as AppData;
  if (!parsed.properties || !parsed.transactions || !parsed.vencimientos) {
    throw new Error('Formato de datos inválido');
  }
  saveData(parsed);
  return parsed;
}

export function resetData(): AppData {
  const data = { ...initialData, lastUpdated: new Date().toISOString() };
  saveData(data);
  return data;
}
