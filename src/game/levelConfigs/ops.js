export const OP = {
  INBOX: {
    title: 'inbox',
    subTitle: '(取原料)',
    color: 0xb3c574,
    desc: '从输入传送带末端拿取一个原料',
  },
  OUTBOX: {
    title: 'outbox',
    subTitle: '(放成品)',
    color: 0xb3c574,
    desc: '把手里的原料放到输出带',
  },
  ADD: {
    title: 'add',
    subTitle: '(添加)',
    color: 0xd2a279,
    desc: '将两个原料混合在一起',
  },
  SUB: {
    title: 'sub',
    subTitle: '(移除)',
    color: 0xd2a279,
    desc: '从输出带移除一个原料',
  },
  JUMP: {
    title: 'jump',
    subTitle: '(跳转)',
    color: 0xa0a2ce,
    desc: '跳转到指定操作',
  },
  JUMP_IF_STRAWBERRY: {
    title: 'jump-if-strawberry',
    subTitle: '(如果有草莓)',
    color: 0xa0a2ce,
    desc: '如果输出带有草莓，跳转到指定操作',
  },
};
