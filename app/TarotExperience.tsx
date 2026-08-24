'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { classifyQuestion, demoAnalysis, isHighRiskQuestion, PERSONAS, previewDraw, SPREADS } from './tarot-data';
import { getOrCreateJourneyKey, tarotApi } from './tarot-api';
import { DrawnCard, JourneyData, ReadingAnalysis, ReadingRecord, ReadingStep, QuestionProfile, TarotPersona } from './tarot-types';
import { CardEmblem, cardNumeral } from './tarot-emblems';
import './tarot-experience.css';

type RitualPhase = 'grounding' | 'shuffle' | 'cut' | 'select';

const READING_FLOW: Array<{ step: ReadingStep; label: string }> = [
  { step: 'understand', label: '理解问题' },
  { step: 'ritual', label: '准备阅读' },
  { step: 'reveal', label: '抽取牌面' },
  { step: 'reading', label: '阅读解读' },
];

const EMPTY_JOURNEY: JourneyData = { readings: [], frequentCards: [], themes: [], preview: true };

export default function TarotExperience() {
  const [step, setStep] = useState<ReadingStep>('home');
  const [question, setQuestion] = useState('');
  const [profile, setProfile] = useState<QuestionProfile | null>(null);
  const [persona, setPersona] = useState<TarotPersona>(PERSONAS.nyx);
  const [ritualPhase, setRitualPhase] = useState<RitualPhase>('grounding');
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [analysis, setAnalysis] = useState<ReadingAnalysis | null>(null);
  const [journey, setJourney] = useState<JourneyData>(EMPTY_JOURNEY);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [readingId, setReadingId] = useState('');
  const [resumeToken, setResumeToken] = useState('');
  const [reflection, setReflection] = useState('');
  const [cutting, setCutting] = useState(false);
  const [cutPile, setCutPile] = useState<number | null>(null);
  const firstRender = useRef(true);

  const spread = profile ? SPREADS[profile.category] : null;
  const visibleCards = cards.slice(0, 3);
  const flowIndex = READING_FLOW.findIndex((item) => item.step === step);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-stage-title]')?.focus();
    });
  }, [step, ritualPhase]);

  useEffect(() => {
    const saved = window.localStorage.getItem('ai-tarot-room-active-reading');
    if (!saved) return;
    let active: { readingId: string; resumeToken: string };
    try {
      active = JSON.parse(saved) as { readingId: string; resumeToken: string };
    } catch {
      window.localStorage.removeItem('ai-tarot-room-active-reading');
      return;
    }
    if (!active.readingId || !active.resumeToken) return;
    tarotApi
      .resumeReading(active.readingId, active.resumeToken)
      .then((restored) => {
        setReadingId(active.readingId);
        setResumeToken(active.resumeToken);
        setProfile(restored.profile);
        setPersona(restored.profile.persona);
        setCards(restored.cards);
        setPreview(false);
        if (restored.status === 'COMPLETE' && restored.interpretation) {
          setAnalysis(restored.interpretation);
          setStep('reading');
        } else {
          setRitualPhase('grounding');
          setStep('ritual');
        }
      })
      .catch(() => window.localStorage.removeItem('ai-tarot-room-active-reading'));
  }, []);

  useEffect(() => {
    if (step !== 'journey') return;
    const journeyKey = getOrCreateJourneyKey();
    tarotApi.getJourney(journeyKey).then(setJourney).catch(() => setJourney(readPreviewJourney()));
  }, [step]);

  function beginReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    if (isHighRiskQuestion(trimmed)) {
      setStep('safety');
      return;
    }
    const nextProfile = classifyQuestion(trimmed);
    setProfile(nextProfile);
    setPersona(nextProfile.persona);
    setStep('understand');
  }

  async function confirmReading() {
    if (!profile) return;
    setBusy(true);
    const localCards = previewDraw(question, profile.category);
    setCards(localCards);
    setAnalysis(demoAnalysis(profile, localCards));
    setPreview(true);
    try {
      const created = await tarotApi.createReading(question, getOrCreateJourneyKey());
      setReadingId(created.readingId);
      setResumeToken(created.resumeToken);
      window.localStorage.setItem(
        'ai-tarot-room-active-reading',
        JSON.stringify({ readingId: created.readingId, resumeToken: created.resumeToken }),
      );
      setPreview(false);
    } catch {
      // Preview mode intentionally remains visible when the server is unavailable.
    }
    setBusy(false);
    setRitualPhase('grounding');
    setCutting(false);
    setCutPile(null);
    setSelectedSlots([]);
    setStep('ritual');
  }

  function moveRitual() {
    setRitualPhase((phase) => phase === 'grounding' ? 'shuffle' : phase === 'shuffle' ? 'cut' : 'select');
  }

  function chooseCutPile(pile: number) {
    if (cutting) return;
    setCutPile(pile);
    setCutting(true);
    window.setTimeout(() => {
      setCutting(false);
      setRitualPhase('select');
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350);
  }

  async function selectCard(slot: number) {
    if (selectedSlots.includes(slot) || selectedSlots.length >= 3) return;
    const next = [...selectedSlots, slot];
    setSelectedSlots(next);
    if (next.length !== 3) return;
    setBusy(true);
    const minimumPause = new Promise<void>((resolve) => {
      window.setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520);
    });
    if (readingId && resumeToken) {
      try {
        const drawn = await tarotApi.drawCards(readingId, resumeToken);
        if (drawn.cards?.length === 3) {
          setCards(drawn.cards);
          if (drawn.interpretation) setAnalysis(drawn.interpretation);
          setPreview(false);
        }
      } catch {
        setPreview(true);
      }
    }
    await minimumPause;
    setBusy(false);
    setRevealedCount(0);
    setStep('reveal');
  }

  function continueReveal() {
    if (revealedCount < visibleCards.length) setRevealedCount((count) => count + 1);
    else {
      if (preview && profile && analysis) savePreviewReading({ question, profile, cards: visibleCards, analysis });
      setStep('reading');
    }
  }

  async function openJourney() {
    if (reflection.trim() && readingId && resumeToken && !preview) {
      try {
        await tarotApi.saveReflection(readingId, resumeToken, reflection.trim());
      } catch {
        // A reflection save should not block the user from opening their journey.
      }
    }
    setStep('journey');
  }

  function restart() {
    window.localStorage.removeItem('ai-tarot-room-active-reading');
    setStep('home'); setQuestion(''); setProfile(null); setCards([]); setAnalysis(null); setRevealedCount(0); setSelectedSlots([]); setPreview(false); setReadingId(''); setResumeToken(''); setReflection(''); setRitualPhase('grounding'); setCutting(false); setCutPile(null); setBusy(false);
  }

  return <main className="tarot-room-shell">
    <div className="tarot-ambient" aria-hidden="true" />
    <div className="tarot-stars" aria-hidden="true" />
    <header className="tarot-header">
      <button className="tarot-brand" onClick={restart} type="button" aria-label="返回塔罗静室首页"><span className="tarot-brand-mark">静</span><span>塔罗静室</span></button>
      <div className="tarot-header-meta"><span className="live-dot" /><span className="room-open-copy">随时为你开放</span><button className="tarot-journey-button" onClick={() => setStep('journey')} type="button">我的旅程 ↗</button></div>
    </header>
    {flowIndex >= 0 && <nav className="tarot-progress" aria-label="阅读进度"><p className="progress-summary">{flowIndex + 1} / 4 · {READING_FLOW[flowIndex].label}</p><ol>{READING_FLOW.map((item, index) => <li key={item.step} className={step === item.step ? 'is-current' : flowIndex > index ? 'is-done' : ''} aria-current={step === item.step ? 'step' : undefined}><span className="progress-number">0{index + 1}</span><span className="progress-label">{item.label}</span></li>)}</ol></nav>}

    {step === 'home' && <HomeView question={question} setQuestion={setQuestion} onSubmit={beginReading} />}
    {step === 'safety' && <SafetyView onBack={() => setStep('home')} />}
    {step === 'understand' && profile && spread && <UnderstandView profile={profile} persona={persona} setPersona={setPersona} spread={spread} onConfirm={confirmReading} busy={busy} />}
    {step === 'ritual' && profile && <RitualView phase={ritualPhase} selectedSlots={selectedSlots} onAdvance={moveRitual} onSkip={() => setRitualPhase('select')} onCut={chooseCutPile} cutPile={cutPile} onSelect={selectCard} busy={busy} cutting={cutting} />}
    {step === 'reveal' && <RevealView cards={visibleCards} revealedCount={revealedCount} onContinue={continueReveal} />}
    {step === 'reading' && profile && analysis && <ReadingView profile={profile} persona={persona} cards={visibleCards} analysis={analysis} preview={preview} reflection={reflection} setReflection={setReflection} onJourney={openJourney} onRestart={restart} />}
    {step === 'journey' && <JourneyView journey={journey} onBack={() => setStep('home')} />}
    <footer className="tarot-footer"><span>用于自我探索，不作未来预言。</span><span>象征解读不替代医疗、法律或财务专业建议。</span></footer>
  </main>;
}

function HomeView({ question, setQuestion, onSubmit }: { question: string; setQuestion: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const starters = ['我正在犹豫一个选择……', '一段关系让我反复消耗……', '我不知道下一步该往哪里走……'];
  function chooseStarter(value: string) {
    setQuestion(value);
    window.requestAnimationFrame(() => questionInput.current?.focus());
  }
  return <section className="tarot-stage tarot-home" data-stage-root tabIndex={-1} aria-labelledby="room-title"><p className="tarot-kicker">一处留给你的安静空间</p><h1 id="room-title" data-stage-title tabIndex={-1}>此刻，是什么<br /><em>让你挂念？</em></h1><p className="tarot-lede">不必讲完整，一句话就可以。我们会先陪你理清真正的问题。</p><div className="starter-prompts" aria-label="可以从这些句子开始">{starters.map((starter) => <button key={starter} type="button" onClick={() => chooseStarter(starter)}>{starter}<span aria-hidden="true">→</span></button>)}</div><form className="tarot-question-card" onSubmit={onSubmit}><label htmlFor="tarot-question">从最近反复出现的一件事说起</label><textarea ref={questionInput} id="tarot-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：我想换工作，但又担心失去现在的稳定。" rows={4} maxLength={600} /><div className="tarot-composer-footer"><span className="tarot-private">内容用于生成本次阅读，不会公开展示</span><button className="tarot-primary-button" disabled={!question.trim()} type="submit">开始阅读 <span aria-hidden="true">→</span></button></div></form></section>;
}

function SafetyView({ onBack }: { onBack: () => void }) {
  return <section className="tarot-stage tarot-safety" data-stage-root tabIndex={-1} aria-labelledby="safety-title"><p className="tarot-kicker">先停一停</p><h1 id="safety-title" data-stage-title tabIndex={-1}>这件事，值得<br /><em>现实中的关照。</em></h1><p>塔罗可以陪你整理感受，但不能替代医生、心理咨询师、财务顾问或律师。如果你正处在危险中，请现在联系当地急救服务或你信任的人。</p><div className="safety-card"><strong>如果你可能伤害自己</strong><span>请立即拨打当地急救电话，或前往最近的急诊室。不要独处。</span></div><button className="tarot-secondary-button" onClick={onBack} type="button">返回静室</button></section>;
}

function UnderstandView({ profile, persona, setPersona, spread, onConfirm, busy }: { profile: QuestionProfile; persona: TarotPersona; setPersona: (persona: TarotPersona) => void; spread: { name: string; nameZh: string; description: string; positions: Array<{ id: string; label: string; labelZh: string; prompt: string }> }; onConfirm: () => void; busy: boolean }) {
  return <section className="tarot-stage tarot-understand" data-stage-root tabIndex={-1} aria-labelledby="understand-title"><div className="stage-heading"><p className="tarot-kicker">01 · 我听见了</p><h1 id="understand-title" data-stage-title tabIndex={-1}>为你的<br /><em>{profile.labelZh}</em>准备</h1><span className="stage-rule" /></div><div className="understand-grid"><article className="understand-summary"><p className="small-label">我听见的张力</p><h2>{profile.tensionZh}</h2><p>{profile.focus}</p></article><aside className="persona-card"><p className="small-label">本次读牌者</p><div className="persona-name"><span className={`persona-seal ${persona.id}`} aria-hidden="true">{persona.name.slice(0, 1)}</span><strong>{persona.name}</strong><small>{persona.role}</small></div><p>{persona.description}</p><div className="persona-switcher" role="group" aria-label="选择读牌者">{Object.values(PERSONAS).map((option) => <button key={option.id} aria-pressed={persona.id === option.id} className={persona.id === option.id ? 'selected' : ''} onClick={() => setPersona(option)} type="button">{option.name}</button>)}</div></aside></div><div className="spread-confirm"><p className="small-label">为你准备的牌阵</p><h2>{spread.nameZh} <small>{spread.name}</small></h2><p>{spread.description}</p><div className="spread-positions">{spread.positions.map((position, index) => <div key={position.id}><span>0{index + 1}</span><strong>{position.labelZh}</strong><small>{position.prompt}</small></div>)}</div><button className="tarot-primary-button" onClick={onConfirm} disabled={busy} type="button">{busy ? '正在准备…' : '进入仪式'} <span aria-hidden="true">→</span></button></div></section>;
}

function RitualView({ phase, selectedSlots, onAdvance, onSkip, onCut, cutPile, onSelect, busy, cutting }: { phase: RitualPhase; selectedSlots: number[]; onAdvance: () => void; onSkip: () => void; onCut: (pile: number) => void; cutPile: number | null; onSelect: (slot: number) => void; busy: boolean; cutting: boolean }) {
  const copy = { grounding: ['02 · 抵达', '在翻牌之前，先回到此刻。', '慢慢呼吸一次。让问题留在这里，不必急着把它解决。'], shuffle: ['02 · 洗牌', '静室正在为你留出空间。', '没有所谓正确的问法。当你不再强求答案，留意心里发生了什么。'], cut: ['02 · 切牌', '选择故事从哪里打开。', '当你的手准备好时，轻轻切开牌组。'], select: ['02 · 选牌', '凭直觉，选择三张牌。', '没有选错这回事。此刻，只需看见牌背。'] }[phase];
  const pileNames = ['左侧', '中间', '右侧'];
  return <section className={`tarot-stage tarot-ritual ritual-${phase}`} data-stage-root tabIndex={-1} aria-labelledby="ritual-title"><div className="stage-heading"><p className="tarot-kicker">{copy[0]}</p><h1 id="ritual-title" data-stage-title tabIndex={-1}>{copy[1]}</h1><p>{copy[2]}</p></div><div className="ritual-table">{phase === 'select' ? <div className="card-selection">{[0, 1, 2, 3, 4].map((slot) => { const selected = selectedSlots.includes(slot); const unavailable = busy || selected || selectedSlots.length >= 3; return <button key={slot} aria-label={selected ? `第 ${slot + 1} 张牌，已作为第 ${selectedSlots.indexOf(slot) + 1} 张选中` : `选择第 ${slot + 1} 张牌`} aria-pressed={selected} disabled={unavailable} className={`card-back ${selected ? 'is-selected' : ''}`} onClick={() => onSelect(slot)} type="button"><span>{selected ? `0${selectedSlots.indexOf(slot) + 1}` : '静'}</span></button>; })}</div> : phase === 'cut' ? <div className="cut-piles" role="group" aria-label="选择一叠牌">{[0, 1, 2].map((pile) => <button key={pile} className={`cut-pile cut-pile-${pile + 1} ${cutPile === pile ? 'is-chosen' : ''}`} aria-label={`选择${pileNames[pile]}的牌`} aria-pressed={cutPile === pile} onClick={() => onCut(pile)} disabled={cutting} type="button"><span>静</span><small>{pileNames[pile]}</small></button>)}</div> : <div className={`ritual-deck ritual-deck-${phase}`}><span>静</span><i>塔罗静室</i></div>}</div>{phase === 'cut' ? <p className="ritual-live" role="status" aria-live="polite">{cutting && cutPile !== null ? `已选择${pileNames[cutPile]}，牌组正在落位……` : '轻触其中一叠，故事会从那里打开。'}</p> : phase === 'select' ? <p className="ritual-live" role="status" aria-live="polite">{busy ? '正在安放三张牌……' : `已选择 ${selectedSlots.length} / 3 张`}</p> : <div className="ritual-controls"><button className="tarot-primary-button" onClick={onAdvance} type="button">{phase === 'grounding' ? '我准备好了' : '完成洗牌，开始切牌'} <span aria-hidden="true">→</span></button><button className="ritual-skip" onClick={onSkip} type="button">跳过准备，直接选牌</button></div>}</section>;
}

function RevealView({ cards, revealedCount, onContinue }: { cards: DrawnCard[]; revealedCount: number; onContinue: () => void }) {
  const current = cards[revealedCount];
  const activeIndex = revealedCount === 0 ? 0 : Math.min(revealedCount - 1, cards.length - 1);
  const lastRevealed = revealedCount > 0 ? cards[revealedCount - 1] : null;
  const ordinal = ['一', '二', '三'][revealedCount];
  return <section className="tarot-stage tarot-reveal" data-stage-root tabIndex={-1} aria-labelledby="reveal-title"><div className="stage-heading"><p className="tarot-kicker">03 · 揭牌</p><h1 id="reveal-title" data-stage-title tabIndex={-1}>让每一张牌，<br /><em>在它的时刻抵达。</em></h1></div><p className="reveal-live" role="status" aria-live="polite">{lastRevealed ? `刚刚揭开：${lastRevealed.positionZh} · ${lastRevealed.nameZh} · ${lastRevealed.polarity === 'upright' ? '正位' : '逆位'}` : '三张牌已经安放好。准备好时，从第一张开始。'}</p><div className="reveal-cards">{cards.map((card, index) => { const state = index === activeIndex ? 'active' : index < revealedCount ? 'revealed' : index === revealedCount ? 'next' : 'future'; return <article className={`reveal-card ${state} ${index < revealedCount ? 'is-revealed' : ''}`} key={card.id}><div className="reveal-card-inner"><div className="reveal-back" aria-hidden={index < revealedCount}><span className="back-seal">静</span></div><div className="reveal-face" aria-hidden={index >= revealedCount}><div className="reveal-face-top"><span className="card-position">{card.positionZh}</span><span className="card-numeral">{cardNumeral(card)}</span></div><span className={`card-emblem ${card.polarity === 'reversed' ? 'is-reversed' : ''}`}><CardEmblem card={card} /></span><strong>{card.nameZh}</strong><small className="polarity-chip">{card.polarity === 'upright' ? '正位' : '逆位'}</small><p>{card.oneLine}</p></div></div></article>; })}</div>{revealedCount < cards.length && current ? <button className="tarot-primary-button" onClick={onContinue} type="button">揭开第{ordinal}张 · {current.positionZh} <span aria-hidden="true">→</span></button> : <button className="tarot-primary-button" onClick={onContinue} type="button">阅读牌面脉络 <span aria-hidden="true">→</span></button>}</section>;
}

function ReadingView({ profile, persona, cards, analysis, preview, reflection, setReflection, onJourney, onRestart }: { profile: QuestionProfile; persona: TarotPersona; cards: DrawnCard[]; analysis: ReadingAnalysis; preview: boolean; reflection: string; setReflection: (value: string) => void; onJourney: () => void; onRestart: () => void }) {
  const journeyAction = preview ? '查看本地旅程' : reflection.trim() ? '保存并查看旅程' : '稍后再写，查看旅程';
  return <section className="tarot-stage tarot-reading" data-stage-root tabIndex={-1} aria-labelledby="reading-title"><div className="reading-intro"><p className="tarot-kicker">04 · 你的阅读 · {persona.name}</p>{preview && <span className="preview-badge">本地预览 · 已保存在此设备</span>}<h1 id="reading-title" data-stage-title tabIndex={-1}>{analysis.thesisZh}</h1><p className="reading-question">“{profile.labelZh} · {profile.tensionZh}”</p>{analysis.boundaryNote && <p className="reading-boundary">{analysis.boundaryNote}</p>}</div><div className="insight-grid"><div className="insight-heading"><p className="small-label">贯穿其中的线索</p><h2>三个线索，指向同一件事</h2></div><div className="insight-items">{analysis.insights.map((insight, index) => <article className="insight-card" key={insight.title}><span>0{index + 1}</span><h3>{insight.title}</h3><p>{insight.bodyZh}</p></article>)}</div></div><div className="section-ornament" aria-hidden="true">☾</div><div className="reading-cards"><p className="small-label">完整牌面 · 逐张展开</p>{cards.map((card, index) => <details className="reading-card" key={card.id} open={index === 0}><summary><span className="reading-card-index">{card.positionZh}</span><span><span className="reading-card-title"><CardEmblem card={card} className={`mini-emblem ${card.polarity === 'reversed' ? 'is-reversed' : ''}`} /><strong>{card.nameZh}</strong></span><small>{card.polarity === 'upright' ? '正位' : '逆位'} · {card.keywords.join(' / ')}</small></span><span className="details-toggle" aria-hidden="true" /></summary><div className="reading-card-detail"><p>{card.oneLine}。这不是结论，而是一个值得你继续观察的角度。</p></div></details>)}</div><div className="section-ornament" aria-hidden="true">☾</div><div className="actions-block"><p className="small-label">把这次阅读带回生活</p><ol>{analysis.actions.map((action, index) => <li key={action}><span>0{index + 1}</span><p>{action}</p></li>)}</ol></div><div className="section-ornament" aria-hidden="true">☾</div><div className="reflection-block"><label htmlFor="reflection">{analysis.reflection}</label><textarea id="reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="写给下一个会来到这里的自己……" rows={4} /><p className="save-note">{preview ? '当前为本地预览，这段文字只会保留到你离开页面。' : '只有点击保存后，这段文字才会加入本次旅程。'}</p><div className="reading-actions"><button className="tarot-primary-button" onClick={onJourney} type="button">{journeyAction} <span aria-hidden="true">→</span></button><button className="tarot-secondary-button" onClick={() => downloadShareCard(profile, cards, analysis)} type="button">保存分享卡片</button><button className="text-button" onClick={onRestart} type="button">开始下一次阅读</button></div></div></section>;
}

function JourneyView({ journey, onBack }: { journey: JourneyData; onBack: () => void }) {
  const lowSample = journey.readings.length < 3;
  return <section className="tarot-stage tarot-journey" data-stage-root tabIndex={-1}><div className="stage-heading"><button className="back-button" onClick={onBack} type="button">← 返回静室</button><p className="tarot-kicker">我的塔罗旅程</p><h1 data-stage-title tabIndex={-1}>故事仍在<br /><em>慢慢成为。</em></h1><p>一些问题会重复出现，直到我们准备好用新的方式听见它们。</p></div>{journey.preview && <span className="preview-badge">本地预览 · 仅保存在此设备</span>}<div className="journey-stats"><div><span>{journey.readings.length}</span><small>阅读次数</small></div><div><span>{journey.frequentCards[0]?.card.nameZh || '—'}</span><small>最常出现的牌</small></div><div><span>{journey.themes[0]?.label || '刚刚开始'}</span><small>正在浮现的主题</small></div></div><div className="journey-section"><p className="small-label">最近的阅读</p>{journey.readings.length === 0 ? <p className="empty-journey">你的第一段故事会从下一次阅读开始。</p> : journey.readings.slice(0, 5).map((reading) => <article className="journey-reading" key={reading.id}><time>{new Date(reading.createdAt).toLocaleDateString('zh-CN')}</time><strong>{reading.profile.labelZh}</strong><span>{reading.cards.length ? reading.cards.map((card) => card.nameZh).join(' · ') : reading.analysis.thesisZh}</span></article>)}</div><div className="journey-section"><p className="small-label">反复出现的主题</p>{lowSample ? <div className="low-sample">还需要 {3 - journey.readings.length} 次阅读，才能看见更可靠的主题变化。<br /><small>旅程会随着你的故事累积而变得清晰。</small></div> : <div className="theme-list">{journey.themes.map((theme) => <span key={theme.label}>{theme.label}<b>{theme.count}</b></span>)}</div>}</div></section>;
}

function savePreviewReading(input: { question: string; profile: QuestionProfile; cards: DrawnCard[]; analysis: ReadingAnalysis }) {
  if (typeof window === 'undefined') return;
  const key = 'ai-tarot-room-preview-readings';
  const existing = JSON.parse(window.localStorage.getItem(key) || '[]') as Array<Record<string, unknown>>;
  const record = { id: `preview-${Date.now()}`, createdAt: new Date().toISOString(), ...input, preview: true };
  window.localStorage.setItem(key, JSON.stringify([record, ...existing].slice(0, 20)));
}

function readPreviewJourney(): JourneyData {
  if (typeof window === 'undefined') return EMPTY_JOURNEY;
  const readings = JSON.parse(
    window.localStorage.getItem('ai-tarot-room-preview-readings') || '[]',
  ) as ReadingRecord[];
  const cardCounts = new Map<string, { card: DrawnCard; count: number }>();
  const themeCounts = new Map<string, number>();
  readings.forEach((reading) => { reading.cards.forEach((card: DrawnCard) => { const prior = cardCounts.get(card.id); cardCounts.set(card.id, { card, count: (prior?.count || 0) + 1 }); }); themeCounts.set(reading.profile.labelZh, (themeCounts.get(reading.profile.labelZh) || 0) + 1); });
  return { readings, frequentCards: [...cardCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5), themes: [...themeCounts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count), preview: true };
}

function downloadShareCard(profile: QuestionProfile, cards: DrawnCard[], analysis: ReadingAnalysis) {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1500;
  const context = canvas.getContext('2d'); if (!context) return;
  context.fillStyle = '#0C0F0D'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#C6A76A'; context.lineWidth = 2; context.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);
  context.fillStyle = '#C6A76A'; context.font = '600 22px "PingFang SC", sans-serif'; context.letterSpacing = '6px'; context.fillText('塔罗静室  ·  私人阅读', 100, 140);
  context.fillStyle = '#F1EBDD'; context.font = '400 54px "Songti SC", STSong, serif'; wrapCanvasText(context, analysis.thesisZh, 100, 300, 1000, 78);
  context.fillStyle = '#9B9A91'; context.font = '400 22px "PingFang SC", sans-serif'; context.fillText(profile.labelZh, 100, 510);
  context.fillStyle = '#F1EBDD'; context.font = '400 28px "Songti SC", STSong, serif'; cards.forEach((card, index) => { const x = 100 + index * 330; context.fillText(card.nameZh, x, 700); context.fillStyle = '#C6A76A'; context.font = '18px "PingFang SC", sans-serif'; context.fillText(card.polarity === 'upright' ? '正位' : '逆位', x, 740); context.fillStyle = '#F1EBDD'; context.font = '24px "Songti SC", STSong, serif'; });
  context.fillStyle = '#9B9A91'; context.font = '24px "Songti SC", STSong, serif'; wrapCanvasText(context, '用于自我探索，不作未来预言。', 100, 1250, 1000, 38);
  const link = document.createElement('a'); link.download = `塔罗静室-${new Date().toISOString().slice(0, 10)}.png`; link.href = canvas.toDataURL('image/png'); link.click();
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) { let line = ''; for (const char of text) { const next = line + char; if (context.measureText(next).width > maxWidth && line) { context.fillText(line, x, y); line = char; y += lineHeight; } else line = next; } context.fillText(line, x, y); }
