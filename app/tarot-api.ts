import { classifyQuestion, TAROT_DECK } from './tarot-data';
import {
  DrawnCard,
  ReadingAnalysis,
  ReadingApiAdapter,
  QuestionProfile,
  TarotCard,
} from './tarot-types';

type ServerCard = {
  positionIndex: number;
  positionLabel: string;
  cardKey: string;
  orientation: 'upright' | 'reversed';
  card: {
    nameEn: string;
    nameZh: string;
    arcana: 'major' | 'minor';
    suit: 'wands' | 'cups' | 'swords' | 'pentacles' | null;
    numeral: string;
    upright: string;
    reversed: string;
  };
};

type ServerInterpretation = {
  thesis: string;
  insights: Array<{ title: string; body: string }>;
  cards: Array<{ cardKey: string; oneLine: string }>;
  nextSteps: string[];
  reflectionQuestions: string[];
  boundaryNote: string;
};

type ServerDraw = {
  cards: ServerCard[];
  interpretation: ServerInterpretation;
};

type ServerJourney = {
  readingCount: number;
  facts: {
    categoryCounts: Record<'CAREER' | 'RELATIONSHIP' | 'SELF', number>;
    commonCards: Array<{
      cardKey: string;
      nameEn: string;
      nameZh: string;
      appearances: number;
    }>;
  };
  history: Array<{
    id: string;
    category: 'CAREER' | 'RELATIONSHIP' | 'SELF';
    coreTension: string;
    thesis: string;
    createdAt: number;
  }>;
};

type ServerResume = {
  status: string;
  analysis: { category: 'CAREER' | 'RELATIONSHIP' | 'SELF' };
  cards: ServerCard[];
  interpretation: ServerInterpretation | null;
};

async function jsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(payload.message ?? `Tarot API ${response.status}`);
  return payload;
}

function profileForCategory(category: 'CAREER' | 'RELATIONSHIP' | 'SELF'): QuestionProfile {
  return classifyQuestion(
    category === 'CAREER' ? '工作与职业方向' : category === 'RELATIONSHIP' ? '感情与关系' : '自我与意义',
  );
}

function toUiCard(card: ServerCard, interpretation?: ServerInterpretation): DrawnCard {
  const oneLine =
    interpretation?.cards.find((item) => item.cardKey === card.cardKey)?.oneLine ??
    (card.orientation === 'upright' ? card.card.upright : card.card.reversed);
  return {
    id: card.cardKey,
    number: card.positionIndex,
    name: card.card.nameEn,
    nameZh: card.card.nameZh,
    arcana: card.card.arcana,
    suit: card.card.suit ?? 'major',
    keywords: [
      card.card.arcana === 'major' ? '原型' : card.card.suit ?? '象征',
      card.orientation === 'upright' ? '正位' : '逆位',
    ],
    upright: card.card.upright,
    reversed: card.card.reversed,
    polarity: card.orientation,
    position: card.positionLabel,
    positionZh: card.positionLabel,
    oneLine,
  };
}

function toUiInterpretation(value: ServerInterpretation): ReadingAnalysis {
  return {
    thesis: value.thesis,
    thesisZh: value.thesis,
    insights: value.insights.map((insight) => ({
      title: insight.title,
      body: insight.body,
      bodyZh: insight.body,
    })),
    actions: value.nextSteps,
    reflection: value.reflectionQuestions[0] ?? '此刻，你最想记住什么？',
    boundaryNote: value.boundaryNote,
  };
}

function placeholderCard(input: ServerJourney['facts']['commonCards'][number]): TarotCard {
  return (
    TAROT_DECK.find((card) => card.name === input.nameEn || card.nameZh === input.nameZh) ?? {
      id: input.cardKey,
      number: 0,
      name: input.nameEn,
      nameZh: input.nameZh,
      arcana: 'major',
      suit: 'major',
      keywords: ['反复出现'],
      upright: '一个反复出现、值得继续观察的主题',
      reversed: '一个需要换个角度观察的主题',
    }
  );
}

export function getOrCreateJourneyKey(): string {
  if (typeof window === 'undefined') return '';
  const storageKey = 'ai-tarot-room-journey-key';
  const existing = window.localStorage.getItem(storageKey);
  if (existing && existing.length >= 24) return existing;
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const created = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  window.localStorage.setItem(storageKey, created);
  return created;
}

async function encryptReflection(value: string): Promise<string> {
  const journeyKey = getOrCreateJourneyKey();
  const material = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(journeyKey));
  const key = await crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(value),
  );
  const encode = (bytes: Uint8Array) =>
    btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
  return `v1.${encode(iv)}.${encode(new Uint8Array(ciphertext))}`;
}

/** D1 adapter. It contains transport mapping only; draw and interpretation remain server-owned. */
export const tarotApi: ReadingApiAdapter = {
  async createReading(question: string, journeyKey: string) {
    return jsonOrThrow<{ readingId: string; resumeToken: string }>(
      await fetch('/api/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Journey-Key': journeyKey,
        },
        body: JSON.stringify({ question, locale: 'zh-CN' }),
      }),
    );
  },

  async drawCards(readingId: string, resumeToken: string) {
    const result = await jsonOrThrow<ServerDraw>(
      await fetch(`/api/readings/${encodeURIComponent(readingId)}/draw`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resumeToken}`,
          'Idempotency-Key': `${readingId}:draw:v1`,
        },
      }),
    );
    return {
      cards: result.cards.map((card) => toUiCard(card, result.interpretation)),
      interpretation: toUiInterpretation(result.interpretation),
    };
  },

  async resumeReading(readingId: string, resumeToken: string) {
    const result = await jsonOrThrow<ServerResume>(
      await fetch(`/api/readings/${encodeURIComponent(readingId)}`, {
        headers: { Authorization: `Bearer ${resumeToken}` },
      }),
    );
    return {
      status: result.status,
      profile: profileForCategory(result.analysis.category),
      cards: result.cards.map((card) =>
        toUiCard(card, result.interpretation ?? undefined),
      ),
      interpretation: result.interpretation
        ? toUiInterpretation(result.interpretation)
        : null,
    };
  },

  async saveReflection(readingId: string, resumeToken: string, reflection: string) {
    await jsonOrThrow<{ saved: boolean }>(
      await fetch(`/api/readings/${encodeURIComponent(readingId)}/reflection`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resumeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ciphertext: await encryptReflection(reflection) }),
      }),
    );
  },

  async getJourney(journeyKey: string) {
    const result = await jsonOrThrow<ServerJourney>(
      await fetch('/api/journey', {
        headers: { 'X-Journey-Key': journeyKey || getOrCreateJourneyKey() },
      }),
    );
    const readings = result.history.map((reading) => {
      const profile = profileForCategory(reading.category);
      const analysis: ReadingAnalysis = {
        thesis: reading.thesis,
        thesisZh: reading.thesis,
        insights: [],
        actions: [],
        reflection: '',
      };
      return {
        id: reading.id,
        createdAt: new Date(reading.createdAt).toISOString(),
        question: '',
        profile: { ...profile, tensionZh: reading.coreTension },
        cards: [],
        analysis,
        preview: false,
      };
    });

    return {
      readings,
      frequentCards: result.facts.commonCards.map((card) => ({
        card: placeholderCard(card),
        count: card.appearances,
      })),
      themes: [
        { label: '事业与方向', count: result.facts.categoryCounts.CAREER },
        { label: '关系与靠近', count: result.facts.categoryCounts.RELATIONSHIP },
        { label: '自我与变化', count: result.facts.categoryCounts.SELF },
      ].filter((theme) => theme.count > 0),
      preview: false,
    };
  },
};
