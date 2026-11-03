import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { LevelId, Mode, Skill } from './types';

export type Lang = 'en' | 'zh';

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'zh',
  setLang: () => {},
});

export const useLang = () => useContext(LangContext);

export const TRANSLATIONS = {
  en: {
    appTitle1: 'Bunny',
    appTitle2: 'Math',
    appTagline: "Pick a level and let's hop to it!",
    questionsLabel: 'Questions',
    start: 'Start!',
    printWorksheet: 'Print a worksheet',
    stickerBook: 'Sticker book',
    soundOn: 'Turn sound on',
    soundOff: 'Turn sound off',
    practicing: 'Practicing',
    change: 'Change',
    switchLangText: '中文',
    switchLangAria: 'Switch to Chinese',

    // Mode pick
    modePickTitle: 'What shall we practice?',
    modePickAria: 'What to practice',
    modes: {
      plus: { name: 'Add & take away', signs: '+ −', blurb: 'Adding and taking away, up to 3 digits' },
      all: { name: 'All four', signs: '+ − × ÷', blurb: 'Times tables and dividing too' },
    } as Record<Mode, { name: string; signs: string; blurb: string }>,

    // Levels
    levels: {
      1: { name: 'Warm-up', blurb: 'Within 20' },
      2: { name: 'Big + small', blurb: 'No carrying' },
      3: { name: 'Tricky ones', blurb: 'Carry and borrow' },
      4: { name: 'Double digits', blurb: 'Two-digit numbers' },
      5: { name: 'Hundreds', blurb: 'Three-digit numbers' },
      6: { name: 'Super sums', blurb: 'Lots of carrying' },
      11: { name: 'First tables', blurb: 'Tables of 2, 5 and 10' },
      12: { name: 'More tables', blurb: 'Tables up to 5' },
      13: { name: 'All tables', blurb: 'Tables up to 10' },
      14: { name: 'Big times', blurb: 'Two-digit times and divide' },
    } as Record<LevelId, { name: string; blurb: string }>,

    // Skills
    skills: {
      add20: 'Adding to 20',
      sub20: 'Taking away to 20',
      add: 'Adding',
      sub: 'Taking away',
      carry: 'Carrying a ten',
      borrow: 'Breaking a ten',
      times: 'Times',
      divide: 'Dividing',
    } as Record<Skill, string>,

    // Quiz prompts
    prompts: {
      missing: 'Find the missing number!',
      choice: 'Pick the answer!',
      compare: 'Bigger, smaller, or the same?',
      '+': 'Add them up!',
      '-': 'Take away!',
      '×': 'Times!',
      '÷': 'Share it out!',
    } as Record<string, string>,

    // Signs
    signs: {
      '<': { label: 'smaller than', short: 'smaller' },
      '=': { label: 'the same as', short: 'same' },
      '>': { label: 'bigger than', short: 'bigger' },
    },

    // Pad
    clear: 'Clear',
    check: 'Check',
    delete: 'Delete',

    // Encouragements
    encourage: ['You can do it!', 'Take your time!', "Let's hop to it!", 'Think hard!', 'I believe in you!'],
    cheers: ['Yes!', 'Great job!', 'You got it!', 'Super!', 'Hoppy-tastic!'],

    // Feedback
    next: 'Next',
    seeStars: 'See my stars!',
    showMeHow: '💡 Show me how',
    soClose: 'So close!',
    haveOneMore: 'Have one more go.',
    tryAgain: 'Try again',
    theAnswerIs: (ans: string) => `The answer is ${ans}`,
    tryAgainEnd: "We'll try it again at the end.",
    lookHowItWorks: "Let's look at how it works.",

    // Quit Dialog
    stopQuizTitle: 'Stop the quiz?',
    stopQuizText: "Your answers so far won't be saved.",
    stop: 'Stop',
    keepGoing: 'Keep going',

    // Results
    resultsCheer: { 3: 'Amazing!', 2: 'Great job!', 1: 'Good try!' } as Record<number, string>,
    scoreText: (right: number, total: number) => `${right} out of ${total}`,
    yourAnswers: 'Your answers',
    tapToSeeHow: 'Tap one to see how',
    questionAria: (i: number, ok: boolean) => `Question ${i}: ${ok ? 'right' : 'needs practice'}`,
    superChip: '⭐ Super!',
    practiceMoreChip: '🌱 Practice more',
    newSticker: 'New sticker!',
    stickerInBook: "It's in your sticker book now.",
    practiceMoreBtn: '🌱 Practice more',
    nextLevelBtn: 'Try the next level ▶',
    playAgainBtn: 'Play again',

    // Stickers
    myStickers: 'My sticker book',
    stickersCount: (owned: number, total: number) => `${owned} of ${total} stickers · finish a quiz to get one`,
    back: 'Back',

    // Worksheet
    pages: 'Pages',
    newQuestions: '🔄 New questions',
    print: '🖨️ Print',
    wsTitle: 'Bunny Math 🐰',
    nameLine: 'Name: ____________________',
    dateLine: 'Date: ____________',
    answers: 'Answers',
    pageN: (p: number) => `Page ${p}`,
    pageNofTotal: (p: number, total: number) => `Page ${p} of ${total}`,

    // Explain
    explainStyles: {
      blocks: '🧱 Blocks',
      column: '✏️ Columns',
    },
    howToSolve: (sum: string) => `How to solve ${sum}`,
    showWith: 'Show it with',
    stepNofTotal: (cur: number, total: number) => `Step ${cur} of ${total}`,
    gotIt: 'Got it!',
    nextStep: 'Next ▶',
    prevStep: '◀ Back',
  },
  zh: {
    appTitle1: '小兔',
    appTitle2: '算术',
    appTagline: '选个关卡，一起跳跳做算术吧！',
    questionsLabel: '题目数量',
    start: '开始！',
    printWorksheet: '打印练习纸',
    stickerBook: '贴纸手账',
    soundOn: '开启声音',
    soundOff: '关闭声音',
    practicing: '当前练习',
    change: '更换',
    switchLangText: 'EN',
    switchLangAria: '切换为英文',

    // Mode pick
    modePickTitle: '你想练习什么数学题？',
    modePickAria: '选择练习内容',
    modes: {
      plus: { name: '加减法', signs: '+ −', blurb: '百以内及三位数加减法，进位与借位' },
      all: { name: '加减乘除', signs: '+ − × ÷', blurb: '包含乘法口诀表与除法练习' },
    } as Record<Mode, { name: string; signs: string; blurb: string }>,

    // Levels
    levels: {
      1: { name: '热身准备', blurb: '20以内加减' },
      2: { name: '大加小', blurb: '不进位不退位' },
      3: { name: '进位借位', blurb: '进位加法与退位减法' },
      4: { name: '两位数', blurb: '两位数加减法' },
      5: { name: '百位数', blurb: '三位数进阶计算' },
      6: { name: '连环进退位', blurb: '连续进位与跨零借位' },
      11: { name: '初识乘法', blurb: '2、5 和 10 的乘法' },
      12: { name: '乘法小能手', blurb: '5以内的表内乘除法' },
      13: { name: '九九乘法表', blurb: '10以内的乘除法全熟练' },
      14: { name: '大数乘除', blurb: '两位数乘除一位数' },
    } as Record<LevelId, { name: string; blurb: string }>,

    // Skills
    skills: {
      add20: '20以内加法',
      sub20: '20以内减法',
      add: '加法',
      sub: '减法',
      carry: '进位加法（满十进一）',
      borrow: '退位减法（借一当十）',
      times: '乘法',
      divide: '除法',
    } as Record<Skill, string>,

    // Quiz prompts
    prompts: {
      missing: '找出填空的数字！',
      choice: '选出正确的答案！',
      compare: '比比看，哪个更大、更小，还是一样大？',
      '+': '加起来！',
      '-': '减一减！',
      '×': '算乘法！',
      '÷': '分一分！',
    } as Record<string, string>,

    // Signs
    signs: {
      '<': { label: '小于', short: '小于' },
      '=': { label: '等于', short: '等于' },
      '>': { label: '大于', short: '大于' },
    },

    // Pad
    clear: '清空',
    check: '确定',
    delete: '删除',

    // Encouragements
    encourage: ['你可以的！', '慢慢想，不着急！', '小兔为你加油！', '仔细思考一下！', '相信你一定行！'],
    cheers: ['太棒了！', '答对啦！', '真厉害！', '超级棒！', '小兔为你鼓掌！'],

    // Feedback
    next: '下一题',
    seeStars: '看我的小星星！',
    showMeHow: '💡 看看怎么算',
    soClose: '好接近呀！',
    haveOneMore: '再试一次吧。',
    tryAgain: '再试一次',
    theAnswerIs: (ans: string) => `正确答案是 ${ans}`,
    tryAgainEnd: '我们最后会再做一次这道题。',
    lookHowItWorks: '来看看具体怎么计算吧。',

    // Quit Dialog
    stopQuizTitle: '要退出本次练习吗？',
    stopQuizText: '当前进度不会被保存哦。',
    stop: '退出',
    keepGoing: '继续练习',

    // Results
    resultsCheer: { 3: '太神奇了！', 2: '真棒！', 1: '继续加油！' } as Record<number, string>,
    scoreText: (right: number, total: number) => `答对 ${right} / ${total} 题`,
    yourAnswers: '答题记录',
    tapToSeeHow: '点击题号看图解',
    questionAria: (i: number, ok: boolean) => `第 ${i} 题：${ok ? '答对' : '需多练习'}`,
    superChip: '⭐ 超级棒！',
    practiceMoreChip: '🌱 再多练练',
    newSticker: '获得新贴纸！',
    stickerInBook: '已经放进你的贴纸手账里啦。',
    practiceMoreBtn: '🌱 专项再练习',
    nextLevelBtn: '挑战下一关 ▶',
    playAgainBtn: '再玩一次',

    // Stickers
    myStickers: '我的贴纸手账',
    stickersCount: (owned: number, total: number) => `已收集 ${owned} / ${total} 张贴纸 · 完成一次练习即可获得新贴纸`,
    back: '返回',

    // Worksheet
    pages: '页数',
    newQuestions: '🔄 换一批题',
    print: '🖨️ 打印',
    wsTitle: '小兔算术 🐰',
    nameLine: '姓名：____________________',
    dateLine: '日期：____________',
    answers: '参考答案',
    pageN: (p: number) => `第 ${p} 页`,
    pageNofTotal: (p: number, total: number) => `第 ${p} 页，共 ${total} 页`,

    // Explain
    explainStyles: {
      blocks: '🧱 积木图解',
      column: '✏️ 竖式计算',
    },
    howToSolve: (sum: string) => `如何计算 ${sum}`,
    showWith: '图解方式',
    stepNofTotal: (cur: number, total: number) => `第 ${cur} 步，共 ${total} 步`,
    gotIt: '学会啦！',
    nextStep: '下一步 ▶',
    prevStep: '◀ 上一步',
  },
};

export function getT(lang: Lang) {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
