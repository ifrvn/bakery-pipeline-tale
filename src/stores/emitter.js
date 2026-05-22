import { defineStore } from 'pinia'

export const useEmitterStore = defineStore('emitter', {
  state: () => ({
    listeners: new Set(),
  }),
  actions: {
    emit(payload) {
      this.listeners.forEach((cb) => cb(payload))
    },
    on(cb) {
      this.listeners.add(cb)
      return () => this.listeners.delete(cb)
    },
  },
})
