import { ensureSchema, getD1 } from '@/db';
import {
  analyzeQuestion,
  planSpread,
  randomSecret,
  sha256,
} from '@/lib/reading-engine';

export const dynamic = 'force-dynamic';

type CreateReadingBody = {
  question?: unknown;
  locale?: unknown;
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

export async function POST(request: Request) {
  let input: CreateReadingBody;
  try {
    input = (await request.json()) as CreateReadingBody;
  } catch {
    return json({ error: 'INVALID_JSON', message: '请求内容无法读取。' }, 400);
  }

  const question = typeof input.question === 'string' ? input.question.trim() : '';
  if (question.length < 8 || question.length > 600) {
    return json(
      {
        error: 'QUESTION_LENGTH',
        message: '请用 8–600 个字符描述最近困扰你的事情。',
      },
      400,
    );
  }

  const journeyKey = request.headers.get('x-journey-key')?.trim() ?? '';
  if (journeyKey.length < 24 || journeyKey.length > 160) {
    return json(
      {
        error: 'JOURNEY_KEY_REQUIRED',
        message: '无法建立你的私密阅读空间，请刷新后重试。',
      },
      400,
    );
  }

  const analysis = analyzeQuestion(question);
  const spread = planSpread(analysis);
  const id = crypto.randomUUID();
  const resumeToken = randomSecret(32);
  const now = Date.now();
  const status = analysis.safety.action === 'STOP' ? 'SAFETY_REDIRECTED' : 'READY_FOR_RITUAL';

  await ensureSchema();
  await getD1()
    .prepare(`
      INSERT INTO readings (
        id, journey_key_hash, resume_token_hash, question_hash, status,
        category, advisor, core_tension, reframed_question,
        safety_domain, safety_action, safety_message,
        spread_title, spread_json, draw_seed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      await sha256(journeyKey),
      await sha256(resumeToken),
      await sha256(question),
      status,
      analysis.category,
      analysis.advisor,
      analysis.coreTension,
      analysis.reframedQuestion,
      analysis.safety.domain,
      analysis.safety.action,
      analysis.safety.message,
      spread.title,
      JSON.stringify(spread),
      randomSecret(32),
      now,
    )
    .run();

  const response = {
    readingId: id,
    resumeToken,
    status,
    nextAction: status === 'SAFETY_REDIRECTED' ? 'SHOW_SAFETY_SUPPORT' : 'ENTER_RITUAL',
    mode: 'STRUCTURED_PREVIEW',
    analysis,
    spread,
  };

  return json(response, status === 'SAFETY_REDIRECTED' ? 422 : 201);
}
