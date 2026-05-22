export async function runInbox(ctx) {
  const worker = ctx.worker
  const inboxBelt = ctx.inboxBelt

  if (worker.state.carrying) {
    ctx.setFail('手里已经拿着东西了，无法继续 INBOX')
    return false
  }
  if (inboxBelt.state.items.length === 0) {
    ctx.setFail('输入传送带已经空了，无法继续 INBOX')
    return false
  }

  const pickup = inboxBelt.getPickupPoint({ x: 0, y: 0 })
  await ctx.moveWorkerTo({ x: pickup.x - 0.1, y: pickup.y })

  const taken = inboxBelt.takeNext()
  if (!taken) {
    ctx.setFail('输入传送带已经空了，无法继续 INBOX')
    return false
  }

  worker.pick(taken)
  ctx.updateState({
    carryingName: taken.item.name,
    inboxCount: inboxBelt.state.items.length,
  })
  return true
}
