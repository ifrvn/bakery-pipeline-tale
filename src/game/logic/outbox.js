export async function runOutbox(ctx) {
  const worker = ctx.worker
  const outboxBelt = ctx.outboxBelt

  if (!worker.state.carrying) {
    ctx.setFail('手里没有原料，无法 OUTBOX')
    return false
  }

  const drop = outboxBelt.getDropPoint({ x: 0, y: 0 })
  await ctx.moveWorkerTo({ x: drop.x + 0.1, y: drop.y })

  const taken = worker.drop()
  if (!taken) {
    ctx.setFail('手里没有原料，无法 OUTBOX')
    return false
  }

  const ok = outboxBelt.put(taken)
  if (!ok) {
    taken.gfx?.destroy?.()
    ctx.setFail('输出传送带已满，无法继续 OUTBOX')
    return false
  }

  ctx.updateState({
    carryingName: '',
    outboxCount: outboxBelt.state.items.length,
  })
  return true
}
