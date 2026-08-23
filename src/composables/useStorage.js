export function useStorage() {
  function get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch { return defaultValue }
  }
  function set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) { console.error('localStorage set failed:', e) }
  }
  function remove(key) {
    try { localStorage.removeItem(key) } catch (e) { console.error('localStorage remove failed:', e) }
  }
  function clear() {
    try { localStorage.clear() } catch (e) { console.error('localStorage clear failed:', e) }
  }
  return { get, set, remove, clear }
}
