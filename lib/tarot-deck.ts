export type Arcana = 'major' | 'minor';
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles' | null;
export type Orientation = 'upright' | 'reversed';

export type TarotCard = {
  key: string;
  nameEn: string;
  nameZh: string;
  arcana: Arcana;
  suit: Suit;
  numeral: string;
  symbol: string;
  upright: string;
  reversed: string;
};

const majorRows = [
  ['the-fool', 'The Fool', '愚者', '0', '○', '开放、启程与信任未知', '先停一步，辨认冲动与逃避'],
  ['the-magician', 'The Magician', '魔术师', 'I', '✦', '资源、意志与主动创造', '分散的力量需要重新聚焦'],
  ['the-high-priestess', 'The High Priestess', '女祭司', 'II', '◐', '直觉、沉静与尚未言明之事', '噪音遮住了内在判断'],
  ['the-empress', 'The Empress', '皇后', 'III', '❦', '滋养、丰盛与让事物生长', '付出过度或忽略自身需要'],
  ['the-emperor', 'The Emperor', '皇帝', 'IV', '△', '结构、边界与稳定领导', '控制过紧，结构需要留出弹性'],
  ['the-hierophant', 'The Hierophant', '教皇', 'V', '⌂', '传统、导师与共同准则', '旧规则可能不再适合此刻'],
  ['the-lovers', 'The Lovers', '恋人', 'VI', '◇', '价值一致、关系与重要选择', '选择与真实价值仍有距离'],
  ['the-chariot', 'The Chariot', '战车', 'VII', '⇧', '方向、意志与整合矛盾', '用力过猛，方向尚未真正统一'],
  ['strength', 'Strength', '力量', 'VIII', '∞', '温柔的勇气与内在韧性', '自我怀疑正在消耗力量'],
  ['the-hermit', 'The Hermit', '隐士', 'IX', '✺', '独处、辨识与寻找内在方向', '独处正在滑向封闭或拖延'],
  ['wheel-of-fortune', 'Wheel of Fortune', '命运之轮', 'X', '⊕', '周期、变化与转折窗口', '抗拒变化让周期难以推进'],
  ['justice', 'Justice', '正义', 'XI', '⚖', '事实、责任与清晰权衡', '判断可能被偏见或回避影响'],
  ['the-hanged-man', 'The Hanged Man', '倒吊人', 'XII', '▽', '暂停、换位与新的观看方式', '停滞没有转化为真正洞察'],
  ['death', 'Death', '死神', 'XIII', '✢', '结束、腾挪与深层转变', '紧握已经完成的阶段'],
  ['temperance', 'Temperance', '节制', 'XIV', '≈', '调和、耐心与持续整合', '节奏失衡，需要重新配比'],
  ['the-devil', 'The Devil', '恶魔', 'XV', '⛓', '欲望、束缚与可被看见的模式', '正在识别并松动旧有束缚'],
  ['the-tower', 'The Tower', '高塔', 'XVI', 'ϟ', '真相显现与旧结构松动', '对必要改变的抵抗延长震荡'],
  ['the-star', 'The Star', '星星', 'XVII', '✧', '希望、修复与重新校准', '希望需要具体照料而非空等'],
  ['the-moon', 'The Moon', '月亮', 'XVIII', '☾', '潜意识、不确定与敏锐感受', '焦虑放大了尚未证实的故事'],
  ['the-sun', 'The Sun', '太阳', 'XIX', '☼', '清晰、生命力与坦然表达', '光亮被自我压抑或过度乐观遮挡'],
  ['judgement', 'Judgement', '审判', 'XX', '⌁', '召唤、复盘与新的回应', '旧评价阻碍了诚实的更新'],
  ['the-world', 'The World', '世界', 'XXI', '◎', '完成、整合与进入新周期', '最后一步仍需要被认真完成'],
] as const;

const major: Array<Omit<TarotCard, 'arcana' | 'suit'>> = majorRows.map(
  ([key, nameEn, nameZh, numeral, symbol, upright, reversed]) => ({
  key,
  nameEn,
  nameZh,
  numeral,
  symbol,
  upright,
  reversed,
  }),
);

const suits = [
  { key: 'wands', en: 'Wands', zh: '权杖', symbol: '│', theme: '行动与创造力' },
  { key: 'cups', en: 'Cups', zh: '圣杯', symbol: '∪', theme: '感受与关系' },
  { key: 'swords', en: 'Swords', zh: '宝剑', symbol: '†', theme: '思考与冲突' },
  { key: 'pentacles', en: 'Pentacles', zh: '星币', symbol: '◇', theme: '现实与资源' },
] as const;

const ranks = [
  { key: 'ace', en: 'Ace', zh: '首牌', numeral: 'A', upright: '新的可能开始成形', reversed: '起点需要更清楚的条件' },
  { key: 'two', en: 'Two', zh: '二', numeral: 'II', upright: '两种力量正在协商', reversed: '摇摆让决定持续延后' },
  { key: 'three', en: 'Three', zh: '三', numeral: 'III', upright: '合作与扩展带来视野', reversed: '协作或节奏需要重新校准' },
  { key: 'four', en: 'Four', zh: '四', numeral: 'IV', upright: '稳定让你有空间观察', reversed: '稳定正滑向停滞或封闭' },
  { key: 'five', en: 'Five', zh: '五', numeral: 'V', upright: '摩擦暴露了真实需要', reversed: '冲突可以通过换一种回应减弱' },
  { key: 'six', en: 'Six', zh: '六', numeral: 'VI', upright: '过渡与支持正在出现', reversed: '旧经验仍影响当下判断' },
  { key: 'seven', en: 'Seven', zh: '七', numeral: 'VII', upright: '辨别与坚持需要同时存在', reversed: '选择过多或防御过重' },
  { key: 'eight', en: 'Eight', zh: '八', numeral: 'VIII', upright: '持续行动正在积累改变', reversed: '重复努力需要调整方法' },
  { key: 'nine', en: 'Nine', zh: '九', numeral: 'IX', upright: '接近结果，也需要照顾边界', reversed: '疲惫提示你重新分配力量' },
  { key: 'ten', en: 'Ten', zh: '十', numeral: 'X', upright: '一个周期来到整合点', reversed: '负担需要被拆分或放下' },
  { key: 'page', en: 'Page', zh: '侍从', numeral: 'P', upright: '以好奇心接近新的信息', reversed: '信息尚未成熟，不宜仓促定论' },
  { key: 'knight', en: 'Knight', zh: '骑士', numeral: 'N', upright: '动能已出现，方向决定结果', reversed: '速度掩盖了尚未处理的细节' },
  { key: 'queen', en: 'Queen', zh: '王后', numeral: 'Q', upright: '成熟地容纳并运用这股力量', reversed: '照顾他人之前需要收回能量' },
  { key: 'king', en: 'King', zh: '国王', numeral: 'K', upright: '稳定掌握并承担选择后果', reversed: '权威与控制需要重新平衡' },
] as const;

const minor: TarotCard[] = suits.flatMap((suit) =>
  ranks.map((rank) => ({
    key: `${rank.key}-of-${suit.key}`,
    nameEn: `${rank.en} of ${suit.en}`,
    nameZh: `${suit.zh}${rank.zh}`,
    arcana: 'minor' as const,
    suit: suit.key,
    numeral: rank.numeral,
    symbol: suit.symbol,
    upright: `${suit.theme}：${rank.upright}`,
    reversed: `${suit.theme}：${rank.reversed}`,
  })),
);

export const TAROT_DECK: TarotCard[] = [
  ...major.map((card) => ({ ...card, arcana: 'major' as const, suit: null })),
  ...minor,
];

if (TAROT_DECK.length !== 78 || new Set(TAROT_DECK.map((card) => card.key)).size !== 78) {
  throw new Error('The canonical tarot deck must contain 78 unique cards.');
}

export function findTarotCard(key: string): TarotCard | undefined {
  return TAROT_DECK.find((card) => card.key === key);
}
