import { describe, expect, it } from 'vitest';
import { explain } from './explain';
import { generateQuiz, LEVELS } from './generator';
import { getT } from './i18n';
import type { Question } from './types';

describe('i18n translations', () => {
  it('has consistent keys for zh and en', () => {
    const en = getT('en');
    const zh = getT('zh');
    expect(en.appTitle1).toBe('Bunny');
    expect(zh.appTitle1).toBe('小兔');

    for (const level of LEVELS) {
      expect(en.levels[level.id]).toBeDefined();
      expect(zh.levels[level.id]).toBeDefined();
      expect(typeof zh.levels[level.id].name).toBe('string');
      expect(typeof zh.levels[level.id].blurb).toBe('string');
    }

    const skills = ['add20', 'sub20', 'add', 'sub', 'carry', 'borrow', 'times', 'divide'] as const;
    for (const s of skills) {
      expect(en.skills[s]).toBeDefined();
      expect(zh.skills[s]).toBeDefined();
    }
  });

  it('generates stories with both English and Chinese text', () => {
    const quiz = generateQuiz({ level: 1, count: 20, seed: 123, kinds: ['story'] });
    const stories = quiz.filter((q): q is Question & { kind: 'story' } => q.kind === 'story');
    expect(stories.length).toBeGreaterThan(0);
    for (const s of stories) {
      expect(s.story.text).toBeTruthy();
      expect(s.story.ask).toBeTruthy();
      expect(s.story.textZh).toBeTruthy();
      expect(s.story.askZh).toBeTruthy();
    }
  });

  it('translates explanation captions into Chinese when lang=zh', () => {
    const q: Question = {
      id: 'test-1',
      fact: { a: 38, op: '+', b: 7, c: 45 },
      skill: 'carry',
      kind: 'type',
    };
    const enSteps = explain(q, 'blocks', 'en');
    const zhSteps = explain(q, 'blocks', 'zh');
    expect(enSteps[0].caption).toBe('Make *38* and *7* with blocks.');
    expect(zhSteps[0].caption).toBe('用积木摆出 *38* 和 *7*。');

    const enCol = explain(q, 'column', 'en');
    const zhCol = explain(q, 'column', 'zh');
    expect(enCol[0].caption).toBe('Stack them up: *ones under ones*.');
    expect(zhCol[0].caption).toBe('列竖式：*相同数位对齐*。');
  });
});
