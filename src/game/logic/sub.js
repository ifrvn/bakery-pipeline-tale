/**
 * SUB 指令：丢弃小人手中持有的原料（废料处理）
 */
export async function runSub(ctx) {
  const worker = ctx.worker;

  if (!worker.state.carrying) {
    ctx.setFail('手里没有原料，无法 SUB');
    return false;
  }

  const dropped = worker.drop();
  dropped?.gfx?.destroy?.();

  ctx.updateState({ carryingName: '' });
  return true;
}
