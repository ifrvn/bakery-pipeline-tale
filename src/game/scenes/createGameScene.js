import { Container, Graphics } from 'pixi.js'
import { createConveyorBelt } from '../entities/createConveyorBelt'
import { createWorker } from '../entities/createWorker'
import { getLevelConfigsById } from '../levelConfigs'
import { createGameRunner } from '../logic'

// 创建收发室场景
function createGameView(app, options) {
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

export function createGameScene(ctx, levelId) {
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

  const view = createGameView(ctx.app, {
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

  return createGameRunner({
    config,
    view,
    inboxItems,
    expectedOutCount,
    availableOps,
    moveDuration,
  })
}
