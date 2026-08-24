import { DrawnCard, QuestionProfile, ReadingAnalysis, Spread, TarotCard, TarotPersona } from './tarot-types';

export const PERSONAS: Record<'sol' | 'luna' | 'nyx', TarotPersona> = {
  sol: { id: 'sol', name: '澄明', role: '清晰的决策者', description: '理性、清晰，帮助你把模糊的选择拆成可以行动的线索。', suitableFor: ['事业', '选择', '方向'] },
  luna: { id: 'luna', name: '月白', role: '温柔的倾听者', description: '温柔、共情，陪你听见情绪底下真正想被照顾的部分。', suitableFor: ['关系', '情绪', '自我理解'] },
  nyx: { id: 'nyx', name: '玄夜', role: '象征的引路者', description: '神秘、深邃，从象征与重复出现的模式里寻找新的视角。', suitableFor: ['深度探索', '潜意识', '转变'] },
};

const majorNames: Array<[string, string, string[]]> = [
  ['The Fool', '愚者', ['开始', '信任', '可能']], ['The Magician', '魔术师', ['意志', '资源', '表达']], ['The High Priestess', '女祭司', ['直觉', '静默', '内在']], ['The Empress', '皇后', ['滋养', '丰盛', '创造']], ['The Emperor', '皇帝', ['结构', '边界', '担当']], ['The Hierophant', '教皇', ['传统', '学习', '信念']], ['The Lovers', '恋人', ['选择', '共鸣', '价值']], ['The Chariot', '战车', ['意志', '推进', '掌控']], ['Strength', '力量', ['勇气', '温柔', '韧性']], ['The Hermit', '隐者', ['独处', '方向', '洞察']], ['Wheel of Fortune', '命运之轮', ['周期', '转机', '变化']], ['Justice', '正义', ['诚实', '平衡', '责任']], ['The Hanged Man', '倒吊人', ['暂停', '换位', '放下']], ['Death', '死神', ['结束', '转化', '释放']], ['Temperance', '节制', ['整合', '节奏', '调和']], ['The Devil', '恶魔', ['执着', '欲望', '束缚']], ['The Tower', '高塔', ['真相', '震荡', '重建']], ['The Star', '星星', ['希望', '疗愈', '愿景']], ['The Moon', '月亮', ['不确定', '梦境', '投射']], ['The Sun', '太阳', ['清晰', '活力', '显现']], ['Judgement', '审判', ['召唤', '复盘', '更新']], ['The World', '世界', ['完成', '整合', '抵达']],
];

const minorNames: Record<'wands' | 'cups' | 'swords' | 'pentacles', [string, string]> = {
  wands: ['权杖', '行动'], cups: ['圣杯', '情感'], swords: ['宝剑', '思考'], pentacles: ['星币', '现实'],
};
const ranks: Array<[string, string, string]> = [['Ace', 'Ace', '一'], ['Two', '2', '二'], ['Three', '3', '三'], ['Four', '4', '四'], ['Five', '5', '五'], ['Six', '6', '六'], ['Seven', '7', '七'], ['Eight', '8', '八'], ['Nine', '9', '九'], ['Ten', '10', '十'], ['Page', '侍者', '侍者'], ['Knight', '骑士', '骑士'], ['Queen', '王后', '王后'], ['King', '国王', '国王']];

export const TAROT_DECK: TarotCard[] = [
  ...majorNames.map(([name, nameZh, keywords], number) => ({ id: `major-${number}`, number, name, nameZh, arcana: 'major' as const, suit: 'major' as const, keywords, upright: keywords[0], reversed: `重新审视${keywords[1]}` })),
  ...(['wands', 'cups', 'swords', 'pentacles'] as const).flatMap((suit, suitIndex) => ranks.map(([rank, display, rankZh], rankIndex) => {
    const [suitZh, theme] = minorNames[suit];
    const isCourt = rankIndex > 9;
    const name = `${rank} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
    const nameZh = `${suitZh}${rankZh}`;
    const keywords = isCourt ? [rankZh, theme, '关系'] : [display === 'Ace' ? '种子' : display, theme, '过程'];
    return { id: `${suit}-${rankIndex + 1}`, number: 22 + suitIndex * 14 + rankIndex + 1, name, nameZh, arcana: 'minor' as const, suit, keywords, upright: `${theme}中的${keywords[0]}`, reversed: `${theme}中的重新调整` };
  })),
];

export const SPREADS: Record<QuestionProfile['category'], Spread> = {
  career: { name: '抉择之径', nameZh: '十字路口', description: '看见你正在权衡的现实、内在动力与下一步。', positions: [{ id: 'context', label: '此刻的处境', labelZh: '此刻的处境', prompt: '现在真正影响你的是什么？' }, { id: 'tension', label: '核心张力', labelZh: '核心张力', prompt: '什么在拉扯你的选择？' }, { id: 'next', label: '下一步', labelZh: '下一步', prompt: '什么行动能让方向变得清晰？' }] },
  relationship: { name: '靠近与边界', nameZh: '关系之间', description: '在靠近与自我边界之间，听见关系正在说什么。', positions: [{ id: 'self', label: '你的内在天气', labelZh: '你的内在天气', prompt: '你带着怎样的感受进入这段关系？' }, { id: 'mirror', label: '关系的镜面', labelZh: '关系的镜面', prompt: '这段关系正在映照什么？' }, { id: 'care', label: '更真实的照顾', labelZh: '更真实的照顾', prompt: '怎样的表达会让关系更诚实？' }] },
  self: { name: '内在朝向', nameZh: '内在罗盘', description: '从反复出现的念头里，辨认你正在成为谁。', positions: [{ id: 'echo', label: '反复回响', labelZh: '反复回响', prompt: '什么主题正在向你索要注意？' }, { id: 'threshold', label: '门槛', labelZh: '门槛', prompt: '什么旧的方式已经不再适用？' }, { id: 'orientation', label: '新的朝向', labelZh: '新的朝向', prompt: '哪一个小方向值得被试着走近？' }] },
};

export function classifyQuestion(question: string): QuestionProfile {
  const q = question.toLowerCase();
  const relationship = /(恋爱|感情|关系|伴侣|前任|喜欢|暧昧|婚姻|朋友|love|relationship)/.test(q);
  const career = /(工作|职业|事业|转行|升职|项目|面试|创业|公司|收入|career|job)/.test(q);
  if (career) return { category: 'career', label: '事业与方向', labelZh: '事业与方向', tension: '稳定与成长', tensionZh: '稳定与成长之间的选择', focus: '把模糊的判断拆成可观察的下一步。', persona: PERSONAS.sol };
  if (relationship) return { category: 'relationship', label: '关系与靠近', labelZh: '关系与靠近', tension: '靠近与自我保护', tensionZh: '靠近与自我保护之间的拉扯', focus: '让情绪成为信息，而不是替你做决定。', persona: PERSONAS.luna };
  return { category: 'self', label: '自我与变化', labelZh: '自我与变化', tension: '旧身份与新可能', tensionZh: '旧身份与新可能之间的过渡', focus: '从反复出现的主题中，找回你的内在罗盘。', persona: PERSONAS.nyx };
}

export function isHighRiskQuestion(question: string): boolean {
  return /(自杀|自残|不想活|结束生命|伤害自己|suicide|kill myself|self.?harm)/i.test(question);
}

function hashQuestion(question: string): number {
  return [...question].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 17) >>> 0;
}

export function previewDraw(question: string, category: QuestionProfile['category']): DrawnCard[] {
  const spread = SPREADS[category];
  const seed = hashQuestion(question);
  const indexes: number[] = [];
  let cursor = seed;
  while (indexes.length < 3) {
    cursor = (cursor * 1664525 + 1013904223) >>> 0;
    const index = cursor % TAROT_DECK.length;
    if (!indexes.includes(index)) indexes.push(index);
  }
  return indexes.map((index, i) => {
    const card = TAROT_DECK[index];
    const polarity = ((seed >> (i + 2)) & 1) === 1 ? 'reversed' : 'upright';
    return { ...card, polarity, position: spread.positions[i].label, positionZh: spread.positions[i].labelZh, oneLine: polarity === 'upright' ? card.upright : card.reversed };
  });
}

export function demoAnalysis(profile: QuestionProfile, cards: DrawnCard[]): ReadingAnalysis {
  const thesisByCategory = { career: '你不必现在回答“要不要离开”；先让真实的限制与想要被看见。', relationship: '这段关系的答案不只在对方的回应里，也在你如何不再缩小自己。', self: '你正在从寻找一个确定答案，转向练习相信自己的辨认力。' };
  const insight = (title: string, bodyZh: string) => ({ title, body: bodyZh, bodyZh });
  const titles = profile.category === 'career' ? ['看见限制', '保留选择', '小步验证'] : profile.category === 'relationship' ? ['先照顾感受', '看见边界', '练习表达'] : ['允许过渡', '辨认回声', '从小处开始'];
  return { thesis: thesisByCategory[profile.category], thesisZh: thesisByCategory[profile.category], insights: cards.map((card, i) => insight(`${titles[i]} · ${card.nameZh}`, `${card.oneLine}。把这张牌当作一面镜子：它邀请你观察，而不是替你下结论。`)), actions: ['写下一个你能在 48 小时内完成的微小行动。', '把“我应该”改写成“我真正需要知道的是……”。', '给自己留出一次不急着解释的安静时间。'], reflection: '读完之后，哪一个词留在了你的身体里？', boundaryNote: '这份阅读用于象征性反思，不预测确定未来，也不替你做决定。' };
}
