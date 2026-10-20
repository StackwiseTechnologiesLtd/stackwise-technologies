const SIDEBAR_STORAGE_KEY = "stackwise-admin-sidebar-collapsed";

let collapsed = false;
const listeners = new Set<() => void>();

function readFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

if (typeof window !== "undefined") {
  collapsed = readFromStorage();
}

export function subscribeAdminSidebar(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAdminSidebarCollapsed(): boolean {
  return collapsed;
}

export function getAdminSidebarCollapsedServerSnapshot(): boolean {
  return false;
}

export function setAdminSidebarCollapsed(next: boolean): void {
  collapsed = next;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((listener) => listener());
}
