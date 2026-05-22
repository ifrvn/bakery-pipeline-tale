import { useEmitterStore } from '@/stores/emitter'

const emitter = useEmitterStore()

export function updateState(partial) {
    Object.assign(state, partial)
    emitter.emit({ ...state })
  }