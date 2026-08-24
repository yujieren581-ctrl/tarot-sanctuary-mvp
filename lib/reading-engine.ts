import { findTarotCard, Orientation, TAROT_DECK } from './tarot-deck';

export type Advisor = 'SOL' | 'LUNA' | 'NYX';
export type ReadingCategory = 'CAREER' | 'RELATIONSHIP' | 'SELF';
export type SafetyAction = 'CONTINUE' | 'CONTINUE_WITH_BOUNDARY' | 'STOP';

export type SpreadPosition = {
  key: string;
  label: string;
  purpose: string;
};

export type QuestionAnalysis = {
  category: ReadingCategory;
  advisor: Advisor;
  coreTension: string;
  reframedQuestion: string;
  safety: {
    domain: 'NONE' | 'SELF_HARM' | 'MEDICAL' | 'FINANCIAL' | 'LEGAL' | 'DEPENDENCY';
    action: SafetyAction;
    message: string | null;
  };
};

export type SpreadPlan = {
  title: string;
  intention: string;
  positions: SpreadPosition[];
};

export type DrawnCard = {
  positionIndex: number;
  position: SpreadPosition;
  cardKey: string;
  orientation: Orientation;
};

export type Interpretation = {
  title: string;
  thesis: string;
  trendStrength: '较强' | '中等' | '较弱';
  insights: Array<{ title: string; body: string }>;
  cards: Array<{
    positionIndex: number;
    cardKey: string;
    positionLabel: string;
    oneLine: string;
    symbolicMeaning: string;
    relevance: string;
    action: string;
  }>;
  fullNarrative: string;
  nextSteps: string[];
  reflectionQuestions: string[];
  boundaryNote: string;
  shareQuote: string;
};

const normalizedIncludes = (value: string, words: string[]) =>
  words.some((word) => value.toLocaleLowerCase().includes(word));

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function randomSecret(bytes = 24): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function analyzeQuestion(question: string): QuestionAnalysis {
  const source = question.trim();

  if (
    normalizedIncludes(source, [
      '自杀',
      '不想活',
      '结束生命',
      '伤害自己',
      'suicide',
      'kill myself',
      'self harm',
    ])
  ) {
    return {
      category: 'SELF',
      advisor: 'LUNA',
      coreTension: '你此刻的安全比任何牌面都重要',
      reframedQuestion: '此刻有哪些现实中的人或资源，可以立即陪你度过这一段？',
      safety: {
        domain: 'SELF_HARM',
        action: 'STOP',
        message:
          '我不会用塔罗解释你此刻的危险。请立即联系当地急救服务、危机干预热线，或请一位你信任的人现在陪在你身边。如果你正处于立即危险中，请离开危险物品并前往有人在的安全地点。',
      },
    };
  }

  const medical = normalizedIncludes(source, [
    '诊断',
    '癌症',
    '怀孕',
    '手术',
    '停药',
    '药物',
    'medical',
    'diagnosis',
  ]);
  const financial = normalizedIncludes(source, [
    '买入',
    '卖出',
    '股票',
    '加密货币',
    '投资',
    '贷款',
    'financial',
    'stock',
  ]);
  const legal = normalizedIncludes(source, ['起诉', '判决', '坐牢', '法律', 'legal', 'lawsuit']);
  const dependency = normalizedIncludes(source, [
    '再抽一次',
    '一直抽',
    '只有塔罗',
    '替我决定',
    '你替我选',
  ]);

  const boundaryDomain = medical
    ? 'MEDICAL'
    : financial
      ? 'FINANCIAL'
      : legal
        ? 'LEGAL'
        : dependency
          ? 'DEPENDENCY'
          : 'NONE';

  const career = normalizedIncludes(source, [
    '工作',
    '职业',
    '同事',
    '老板',
    '离职',
    '跳槽',
    '项目',
    '事业',
    'career',
    'job',
  ]);
  const relationship = normalizedIncludes(source, [
    '感情',
    '关系',
    '伴侣',
    '前任',
    '喜欢',
    '分手',
    '家人',
    '朋友',
    'relationship',
    'love',
  ]);

  const category: ReadingCategory = career ? 'CAREER' : relationship ? 'RELATIONSHIP' : 'SELF';
  const advisor: Advisor = category === 'CAREER' ? 'SOL' : category === 'RELATIONSHIP' ? 'LUNA' : 'NYX';

  const categoryCopy = {
    CAREER: {
      tension: '稳定与成长之间的选择',
      question: '什么值得继续投入，什么又需要通过小范围行动来验证？',
    },
    RELATIONSHIP: {
      tension: '靠近真实需要与保护自己之间的距离',
      question: '这段关系正在提醒你看见怎样的需要、边界与回应方式？',
    },
    SELF: {
      tension: '外界答案与内在方向之间的拉扯',
      question: '当你不急着得到结论时，什么更真实的方向正在浮现？',
    },
  }[category];

  return {
    category,
    advisor,
    coreTension: categoryCopy.tension,
    reframedQuestion: categoryCopy.question,
    safety: {
      domain: boundaryDomain,
      action: boundaryDomain === 'NONE' ? 'CONTINUE' : 'CONTINUE_WITH_BOUNDARY',
      message:
        boundaryDomain === 'NONE'
          ? null
          : '这次阅读只帮助你整理感受、价值与待核实的问题，不提供医疗诊断、投资指令或法律结论。重要决定请同时咨询相应专业人士。',
    },
  };
}

export function planSpread(analysis: QuestionAnalysis): SpreadPlan {
  const plans: Record<ReadingCategory, SpreadPlan> = {
    CAREER: {
      title: '审慎的渡口',
      intention: '在稳定与成长之间，辨认真正值得验证的下一步。',
      positions: [
        { key: 'anchor', label: '你正在保护什么', purpose: '看见当前选择背后的稳定需求' },
        { key: 'invitation', label: '变化邀请你面对什么', purpose: '辨认成长真正要求的代价与能力' },
        { key: 'experiment', label: '下一步值得验证的行动', purpose: '把巨大选择变成一个现实实验' },
      ],
    },
    RELATIONSHIP: {
      title: '诚实的距离',
      intention: '在感受、边界与关系现实之间，找到更诚实的位置。',
      positions: [
        { key: 'feeling', label: '你的感受在保护什么', purpose: '承认情绪背后的真实需要' },
        { key: 'dynamic', label: '关系中正在重复什么', purpose: '看见互动模式而非猜测对方内心' },
        { key: 'response', label: '你可以怎样回应', purpose: '选择既温柔又有边界的下一步' },
      ],
    },
    SELF: {
      title: '内在罗盘',
      intention: '暂时放下外界噪音，辨认正在形成的内在方向。',
      positions: [
        { key: 'surface', label: '此刻最响亮的声音', purpose: '识别占据注意力的表层叙事' },
        { key: 'understory', label: '更深处正在发生什么', purpose: '接近尚未被命名的内在主题' },
        { key: 'practice', label: '如何与答案相处', purpose: '找到一个可以持续实践的动作' },
      ],
    },
  };

  return plans[analysis.category];
}

async function score(seed: string, label: string): Promise<number> {
  const digest = await sha256(`${seed}:${label}`);
  return Number.parseInt(digest.slice(0, 12), 16);
}

export async function drawFromSeed(seed: string, spread: SpreadPlan): Promise<DrawnCard[]> {
  const scored = await Promise.all(
    TAROT_DECK.map(async (card) => ({
      card,
      score: await score(seed, card.key),
      orientationScore: await score(seed, `orientation:${card.key}`),
    })),
  );
  scored.sort((a, b) => a.score - b.score || a.card.key.localeCompare(b.card.key));

  return spread.positions.map((position, positionIndex) => ({
    positionIndex,
    position,
    cardKey: scored[positionIndex].card.key,
    orientation: scored[positionIndex].orientationScore % 2 === 0 ? 'upright' : 'reversed',
  }));
}

export function interpretDraw(
  analysis: QuestionAnalysis,
  spread: SpreadPlan,
  draw: DrawnCard[],
): Interpretation {
  const advisorLead = {
    SOL: '这组牌没有替你裁决去留，而是在区分：哪些是事实，哪些是担心，哪些可以先验证。',
    LUNA: '这组牌先接住你的感受，也提醒你：理解自己并不等于忽略现实中的边界。',
    NYX: '这组牌像一面安静的镜子，让反复出现的主题从模糊感受变成可被观察的线索。',
  }[analysis.advisor];

  const cardReadings = draw.map((drawn) => {
    const card = findTarotCard(drawn.cardKey);
    if (!card) throw new Error(`Unknown card: ${drawn.cardKey}`);
    const symbolicMeaning = drawn.orientation === 'upright' ? card.upright : card.reversed;
    return {
      positionIndex: drawn.positionIndex,
      cardKey: drawn.cardKey,
      positionLabel: drawn.position.label,
      oneLine: `${drawn.position.label}：${symbolicMeaning}。`,
      symbolicMeaning,
      relevance: `把“${analysis.coreTension}”放在这里看，${card.nameZh}更像一种观察角度，而不是对未来的判决。`,
      action:
        drawn.positionIndex === 2
          ? '把这条提示改写成一个七天内可完成、可撤回的小实验。'
          : '写下一个支持这份感受的事实，再写下一个可能反驳它的事实。',
    };
  });

  const thesisByCategory: Record<ReadingCategory, string> = {
    CAREER: '真正的选择，不只是离开还是留下，而是什么值得继续投入。',
    RELATIONSHIP: '答案不在猜透对方，而在更诚实地看见自己的需要与边界。',
    SELF: '方向并不总以结论出现，它也可能先以一个反复回来的问题出现。',
  };

  const insightTitles: Record<ReadingCategory, [string, string, string]> = {
    CAREER: ['先区分稳定与惯性', '让成长变得可验证', '用小实验替代一次豪赌'],
    RELATIONSHIP: ['感受值得被承认', '模式比猜测更可靠', '边界也是一种靠近'],
    SELF: ['噪音不是全部事实', '重复主题带着线索', '让方向通过行动显形'],
  };

  const titles = insightTitles[analysis.category];
  const thesis = thesisByCategory[analysis.category];

  return {
    title: spread.title,
    thesis,
    trendStrength: '中等',
    insights: cardReadings.map((reading, index) => ({
      title: titles[index],
      body: reading.symbolicMeaning,
    })),
    cards: cardReadings,
    fullNarrative: `${advisorLead} ${cardReadings
      .map((reading) => reading.oneLine)
      .join(' ')} 这不是确定性预测，而是一组可以带回现实、逐步验证的观察。`,
    nextSteps: [
      '写下你已经确认的三个事实，以及仍然只是猜测的部分。',
      '选择一个七天内可完成、成本可控且可以撤回的小行动。',
    ],
    reflectionQuestions: [
      '如果暂时不追求“正确答案”，你最想保护的价值是什么？',
      '哪一个现实信号会让你愿意调整现在的判断？',
    ],
    boundaryNote:
      analysis.safety.message ??
      '塔罗在这里用于象征性反思，不预测确定未来，也不替你做决定。',
    shareQuote: thesis,
  };
}
