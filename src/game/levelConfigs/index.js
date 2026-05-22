import { OP } from './ops';
import { MATERIALS } from './materials';

const levelConfigs = [
  {
    level: 1,
    levelName: '收发室',
    levelDesc: '在收发室，你可以从输入传送带拿取原料，也可以把成品放到输出带',
    inboxItems: [MATERIALS.BREAD, MATERIALS.CREAM],
    availableOps: [OP.INBOX, OP.OUTBOX],
  },
  {
    level: 2,
    levelName: '繁忙的收发室',
    levelDesc: '在繁忙的收发室，你可以从输入传送带拿取原料，也可以把成品放到输出带',
    inboxItems: [MATERIALS.BREAD, MATERIALS.CREAM, MATERIALS.STRAWBERRY],
    availableOps: [OP.INBOX, OP.OUTBOX],
  },
];

function getLevelConfigsById(levelId) {
  return levelConfigs[levelId - 1] || null;
}

export { OP, MATERIALS, getLevelConfigsById };
