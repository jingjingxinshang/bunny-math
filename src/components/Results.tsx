import { useEffect, useState } from 'preact/hooks';
import { bigParty } from '../lib/celebrate';
import { SKILL_LABELS } from '../lib/generator';
import { getT, useLang } from '../lib/i18n';
import { sounds } from '../lib/sound';
import type { Question, Skill } from '../lib/types';
import { Bunny, Star } from './Bunny';
import { ExplainSheet } from './Explain';
import { LangButton } from './Home';
import type { QuizResult } from './Quiz';

export function starsFor(right: number, total: number) {
  const p = right / total;
  return p >= 0.9 ? 3 : p >= 0.7 ? 2 : 1;
}

type Props = {
  result: QuizResult;
  sticker: string | null;
  canLevelUp: boolean;
  onHome: () => void;
  onAgain: () => void;
  onPractice: (skills: Skill[]) => void;
  onNextLevel: () => void;
};

export function Results({ result, sticker, canLevelUp, onHome, onAgain, onPractice, onNextLevel }: Props) {
  const { lang } = useLang();
  const t = getT(lang);
  const { questions, firstTry } = result;
  const right = questions.filter((q) => firstTry[q.id]).length;
  const stars = starsFor(right, questions.length);
  const [looking, setLooking] = useState<Question | null>(null);

  useEffect(() => {
    if (stars >= 2) bigParty();
  }, []);

  const bySkill = new Map<Skill, { right: number; total: number }>();
  for (const q of questions) {
    const s = bySkill.get(q.skill) ?? { right: 0, total: 0 };
    s.total++;
    if (firstTry[q.id]) s.right++;
    bySkill.set(q.skill, s);
  }
  const missedSkills = [...bySkill].filter(([, s]) => s.right < s.total).map(([k]) => k);
  const missed = questions.length - right;

  return (
    <section class="screen">
      <header class="topbar">
        <button class="puffy icon-btn" aria-label="Home" onClick={onHome}>
          🏠
        </button>
        <span class="spacer" />
        <LangButton />
      </header>
      <div class="res-body">
        <div class="res-hero">
          <div class="stars" aria-label={`${stars} of 3 stars`}>
            {[1, 2, 3].map((n) => (
              <Star key={n} empty={n > stars} />
            ))}
          </div>
          <p class="cheer">{t.resultsCheer[stars]}</p>
          <p class="score">{t.scoreText(right, questions.length)}</p>
          <Bunny mood="cheer" />
        </div>
        <div class="res-side">
          <div class="panel">
            <h2>
              {t.yourAnswers} <small>{t.tapToSeeHow}</small>
            </h2>
            <div class="qgrid">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  class={firstTry[q.id] ? '' : 'x'}
                  aria-label={t.questionAria(i + 1, !!firstTry[q.id])}
                  onClick={() => {
                    sounds.tap();
                    setLooking(q);
                  }}
                >
                  {i + 1}
                  {firstTry[q.id] ? '✓' : '✗'}
                </button>
              ))}
            </div>
          </div>
          <div class="panel">
            <ul class="skills">
              {[...bySkill].map(([skill, s]) => (
                <li key={skill}>
                  {SKILL_LABELS[skill].icon} {t.skills[skill] ?? SKILL_LABELS[skill].label}
                  <span class="skill-count">
                    {s.right}/{s.total}
                  </span>
                  {s.right / s.total >= 0.8 ? <span class="chip great">{t.superChip}</span> : <span class="chip grow">{t.practiceMoreChip}</span>}
                </li>
              ))}
            </ul>
          </div>
          {sticker && (
            <div class="panel sticker-row">
              <div class="sticker">{sticker}</div>
              <div>
                <b style={{ fontSize: '20px' }}>{t.newSticker}</b>
                <br />
                <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{t.stickerInBook}</span>
              </div>
            </div>
          )}
          <div class="res-actions">
            {missed > 0 ? (
              <button class="puffy butter" onClick={() => onPractice(missedSkills)}>
                {t.practiceMoreBtn}
              </button>
            ) : canLevelUp ? (
              <button class="puffy butter" onClick={onNextLevel}>
                {t.nextLevelBtn}
              </button>
            ) : null}
            <button class="puffy berry" onClick={onAgain}>
              {t.playAgainBtn}
            </button>
          </div>
        </div>
      </div>
      {looking && <ExplainSheet question={looking} onClose={() => setLooking(null)} />}
    </section>
  );
}
