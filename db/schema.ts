import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const readings = sqliteTable(
  'readings',
  {
    id: text('id').primaryKey(),
    journeyKeyHash: text('journey_key_hash').notNull(),
    resumeTokenHash: text('resume_token_hash').notNull(),
    questionHash: text('question_hash').notNull(),
    status: text('status').notNull(),
    category: text('category').notNull(),
    advisor: text('advisor').notNull(),
    coreTension: text('core_tension').notNull(),
    reframedQuestion: text('reframed_question').notNull(),
    safetyDomain: text('safety_domain').notNull(),
    safetyAction: text('safety_action').notNull(),
    safetyMessage: text('safety_message'),
    spreadTitle: text('spread_title').notNull(),
    spreadJson: text('spread_json').notNull(),
    drawSeed: text('draw_seed').notNull(),
    interpretationJson: text('interpretation_json'),
    reflectionCiphertext: text('reflection_ciphertext'),
    createdAt: integer('created_at').notNull(),
    completedAt: integer('completed_at'),
  },
  (table) => [
    uniqueIndex('idx_readings_resume_token').on(table.resumeTokenHash),
    index('idx_readings_journey_created').on(table.journeyKeyHash, table.createdAt),
    index('idx_readings_status').on(table.status),
  ],
);

export const readingCards = sqliteTable(
  'reading_cards',
  {
    id: text('id').primaryKey(),
    readingId: text('reading_id')
      .notNull()
      .references(() => readings.id, { onDelete: 'cascade' }),
    positionIndex: integer('position_index').notNull(),
    positionKey: text('position_key').notNull(),
    positionLabel: text('position_label').notNull(),
    cardKey: text('card_key').notNull(),
    orientation: text('orientation').notNull(),
    revealedAt: integer('revealed_at'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_reading_cards_position').on(table.readingId, table.positionIndex),
    uniqueIndex('idx_reading_cards_card').on(table.readingId, table.cardKey),
    index('idx_reading_cards_reading').on(table.readingId),
  ],
);
