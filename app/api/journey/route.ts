import { ensureSchema, getD1 } from '@/db';
import { sha256 } from '@/lib/reading-engine';
import { findTarotCard } from '@/lib/tarot-deck';

export const dynamic = 'force-dynamic';

type HistoryRow = {
  id: string;
  category: 'CAREER' | 'RELATIONSHIP' | 'SELF';
  advisor: 'SOL' | 'LUNA' | 'NYX';
  core_tension: string;
  spread_title: string;
  interpretation_json: string | null;
  created_at: number;
  completed_at: number | null;
};

type CommonCardRow = {
  card_key: string;
  appearances: number;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function GET(request: Request) {
  const journeyKey = request.headers.get('x-journey-key')?.trim() ?? '';
  if (journeyKey.length < 24 || journeyKey.length > 160) {
    return json({ error: 'JOURNEY_KEY_REQUIRED' }, 401);
  }

  await ensureSchema();
  const db = getD1();
  const keyHash = await sha256(journeyKey);
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const [historyResult, cardsResult] = await Promise.all([
    db
      .prepare(`
        SELECT id, category, advisor, core_tension, spread_title,
          interpretation_json, created_at, completed_at
        FROM readings
        WHERE journey_key_hash = ? AND status = 'COMPLETE' AND created_at >= ?
        ORDER BY created_at DESC
        LIMIT 30
      `)
      .bind(keyHash, cutoff)
      .all<HistoryRow>(),
    db
      .prepare(`
        SELECT rc.card_key, COUNT(*) AS appearances
        FROM reading_cards rc
        INNER JOIN readings r ON r.id = rc.reading_id
        WHERE r.journey_key_hash = ? AND r.status = 'COMPLETE' AND r.created_at >= ?
        GROUP BY rc.card_key
        ORDER BY appearances DESC, rc.card_key ASC
        LIMIT 5
      `)
      .bind(keyHash, cutoff)
      .all<CommonCardRow>(),
  ]);

  const categoryCounts = { CAREER: 0, RELATIONSHIP: 0, SELF: 0 };
  for (const row of historyResult.results) categoryCounts[row.category] += 1;

  const history = historyResult.results.map((row) => {
    const interpretation = row.interpretation_json
      ? (JSON.parse(row.interpretation_json) as { thesis?: string; shareQuote?: string })
      : null;
    return {
      id: row.id,
      category: row.category,
      advisor: row.advisor,
      coreTension: row.core_tension,
      spreadTitle: row.spread_title,
      thesis: interpretation?.thesis ?? interpretation?.shareQuote ?? '',
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  });

  const commonCards = cardsResult.results.map((row) => {
    const card = findTarotCard(row.card_key);
    return {
      cardKey: row.card_key,
      nameEn: card?.nameEn ?? row.card_key,
      nameZh: card?.nameZh ?? row.card_key,
      appearances: Number(row.appearances),
    };
  });

  const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0];
  const observations: Record<string, string> = {
    CAREER: '近期的阅读更常围绕职业方向与现实选择展开。',
    RELATIONSHIP: '近期的阅读更常回到关系中的感受、回应与边界。',
    SELF: '近期的阅读正在从寻找外部答案，转向辨认内在方向。',
  };

  return json({
    period: '90d',
    readingCount: history.length,
    facts: {
      categoryCounts,
      commonCards,
    },
    aiObservation: history.length >= 3 ? observations[dominantCategory] : null,
    lowSample: history.length < 3,
    history,
  });
}
