const SIDEBAR_KEY = 'ptm.ui.sidebarCollapsed';

export function getSidebarCollapsed() {
  try {
    const value = window.localStorage.getItem(SIDEBAR_KEY);
    if (value === null) {
      return false;
    }
    return value === 'true';
  } catch {
    return false;
  }
}

export function setSidebarCollapsed(value) {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, value ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}
