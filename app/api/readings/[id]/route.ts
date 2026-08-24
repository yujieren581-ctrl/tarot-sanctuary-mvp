import { ensureSchema, getD1 } from '@/db';
import { QuestionAnalysis, sha256, SpreadPlan } from '@/lib/reading-engine';
import { findTarotCard } from '@/lib/tarot-deck';

export const dynamic = 'force-dynamic';

type ReadingRow = {
  id: string;
  resume_token_hash: string;
  status: string;
  category: QuestionAnalysis['category'];
  advisor: QuestionAnalysis['advisor'];
  core_tension: string;
  reframed_question: string;
  safety_domain: QuestionAnalysis['safety']['domain'];
  safety_action: QuestionAnalysis['safety']['action'];
  safety_message: string | null;
  spread_json: string;
  interpretation_json: string | null;
  reflection_ciphertext: string | null;
  created_at: number;
  completed_at: number | null;
};

type CardRow = {
  position_index: number;
  position_key: string;
  position_label: string;
  card_key: string;
  orientation: 'upright' | 'reversed';
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return json({ error: 'UNAUTHORIZED' }, 401);

  await ensureSchema();
  const db = getD1();
  const reading = await db
    .prepare(`
      SELECT id, resume_token_hash, status, category, advisor, core_tension,
        reframed_question, safety_domain, safety_action, safety_message,
        spread_json, interpretation_json, reflection_ciphertext, created_at, completed_at
      FROM readings WHERE id = ?
    `)
    .bind(id)
    .first<ReadingRow>();

  if (!reading || reading.resume_token_hash !== (await sha256(token))) {
    return json({ error: 'READING_NOT_FOUND' }, 404);
  }

  const cardsResult = await db
    .prepare(`
      SELECT position_index, position_key, position_label, card_key, orientation
      FROM reading_cards WHERE reading_id = ? ORDER BY position_index ASC
    `)
    .bind(id)
    .all<CardRow>();

  return json({
    readingId: reading.id,
    status: reading.status,
    analysis: {
      category: reading.category,
      advisor: reading.advisor,
      coreTension: reading.core_tension,
      reframedQuestion: reading.reframed_question,
      safety: {
        domain: reading.safety_domain,
        action: reading.safety_action,
        message: reading.safety_message,
      },
    },
    spread: JSON.parse(reading.spread_json) as SpreadPlan,
    cards: cardsResult.results.map((row) => ({
      positionIndex: row.position_index,
      positionKey: row.position_key,
      positionLabel: row.position_label,
      cardKey: row.card_key,
      orientation: row.orientation,
      card: findTarotCard(row.card_key),
    })),
    interpretation: reading.interpretation_json
      ? JSON.parse(reading.interpretation_json)
      : null,
    reflectionCiphertext: reading.reflection_ciphertext,
    createdAt: reading.created_at,
    completedAt: reading.completed_at,
  });
}
