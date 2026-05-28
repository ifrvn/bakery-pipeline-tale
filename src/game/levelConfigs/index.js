import { OP } from './ops';
import { MATERIALS } from './materials';

const levelConfigs = [
  {
    level: 1,
    levelName: '基础取放',
    levelDesc: '用 inbox 从输入传送带取原料，用 outbox 把成品送出去吧！',
    inboxItems: [MATERIALS.BREAD, MATERIALS.CREAM],
    availableOps: [OP.INBOX, OP.OUTBOX],
    successMessage: '太棒了！掌握了基础取放就可以开始流水线工作啦～',
  },
  {
    level: 2,
    levelName: '循环生产',
    levelDesc: '原料变多了！用 jump 跳回第 1 步，让程序循环起来吧！',
    inboxItems: [MATERIALS.BREAD, MATERIALS.CREAM, MATERIALS.STRAWBERRY, MATERIALS.BREAD],
    availableOps: [OP.INBOX, OP.OUTBOX, OP.JUMP],
    successMessage: '完美！用循环解决重复工作，这就是编程的魔法！',
  },
  {
    level: 3,
    levelName: '废料分拣',
    levelDesc: '传送带里混入了废料！取出后用 sub 丢掉废料，用 outbox 送出良品。',
    inboxItems: [
      MATERIALS.BREAD,
      MATERIALS.SCRAP,
      MATERIALS.CREAM,
      MATERIALS.SCRAP,
    ],
    expectedOutCount: 2,
    availableOps: [OP.INBOX, OP.OUTBOX, OP.SUB, OP.JUMP],
    successMessage: '出色！学会了废料分拣，工厂品质更有保障了！',
  },
];

function getLevelConfigsById(levelId) {
  return levelConfigs[levelId - 1] || null;
}

function getLevelCount() {
  return levelConfigs.length;
}

export { OP, MATERIALS, getLevelConfigsById, getLevelCount };
