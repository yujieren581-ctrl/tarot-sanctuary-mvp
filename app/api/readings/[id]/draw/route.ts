import { ensureSchema, getD1 } from '@/db';
import {
  drawFromSeed,
  interpretDraw,
  QuestionAnalysis,
  sha256,
  SpreadPlan,
} from '@/lib/reading-engine';
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
  draw_seed: string;
  interpretation_json: string | null;
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
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function bearerToken(request: Request): string {
  const value = request.headers.get('authorization') ?? '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = bearerToken(request);
  const idempotencyKey = request.headers.get('idempotency-key')?.trim() ?? '';

  if (!token || idempotencyKey.length < 12) {
    return json(
      {
        error: 'AUTH_OR_IDEMPOTENCY_REQUIRED',
        message: '阅读凭证无效，请返回首页重新开始。',
      },
      401,
    );
  }

  await ensureSchema();
  const db = getD1();
  const reading = await db
    .prepare(`
      SELECT id, resume_token_hash, status, category, advisor, core_tension,
        reframed_question, safety_domain, safety_action, safety_message,
        spread_json, draw_seed, interpretation_json
      FROM readings WHERE id = ?
    `)
    .bind(id)
    .first<ReadingRow>();

  if (!reading || reading.resume_token_hash !== (await sha256(token))) {
    return json({ error: 'READING_NOT_FOUND', message: '没有找到这次阅读。' }, 404);
  }

  if (reading.safety_action === 'STOP') {
    return json(
      {
        error: 'SAFETY_REDIRECTED',
        message: reading.safety_message,
      },
      422,
    );
  }

  const spread = JSON.parse(reading.spread_json) as SpreadPlan;
  const analysis: QuestionAnalysis = {
    category: reading.category,
    advisor: reading.advisor,
    coreTension: reading.core_tension,
    reframedQuestion: reading.reframed_question,
    safety: {
      domain: reading.safety_domain,
      action: reading.safety_action,
      message: reading.safety_message,
    },
  };
  const canonicalDraw = await drawFromSeed(reading.draw_seed, spread);
  const interpretation =
    reading.interpretation_json == null
      ? interpretDraw(analysis, spread, canonicalDraw)
      : JSON.parse(reading.interpretation_json);
  const now = Date.now();

  const statements = canonicalDraw.map((drawn) =>
    db
      .prepare(`
        INSERT OR IGNORE INTO reading_cards (
          id, reading_id, position_index, position_key, position_label,
          card_key, orientation, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        `${id}:${drawn.positionIndex}`,
        id,
        drawn.positionIndex,
        drawn.position.key,
        drawn.position.label,
        drawn.cardKey,
        drawn.orientation,
        now,
      ),
  );

  await db.batch([
    ...statements,
    db
      .prepare(
        `UPDATE readings
         SET status = 'COMPLETE', interpretation_json = ?, completed_at = COALESCE(completed_at, ?)
         WHERE id = ?`,
      )
      .bind(JSON.stringify(interpretation), now, id),
  ]);

  const result = await db
    .prepare(`
      SELECT position_index, position_key, position_label, card_key, orientation
      FROM reading_cards
      WHERE reading_id = ?
      ORDER BY position_index ASC
    `)
    .bind(id)
    .all<CardRow>();

  const cards = result.results.map((row) => {
    const card = findTarotCard(row.card_key);
    if (!card) throw new Error(`Stored card is not in canonical deck: ${row.card_key}`);
    return {
      positionIndex: row.position_index,
      positionKey: row.position_key,
      positionLabel: row.position_label,
      cardKey: row.card_key,
      orientation: row.orientation,
      card,
    };
  });

  return json({
    readingId: id,
    status: 'COMPLETE',
    nextAction: 'REVEAL_CARDS',
    mode: 'STRUCTURED_PREVIEW',
    cards,
    interpretation,
  });
}
