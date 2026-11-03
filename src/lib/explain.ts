import type { Lang } from './i18n';
import { compareSign, digit, opSymbol } from './generator';
import type { ExplainStyle } from './storage';
import type { Fact, Question } from './types';

/**
 * Builds the "Show me how" steps for a question. Each step is one picture and one short line.
 * Two styles:
 * - blocks: base-ten blocks (a square is 100, a rod is 10, a cube is 1), and dot arrays for × and ÷
 * - column: the written column method (竖式), one column at a time
 *
 * Captions use *stars* around the words to highlight.
 */

export type Color = 'a' | 'b' | 'new';
export type Piece = { color: Color; state?: 'gone' | 'mark' };
export type Group = { flats?: Piece[]; rods: Piece[]; cubes: Piece[] };

/** One written digit in the column method. */
export type Cell = { t: string; tone?: 'a' | 'b' | 'new' | 'carry'; dot?: boolean };
export type ColRow = {
  /** The sign or divisor written to the left. */
  label?: string;
  cells: (Cell | null)[];
  /** Draw the line above this row. */
  rule?: boolean;
  /** Small carried digits. */
  carry?: boolean;
  /** The number being divided, under the division bracket. */
  bracket?: boolean;
};

export type Scene =
  | { type: 'blocks'; parts: (Group | '+')[]; result?: number }
  | { type: 'text'; lines: string[] }
  /** `rows` rows of `cols` dots; with `totals`, each row shows the running count. */
  | { type: 'array'; rows: number; cols: number; totals?: boolean; result?: number }
  /** `focus` is the column (from the left) being worked on. */
  | { type: 'column'; width: number; rows: ColRow[]; focus?: number; division?: boolean; result?: number };
export type Step = { scene: Scene; caption: string };

const PLACE = ['Ones', 'Tens', 'Hundreds'];
const H = (n: number) => digit(n, 2);
const T = (n: number) => digit(n, 1);
const O = (n: number) => digit(n, 0);
const len = (n: number) => String(n).length;
const many = (n: number, piece: Piece): Piece[] => Array.from({ length: n }, () => ({ ...piece }));
const group = (n: number, color: Color): Group => ({
  flats: many(Math.floor(n / 100), { color }),
  rods: many(T(n), { color }),
  cubes: many(O(n), { color }),
});
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sym = (op: Fact['op']) => opSymbol(op);

/** "3 hundreds, 4 tens and 5 ones" (leaving out the zeros). */
function placeWords(n: number) {
  const parts = [
    [Math.floor(n / 100), 'hundred'],
    [T(n), 'ten'],
    [O(n), 'one'],
  ]
    .filter(([k]) => k)
    .map(([k, w]) => plural(k as number, w as string));
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
}

const marked = (pieces: Piece[], from: number, to: number) => pieces.map((p, i) => (i >= from && i < to ? { ...p, state: 'mark' as const } : p));
const gone = (pieces: Piece[], n: number) => pieces.map((p, i) => (i >= pieces.length - n ? { ...p, state: 'gone' as const } : p));

/* ---------- Blocks ---------- */

function addBlocks({ a, b, c }: Fact): Step[] {
  const steps: Step[] = [
    { scene: { type: 'blocks', parts: [group(a, 'a'), '+', group(b, 'b')] }, caption: `Make *${a}* and *${b}* with blocks.` },
  ];
  let flats = [...many(H(a), { color: 'a' }), ...many(H(b), { color: 'b' })];
  let rods = [...many(T(a), { color: 'a' }), ...many(T(b), { color: 'b' })];
  let cubes = [...many(O(a), { color: 'a' }), ...many(O(b), { color: 'b' })];
  const show = (g: Group): Scene => ({ type: 'blocks', parts: [g] });
  const onesSum = O(a) + O(b);

  steps.push({
    scene: show({ flats, rods, cubes }),
    caption: a < 10 && b < 10 ? `Put them together: *${onesSum}* ones.` : `Put the ones together: *${O(a)} + ${O(b)} = ${onesSum}*`,
  });
  if (onesSum >= 10) {
    steps.push({ scene: show({ flats, rods, cubes: marked(cubes, 0, 10) }), caption: `Circle *10 ones*…` });
    rods = [...rods, { color: 'new' }];
    cubes = cubes.slice(10);
    steps.push({ scene: show({ flats, rods, cubes }), caption: `…they turn into *1 ten*!` });
  }

  const carried = onesSum >= 10 ? 1 : 0;
  const tensSum = T(a) + T(b) + carried;
  if (T(b) > 0 || tensSum >= 10) {
    const terms = [T(a), ...(T(b) ? [T(b)] : []), ...(carried ? [1] : [])];
    steps.push({ scene: show({ flats, rods, cubes }), caption: `Now the tens: *${terms.join(' + ')} = ${tensSum}*` });
  }
  if (tensSum >= 10) {
    steps.push({ scene: show({ flats, rods: marked(rods, 0, 10), cubes }), caption: `Circle *10 tens*…` });
    flats = [...flats, { color: 'new' }];
    rods = rods.slice(10);
    steps.push({ scene: show({ flats, rods, cubes }), caption: `…they turn into *1 hundred*!` });
  }
  if (H(b) > 0) {
    const terms = [H(a), H(b), ...(tensSum >= 10 ? [1] : [])];
    steps.push({ scene: show({ flats, rods, cubes }), caption: `Now the hundreds: *${terms.join(' + ')} = ${H(c)}*` });
  }
  steps.push({
    scene: { type: 'blocks', parts: [group(c, 'a')], result: c },
    caption: c >= 10 ? `${placeWords(c)} = *${c}*` : `Count them: *${c}*!`,
  });
  return steps;
}

function subBlocks({ a, b, c }: Fact): Step[] {
  const steps: Step[] = [{ scene: { type: 'blocks', parts: [group(a, 'a')] }, caption: `Start with *${a}*.` }];
  let flats = many(H(a), { color: 'a' });
  let rods = many(T(a), { color: 'a' });
  let cubes = many(O(a), { color: 'a' });
  const push = (caption: string, g: Group = { flats, rods, cubes }) => steps.push({ scene: { type: 'blocks', parts: [g] }, caption });

  if (O(a) < O(b)) {
    if (rods.length === 0) {
      push(`Take away ${O(b)} ones? There are only *${O(a)}*, and no tens!`, { flats: marked(flats, flats.length - 1, flats.length), rods, cubes });
      flats = flats.slice(1);
      rods = many(10, { color: 'new' });
      push(`Break *1 hundred* into *10 tens*!`);
      push(`Now take *1 ten*…`, { flats, rods: marked(rods, rods.length - 1, rods.length), cubes });
    } else {
      push(`Take away ${O(b)} ones? There are only *${O(a)}*!`, { flats, rods: marked(rods, rods.length - 1, rods.length), cubes });
    }
    rods = rods.slice(1);
    cubes = [...cubes, ...many(10, { color: 'new' })];
    push(`Break *1 ten* into *10 ones*!`);
  }
  if (O(b) > 0) {
    cubes = gone(cubes, O(b));
    push(`Take away *${plural(O(b), 'one')}*.`);
  }
  if (rods.length < T(b)) {
    push(`Take away ${T(b)} tens? There are only *${rods.length}*!`, { flats: marked(flats, flats.length - 1, flats.length), rods, cubes });
    flats = flats.slice(1);
    rods = [...rods, ...many(10, { color: 'new' })];
    push(`Break *1 hundred* into *10 tens*!`);
  }
  if (T(b) > 0) {
    rods = gone(rods, T(b));
    push(`Take away *${plural(T(b), 'ten')}*.`);
  }
  if (H(b) > 0) {
    flats = gone(flats, H(b));
    push(`Take away *${plural(H(b), 'hundred')}*.`);
  }
  steps.push({
    scene: { type: 'blocks', parts: [group(c, 'a')], result: c },
    caption: c >= 10 ? `${placeWords(c)} left. That's *${c}*!` : `*${c}* left!`,
  });
  return steps;
}

/** Skip-counting list: "4, 8, 12" or "4, 8, 12 … 36". */
function countBy(step: number, times: number) {
  const all = Array.from({ length: times }, (_, i) => step * (i + 1));
  const shown = times > 5 ? [...all.slice(0, 3), '…', all.at(-1)] : all;
  return shown.map((n, i) => (i === shown.length - 1 ? `*${n}*` : n)).join(', ').replace(', …,', ' …');
}

function timesBlocks({ a, b, c }: Fact): Step[] {
  if (a <= 10 && b <= 10) {
    return [
      { scene: { type: 'array', rows: a, cols: b }, caption: `*${a} × ${b}* means *${a} rows* of *${b}*.` },
      { scene: { type: 'array', rows: a, cols: b, totals: true }, caption: `Count by ${b}s: ${countBy(b, a)}` },
      { scene: { type: 'array', rows: a, cols: b, totals: true, result: c }, caption: `${a} × ${b} = *${c}*` },
    ];
  }
  const big = Math.max(a, b);
  const n = Math.min(a, b);
  const tensPart = big - O(big);
  const steps: Step[] = [
    {
      scene: { type: 'blocks', parts: Array.from({ length: n }, () => group(big, 'a')) },
      caption: `${a} × ${b} means *${n} groups* of *${big}*.`,
    },
  ];
  if (O(big) === 0) {
    steps.push({ scene: { type: 'text', lines: [`${n} × ${T(big)} tens = ${n * T(big)} tens`] }, caption: `${n} lots of *${T(big)} tens* is *${n * T(big)} tens*.` });
  } else {
    steps.push(
      { scene: { type: 'text', lines: [`${big} = ${tensPart} + ${O(big)}`] }, caption: `Split *${big}* into tens and ones.` },
      { scene: { type: 'text', lines: [`${n} × ${tensPart} = ${n * tensPart}`] }, caption: `${n} lots of ${tensPart}: *${n * tensPart}*` },
      { scene: { type: 'text', lines: [`${n} × ${O(big)} = ${n * O(big)}`] }, caption: `${n} lots of ${O(big)}: *${n * O(big)}*` },
    );
  }
  steps.push({
    scene: { type: 'blocks', parts: [group(c, 'a')], result: c },
    caption: O(big) === 0 ? `That's *${c}*!` : `${n * tensPart} + ${n * O(big)} = *${c}*`,
  });
  return steps;
}

function divideBlocks({ a, b, c }: Fact): Step[] {
  if (c <= 10) {
    return [
      { scene: { type: 'blocks', parts: [group(a, 'a')] }, caption: `*${a} ÷ ${b}*: how many *${b}s* make ${a}?` },
      { scene: { type: 'array', rows: c, cols: b, totals: true }, caption: `Make rows of ${b}: ${countBy(b, c)}` },
      { scene: { type: 'array', rows: c, cols: b, totals: true, result: c }, caption: `That's *${c} rows*. ${a} ÷ ${b} = *${c}*` },
    ];
  }
  const easy = Math.floor(a / (10 * b)) * 10 * b;
  const rest = a - easy;
  const steps: Step[] = [
    { scene: { type: 'blocks', parts: [group(a, 'a')] }, caption: `Share *${a}* into *${b}* equal groups.` },
    { scene: { type: 'text', lines: [rest ? `${a} = ${easy} + ${rest}` : `${a} = ${easy}`] }, caption: rest ? `Split ${a} into parts that are easy to share.` : `${a} is easy to share!` },
    { scene: { type: 'text', lines: [`${easy} ÷ ${b} = ${easy / b}`] }, caption: `Each group gets *${easy / b}*…` },
  ];
  if (rest) steps.push({ scene: { type: 'text', lines: [`${rest} ÷ ${b} = ${rest / b}`] }, caption: `…and *${rest / b}* more.` });
  steps.push({
    scene: { type: 'blocks', parts: Array.from({ length: b }, () => group(c, 'a')), result: c },
    caption: rest ? `${easy / b} + ${rest / b} = *${c}* in each group.` : `*${c}* in each group.`,
  });
  return steps;
}

/* ---------- Column method (竖式) ---------- */

/** A number written right-aligned in a row `width` digits wide, ending at column `end`. */
function digitsAt(n: number, width: number, tone: Cell['tone'], end = width - 1): (Cell | null)[] {
  const s = String(n);
  const row: (Cell | null)[] = Array(width).fill(null);
  for (let i = 0; i < s.length; i++) row[end - s.length + 1 + i] = { t: s[i], tone };
  return row;
}

const STACK = 'Stack them up: *ones under ones*.';

function addColumn({ a, b, c }: Fact): Step[] {
  const width = len(c);
  const carry: (Cell | null)[] = Array(width).fill(null);
  const ans: (Cell | null)[] = Array(width).fill(null);
  const scene = (focus?: number, result?: number): Scene => ({
    type: 'column',
    width,
    focus,
    result,
    rows: [
      { cells: digitsAt(a, width, 'a') },
      { label: '+', cells: digitsAt(b, width, 'b') },
      { cells: [...carry], carry: true },
      { cells: [...ans], rule: true },
    ],
  });
  const steps: Step[] = [{ scene: scene(), caption: STACK }];
  const top = Math.max(len(a), len(b));
  let k = 0;
  for (let p = 0; p < top; p++) {
    const col = width - 1 - p;
    const terms = [...(p < len(a) ? [digit(a, p)] : []), ...(p < len(b) ? [digit(b, p)] : []), ...(k ? [k] : [])];
    const sum = terms.reduce((x, y) => x + y, 0);
    const sumText = `${PLACE[p]}: *${terms.join(' + ')} = ${sum}*.`;
    if (sum >= 10 && p < top - 1) {
      ans[col] = { t: String(sum % 10), tone: 'new' };
      carry[col - 1] = { t: '1', tone: 'carry' };
      steps.push({ scene: scene(col), caption: `${sumText} Write ${sum % 10}, carry 1.` });
      k = 1;
    } else {
      digitsAt(sum, width, 'new', col).forEach((cell, i) => cell && (ans[i] = cell));
      steps.push({ scene: scene(col), caption: `${sumText} Write ${sum}.` });
      k = 0;
    }
  }
  steps.push({ scene: scene(undefined, c), caption: `*${a} + ${b} = ${c}*` });
  return steps;
}

function subColumn({ a, b, c }: Fact): Step[] {
  const width = len(a);
  const dots: boolean[] = Array(width).fill(false);
  const ans: (Cell | null)[] = Array(width).fill(null);
  const scene = (focus?: number, result?: number): Scene => ({
    type: 'column',
    width,
    focus,
    result,
    rows: [
      { cells: digitsAt(a, width, 'a').map((cell, i) => (cell && dots[i] ? { ...cell, dot: true } : cell)) },
      { label: '−', cells: digitsAt(b, width, 'b') },
      { cells: [...ans], rule: true },
    ],
  });
  const steps: Step[] = [{ scene: scene(), caption: STACK }];
  let borrowed = 0;
  for (let p = 0; p < width; p++) {
    const col = width - 1 - p;
    const da = digit(a, p);
    const hasB = p < len(b);
    const db = hasB ? digit(b, p) : 0;
    const short = da - borrowed < db;
    if (short) dots[col - 1] = true;
    const top = da + (short ? 10 : 0);
    const r = top - borrowed - db;
    const leadingZero = p > 0 && Math.floor(c / 10 ** p) === 0;
    if (!leadingZero) ans[col] = { t: String(r), tone: 'new' };
    const sum = `*${top}${borrowed ? ' − 1' : ''}${hasB ? ` − ${db}` : ''} = ${r}*`;
    let caption: string;
    if (short && borrowed) caption = `${PLACE[p]}: too small again! Borrow 1: ${sum}`;
    else if (short) caption = `${PLACE[p]}: ${da} − ${db}? Too small! Borrow 1 from next door: ${sum}`;
    else if (borrowed) caption = `${PLACE[p]}: the dot means 1 less. ${sum}`;
    else if (!hasB) caption = `${PLACE[p]}: nothing to take away. Write *${da}*.`;
    else caption = `${PLACE[p]}: ${sum}.`;
    if (leadingZero) caption += ' No 0 at the front.';
    steps.push({ scene: scene(col), caption });
    borrowed = short ? 1 : 0;
  }
  steps.push({ scene: scene(undefined, c), caption: `*${a} − ${b} = ${c}*` });
  return steps;
}

function timesColumn({ a, b, c }: Fact): Step[] {
  // The longer number goes on top, so we multiply by one digit.
  const swap = len(b) > len(a);
  const top = swap ? b : a;
  const m = swap ? a : b;
  const width = len(c);
  const carry: (Cell | null)[] = Array(width).fill(null);
  const ans: (Cell | null)[] = Array(width).fill(null);
  const scene = (focus?: number, result?: number): Scene => ({
    type: 'column',
    width,
    focus,
    result,
    rows: [
      { cells: digitsAt(top, width, 'a') },
      { label: '×', cells: digitsAt(m, width, 'b') },
      { cells: [...carry], carry: true },
      { cells: [...ans], rule: true },
    ],
  });
  const steps: Step[] = [{ scene: scene(), caption: swap ? `Put *${top}* on top and *${m}* under it.` : STACK }];
  let k = 0;
  for (let p = 0; p < len(top); p++) {
    const col = width - 1 - p;
    const d = digit(top, p);
    const prod = d * m + k;
    const sumText = `${PLACE[p]}: *${d} × ${m}${k ? ` + ${k}` : ''} = ${prod}*.`;
    if (prod >= 10 && p < len(top) - 1) {
      ans[col] = { t: String(prod % 10), tone: 'new' };
      k = Math.floor(prod / 10);
      carry[col - 1] = { t: String(k), tone: 'carry' };
      steps.push({ scene: scene(col), caption: `${sumText} Write ${prod % 10}, carry ${k}.` });
    } else {
      digitsAt(prod, width, 'new', col).forEach((cell, i) => cell && (ans[i] = cell));
      steps.push({ scene: scene(col), caption: `${sumText} Write ${prod}.` });
      k = 0;
    }
  }
  steps.push({ scene: scene(undefined, c), caption: `*${a} × ${b} = ${c}*` });
  return steps;
}

/** Long division with the 厂-shaped bracket: divide, multiply, take away, bring down. */
function divideColumn({ a, b, c }: Fact): Step[] {
  const ds = String(a).split('').map(Number);
  const width = ds.length;
  const quotient: (Cell | null)[] = Array(width).fill(null);
  const work: ColRow[] = [];
  const scene = (focus?: number, result?: number): Scene => ({
    type: 'column',
    width,
    focus,
    result,
    division: true,
    rows: [{ cells: [...quotient] }, { label: String(b), cells: digitsAt(a, width, 'a'), bracket: true }, ...work.map((r) => ({ ...r, cells: [...r.cells] }))],
  });
  const steps: Step[] = [{ scene: scene(), caption: `How many *${b}s* in *${a}*? Start on the left.` }];
  let cur = 0;
  let started = false;
  for (let i = 0; i < width; i++) {
    cur = cur * 10 + ds[i];
    if (!started && cur < b && i < width - 1) {
      steps.push({ scene: scene(i), caption: `${cur} is less than ${b}, so look at *${cur * 10 + ds[i + 1]}*.` });
      continue;
    }
    started = true;
    const q = Math.floor(cur / b);
    const prod = q * b;
    const rem = cur - prod;
    quotient[i] = { t: String(q), tone: 'new' };
    work.push({ cells: digitsAt(prod, width, 'b', i) });
    steps.push({ scene: scene(i), caption: `${cur} ÷ ${b}: *${b} × ${q} = ${prod}*. Write ${q} on top.` });
    if (i < width - 1) {
      const row = rem ? digitsAt(rem, width, 'a', i) : Array<Cell | null>(width).fill(null);
      row[i + 1] = { t: String(ds[i + 1]), tone: 'new' };
      work.push({ cells: row, rule: true });
      steps.push({
        scene: scene(i + 1),
        caption: `${cur} − ${prod} = ${rem}. Bring down the ${ds[i + 1]}: *${rem * 10 + ds[i + 1]}*.`,
      });
      cur = rem;
    } else {
      work.push({ cells: digitsAt(rem, width, 'a', i), rule: true });
      steps.push({ scene: scene(i), caption: `${cur} − ${prod} = *0*. Nothing left over!` });
    }
  }
  steps.push({ scene: scene(undefined, c), caption: `*${a} ÷ ${b} = ${c}*` });
  return steps;
}

/* ---------- Putting it together ---------- */

const BUILDERS: Record<ExplainStyle, Record<Fact['op'], (f: Fact) => Step[]>> = {
  blocks: { '+': addBlocks, '-': subBlocks, '×': timesBlocks, '÷': divideBlocks },
  column: { '+': addColumn, '-': subColumn, '×': timesColumn, '÷': divideColumn },
};

export function factSteps(f: Fact, style: ExplainStyle = 'blocks'): Step[] {
  return BUILDERS[style][f.op](f);
}

/** Missing number: turn the sum around so it becomes a normal sum. */
export function inverse(q: Extract<Question, { kind: 'missing' }>): Fact {
  const { a, op, b, c } = q.fact;
  const hideB = q.hide === 'b';
  switch (op) {
    case '+':
      return hideB ? { a: c, op: '-', b: a, c: b } : { a: c, op: '-', b, c: a };
    case '-':
      return hideB ? { a, op: '-', b: c, c: b } : { a: c, op: '+', b, c: a };
    case '×':
      return hideB ? { a: c, op: '÷', b: a, c: b } : { a: c, op: '÷', b, c: a };
    case '÷':
      return hideB ? { a, op: '÷', b: c, c: b } : { a: c, op: '×', b, c: a };
  }
}

export function questionText(q: Question): string {
  const { a, op, b, c } = q.fact;
  const s = sym(op);
  if (q.kind === 'missing') return q.hide === 'a' ? `? ${s} ${b} = ${c}` : `${a} ${s} ? = ${c}`;
  return `${a} ${s} ${b}`;
}


export function toZhCaption(s: string): string {
  if (s.startsWith("Make *") && s.includes("with blocks")) {
    return s.replace(/^Make \*(.*?)\* and \*(.*?)\* with blocks\.$/, "用积木摆出 *$1* 和 *$2*。");
  }
  if (s.startsWith("Put them together:")) {
    return s.replace(/^Put them together:\s*\*(.*?)\*\s*ones\.$/, "合在一起：*$1* 个一。");
  }
  if (s.startsWith("Put the ones together:")) {
    return s.replace(/^Put the ones together:\s*(.*)$/, "个位相加：$1");
  }
  if (s.includes("Circle *10 ones*")) return "圈出 *10个一*…";
  if (s.includes("they turn into *1 ten*")) return "…满十进一，变成 *1个十*！";
  if (s.includes("Circle *10 tens*")) return "圈出 *10个十*…";
  if (s.includes("they turn into *1 hundred*")) return "…满十进一，变成 *1个百*！";
  if (s.startsWith("Now the tens:")) return s.replace(/^Now the tens:\s*(.*)$/, "再算十位：$1");
  if (s.startsWith("Now the hundreds:")) return s.replace(/^Now the hundreds:\s*(.*)$/, "再算百位：$1");
  if (s.startsWith("Count them:")) return s.replace(/^Count them:\s*\*(.*?)\*!$/, "数一数，一共是：*$1*！");
  if (s.startsWith("Start with *")) return s.replace(/^Start with \*(.*?)\*\.$/, "先摆出 *$1*。");
  if (s.startsWith("Take away") && s.includes("and no tens!")) {
    return s.replace(/^Take away (\d+) ones\? There are only \*(.*?)\*, and no tens!$/, "要减去 $1 个一？但只有 *$2* 个，十位也没有！");
  }
  if (s.startsWith("Take away") && s.includes("There are only")) {
    return s.replace(/^Take away (\d+) ones\? There are only \*(.*?)\*!$/, "要减去 $1 个一？但只有 *$2* 个！");
  }
  if (s === "Break *1 hundred* into *10 tens*!") return "拆开 *1个百* 变成 *10个十*！";
  if (s === "Now take *1 ten*…") return "现在取 *1个十*…";
  if (s === "Break *1 ten* into *10 ones*!") return "拆开 *1个十* 变成 *10个一*！";
  if (s.startsWith("Take away *")) {
    return s.replace(/^Take away \*(.*?)\s+ones?\*\.$/, "减去 *$1个一*。")
            .replace(/^Take away \*(.*?)\s+tens?\*\.$/, "减去 *$1个十*。")
            .replace(/^Take away \*(.*?)\s+hundreds?\*\.$/, "减去 *$1个百*。");
  }
  if (s.includes("left. That's *")) {
    return s.replace(/left\.\s*That's\s*\*(.*?)\*!/, "，还剩下 *$1*！")
            .replace(/(\d+)\s+hundreds?/gi, "$1个百")
            .replace(/(\d+)\s+tens?/gi, "$1个十")
            .replace(/(\d+)\s+ones?/gi, "$1个一")
            .replace(/,\s*/g, "、")
            .replace(/\s+and\s+/g, "和");
  }
  if (s.includes("means") && s.includes("rows")) {
    return s.replace(/^\*(.*?)\* means \*(.*?) rows\* of \*(.*?)\*\.$/, "*$1* 表示 *$2 行*，每行 *$3 个*。");
  }
  if (s.startsWith("Count by ")) {
    return s.replace(/^Count by (\d+)s:\s*(.*)$/, "按 $1 个一组连加计数：$2");
  }
  if (s.startsWith("Share *") && s.includes("equal rows")) {
    return s.replace(/^Share \*(.*?)\* into \*(.*?)\* equal rows\.$/, "把 *$1* 平均分成 *$2* 行。");
  }
  if (s.startsWith("Count each row:")) {
    return s.replace(/^Count each row:\s*\*(.*?)\*\.$/, "每行有：*$1* 个。");
  }
  if (s.startsWith("Each row gets")) {
    return s.replace(/^Each row gets \*(.*?)\*\.$/, "每行分得 *$1* 个。");
  }
  if (s === "Stack them up: *ones under ones*.") return "列竖式：*相同数位对齐*。";
  if (s.startsWith("Put *") && s.includes("on top, with *")) {
    return s.replace(/^Put \*(.*?)\* on top, with \*(.*?)\* under it\.$/, "上面写 *$1*，下面写 *$2*。");
  }
  if (s.startsWith("Ones:") || s.startsWith("Tens:") || s.startsWith("Hundreds:")) {
    const prefix = s.startsWith("Ones:") ? "个位：" : s.startsWith("Tens:") ? "十位：" : "百位：";
    const rest = s.slice(s.indexOf(":") + 1).trim();
    if (rest.includes("Too small! Borrow 1 from next door:")) {
      return prefix + rest.replace(/(.*?)\?\s*Too small!\s*Borrow 1 from next door:\s*\*(.*?)\*/, "$1 不够减！向十位借1当10：*$2*");
    }
    if (rest.includes("too small again! Borrow 1:")) {
      return prefix + rest.replace(/too small again!\s*Borrow 1:\s*\*(.*?)\*/, "也不够减！向百位借1当10：*$1*");
    }
    if (rest.includes("the dot means 1 less.")) {
      return prefix + rest.replace(/the dot means 1 less\.\s*\*(.*?)\*/, "借位点表示少1。*$1*");
    }
    if (rest.includes("Write") && rest.includes("carry")) {
      return prefix + rest.replace(/\*(.*?)\*\.\s*Write (\d+),\s*carry (\d+)\./, "*$1*。写 $2 进 $3。");
    }
    if (rest.includes("Write")) {
      return prefix + rest.replace(/\*(.*?)\*\.\s*Write (\d+)\./, "*$1*。写 $2。");
    }
    return prefix + rest;
  }
  if (s.startsWith("How many *") && s.includes("Start on the left")) {
    return s.replace(/^How many \*(.*?)s\* in \*(.*?)\*\?\s*Start on the left\.$/, "*$2* 里面有几个 *$1*？从高位除起。");
  }
  if (s.includes("is less than") && s.includes("so look at")) {
    return s.replace(/^(\d+) is less than (\d+), so look at \*(.*?)\*\.$/, "$1 比 $2 小，所以看前两位 *$3*。");
  }
  if (s.includes("÷") && s.includes("Write") && s.includes("on top")) {
    return s.replace(/^(.*?) ÷ (.*?):\s*\*(.*?)\*\.\s*Write (\d+) on top\.$/, "$1 ÷ $2：*$3*。上面商 $4。");
  }
  if (s.includes("Bring down the")) {
    return s.replace(/^(.*?) − (.*?) = (.*?)\.\s*Bring down the (.*?):\s*\*(.*?)\*\.$/, "$1 − $2 = $3。落下 $4：*$5*。");
  }
  if (s.includes("Nothing left over!")) {
    return s.replace(/^(.*?) − (.*?) = \*0\*\.\s*Nothing left over!$/, "$1 − $2 = *0*。正好除尽！");
  }
  if (s === "Missing number? *Turn it around!*") return "找出填空的数字？*逆向换算！*";
  if (s.startsWith("The missing number is *")) {
    return s.replace(/^The missing number is \*(.*?)\*!$/, "填空的数字是 *$1*！");
  }
  if (s.includes("is smaller than")) return s.replace(/^\*(.*?)\* is smaller than \*(.*?)\*\.$/, "*$1* 小于 *$2*。");
  if (s.includes("is bigger than")) return s.replace(/^\*(.*?)\* is bigger than \*(.*?)\*\.$/, "*$1* 大于 *$2*。");
  if (s.includes("is the same as")) return s.replace(/^\*(.*?)\* is the same as \*(.*?)\*\.$/, "*$1* 等于 *$2*。");
  if (s.includes(" = *")) {
    return s.replace(/(\d+)\s+hundreds?/gi, "$1个百")
            .replace(/(\d+)\s+tens?/gi, "$1个十")
            .replace(/(\d+)\s+ones?/gi, "$1个一")
            .replace(/,\s*/g, "、")
            .replace(/\s+and\s+/g, "和");
  }
  return s;
}


export function explain(q: Question, style: ExplainStyle = 'blocks', lang: Lang = 'en'): Step[] {
  let steps: Step[];
  if (q.kind === 'missing') {
    const f = inverse(q);
    const rawSteps = factSteps(f, style);
    const last = rawSteps[rawSteps.length - 1];
    steps = [
      {
        scene: { type: 'text', lines: [questionText(q), `${f.a} ${sym(f.op)} ${f.b} = ?`] },
        caption: `Missing number? *Turn it around!*`,
      },
      ...rawSteps.slice(0, -1),
      { ...last, caption: `The missing number is *${f.c}*!` },
    ];
  } else {
    steps = factSteps(q.fact, style);
    if (q.kind === 'compare') {
      const sign = compareSign(q.fact.c, q.than);
      const words = { '<': 'smaller than', '>': 'bigger than', '=': 'the same as' }[sign];
      steps.push({
        scene: { type: 'text', lines: [`${q.fact.c} ${sign} ${q.than}`] },
        caption: `*${q.fact.c}* is ${words} *${q.than}*.`,
      });
    }
  }
  if (lang === 'zh') {
    return steps.map((s) => ({ ...s, caption: toZhCaption(s.caption) }));
  }
  return steps;
}
