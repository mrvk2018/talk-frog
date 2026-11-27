import type {
  AudioChoiceStep,
  CategorySortStep,
  CustomInputSpeakStep,
  ListenRepeatItem,
  ListenRepeatStep,
  PairMatchStep,
  VisualChoiceStep,
  ZeroLevelInteractiveLesson,
} from '@/types/lessonSteps';

const LETTER_IPA: Record<string, string> = {
  A: '/eɪ/',
  B: '/biː/',
  C: '/siː/',
  D: '/diː/',
  E: '/iː/',
  F: '/ef/',
  G: '/dʒiː/',
  H: '/eɪtʃ/',
  I: '/aɪ/',
  J: '/dʒeɪ/',
  K: '/keɪ/',
  L: '/el/',
  M: '/em/',
  N: '/en/',
  O: '/əʊ/',
  P: '/piː/',
  Q: '/kjuː/',
  R: '/ɑː/',
  S: '/es/',
  T: '/tiː/',
  U: '/juː/',
  V: '/viː/',
  W: '/ˈdʌb.əl.juː/',
  X: '/eks/',
  Y: '/waɪ/',
  Z: '/zed/',
};

function buildAlphabetListenItems(): ListenRepeatItem[] {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((upper) => {
    const lower = upper.toLowerCase();
    return {
      display: `${upper} ${lower}`,
      upper,
      lower,
      speakText: upper,
      transcription: LETTER_IPA[upper],
      hintRu: `Заглавная ${upper}, строчная ${lower}`,
    };
  });
}

function audioChoice(
  id: string,
  titleRu: string,
  speakText: string,
  transcription: string,
  choices: string[],
  correctIndex: number,
  extra?: { isFinalTest?: boolean },
): AudioChoiceStep {
  return {
    id,
    stepType: 'audio_choice',
    titleRu,
    speakText,
    transcription,
    choices,
    correctIndex,
    hideVisualHint: true,
    ...extra,
  };
}

function pairChunks(
  idPrefix: string,
  titleRu: string,
  chunkIndex: number,
  letters: string[],
): PairMatchStep {
  return {
    id: `${idPrefix}-chunk-${chunkIndex}`,
    stepType: 'pair_match',
    titleRu,
    pairs: letters.map((upper) => ({
      id: `${upper}`,
      leftLabel: upper,
      rightLabel: upper.toLowerCase(),
      leftSpeakText: upper,
      rightSpeakText: upper.toLowerCase(),
    })),
  };
}

const numbersLexicon: ListenRepeatItem[] = [
  { display: '0 — zero', speakText: 'zero', transcription: '/ˈzɪə.rəʊ/', hintRu: 'ноль' },
  { display: '1 — one', speakText: 'one', transcription: '/wʌn/', hintRu: 'один' },
  { display: '2 — two', speakText: 'two', transcription: '/tuː/', hintRu: 'два' },
  { display: '3 — three', speakText: 'three', transcription: '/θriː/', hintRu: 'три' },
  { display: '4 — four', speakText: 'four', transcription: '/fɔː/', hintRu: 'четыре' },
  { display: '5 — five', speakText: 'five', transcription: '/faɪv/', hintRu: 'пять' },
  { display: '6 — six', speakText: 'six', transcription: '/sɪks/', hintRu: 'шесть' },
  { display: '7 — seven', speakText: 'seven', transcription: '/ˈsev.ən/', hintRu: 'семь' },
  { display: '8 — eight', speakText: 'eight', transcription: '/eɪt/', hintRu: 'восемь' },
  { display: '9 — nine', speakText: 'nine', transcription: '/naɪn/', hintRu: 'девять' },
  { display: '10 — ten', speakText: 'ten', transcription: '/ten/', hintRu: 'десять' },
  { display: '11 — eleven', speakText: 'eleven', transcription: '/ɪˈlev.ən/', hintRu: 'одиннадцать' },
  { display: '12 — twelve', speakText: 'twelve', transcription: '/twelv/', hintRu: 'двенадцать' },
  { display: '13 — thirteen', speakText: 'thirteen', transcription: '/ˌθɜːˈtiːn/', hintRu: 'тринадцать' },
  { display: '14 — fourteen', speakText: 'fourteen', transcription: '/ˌfɔːˈtiːn/', hintRu: 'четырнадцать' },
  { display: '15 — fifteen', speakText: 'fifteen', transcription: '/ˌfɪfˈtiːn/', hintRu: 'пятнадцать' },
  { display: '16 — sixteen', speakText: 'sixteen', transcription: '/ˌsɪksˈtiːn/', hintRu: 'шестнадцать' },
  { display: '17 — seventeen', speakText: 'seventeen', transcription: '/ˌsev.ənˈtiːn/', hintRu: 'семнадцать' },
  { display: '18 — eighteen', speakText: 'eighteen', transcription: '/ˌeɪˈtiːn/', hintRu: 'восемнадцать' },
  { display: '19 — nineteen', speakText: 'nineteen', transcription: '/ˌnaɪnˈtiːn/', hintRu: 'девятнадцать' },
  { display: '20 — twenty', speakText: 'twenty', transcription: '/ˈtwen.ti/', hintRu: 'двадцать' },
  { display: '30 — thirty', speakText: 'thirty', transcription: '/ˈθɜː.ti/', hintRu: 'тридцать' },
  { display: '40 — forty', speakText: 'forty', transcription: '/ˈfɔː.ti/', hintRu: 'сорок' },
  { display: '50 — fifty', speakText: 'fifty', transcription: '/ˈfɪf.ti/', hintRu: 'пятьдесят' },
  { display: '60 — sixty', speakText: 'sixty', transcription: '/ˈsɪks.ti/', hintRu: 'шестьдесят' },
  { display: '70 — seventy', speakText: 'seventy', transcription: '/ˈsev.ən.ti/', hintRu: 'семьдесят' },
  { display: '80 — eighty', speakText: 'eighty', transcription: '/ˈeɪ.ti/', hintRu: 'восемьдесят' },
  { display: '90 — ninety', speakText: 'ninety', transcription: '/ˈnaɪn.ti/', hintRu: 'девяносто' },
  {
    display: '100 — one hundred',
    speakText: 'one hundred',
    transcription: '/wʌn ˈhʌn.drəd/',
    hintRu: 'сто',
  },
  {
    display: '1000 — one thousand',
    speakText: 'one thousand',
    transcription: '/wʌn ˈθaʊ.zənd/',
    hintRu: 'тысяча',
  },
  {
    display: '1 000 000 — one million',
    speakText: 'one million',
    transcription: '/wʌn ˈmɪl.jən/',
    hintRu: 'миллион',
  },
];

const lessonAbc: ZeroLevelInteractiveLesson = {
  contentId: '1',
  lessonProgressId: 'z1',
  titleEn: 'ABC',
  titleRu: 'ABC — Alphabet / Алфавит',
  subtitleRu: 'Британское произношение букв',
  stages: [
    {
      id: 'z1-stage-1',
      stepType: 'listen_repeat',
      titleRu: 'Этап 1: Слушаем и повторяем A–Z',
      instructionsRu:
        'Слушайте британское произношение каждой буквы. Повторяйте вслух. Следите за заглавной и строчной формой.',
      items: buildAlphabetListenItems(),
    },
    audioChoice(
      'z1-stage-2a',
      'Этап 2: Ловушка A / E / I',
      'A',
      LETTER_IPA.A,
      ['A', 'E', 'I'],
      0,
    ),
    audioChoice(
      'z1-stage-2b',
      'Этап 2: Ловушка E / I / U',
      'E',
      LETTER_IPA.E,
      ['E', 'I', 'U'],
      0,
    ),
    audioChoice(
      'z1-stage-2c',
      'Этап 2: Ловушка Y / U / W',
      'U',
      LETTER_IPA.U,
      ['Y', 'U', 'W'],
      1,
    ),
    audioChoice('z1-stage-2d', 'Этап 2: Контроль B', 'B', LETTER_IPA.B, ['B', 'P', 'T'], 0),
    audioChoice('z1-stage-2e', 'Этап 2: Контроль H', 'H', LETTER_IPA.H, ['H', 'A', 'N'], 0),
    audioChoice('z1-stage-2f', 'Этап 2: Контроль O', 'O', LETTER_IPA.O, ['O', 'Q', 'U'], 0),
    audioChoice('z1-stage-2g', 'Этап 2: Контроль R', 'R', LETTER_IPA.R, ['R', 'L', 'N'], 0),
    audioChoice('z1-stage-2h', 'Этап 2: Контроль S', 'S', LETTER_IPA.S, ['S', 'F', 'X'], 0),
    audioChoice('z1-stage-2i', 'Этап 2: Контроль Z', 'Z', LETTER_IPA.Z, ['Z', 'X', 'S'], 0),
    {
      id: 'z1-stage-3',
      stepType: 'listen_repeat',
      titleRu: 'Этап 3: Назови выпавшую букву',
      instructionsRu: 'Слушайте и произнесите вслух случайную букву из алфавита.',
      items: buildAlphabetListenItems(),
      randomPick: true,
    },
    {
      id: 'z1-stage-4',
      stepType: 'category_sort',
      titleRu: 'Этап 4: Рифма и звучание букв',
      instructionsRu:
        'Буквы «поются» в одну из трёх групп по звуку. В каждой колонке уже стоят два примера. Остальные буквы перетащите в нужную категорию.',
      categories: [
        {
          id: 'i_long',
          labelRu: 'Звук «и»',
          ipaLabel: '/iː/',
          letters: ['B', 'C', 'D', 'E', 'G', 'P', 'T', 'V'],
          prefilled: ['B', 'C'],
        },
        {
          id: 'e_short',
          labelRu: 'Звук «э»',
          ipaLabel: '/e/',
          letters: ['F', 'L', 'M', 'N', 'S', 'X', 'Z'],
          prefilled: ['F', 'L'],
        },
        {
          id: 'ai_diphthong',
          labelRu: 'Звук «эй»',
          ipaLabel: '/eɪ/',
          letters: ['A', 'H', 'J', 'K'],
          prefilled: ['A', 'H'],
        },
      ],
      poolLetters: ['D', 'E', 'G', 'P', 'T', 'V', 'M', 'N', 'S', 'X', 'Z', 'J', 'K'],
    } satisfies CategorySortStep,
    {
      id: 'z1-stage-5-overview',
      stepType: 'pair_match',
      titleRu: 'Этап 5: Строчные буквы — обзор',
      overviewCard:
        'Aa  Bb  Cc  Dd  Ee  Ff  Gg  Hh  Ii  Jj  Kk  Ll  Mm  Nn  Oo  Pp  Qq  Rr  Ss  Tt  Uu  Vv  Ww  Xx  Yy  Zz',
      instructionsRu: 'Запомните пары. Далее соедините заглавные с маленькими.',
      pairs: [],
    },
    pairChunks('z1-stage-5', 'Этап 5: Пары A–F', 1, ['A', 'B', 'C', 'D', 'E', 'F']),
    pairChunks('z1-stage-5', 'Этап 5: Пары G–L', 2, ['G', 'H', 'I', 'J', 'K', 'L']),
    pairChunks('z1-stage-5', 'Этап 5: Пары M–R', 3, ['M', 'N', 'O', 'P', 'Q', 'R']),
    pairChunks('z1-stage-5', 'Этап 5: Пары S–X', 4, ['S', 'T', 'U', 'V', 'W', 'X']),
    pairChunks('z1-stage-5', 'Этап 5: Пары Y–Z', 5, ['Y', 'Z']),
    {
      id: 'z1-stage-6a',
      stepType: 'visual_choice',
      titleRu: 'Этап 6: Похожие строчные буквы (без звука)',
      targetLetter: 'd',
      choices: ['b', 'd', 'g'],
      correctIndex: 1,
      isSilent: true,
    } satisfies VisualChoiceStep,
    {
      id: 'z1-stage-6b',
      stepType: 'visual_choice',
      titleRu: 'Этап 6: Похожие строчные буквы (без звука)',
      targetLetter: 'b',
      choices: ['b', 'd', 'g'],
      correctIndex: 0,
      isSilent: true,
    },
    {
      id: 'z1-stage-6c',
      stepType: 'visual_choice',
      titleRu: 'Этап 6: Похожие строчные буквы (без звука)',
      targetLetter: 'g',
      choices: ['j', 'g', 'd'],
      correctIndex: 1,
      isSilent: true,
    },
    {
      id: 'z1-stage-6d',
      stepType: 'visual_choice',
      titleRu: 'Этап 6: Похожие строчные буквы (без звука)',
      targetLetter: 'u',
      choices: ['u', 'v', 'w'],
      correctIndex: 0,
      isSilent: true,
    },
    {
      id: 'z1-stage-7-intro',
      stepType: 'listen_repeat',
      titleRu: 'Этап 7: Логотипы и аббревиатуры',
      instructionsRu:
        'В английском логотипы и аббревиатуры читаются по буквам алфавита — не как слово.',
      items: [
        {
          display: 'BBC — телеканал',
          speakText: 'B,B,C',
          hintRu: 'Би-би-си',
          transcription: 'B — B — C',
        },
        {
          display: 'ATM — банкомат',
          speakText: 'A,T,M',
          hintRu: 'Эй-ти-эм',
          transcription: 'A — T — M',
        },
        {
          display: 'USA — США',
          speakText: 'U,S,A',
          hintRu: 'Ю-эс-эй',
          transcription: 'U — S — A',
        },
        {
          display: 'UK — Великобритания',
          speakText: 'U,K',
          hintRu: 'Ю-кей',
          transcription: 'U — K',
        },
        {
          display: 'VIP — особо важная персона',
          speakText: 'V,I,P',
          hintRu: 'Ви-ай-пи',
          transcription: 'V — I — P',
        },
        {
          display: 'DJ — диджей',
          speakText: 'D,J',
          hintRu: 'Ди-джей',
          transcription: 'D — J',
        },
      ],
    },
    {
      id: 'z1-stage-7-match',
      stepType: 'pair_match',
      titleRu: 'Этап 7: Соедини аббревиатуру и значение',
      methodologyNoteRu:
        'В английском логотипы и аббревиатуры читаются по буквам алфавита.',
      pairs: [
        { id: 'bbc', leftLabel: 'BBC', rightLabel: 'телеканал', leftSpeakText: 'B,B,C' },
        { id: 'atm', leftLabel: 'ATM', rightLabel: 'банкомат', leftSpeakText: 'A,T,M' },
        { id: 'usa', leftLabel: 'USA', rightLabel: 'США', leftSpeakText: 'U,S,A' },
        { id: 'uk', leftLabel: 'UK', rightLabel: 'Великобритания', leftSpeakText: 'U,K' },
        { id: 'vip', leftLabel: 'VIP', rightLabel: 'особая персона', leftSpeakText: 'V,I,P' },
        { id: 'dj', leftLabel: 'DJ', rightLabel: 'диджей', leftSpeakText: 'D,J' },
      ],
    },
    {
      id: 'z1-stage-8',
      stepType: 'custom_input_speak',
      titleRu: 'Этап 8: Своё имя по буквам',
      inputLabelRu: 'Введите своё имя латиницей',
      placeholder: 'Maria',
      ruleNoteRu:
        'Имя проговаривается по буквам: M — A — R — I — A. Используйте латиницу, без кириллицы.',
      spellOutOnSpeak: true,
      inputKind: 'name',
    } satisfies CustomInputSpeakStep,
  ],
  finalTest: [
    {
      id: 'z1-test-1',
      stepType: 'listen_repeat',
      titleRu: 'Тест (A1): Буква вслух',
      isFinalTest: true,
      items: [{ display: 'M m', speakText: 'M', transcription: LETTER_IPA.M, upper: 'M', lower: 'm' }],
    },
    audioChoice(
      'z1-test-2',
      'Тест (A1): Выбор по звуку',
      'I',
      LETTER_IPA.I,
      ['I', 'A', 'E'],
      0,
      { isFinalTest: true },
    ),
    {
      id: 'z1-test-3',
      stepType: 'listen_repeat',
      titleRu: 'Тест (A1): Случайная буква',
      isFinalTest: true,
      randomPick: true,
      items: buildAlphabetListenItems().filter((item) => ['K', 'Q', 'W'].includes(item.speakText)),
    },
    {
      id: 'z1-test-4',
      stepType: 'category_sort',
      titleRu: 'Тест (A1): Категория звука',
      isFinalTest: true,
      instructionsRu: 'Где звучит /eɪ/?',
      categories: [
        {
          id: 'ai_diphthong',
          labelRu: '/eɪ/',
          ipaLabel: '/eɪ/',
          letters: ['A', 'H', 'J', 'K'],
          prefilled: ['A', 'H'],
        },
        {
          id: 'i_long',
          labelRu: '/iː/',
          ipaLabel: '/iː/',
          letters: ['B', 'C', 'D', 'E', 'G', 'P', 'T', 'V'],
          prefilled: ['B', 'C'],
        },
        {
          id: 'e_short',
          labelRu: '/e/',
          ipaLabel: '/e/',
          letters: ['F', 'L', 'M', 'N', 'S', 'X', 'Z'],
          prefilled: ['F', 'L'],
        },
      ],
      poolLetters: ['J', 'K'],
    },
    {
      id: 'z1-test-5',
      stepType: 'pair_match',
      titleRu: 'Тест (A1): Заглавная — строчная',
      isFinalTest: true,
      pairs: [
        { id: 'p', leftLabel: 'P', rightLabel: 'p', leftSpeakText: 'P' },
        { id: 'r', leftLabel: 'R', rightLabel: 'r', leftSpeakText: 'R' },
      ],
    },
    {
      id: 'z1-test-6',
      stepType: 'visual_choice',
      titleRu: 'Тест (A1): Узнай букву',
      isFinalTest: true,
      targetLetter: 'g',
      choices: ['j', 'g', 'd'],
      correctIndex: 1,
      isSilent: true,
    },
    {
      id: 'z1-test-7',
      stepType: 'pair_match',
      titleRu: 'Тест (A1): Аббревиатура',
      isFinalTest: true,
      pairs: [{ id: 'vip', leftLabel: 'VIP', rightLabel: 'особая персона', leftSpeakText: 'V,I,P' }],
    },
    {
      id: 'z1-test-8',
      stepType: 'custom_input_speak',
      titleRu: 'Тест (A1): Имя по буквам',
      isFinalTest: true,
      inputLabelRu: 'Ваше имя',
      placeholder: 'Alex',
      ruleNoteRu: 'Проговорите имя по буквам вслух.',
      spellOutOnSpeak: true,
      inputKind: 'name',
    },
  ],
};

const digitListenItems: ListenRepeatItem[] = numbersLexicon.filter((item) =>
  /^[0-9]/.test(item.display),
);

const lesson123: ZeroLevelInteractiveLesson = {
  contentId: '2',
  lessonProgressId: 'z2',
  titleEn: '123',
  titleRu: '123 — Numbers. Цифры и числа',
  subtitleRu: 'Британская транскрипция (IPA)',
  referenceLexicon: numbersLexicon,
  stages: [
    {
      id: 'z2-stage-1-digits',
      stepType: 'listen_repeat',
      titleRu: 'Этап 1: Цифры 0–9',
      instructionsRu: 'Слушайте и повторяйте. Затем пройдите обзор 10–19, десятков и крупных чисел.',
      items: numbersLexicon.slice(0, 10),
    },
    {
      id: 'z2-stage-1-overview',
      stepType: 'listen_repeat',
      titleRu: 'Этап 1: Обзор 10–19, 20–90, 100–1 000 000',
      items: numbersLexicon.slice(10),
    },
    {
      id: 'z2-stage-2',
      stepType: 'pair_match',
      titleRu: 'Этап 2: Звук и цифра',
      pairs: [
        { id: '0', leftLabel: 'zero', rightLabel: '0', leftSpeakText: 'zero' },
        { id: '1', leftLabel: 'one', rightLabel: '1', leftSpeakText: 'one' },
        { id: '2', leftLabel: 'two', rightLabel: '2', leftSpeakText: 'two' },
        { id: '3', leftLabel: 'three', rightLabel: '3', leftSpeakText: 'three' },
        { id: '4', leftLabel: 'four', rightLabel: '4', leftSpeakText: 'four' },
        { id: '5', leftLabel: 'five', rightLabel: '5', leftSpeakText: 'five' },
        { id: '6', leftLabel: 'six', rightLabel: '6', leftSpeakText: 'six' },
        { id: '7', leftLabel: 'seven', rightLabel: '7', leftSpeakText: 'seven' },
        { id: '8', leftLabel: 'eight', rightLabel: '8', leftSpeakText: 'eight' },
        { id: '9', leftLabel: 'nine', rightLabel: '9', leftSpeakText: 'nine' },
        { id: '10', leftLabel: 'ten', rightLabel: '10', leftSpeakText: 'ten' },
        { id: '20', leftLabel: 'twenty', rightLabel: '20', leftSpeakText: 'twenty' },
        { id: '100', leftLabel: 'one hundred', rightLabel: '100', leftSpeakText: 'one hundred' },
      ],
    },
    {
      id: 'z2-stage-3',
      stepType: 'listen_repeat',
      titleRu: 'Этап 3: Случайное число вслух',
      instructionsRu: 'Произнесите вслух выпавшее число или цифру.',
      items: digitListenItems,
      randomPick: true,
    },
    {
      id: 'z2-stage-4',
      stepType: 'pair_match',
      titleRu: 'Этап 4: Phone number — номер телефона',
      instructionsRu:
        'plus — плюс. Номер телефона обычно проговаривается по одной цифре. Слушайте диктовку и выберите запись.',
      methodologyNoteRu: 'Номер телефона обычно проговаривается по одной цифре.',
      pairs: [
        {
          id: 'ru',
          leftLabel: '+7 915 482 03 61',
          rightLabel: '+7 915 482 03 61',
          leftSpeakText: 'plus,7,9,1,5,4,8,2,0,3,6,1',
        },
        {
          id: 'kr',
          leftLabel: '+82 10 3492 8105',
          rightLabel: '+82 10 3492 8105',
          leftSpeakText: 'plus,8,2,1,0,3,4,9,2,8,1,0,5',
        },
      ],
    },
    {
      id: 'z2-stage-5',
      stepType: 'listen_repeat',
      titleRu: 'Этап 5: Проговорите номер по цифрам',
      instructionsRu: 'Вслух назовите каждую цифру номера.',
      items: [
        {
          display: '+7 915 482 03 61',
          speakText: 'plus,7,9,1,5,4,8,2,0,3,6,1',
          hintRu: 'По одной цифре',
        },
        {
          display: '+82 10 3492 8105',
          speakText: 'plus,8,2,1,0,3,4,9,2,8,1,0,5',
          hintRu: 'По одной цифре',
        },
      ],
    },
  ],
  finalTest: [
    {
      id: 'z2-test-phone',
      stepType: 'custom_input_speak',
      titleRu: 'Тест (A1): Свой номер телефона',
      isFinalTest: true,
      inputLabelRu: 'Введите свой номер телефона',
      placeholder: '+7 900 123 45 67',
      ruleNoteRu: 'Проговорите номер по одной цифре; «+» — plus.',
      spellOutOnSpeak: true,
      inputKind: 'phone',
    },
  ],
};

/** Все интерактивные уроки Нулевого уровня (пока 1–2). */
export const ZERO_LEVEL_INTERACTIVE_LESSONS: ZeroLevelInteractiveLesson[] = [lessonAbc, lesson123];

const PROGRESS_ID_ALIASES: Record<string, 'z1' | 'z2'> = {
  z1: 'z1',
  z2: 'z2',
  '1': 'z1',
  '2': 'z2',
  abc: 'z1',
  ABC: 'z1',
  '123': 'z2',
};

export function normalizeZeroLessonProgressId(lessonId: string): 'z1' | 'z2' | undefined {
  return PROGRESS_ID_ALIASES[lessonId.trim()];
}

export function getZeroLevelInteractiveLessonByProgressId(
  lessonId: string,
): ZeroLevelInteractiveLesson | undefined {
  const key = normalizeZeroLessonProgressId(lessonId);
  if (!key) return undefined;
  return ZERO_LEVEL_INTERACTIVE_LESSONS.find((lesson) => lesson.lessonProgressId === key);
}

export function getZeroLevelInteractiveLessonByContentId(
  contentId: string,
): ZeroLevelInteractiveLesson | undefined {
  return ZERO_LEVEL_INTERACTIVE_LESSONS.find((lesson) => lesson.contentId === contentId);
}

export function resolveZeroLevelInteractiveLesson(
  lessonId: string,
): ZeroLevelInteractiveLesson | undefined {
  return (
    getZeroLevelInteractiveLessonByProgressId(lessonId) ??
    getZeroLevelInteractiveLessonByContentId(lessonId)
  );
}