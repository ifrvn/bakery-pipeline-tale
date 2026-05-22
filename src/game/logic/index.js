import { OP } from '../levelConfigs'
import { useEmitterStore } from '@/stores/emitter'
import { runInbox } from './inbox'
import { runOutbox } from './outbox'

export function createGameRunner(options) {
  const emitter = useEmitterStore()
  const config = options.config
  const view = options.view
  const inboxItems = options.inboxItems
  const expectedOutCount = options.expectedOutCount
  const availableOps = options.availableOps
  const moveDuration = options.moveDuration

  const inboxBelt = view.inboxBelt
  const outboxBelt = view.outboxBelt
  const worker = view.worker

  const state = {
    status: 'idle',
    pointer: -1,
    result: '',
    message: '',
    expectedOutCount,
    inboxCount: expectedOutCount,
    outboxCount: 0,
    carryingName: '',
  }

  function updateState(partial) {
    Object.assign(state, partial)
    emitter.emit({ ...state })
  }

  function setFail(message) {
    updateState({
      status: 'finished',
      result: 'fail',
      message,
      pointer: -1,
      carryingName: worker.state.carrying?.item?.name ?? '',
      inboxCount: inboxBelt.state.items.length,
      outboxCount: outboxBelt.state.items.length,
    })
  }

  function setSuccess(message) {
    updateState({
      status: 'finished',
      result: 'success',
      message,
      pointer: -1,
      carryingName: '',
      inboxCount: 0,
      outboxCount: expectedOutCount,
    })
  }

  function moveWorkerTo(target, duration = moveDuration) {
    return worker.moveTo(target, duration)
  }

  const runnerCtx = {
    state,
    config,
    view,
    inboxItems,
    expectedOutCount,
    availableOps,
    inboxBelt,
    outboxBelt,
    worker,
    updateState,
    setFail,
    setSuccess,
    moveWorkerTo,
  }

  function reset() {
    updateState({
      status: 'idle',
      pointer: -1,
      result: '',
      message: '',
      inboxCount: expectedOutCount,
      outboxCount: 0,
      carryingName: '',
    })

    if (worker.state.carrying) {
      const dropped = worker.drop()
      dropped?.gfx?.destroy?.()
    }
    inboxBelt.setItems(inboxItems)
    outboxBelt.setItems([])
    worker.setPosition(0, 0)
  }

  function evaluateAfterRun() {
    const inboxRemaining = inboxBelt.state.items.length
    const outCount = outboxBelt.state.items.length
    const holding = Boolean(worker.state.carrying)

    if (inboxRemaining > 0 || holding || outCount !== expectedOutCount) {
      const holdingText = holding ? '，手里还有 1 个' : ''
      setFail(`播放结束但仍有原料未处理（输入剩余 ${inboxRemaining} 个${holdingText}）。`)
      return
    }

    setSuccess(config?.successMessage ?? '恭喜通关！')
  }

  const handlers = {
    [OP.INBOX.title]: runInbox,
    [OP.OUTBOX.title]: runOutbox,
  }

  async function play(programOps) {
    if (state.status !== 'idle') return
    if (!Array.isArray(programOps) || programOps.length === 0) return

    updateState({
      status: 'running',
      pointer: 0,
      result: '',
      message: '',
    })

    for (let i = 0; i < programOps.length; i += 1) {
      updateState({ pointer: i })
      const op = programOps[i]
      const fn = handlers[op]
      if (!fn) {
        setFail(`未知指令：${op}`)
        return
      }
      const ok = await fn(runnerCtx)
      if (!ok) return
    }

    evaluateAfterRun()
  }

  reset()

  function setSize(width, height) {
    view.setSize(width, height, {
      inboxCount: state.inboxCount,
      outboxCount: state.outboxCount,
      expectedOutCount,
    })
  }

  function update(dt) {
    worker.update(dt)
  }

  function dispose() {
    view.dispose()
  }

  const api = {
    availableOps,
    onStateChange: emitter.on,
    getState: () => ({ ...state }),
    reset,
    play,
  }

  return {
    setSize,
    update,
    dispose,
    api,
  }
}
