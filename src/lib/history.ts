import { SearchHistoryItem } from './types';

const STORAGE_KEY = 'netscope_search_history';
const MAX_HISTORY = 10;

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSearchHistory(query: string, type: 'dns' | 'ip', summary?: string): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getSearchHistory();
    const cleanQuery = query.trim().toLowerCase();
    
    // Remove if already exists with same query and type to move to front
    const filtered = current.filter((item) => !(item.query.toLowerCase() === cleanQuery && item.type === type));

    const newItem: SearchHistoryItem = {
      id: `${type}-${cleanQuery}-${Date.now()}`,
      query: cleanQuery,
      type,
      timestamp: Date.now(),
      summary,
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteHistoryItem(id: string): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getSearchHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }
}
