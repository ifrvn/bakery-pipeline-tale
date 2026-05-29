/**
 * JUMP 指令：跳转到程序中的指定行（1-based）
 * 返回 { jumpTo: 0-based index }，由 play() 循环处理跳转
 */
export function runJump(_ctx, op) {
  const target = op?.target ?? 1;
  return { jumpTo: target - 1 }; // 转换为 0-based 索引
}
