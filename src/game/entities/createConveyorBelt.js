import { Container, Graphics } from 'pixi.js'

function lerp(a, b, t) {
  return a + (b - a) * t
}

export function createConveyorBelt(options) {
  const width = options?.width ?? 0.9
  const depth = options?.depth ?? 4.2
  const color = options?.color ?? 0x56311b
  const itemCapacity = options?.itemCapacity ?? 6
  const railColor = options?.railColor ?? 0x2a2a2a

  const container = new Container()

  const base = new Graphics()
  base.rect(-width / 2, -depth / 2, width, depth, 0.12)
      .fill({color})
  container.addChild(base)

  const rails = new Graphics()
  rails.rect(-width / 2, -depth / 2 - 0.08, width, 0.08)
       .rect(-width / 2, depth / 2, width, 0.08)
       .fill({ color: railColor })
  container.addChild(rails)

  const itemsContainer = new Container()
  container.addChild(itemsContainer)

  const slots = []
  const padding = 0.35
  for (let i = 0; i < itemCapacity; i += 1) {
    const t = itemCapacity === 1 ? 0.5 : i / (itemCapacity - 1)
    const y = lerp(-depth / 2 + padding, depth / 2 - padding, t)
    slots.push({ x: 0, y })
  }

  const state = {
    items: [],
    sprites: [],
    x: 0,
    y: 0,
  }

  function setPosition(x, y) {
    state.x = x
    state.y = y
    container.position.set(x, y)
  }

  function layout() {
    state.sprites.forEach((gfx, idx) => {
      const p = slots[Math.min(idx, slots.length - 1)] ?? { x: 0, y: 0 }
      gfx.position.set(p.x, p.y)
    })
  }

  function createItemGfx(item) {
    const gfx = new Graphics()
    gfx.roundRect(-0.18, -0.18, 0.36, 0.36).fill({ color: item.color ?? 0xffffff, alpha: 1 })
    return gfx
  }

  function setItems(items) {
    clear()
    items.forEach((item) => {
      state.items.push(item)
      const gfx = createItemGfx(item)
      state.sprites.push(gfx)
      itemsContainer.addChild(gfx)
    })
    layout()
  }

  function clear() {
    state.sprites.forEach((g) => g.destroy({ children: true }))
    state.items = []
    state.sprites = []
    itemsContainer.removeChildren()
  }

  function takeNext() {
    if (state.items.length === 0) return null
    const item = state.items.shift()
    const gfx = state.sprites.shift()
    if (gfx) itemsContainer.removeChild(gfx)
    layout()
    return { item, gfx }
  }

  function put(taken) {
    if (state.items.length >= itemCapacity) return false
    state.items.push(taken.item)
    state.sprites.push(taken.gfx)
    itemsContainer.addChild(taken.gfx)
    layout()
    return true
  }

  function getPickupPoint(target = { x: 0, y: 0 }) {
    const p = slots[0] ?? { x: 0, y: 0 }
    target.x = state.x + p.x + width / 2 + 0.65
    target.y = state.y + p.y
    return target
  }

  function getDropPoint(target = { x: 0, y: 0 }) {
    const idx = Math.min(state.items.length, slots.length - 1)
    const p = slots[idx] ?? { x: 0, y: 0 }
    target.x = state.x + p.x - width / 2 - 0.65
    target.y = state.y + p.y
    return target
  }

  function getItemSlots() {
    return state.items.map((item, idx) => {
      const p = slots[Math.min(idx, slots.length - 1)] ?? { x: 0, y: 0 }
      return {
        item,
        x: state.x + p.x,
        y: state.y + p.y,
      }
    })
  }

  return {
    state,
    container,
    setPosition,
    setItems,
    takeNext,
    put,
    getPickupPoint,
    getDropPoint,
    getItemSlots,
    dispose: () => container.destroy({ children: true }),
  }
}
