export type ReadingStep = 'home' | 'understand' | 'ritual' | 'reveal' | 'reading' | 'journey' | 'safety';

export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type Arcana = 'major' | 'minor';
export type Polarity = 'upright' | 'reversed';

export interface TarotCard {
  id: string;
  number: number;
  name: string;
  nameZh: string;
  arcana: Arcana;
  suit: Suit;
  keywords: string[];
  upright: string;
  reversed: string;
}

export interface DrawnCard extends TarotCard {
  polarity: Polarity;
  position: string;
  positionZh: string;
  oneLine: string;
}

export interface TarotPersona {
  id: 'sol' | 'luna' | 'nyx';
  name: string;
  role: string;
  description: string;
  suitableFor: string[];
}

export interface QuestionProfile {
  category: 'career' | 'relationship' | 'self';
  label: string;
  labelZh: string;
  tension: string;
  tensionZh: string;
  focus: string;
  persona: TarotPersona;
}

export interface SpreadPosition {
  id: string;
  label: string;
  labelZh: string;
  prompt: string;
}

export interface ReadingAnalysis {
  thesis: string;
  thesisZh: string;
  insights: Array<{ title: string; body: string; bodyZh: string }>;
  actions: string[];
  reflection: string;
  boundaryNote?: string;
}

export interface ReadingRecord {
  id: string;
  createdAt: string;
  question: string;
  profile: QuestionProfile;
  cards: DrawnCard[];
  analysis: ReadingAnalysis;
  preview: boolean;
}

export interface JourneyData {
  readings: ReadingRecord[];
  frequentCards: Array<{ card: TarotCard; count: number }>;
  themes: Array<{ label: string; count: number }>;
  preview: boolean;
}

export interface ReadingApiAdapter {
  createReading(question: string, journeyKey: string): Promise<{ readingId: string; resumeToken: string }>;
  drawCards(readingId: string, resumeToken: string): Promise<{ cards: DrawnCard[]; interpretation?: ReadingAnalysis }>;
  resumeReading(readingId: string, resumeToken: string): Promise<{
    status: string;
    profile: QuestionProfile;
    cards: DrawnCard[];
    interpretation: ReadingAnalysis | null;
  }>;
  saveReflection(readingId: string, resumeToken: string, reflection: string): Promise<void>;
  getJourney(journeyKey: string): Promise<JourneyData>;
}

export interface Spread {
  name: string;
  nameZh: string;
  description: string;
  positions: SpreadPosition[];
}
