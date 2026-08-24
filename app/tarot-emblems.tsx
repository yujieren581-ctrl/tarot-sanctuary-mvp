import type { ReactNode } from 'react';
import type { TarotCard } from './tarot-types';
import { TAROT_DECK } from './tarot-data';

// 服务器下发的牌卡 number 是牌阵位置而非牌号，且 id 是英文 slug；
// 统一解析回前端牌库，保证图腾与罗马数字对应真实的牌。
function resolveCard(card: TarotCard): TarotCard {
  return (
    TAROT_DECK.find((item) => item.id === card.id) ??
    TAROT_DECK.find((item) => item.name === card.name) ??
    card
  );
}

export function toRoman(value: number): string {
  if (value <= 0) return '0';
  const table: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let rest = value;
  let result = '';
  for (const [amount, symbol] of table) {
    while (rest >= amount) {
      result += symbol;
      rest -= amount;
    }
  }
  return result;
}

const MAJOR_EMBLEMS: Record<number, ReactNode> = {
  // 0 愚者 · 星轨
  0: (
    <>
      <path d="M10 46 Q30 18 54 38" />
      <path d="M46 16 L47.6 21.4 L53 23 L47.6 24.6 L46 30 L44.4 24.6 L39 23 L44.4 21.4 Z" />
      <circle cx="14" cy="44" r="1.4" />
    </>
  ),
  // 1 魔术师 · 无穷与权杖
  1: (
    <>
      <path d="M32 34 C32 26 20 26 20 34 C20 42 32 42 32 34 C32 26 44 26 44 34 C44 42 32 42 32 34 Z" />
      <path d="M32 12 L32 20" />
      <circle cx="32" cy="50" r="1.3" />
    </>
  ),
  // 2 女祭司 · 弦月
  2: (
    <>
      <path d="M40 12 A21 21 0 1 0 40 52 A16.5 16.5 0 1 1 40 12 Z" />
      <circle cx="47" cy="19" r="1.2" />
    </>
  ),
  // 3 皇后 · 花冠
  3: (
    <>
      <path d="M14 42 Q32 24 50 42" />
      <circle cx="20" cy="33" r="2.2" />
      <circle cx="32" cy="25" r="2.2" />
      <circle cx="44" cy="33" r="2.2" />
    </>
  ),
  // 4 皇帝 · 山形
  4: (
    <>
      <path d="M12 46 L26 26 L34 38 L42 28 L52 46 Z" />
      <path d="M10 52 L54 52" />
    </>
  ),
  // 5 教皇 · 钥匙
  5: (
    <>
      <circle cx="25" cy="25" r="7" />
      <path d="M30 30 L47 47" />
      <path d="M40 40 L44 36" />
      <path d="M44 44 L48 40" />
    </>
  ),
  // 6 恋人 · 交叠双圆
  6: (
    <>
      <circle cx="24" cy="32" r="10" />
      <circle cx="40" cy="32" r="10" />
      <circle cx="32" cy="18" r="1.3" />
    </>
  ),
  // 7 战车 · 车轮
  7: (
    <>
      <circle cx="32" cy="34" r="12" />
      <path d="M32 22 L32 46 M20 34 L44 34" />
      <path d="M18 14 L46 14" />
    </>
  ),
  // 8 力量 · 无穷与圆
  8: (
    <>
      <path d="M32 28 C32 22 22 22 22 28 C22 34 32 34 32 28 C32 22 42 22 42 28 C42 34 32 34 32 28 Z" />
      <circle cx="32" cy="44" r="4" />
    </>
  ),
  // 9 隐者 · 灯
  9: (
    <>
      <path d="M24 12 L24 52" />
      <path d="M24 20 L36 20" />
      <circle cx="38" cy="27" r="6" />
      <circle cx="38" cy="27" r="1.4" />
    </>
  ),
  // 10 命运之轮 · 八辐轮
  10: (
    <>
      <circle cx="32" cy="32" r="14" />
      <path d="M32 18 L32 46 M18 32 L46 32 M22 22 L42 42 M42 22 L22 42" />
      <circle cx="32" cy="32" r="2.5" />
    </>
  ),
  // 11 正义 · 天平
  11: (
    <>
      <path d="M32 14 L32 46" />
      <path d="M16 21 L48 21" />
      <path d="M16 21 L11 33 L21 33 Z" />
      <path d="M48 21 L43 33 L53 33 Z" />
      <path d="M25 52 L39 52" />
    </>
  ),
  // 12 倒吊人 · 倒三角
  12: (
    <>
      <path d="M32 10 L32 22" />
      <path d="M32 48 L18 22 L46 22 Z" />
    </>
  ),
  // 13 死神 · 落日线
  13: (
    <>
      <path d="M12 42 L52 42" />
      <path d="M22 42 A10 10 0 0 1 42 42" />
      <path d="M20 50 L20 54 M32 51 L32 55 M44 50 L44 54" />
    </>
  ),
  // 14 节制 · 双杯倾水
  14: (
    <>
      <path d="M14 22 A9 9 0 0 0 32 22" />
      <path d="M28 31 Q33 37 35 41" />
      <path d="M32 48 A9 9 0 0 0 50 48" />
    </>
  ),
  // 15 恶魔 · 锁链环
  15: (
    <>
      <circle cx="22" cy="34" r="6" />
      <circle cx="32" cy="26" r="5" />
      <circle cx="42" cy="34" r="6" />
      <path d="M24 14 Q32 8 40 14" />
    </>
  ),
  // 16 高塔 · 塔形与闪电
  16: (
    <>
      <path d="M26 22 L38 22 L40 52 L24 52 Z" />
      <path d="M30 52 L30 44 L34 44 L34 52" />
      <path d="M46 10 L40 22 L46 22 L42 32" />
    </>
  ),
  // 17 星星 · 八角星
  17: (
    <>
      <path d="M32 12 L35.5 28.5 L52 32 L35.5 35.5 L32 52 L28.5 35.5 L12 32 L28.5 28.5 Z" />
      <circle cx="47" cy="17" r="1.2" />
      <circle cx="17" cy="47" r="1.2" />
    </>
  ),
  // 18 月亮 · 满月与云纹
  18: (
    <>
      <circle cx="32" cy="27" r="12" />
      <path d="M14 48 Q20 42 26 48 T38 48 T50 48" />
    </>
  ),
  // 19 太阳 · 日轮
  19: (
    <>
      <circle cx="32" cy="32" r="10" />
      <path d="M32 12 L32 18 M32 46 L32 52 M12 32 L18 32 M46 32 L52 32 M18 18 L22.2 22.2 M41.8 41.8 L46 46 M46 18 L41.8 22.2 M22.2 41.8 L18 46" />
    </>
  ),
  // 20 审判 · 召唤弧
  20: (
    <>
      <path d="M12 44 Q32 18 52 44" />
      <circle cx="32" cy="11" r="1.3" />
    </>
  ),
  // 21 世界 · 月桂冠圆环
  21: (
    <>
      <circle cx="32" cy="32" r="13" />
      <path d="M17 45 Q12 32 19 19" />
      <path d="M47 45 Q52 32 45 19" />
      <circle cx="32" cy="32" r="1.4" />
    </>
  ),
};

const SUIT_EMBLEMS: Record<TarotCard['suit'], ReactNode> = {
  major: null,
  // 权杖 · 竖杖与叶
  wands: (
    <>
      <path d="M32 10 L32 54" />
      <path d="M32 22 Q40 20 42 12" />
      <path d="M32 34 Q24 32 22 24" />
    </>
  ),
  // 圣杯 · 杯形
  cups: (
    <>
      <path d="M18 20 A14 14 0 0 0 46 20" />
      <path d="M32 34 L32 46" />
      <path d="M23 50 L41 50" />
    </>
  ),
  // 宝剑 · 斜剑
  swords: (
    <>
      <path d="M22 46 L44 12" />
      <path d="M22 31 L36 39" />
      <circle cx="20" cy="48" r="2" />
    </>
  ),
  // 星币 · 圆币与五芒星
  pentacles: (
    <>
      <circle cx="32" cy="32" r="13" />
      <path d="M32 21 L38.5 40.9 L21.5 28.6 L42.5 28.6 L25.5 40.9 Z" />
    </>
  ),
};

function MinorRankMark({ card }: { card: TarotCard }) {
  const rankIndex = Number(card.id.split('-')[1]) - 1;
  if (!Number.isFinite(rankIndex) || rankIndex < 0) return null;
  if (rankIndex >= 10) {
    // 宫廷牌 · 小冠冕
    return <path d="M24 57 L24 51 L28 54 L32 49 L36 54 L40 51 L40 57 Z" />;
  }
  const count = rankIndex + 1;
  const start = 32 - (count - 1) * 2.5;
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <path key={index} d={`M${start + index * 5} 54 L${start + index * 5} 59`} />
      ))}
    </>
  );
}

export function cardNumeral(card: TarotCard): string {
  const resolved = resolveCard(card);
  return resolved.arcana === 'major' ? toRoman(resolved.number) : resolved.name;
}

export function CardEmblem({ card, className }: { card: TarotCard; className?: string }) {
  const resolved = resolveCard(card);
  const isMajor = resolved.arcana === 'major';
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isMajor ? MAJOR_EMBLEMS[resolved.number] ?? null : SUIT_EMBLEMS[resolved.suit]}
      {!isMajor && <MinorRankMark card={resolved} />}
    </svg>
  );
}
