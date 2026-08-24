import { ensureSchema, getD1 } from '@/db';
import { sha256 } from '@/lib/reading-engine';

export const dynamic = 'force-dynamic';

type ReflectionBody = {
  ciphertext?: unknown;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return json({ error: 'UNAUTHORIZED' }, 401);

  let body: ReflectionBody;
  try {
    body = (await request.json()) as ReflectionBody;
  } catch {
    return json({ error: 'INVALID_JSON' }, 400);
  }

  const ciphertext = typeof body.ciphertext === 'string' ? body.ciphertext.trim() : '';
  if (!ciphertext || ciphertext.length > 6000) {
    return json({ error: 'INVALID_REFLECTION' }, 400);
  }

  await ensureSchema();
  const result = await getD1()
    .prepare(`
      UPDATE readings
      SET reflection_ciphertext = ?
      WHERE id = ? AND resume_token_hash = ? AND status = 'COMPLETE'
    `)
    .bind(ciphertext, id, await sha256(token))
    .run();

  if (!result.meta.changes) return json({ error: 'READING_NOT_FOUND' }, 404);
  return json({ readingId: id, saved: true });
}
