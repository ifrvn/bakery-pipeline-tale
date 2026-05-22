import { Container, Graphics } from 'pixi.js';

export function createWorker() {
  let moveResolve = null;
  const container = new Container();

  const body = new Graphics();
  body.circle(0, 0, 0.25).fill({ color: 0xffffff, alpha: 1 });
  container.addChild(body);

  const eyes = new Graphics();
  eyes.circle(-0.07, -0.05, 0.03).circle(0.07, -0.05, 0.03).fill({ color: 0x111827, alpha: 1 });
  container.addChild(eyes);

  const carry = new Container();
  carry.position.set(0, -0.55);
  container.addChild(carry);

  const state = {
    x: 0,
    y: 0,
    carrying: null,
    moving: false,
    moveFrom: { x: 0, y: 0 },
    moveTo: { x: 0, y: 0 },
    moveElapsed: 0,
    moveDuration: 0,
  };

  function setPosition(x, y) {
    state.x = x;
    state.y = y;
    container.position.set(x, y);
  }

  function moveTo(target, duration = 0.55) {
    state.moving = true;
    state.moveFrom = { x: state.x, y: state.y };
    state.moveTo = { x: target.x, y: target.y };
    state.moveElapsed = 0;
    state.moveDuration = Math.max(0.01, duration);
    return new Promise((resolve) => {
      moveResolve = resolve;
    });
  }

  function update(dt) {
    if (!state.moving) return false;
    state.moveElapsed += dt;
    const t = Math.min(1, state.moveElapsed / state.moveDuration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    state.x = state.moveFrom.x + (state.moveTo.x - state.moveFrom.x) * ease;
    state.y = state.moveFrom.y + (state.moveTo.y - state.moveFrom.y) * ease;
    container.position.set(state.x, state.y);
    if (t >= 1) {
      state.moving = false;
      const resolve = moveResolve;
      moveResolve = null;
      resolve?.();
      return true;
    }
    return false;
  }

  function pick(item) {
    if (!item) return;
    state.carrying = item;
    if (item.gfx) {
      carry.addChild(item.gfx);
      item.gfx.position.set(0, 0);
    }
  }

  function drop() {
    const item = state.carrying;
    if (!item) return null;
    if (item.gfx) carry.removeChild(item.gfx);
    state.carrying = null;
    return item;
  }

  return {
    state,
    container,
    setPosition,
    moveTo,
    update,
    pick,
    drop,
    dispose: () => container.destroy({ children: true }),
  };
}
