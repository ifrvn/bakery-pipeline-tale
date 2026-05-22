export function createEmitter() {
  const listeners = new Set();

  function emit(payload) {
    listeners.forEach((cb) => cb(payload));
  }

  function on(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  return { emit, on };
}
