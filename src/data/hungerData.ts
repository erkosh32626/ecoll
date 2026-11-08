export interface ScarcityCause {
  id: string;
  index: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  sharePercent: number;
  affectedMillions: number;
  summary: string;
  mechanisms: string[];
  keyMetricLabel: string;
  keyMetricValue: string;
  regionExample: string;
  valleyColorPrimary: string;
  valleyColorSecondary: string;
  valleyFogTint: string;
  cameraProgressTarget: number;
}

export interface RegionStat {
  id: string;
  region: string;
  undernourishedMillions: number;
  prevalencePercent: number;
  foodInflationPercent: number;
  waterStressLevel: 'Төмен' | 'Орташа' | 'Жоғары' | 'Аса қауіпті';
  primaryDriver: string;
}

export interface SolutionAction {
  id: string;
  code: string;
  title: string;
  category: 'Жаһандық жүйе' | 'Агротехнология' | 'Жеке үлес';
  description: string;
  annualGrainSavedMt: number;
  peopleFedMillions: number;
  waterSavedKm3: number;
}

export interface ValleyWaypoint {
  id: string;
  progress: number;
  label: string;
  title: string;
  metric: string;
  caption: string;
}

export const GLOBAL_HUNGER_OVERVIEW = {
  topicTitle: 'Әлемдегі аштық мәселесі және азық-түлік тапшылығының себептері',
  topicKicker: 'ӘЛЕМДЕГІ АШТЫҚ МӘСЕЛЕСІ ЖӘНЕ АЗЫҚ-ТҮЛІК ТАПШЫЛЫҒЫНЫҢ СЕБЕПТЕРІ',
  heroHeadline: 'Өмір нәрі — әрбір дәнде.',
  heroSubheadline: 'Табиғаттан тамыр алған. Болашақ үшін өсірілген.',
  chronicHungerMillions: 733,
  insecurityBillions: 2.33,
  unaffordableDietBillions: 2.8,
  annualFoodWasteBillionTons: 1.3,
  childStuntingMillions: 148,
  projected2050PopulationBillions: 9.7,
  introNarrative:
    'Бүгінде әлемде 10 миллиард адамды асырауға жететін азық-түлік өндірілсе де, 733 миллион адам созылмалы аштықтан зардап шегуде. Азық-түлік тапшылығы — тек өнімнің аздығы емес, ол қарулы қақтығыстардың, климаттық дағдарыстың, экономикалық теңсіздік пен орасан зор ысыраптың салдары.',
};

export const SCARCITY_CAUSES: ScarcityCause[] = [
  {
    id: 'conflict',
    index: '01',
    title: 'Қарулы қақтығыстар мен геосаяси тұрақсыздық',
    shortTitle: 'Қақтығыстар',
    subtitle: 'Аштыққа ұшырағандардың 60%-ы соғыс жүріп жатқан аймақтарда өмір сүреді',
    sharePercent: 38,
    affectedMillions: 279,
    summary:
      'Әскери қақтығыстар егіс алқаптарын, суару жүйелерін және астық қоймаларын тікелей жояды. Теңіз порттары мен теміржол дәліздерінің жабылуы импортқа тәуелді елдерде жедел азық-түлік дағдарысын тудырады.',
    mechanisms: [
      'Егістік жерлердің миналануы және ауыл шаруашылығы инфрақұрылымының қирауы',
      'Босқындар легі: 110 миллионнан астам адам өз жерін тастап кетуге мәжбүр болды',
      'Экспорттық шектеулер мен жаһандық бидай, жүгері және күнбағыс майы логистикасының үзілуі',
    ],
    keyMetricLabel: 'Қақтығыс аймағындағы аштық үлесі',
    keyMetricValue: '60%',
    regionExample: 'Судан, Газа секторы, Йемен, Сахель аймағы, Сирия',
    valleyColorPrimary: '#f29d52',
    valleyColorSecondary: '#d95338',
    valleyFogTint: '#140806',
    cameraProgressTarget: 0.18,
  },
  {
    id: 'climate',
    index: '02',
    title: 'Климаттық өзгерістер, қуаңшылық және топырақ тозуы',
    shortTitle: 'Климат және қуаңшылық',
    subtitle: 'Төтенше табиғи құбылыстар негізгі дақылдардың өнімділігін 30–50%-ға дейін қысқартуда',
    sharePercent: 26,
    affectedMillions: 191,
    summary:
      'Жаһандық жылыну салдарынан ұзаққа созылған қуаңшылық, тосын су тасқыны және тұщы су тапшылығы жиіледі. Құнарлы топырақтың 33%-ы эрозияға, тұздануға және шөлейттенуге ұшыраған.',
    mechanisms: [
      'Орташа температураның +1°C-қа көтерілуі дәнді дақылдар түсімін 6–10%-ға төмендетеді',
      'Тұщы су қорының 70%-ы ауыл шаруашылығына жұмсалады, ал сулы горизонттар сарқылуда',
      'Тозаңдандырғыш жәндіктер мен биоәртүрліліктің жойылуы жеміс-жидек пен көкөніс өнімін азайтады',
    ],
    keyMetricLabel: 'Тозған ауыл шаруашылығы жерлері',
    keyMetricValue: '33%',
    regionExample: 'Шығыс Африка мүйізі, Оңтүстік Азия, Орталық Азияның қуаң белдеуі',
    valleyColorPrimary: '#e8c468',
    valleyColorSecondary: '#b8863b',
    valleyFogTint: '#120f05',
    cameraProgressTarget: 0.36,
  },
  {
    id: 'economics',
    index: '03',
    title: 'Экономикалық күйзеліс және азық-түлік инфляциясы',
    shortTitle: 'Экономика және баға',
    subtitle: '2,8 миллиард адамның күнделікті құнарлы тамақтануға қارجылық мүмкіндігі жетпейді',
    sharePercent: 18,
    affectedMillions: 132,
    summary:
      'Азық-түлік сөреде болғанымен, оның бағасы миллиондаған отбасы үшін қолжетімсіз. Энергия тасымалдаушылар мен минералды тыңайтқыштардың қымбаттауы өзіндік құнды еселеп арттырады.',
    mechanisms: [
      'Кедей елдерде үй шаруашылығы табысының 60–75%-ы тек тамақ сатып алуға жұмсалады',
      'Ұлттық валюталардың құнсыздануы импорттық астық пен дәрі-дәрмек бағасын шарықтатады',
      'Ауыл шаруашылығы несиелері мен тыңайтқыштардың шағын фермерлерге қолжетімсіздігі',
    ],
    keyMetricLabel: 'Құнарлы мәзірге қолы жетпейтіндер',
    keyMetricValue: '2,8 млрд',
    regionExample: 'Оңтүстік Азия, Латын Америкасы, Батыс Африка',
    valleyColorPrimary: '#8ecae6',
    valleyColorSecondary: '#5885af',
    valleyFogTint: '#060c14',
    cameraProgressTarget: 0.54,
  },
  {
    id: 'waste',
    index: '04',
    title: 'Жеткізу тізбегінің үзілуі және азық-түлік ысырабы',
    shortTitle: 'Ысырап және логистика',
    subtitle: 'Өндірілген барлық азық-түліктің үштен бірі — жылына 1,3 миллиард тоннасы жоғалады',
    sharePercent: 11,
    affectedMillions: 80,
    summary:
      'Дамушы елдерде өнім тоңазытқыш қоймалар мен жолдардың жоқтығынан егістіктен базарға жетпей бұзылса, дамыған елдерде бөлшек сауда мен үй шаруашылығында тонналап қоқысқа тасталады.',
    mechanisms: [
      'Жиын-терім мен сақтау кезінде дамушы елдерде өнімнің 14%-ы қоймада шіріп кетеді',
      'Тұтыну деңгейінде жыл сайын 1 миллиард тонна дайын тағам қоқысқа тасталады',
      'Ысырап болған азық-түлік әлемдік парниктік газдар шығарындысының 8–10%-ын құрайды',
    ],
    keyMetricLabel: 'Жылдық азық-түлік шығыны мен ысырабы',
    keyMetricValue: '1,3 млрд т',
    regionExample: 'Жаһандық мегаполистер мен тропикалық аграрлық аймақтар',
    valleyColorPrimary: '#f5efe2',
    valleyColorSecondary: '#d4a373',
    valleyFogTint: '#0d0b08',
    cameraProgressTarget: 0.72,
  },
  {
    id: 'demographics',
    index: '05',
    title: 'Демографиялық қысым және ресурстардың теңсіз бөлінуі',
    shortTitle: 'Ресурс теңсіздігі',
    subtitle: '2050 жылы 9,7 миллиард халықты асырау үшін өндірісті 50%-ға арттыру қажет',
    sharePercent: 7,
    affectedMillions: 51,
    summary:
      'Урбанизацияның жеделдеуі, егістік жерлердің тарылуы және жер мен су ресурстарының ірі корпорациялар қолында шоғырлануы жергілікті қауымдастықтардың өзін-өзі азық-түлікпен қамтуын әлсіретеді.',
    mechanisms: [
      'Жан басына шаққандағы егістік жер көлемі соңғы 50 жылда екі есеге қысқарды',
      'Жем-шөп пен биоотын өндірісі тікелей адам тағамына арналған дақылдармен жер үшін бәсекелеседі',
      'Шағын фермерлер әлемдік азықтың 35%-ын өндірсе де, мемлекеттік қолдаудың аз бөлігін алады',
    ],
    keyMetricLabel: '2050 жылға дейін қажетті өндіріс өсімі',
    keyMetricValue: '+50%',
    regionExample: 'Жаһандық Оңтүстік және жылдам өсіп жатқан урбанизация орталықтары',
    valleyColorPrimary: '#a8e6cf',
    valleyColorSecondary: '#56ab91',
    valleyFogTint: '#05120d',
    cameraProgressTarget: 0.9,
  },
];

export const REGIONAL_HUNGER_STATS: RegionStat[] = [
  {
    id: 'ssa',
    region: 'Субсахаралық Африка',
    undernourishedMillions: 298,
    prevalencePercent: 20.4,
    foodInflationPercent: 18.6,
    waterStressLevel: 'Аса қауіпті',
    primaryDriver: 'Қарулы қақтығыстар мен ұзақ қуаңшылық',
  },
  {
    id: 'south-asia',
    region: 'Оңтүстік Азия',
    undernourishedMillions: 261,
    prevalencePercent: 13.9,
    foodInflationPercent: 11.4,
    waterStressLevel: 'Аса қауіпті',
    primaryDriver: 'Экономикалық теңсіздік пен муссондық ауытқулар',
  },
  {
    id: 'wana',
    region: 'Батыс Азия және Солтүстік Африка',
    undernourishedMillions: 69,
    prevalencePercent: 12.2,
    foodInflationPercent: 16.2,
    waterStressLevel: 'Аса қауіпті',
    primaryDriver: 'Су тапшылығы, соғыстар және астық импортына тәуелділік',
  },
  {
    id: 'latam',
    region: 'Латын Америкасы және Кариб бассейні',
    undernourishedMillions: 41,
    prevalencePercent: 6.2,
    foodInflationPercent: 9.8,
    waterStressLevel: 'Орташа',
    primaryDriver: 'Азық-түлік инфляциясы мен Эль-Ниньо құбылысы',
  },
  {
    id: 'central-asia',
    region: 'Орталық Азия және Шығыс Азия',
    undernourishedMillions: 52,
    prevalencePercent: 3.1,
    foodInflationPercent: 7.5,
    waterStressLevel: 'Жоғары',
    primaryDriver: 'Мұздықтардың еруі, трансшекаралық су тапшылығы және логистика',
  },
];

export const SOLUTION_ACTIONS: SolutionAction[] = [
  {
    id: 'cold-chain',
    code: '01',
    title: 'Күн энергиясымен жұмыс істейтін салқындату қоймалары',
    category: 'Жаһандық жүйе',
    description:
      'Ферма маңындағы автономды салқындату мен заманауи астық элеваторлары жиын-терімнен кейінгі шығынды 60%-ға дейін қысқартады.',
    annualGrainSavedMt: 185,
    peopleFedMillions: 140,
    waterSavedKm3: 210,
  },
  {
    id: 'regenerative-ag',
    code: '02',
    title: 'Регенеративті егіншілік және құрғақшылыққа төзімді тұқымдар',
    category: 'Агротехнология',
    description:
      'Топырақ гумусын қалпына келтіру, ауыспалы егіс және гендік селекцияланған құрғақшылыққа төзімді бидай мен тары сорттарын енгізу.',
    annualGrainSavedMt: 220,
    peopleFedMillions: 175,
    waterSavedKm3: 340,
  },
  {
    id: 'drip-irrigation',
    code: '03',
    title: 'Тамшылатып суару және дәлме-дәл агромониторинг',
    category: 'Агротехнология',
    description:
      'Спутниктік ылғал сенсорлары мен тамшылатып суару су шығынын 45%-ға үнемдеп, өнімділікті 1,5 есе арттырады.',
    annualGrainSavedMt: 145,
    peopleFedMillions: 115,
    waterSavedKm3: 480,
  },
  {
    id: 'humanitarian-corridors',
    code: '04',
    title: 'Қорғалған гуманитарлық астық дәліздері мен ерте ескерту',
    category: 'Жаһандық жүйе',
    description:
      'Азық-түлікті қару ретінде қолдануға халықаралық тыйым салу және жергілікті астық резервтерін алдын ала жасақтау.',
    annualGrainSavedMt: 160,
    peopleFedMillions: 195,
    waterSavedKm3: 95,
  },
  {
    id: 'zero-waste-consumer',
    code: '05',
    title: 'Саналы тұтыну және азық-түлік банктерінің желісі',
    category: 'Жеке үлес',
    description:
      'Супермаркеттер мен мейрамханалардағы артық өнімді қайырымдылық қорларына бағыттау және үй шаруашылығындағы тамақ ысырабын тоқтату.',
    annualGrainSavedMt: 190,
    peopleFedMillions: 150,
    waterSavedKm3: 260,
  },
];

export const VALLEY_WAYPOINTS: ValleyWaypoint[] = [
  {
    id: 'wp-origin',
    progress: 0.0,
    label: '01 / БАСТАУ АЛҚАБЫ',
    title: 'Әлемдегі аштық мәселесі',
    metric: '733 млн адам',
    caption: 'Әлемдегі әрбір 11-ші тұрғын күн сайын созылмалы аштықпен бетпе-бет келеді.',
  },
  {
    id: 'wp-conflict',
    progress: 0.2,
    label: '02 / ҚАҚТЫҒЫС БЕЛДЕУІ',
    title: 'Қарулы қақтығыстар',
    metric: '60% аштық ошағы',
    caption: 'Соғыстар егістіктерді өртеп, миллиондаған фермерді босқынға айналдыруда.',
  },
  {
    id: 'wp-climate',
    progress: 0.4,
    label: '03 / ҚУАҢШЫЛЫҚ ҚЫРАТЫ',
    title: 'Климат және су тапшылығы',
    metric: '33% тозған жер',
    caption: 'Қуаңшылық пен топырақ эрозиясы дәнді дақылдар түсімін күрт кемітуде.',
  },
  {
    id: 'wp-waste',
    progress: 0.65,
    label: '04 / ЖОҒАЛҒАН ӨНІМ',
    title: 'Инфляция және 1/3 ысырап',
    metric: '1,3 млрд тонна',
    caption: 'Өндірілген тағамның үштен бірі дастарханға жетпей рәсуа болады.',
  },
  {
    id: 'wp-renewal',
    progress: 0.85,
    label: '05 / ЖАҢҒЫРУ ОЙПАТЫ',
    title: 'Регенеративті болашақ',
    metric: '100% қолжетімді нәр',
    caption: 'Суды үнемдеу, ысырапты жою және бейбіт логистика арқылы аштықты жеңу.',
  },
];
