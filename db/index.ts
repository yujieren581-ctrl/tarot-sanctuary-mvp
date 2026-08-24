import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let schemaInitialization: Promise<void> | null = null;

export function getD1(): D1Database {
  if (!env.DB) {
    throw new Error(
      'Cloudflare D1 binding `DB` is unavailable. Keep the d1 binding in .openai/hosting.json.',
    );
  }
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export async function ensureSchema(): Promise<void> {
  if (!schemaInitialization) {
    schemaInitialization = initializeSchema().catch((error) => {
      schemaInitialization = null;
      throw error;
    });
  }
  return schemaInitialization;
}

async function initializeSchema(): Promise<void> {
  const db = getD1();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS readings (
        id TEXT PRIMARY KEY NOT NULL,
        journey_key_hash TEXT NOT NULL,
        resume_token_hash TEXT NOT NULL,
        question_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT NOT NULL,
        advisor TEXT NOT NULL,
        core_tension TEXT NOT NULL,
        reframed_question TEXT NOT NULL,
        safety_domain TEXT NOT NULL,
        safety_action TEXT NOT NULL,
        safety_message TEXT,
        spread_title TEXT NOT NULL,
        spread_json TEXT NOT NULL,
        draw_seed TEXT NOT NULL,
        interpretation_json TEXT,
        reflection_ciphertext TEXT,
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS reading_cards (
        id TEXT PRIMARY KEY NOT NULL,
        reading_id TEXT NOT NULL,
        position_index INTEGER NOT NULL,
        position_key TEXT NOT NULL,
        position_label TEXT NOT NULL,
        card_key TEXT NOT NULL,
        orientation TEXT NOT NULL,
        revealed_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE
      )
    `),
    db.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_resume_token ON readings(resume_token_hash)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_readings_journey_created ON readings(journey_key_hash, created_at)',
    ),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_readings_status ON readings(status)'),
    db.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_cards_position ON reading_cards(reading_id, position_index)',
    ),
    db.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_cards_card ON reading_cards(reading_id, card_key)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_reading_cards_reading ON reading_cards(reading_id)',
    ),
  ]);
  await db.prepare('PRAGMA optimize').run();
}
