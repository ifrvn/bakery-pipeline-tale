import { Container, Graphics } from 'pixi.js'
import { createConveyorBelt } from '../entities/createConveyorBelt'
import { createWorker } from '../entities/createWorker'
import { createEmitter } from '../core/createEmitter'
import { OP } from '../levelConfigs'
import { getLevelConfigsById } from '../levelConfigs'

// 创建收发室场景
function createMailroomView(app, options) {
  const roomWidth = options.roomWidth
  const roomDepth = options.roomDepth
  const beltDepth = options.beltDepth
  const beltWidth = options.beltWidth
  const beltCapacity = options.beltCapacity
  const inboxX = options.inboxX
  const outboxX = options.outboxX
  const beltY = options.beltY
  const beltColor = options.beltColor

  const root = new Container()
  const world = new Container()
  root.addChild(world)
  app.stage.addChild(root)

  function updateViewSize(width, height) {
    const margin = 48
    const usableW = Math.max(1, width - margin * 2)
    const usableH = Math.max(1, height - margin * 2)
    const scale = Math.min(usableW / roomWidth, usableH / roomDepth)
    world.scale.set(scale)
    world.position.set(width / 2, height / 2)
  }

  const background = new Graphics()
  background.roundRect(-roomWidth / 2, -roomDepth / 2, roomWidth, roomDepth, 0.35)
  background.fill({ color: 0xf3e6d3, alpha: 1 })
  world.addChild(background)

  const inboxBelt = createConveyorBelt({
    width: beltWidth,
    depth: beltDepth,
    color: beltColor,
    itemCapacity: beltCapacity,
  })
  inboxBelt.setPosition(inboxX, beltY)
  world.addChild(inboxBelt.container)

  const outboxBelt = createConveyorBelt({
    width: beltWidth,
    depth: beltDepth,
    color: beltColor,
    itemCapacity: beltCapacity,
  })
  outboxBelt.setPosition(outboxX, beltY)
  world.addChild(outboxBelt.container)

  const worker = createWorker()
  worker.setPosition(0, 0)
  world.addChild(worker.container)

  function setSize(width, height) {
    updateViewSize(width, height)
  }

  function dispose() {
    inboxBelt.dispose()
    outboxBelt.dispose()
    worker.dispose()
    app.stage.removeChild(root)
    root.destroy({ children: true })
  }

  return {
    root,
    world,
    inboxBelt,
    outboxBelt,
    worker,
    setSize,
    dispose,
  }
}

// 创建收发室运行器
function createMailroomRunner(options) {
  const emitter = options.emitter
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

  async function doInbox() {
    if (worker.state.carrying) {
      setFail('手里已经拿着东西了，无法继续 INBOX')
      return false
    }
    if (inboxBelt.state.items.length === 0) {
      setFail('输入传送带已经空了，无法继续 INBOX')
      return false
    }

    const pickup = inboxBelt.getPickupPoint({ x: 0, y: 0 })
    await moveWorkerTo({ x: pickup.x - 0.1, y: pickup.y })

    const taken = inboxBelt.takeNext()
    if (!taken) {
      setFail('输入传送带已经空了，无法继续 INBOX')
      return false
    }

    worker.pick(taken)
    updateState({
      carryingName: taken.item.name,
      inboxCount: inboxBelt.state.items.length,
    })
    return true
  }

  async function doOutbox() {
    if (!worker.state.carrying) {
      setFail('手里没有原料，无法 OUTBOX')
      return false
    }

    const drop = outboxBelt.getDropPoint({ x: 0, y: 0 })
    await moveWorkerTo({ x: drop.x + 0.1, y: drop.y })

    const taken = worker.drop()
    if (!taken) {
      setFail('手里没有原料，无法 OUTBOX')
      return false
    }

    const ok = outboxBelt.put(taken)
    if (!ok) {
      taken.gfx?.destroy?.()
      setFail('输出传送带已满，无法继续 OUTBOX')
      return false
    }

    updateState({
      carryingName: '',
      outboxCount: outboxBelt.state.items.length,
    })
    return true
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

    setSuccess('恭喜通关！')
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
      if (op === OP.INBOX.title) {
        const ok = await doInbox()
        if (!ok) return
      } else if (op === OP.OUTBOX.title) {
        const ok = await doOutbox()
        if (!ok) return
      } else {
        setFail(`未知指令：${op}`)
        return
      }
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

export function createMailroomScene(ctx, levelId) {
  const roomWidth = 8
  const roomDepth = 8

  const beltDepth = 5.2
  const beltWidth = 0.5
  const beltCapacity = 10

  const inboxX = -1.5
  const outboxX = 1.0
  const beltY = 0
  const moveDuration = 0.55

  const config = getLevelConfigsById(levelId)
  const inboxItems = config?.inboxItems ?? []
  const expectedOutCount = inboxItems.length
  const availableOps = config?.availableOps

  const emitter = createEmitter()
  const view = createMailroomView(ctx.app, {
    roomWidth,
    roomDepth,
    beltDepth,
    beltWidth,
    beltCapacity,
    inboxX,
    outboxX,
    beltY,
    beltColor: 0xb37d4a,
  })

  view.setSize(ctx.width, ctx.height)

  return createMailroomRunner({
    config,
    emitter,
    view,
    inboxItems,
    expectedOutCount,
    availableOps,
    moveDuration,
  })
}
