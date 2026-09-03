/**
 * AI Driving Coach — Authoritative Dutch Driving Knowledge Base
 * Extracted and structured from RVV 1990, CBR exam criteria, and official Dutch road standards.
 */

export interface KnowledgeItem {
  id: string;
  category: 'speed' | 'priority' | 'roundabouts' | 'signs' | 'markings' | 'mirrors' | 'vehicle' | 'maneuvers' | 'safety' | 'exam' | 'scenarios' | 'terminology';
  concept: string;
  aliases: string[];
  student_phrases: string[];
  language_variants: {
    ar: string[];
    nl: string[];
    en: string[];
  };
  keywords: string[];
  related_concepts: string[];
  question_ar: string;
  answer_ar: string;
  question_nl: string;
  answer_nl: string;
  question_en: string;
  answer_en: string;
  dutchTerms: string[];
  cbrFocus?: boolean;
  embedding_text?: string;
}

export const DRIVING_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // --- SPEED LIMITS & SPEED VS PRIORITY ---
  {
    id: 'kb-speed-vs-priority',
    category: 'priority',
    concept: 'Speed Limit vs Priority Dissociation',
    aliases: [
      'snelheid bepaalt geen voorrang', 'speed does not give right of way', 'السرعة لا تحدد الأولوية',
      'voorrang op 70 weg', 'voorrang op 30 weg', 'voorrang op 60 weg', 'voorrang op 80 weg',
      'أولوية شارع 70', 'أولوية شارع 30', 'أولوية شارع 60', 'أولوية شارع 80', 'أولوية شارع 50'
    ],
    student_phrases: [
      'من له الأولوية في شارع 70؟',
      'مين إله الحق في شارع 70؟',
      'مين بيمر أول في شارع 70؟',
      'طريق 70 وأنا داخل تقاطع، مين إله الأولوية؟',
      'إذا أنا على شارع 70 والشارع الثاني 30 مين بيمر؟',
      'أنا على شارع 70 وفي تقاطع بدون شاخطات والسيارة جاية من اليمين، مين بيمر؟',
      'أنا على شارع 70 وفي تقاطع بدون شاخطات، والسيارة جاية من اليمين، مين بيمر؟',
      'شارع 70 وتقاطع بدون شواخص',
      'طيب وإذا كان الشارع 30؟',
      'وإذا كان الشارع 30؟',
      'يعني السرعة بتحدد الأولوية؟',
      'هل السرعة تعطيني حق المرور؟',
      'أنا ماشي 70 والثاني ماشي 30 مين يمشي أول؟',
      'شارع سرعته 70',
      'Wie heeft voorrang op een 70 km/u weg?',
      'Bepaalt snelheid wie voorrang heeft?',
      'Als ik 70 rij en de ander 50 wie mag eerst?',
      'Does a 70 km/h speed limit give me right of way?',
      'Who has priority on a 70 or 30 road?'
    ],
    language_variants: {
      ar: ['السرعة لا تحدد الأولوية', 'شارع 70', 'شارع 30', 'شارع 60', 'شارع 80', 'حق المرور والسرعة', 'تقاطع متساوي والسرعة', 'شارع 70 وتقاطع بدون شواخص'],
      nl: ['snelheid bepaalt geen voorrang', 'voorrang 70 km/u', 'voorrang 30 km/u', 'gelijkwaardig kruispunt snelheid'],
      en: ['speed limit does not dictate priority', 'priority on 70 road', 'priority on 30 road', 'equal junction speed']
    },
    keywords: ['70', '60', '30', '50', '80', '100', '130', 'سرعة', 'أولوية', 'اولوية', 'يمر', 'الحق', 'بيمر', 'voorrang', 'snelheid', 'priority', 'speed'],
    related_concepts: ['kb-priority-equal-intersection', 'kb-priority-signs-b1-b6-b7', 'kb-priority-haaientanden'],
    question_ar: 'من له الأولوية في شارع 70 أو 60 أو 30 أو 50؟ هل السرعة تحدد الأولوية؟',
    answer_ar: 'القاعدة الأساسية: **السرعة لا تحدد الأولوية إطلاقاً (Snelheid bepaalt geen voorrang)**. حد السرعة (مثل 30، 50، 60، 70، 80 كم/س) يبين فقط أقصى سرعة مسموحة على الطريق، ولا يمنح حق المرور. الأولوية تُحدد دائماً بناءً على: 1. الشواخص المرورية (مثل شاخصة طريق الأولوية B1 أو شاخصة إعطاء الأولوية B6). 2. علامات الطريق (مثل أسنان القرش Haaietanden). 3. نوع التقاطع: في التقاطع المتساوي (Gelijkwaardig kruispunt) الخالي من الشواخص والعلامات، الأولوية دائماً للقادم من اليمين بغض النظر عن سرعة الشارع.',
    question_nl: 'Wie heeft voorrang op een 70, 60, 50 of 30 km/u weg? Bepaalt snelheid voorrang?',
    answer_nl: 'Basisregel: **Snelheid bepaalt nooit voorrang!** Een snelheidslimiet geeft alleen de maximaal toegestane snelheid aan. Voorrang wordt uitsluitend bepaald door voorrangsborden (zoals B1 of B6), wegmarkeringen (zoals haaietanden) of de algemene regel op gelijkwaardige kruispunten (bestuurders van rechts hebben voorrang).',
    question_en: 'Who has right of way on a 70, 60, 50 or 30 km/h road? Does speed determine priority?',
    answer_en: 'Core rule: **Speed limit NEVER determines right of way!** A speed limit only states the maximum speed allowed. Priority is determined by traffic signs (B1, B6), road markings (shark teeth / haaietanden), or general equal intersection rules (yield to the right).',
    dutchTerms: ['Snelheid bepaalt geen voorrang', 'Gelijkwaardig kruispunt', 'Voorrangsweg', 'Haaietanden'],
    cbrFocus: true
  },

  // --- GENERAL PRIORITY & EQUAL INTERSECTIONS ---
  {
    id: 'kb-priority-equal-intersection',
    category: 'priority',
    concept: 'Equal Intersection Priority from the Right',
    aliases: [
      'gelijkwaardig kruispunt', 'voorrang van rechts', 'priority from right',
      'الأولوية من اليمين', 'التقاطع المتساوي', 'تقاطع بدون إشارات', 'تقاطع بدون شواخص'
    ],
    student_phrases: [
      'أنا داخل تقاطع بدون شاخطات، والسيارة جاية من اليمين، مين بيمر؟',
      'أنا داخل تقاطع بدون شاخطات والسيارة جاية من اليمين مين بيمر؟',
      'تقاطع بدون شاخطات والسيارة جاية من اليمين',
      'تقاطع بدون شاخصات والسيارة جاية من اليمين',
      'من له الأولوية؟',
      'مين إله الحق؟',
      'مين بيمر أول؟',
      'مين بيفوت أول؟',
      'مين بيمر؟',
      'أنا جاي من اليمين، بمر أول؟',
      'أنا جاي من اليمين بمر؟',
      'أنا على شارع 70 وفي تقاطع بدون شاخطات والسيارة جاية من اليمين، مين بيمر؟',
      'لو في سيارة من اليمين؟',
      'لو في سيارة جاية من اليمين مين بيمر؟',
      'إذا في دراجة على اليمين مين بيمر؟',
      'ولو السيارة الثانية دراجة؟',
      'ولو كانت دراجة؟',
      'ولو في دراجة؟',
      'أنا إلي حق؟',
      'أنا أمشي أول ولا هو؟',
      'تقاطع بدون شاخصات مين يمر؟',
      'مين له أولوية في التقاطع؟',
      'Wie heeft voorrang op een gelijkwaardig kruispunt?',
      'Wie heeft voorrang?',
      'Wie mag eerst?',
      'Bestuurders van rechts',
      'Who has priority?',
      'Who goes first at an unmarked junction?',
      'Yield to right'
    ],
    language_variants: {
      ar: ['الأولوية للقادم من اليمين', 'تقاطع متساوي', 'مين بيمر', 'مين إله الحق', 'سيارة من اليمين', 'دراجة من اليمين', 'ولو السيارة دراجة'],
      nl: ['gelijkwaardig kruispunt', 'voorrang van rechts', 'wie mag eerst', 'bestuurders van rechts'],
      en: ['equal junction', 'priority from right', 'who goes first', 'yield to right']
    },
    keywords: ['تقاطع متساوي', 'gelijkwaardig kruispunt', 'يمين', 'rechts', 'بلا شواخص', 'بدون اشارات', 'بدون شاخطات', 'مين بيمر', 'مين يمر', 'أولوية', 'حق', 'بيمر أول', 'دراجة'],
    related_concepts: ['kb-priority-turning-straight-ahead', 'kb-priority-short-turn-vs-long-turn', 'kb-priority-signs-b1-b6-b7'],
    question_ar: 'من له الأولوية في التقاطع المتساوي (Gelijkwaardig kruispunt)؟',
    answer_ar: 'في التقاطع المتساوي (أي تقاطع يخلو من شواخص الأولوية أو أسنان القرش أو الإشارات الضوئية): **الأولوية دائماً لحركة المرور القادمة من اليمين (Voorrang van rechts)**. يشمل ذلك السيارات، الدراجات النارية، الدراجات الهوائية، وعربات الجر. نوع المركبة أو سرعة الطريق لا يغيّر القاعدة؛ فراكب الدراجة الهوائية هو سائق مركبة (Bestuurder) ويخضع لقواعد أولوية المرور المعمول بها في هولندا، فإذا جاء من اليمين في تقاطع متساوي، فله الأولوية.',
    question_nl: 'Wie heeft voorrang op een gelijkwaardig kruispunt?',
    answer_nl: 'Op een gelijkwaardig kruispunt (zonder voorrangsborden, haaietanden of verkeerslichten) hebben alle bestuurders van rechts voorrang. De persoon die op een fiets rijdt is een bestuurder en valt onder de geldende voorrangsregels. Voetgangers zijn geen bestuurders.',
    question_en: 'Who has priority at an equal intersection (Gelijkwaardig kruispunt)?',
    answer_en: 'At an equal junction (no signs, road markings, or traffic lights), all drivers from the right have right-of-way. The person riding a bicycle is a driver (Bestuurder) and is subject to the applicable Dutch traffic priority rules. Pedestrians are not drivers.',
    dutchTerms: ['Gelijkwaardig kruispunt', 'Voorrang van rechts', 'Bestuurders', 'Fietsers'],
    cbrFocus: true
  },

  // --- TRAFFIC SIGNS: B1, B6, B7 ---
  {
    id: 'kb-priority-signs-b1-b6-b7',
    category: 'signs',
    concept: 'Priority Signs B1, B6, B7',
    aliases: [
      'bord b1', 'bord b6', 'bord b7', 'voorrangsborden', 'voorrangsweg bord', 'verleen voorrang bord', 'stopbord',
      'شاخصة b1', 'شاخصة b6', 'شاخصة b7', 'المعين الأصفر', 'المثلث المقلوب', 'شاخصة قف', 'الفرق بين b1 و b6'
    ],
    student_phrases: [
      'شو الفرق بين B1 و B6؟',
      'ما الفرق بين B1 و B6؟',
      'ما الفرق بين طريق الأولوية وإعطاء الأولوية؟',
      'متى تكون الأولوية إلي؟',
      'شو يعني المعين الأصفر؟',
      'شو يعني المثلث المقلوب؟',
      'شاخصة B1 وشاخصة B6',
      'شاخصة B7 وشاخصة قف',
      'طيب مين بيمر؟',
      'ولو في دراجة؟',
      'إذا عندي شاخصة B1 مين بيمر؟',
      'إذا عندي شاخصة B6 مين بيمر؟',
      'Wat is het verschil tussen bord B1 en B6?',
      'Bord B1 vs Bord B6',
      'Bord B7 stopbord',
      'What is the difference between signs B1 and B6?'
    ],
    language_variants: {
      ar: ['شاخصة B1', 'شاخصة B6', 'شاخصة B7', 'طريق أولوية', 'إعطاء أولوية', 'شاخصة قف', 'المعين الأصفر', 'المثلث المقلوب'],
      nl: ['bord B1 voorrangsweg', 'bord B6 verleen voorrang', 'bord B7 stopbord', 'gele ruit', 'driehoek punt omlaag'],
      en: ['sign B1 priority road', 'sign B6 give way', 'sign B7 stop sign', 'yellow diamond', 'inverted triangle']
    },
    keywords: ['b1', 'b6', 'b7', 'شاخصة b1', 'شاخصة b6', 'شاخصة b7', 'فرق بين b1 و b6', 'معين أصفر', 'مثلث مقلوب', 'قف', 'stop', 'voorrangsweg'],
    related_concepts: ['kb-priority-haaientanden', 'kb-priority-equal-intersection'],
    question_ar: 'ما الفرق بين الشواخص B1 و B6 و B7 ومن له الأولوية؟',
    answer_ar: '1. **الشاخصة B1 (المعين الأصفر ذو الإطار الأبيض - Voorrangsweg):** تعني أنك تسير على طريق أولوية، ولك حق الأولوية في جميع التقاطعات القادمة حتى ظهور شاخصة نهاية طريق الأولوية B2.\n2. **الشاخصة B6 (المثلث المقلوب بإطار أحمر - Verleen voorrang):** تلزمك بإعطاء الأولوية (Voorrang verlenen) لحركة المرور التي تملك الأولوية على الطريق المتقاطع؛ ولا تلزمك بالتوقف التام إلا إذا كان ذلك ضرورياً لإعطاء الأولوية بأمان.\n3. **الشاخصة B7 (شاخصة قف المثمنة الحمراء - STOP):** تلزمك بالتوقف التام والكامل عند خط التوقف (حتى لو كان الطريق فارغاً)، ثم إعطاء الأولوية لجميع السائقين على الطريق المتقاطع.',
    question_nl: 'Wat is het verschil tussen borden B1, B6 en B7 en wie heeft voorrang?',
    answer_nl: '1. Bord B1 (Voorrangsweg / gele ruit): Jij rijdt op een voorrangsweg en hebt voorrang op kruispunten.\n2. Bord B6 (Driehoek punt omlaag / Verleen voorrang): Je moet voorrang verlenen aan bestuurders op de kruisende weg. Stoppen is alleen verplicht wanneer dat nodig is om veilig voorrang te verlenen.\n3. Bord B7 (STOP-bord): Verplicht volledig stoppen bij de stopstreep en voorrang verlenen aan alle bestuurders op de kruisende weg.',
    question_en: 'What is the difference between signs B1, B6, and B7?',
    answer_en: '1. Sign B1 (Yellow diamond): Priority road; you have right of way at upcoming junctions.\n2. Sign B6 (Inverted triangle): Yield/Give way (Voorrang verlenen) to drivers on the crossing road. Stopping is only required when necessary to safely yield.\n3. Sign B7 (STOP sign): Mandatory complete stop at the stop line, then yield to all drivers on the crossing road.',
    dutchTerms: ['Bord B1 Voorrangsweg', 'Bord B6 Verleen voorrang', 'Bord B7 Stopbord', 'Stopstreep'],
    cbrFocus: true
  },

  // --- ROAD MARKINGS: HAAIENTANDEN ---
  {
    id: 'kb-priority-haaientanden',
    category: 'markings',
    concept: 'Shark Teeth Road Markings (Haaietanden)',
    aliases: [
      'haaietanden', 'haaientanden', 'shark teeth markings', 'مثلثات بيضاء على الأرض', 'اسنان القرش', 'أسنان القرش'
    ],
    student_phrases: [
      'ماذا تعني أسنان القرش؟',
      'شو يعني أسنان القرش على الأرض؟',
      'هل لازم أوقف عند أسنان القرش؟',
      'إذا في أسنان قرش مين بيمر؟',
      'توقف عند haaientanden',
      'Wat betekenen haaietanden?',
      'Moet ik stoppen bij haaietanden?',
      'What do shark teeth mean?',
      'Do I have to stop at shark teeth?'
    ],
    language_variants: {
      ar: ['أسنان القرش', 'مثلثات بيضاء', 'إعطاء الأولوية على الأرض', 'هل يجب التوقف'],
      nl: ['haaietanden', 'witte driehoeken op de weg', 'voorrang verlenen', 'moet je stoppen'],
      en: ['shark teeth', 'white triangles on road', 'give way markings', 'must you stop']
    },
    keywords: ['haaientanden', 'haaietanden', 'أسنان القرش', 'اسنان القرش', 'مثلثات بيضاء', 'خط اسنان القرش', 'توقف عند اسنان القرش'],
    related_concepts: ['kb-priority-signs-b1-b6-b7', 'kb-priority-equal-intersection'],
    question_ar: 'ماذا تعني علامات أسنان القرش (Haaientanden) وهل يجب التوقف عندها؟',
    answer_ar: 'علامات أسنان القرش (Haaientanden) هي مثلثات بيضاء مرسومة على أرضية الطريق تلزمك بإعطاء الأولوية للسائقين على الطريق المتقاطع. **هل يجب التوقف دائماً؟** لا، لا يلزمك التوقف التام إلا إذا كانت هناك حركة مرور قادمة تحتاج لإعطائها الأولوية. إذا كان الطريق خالياً تماماً، يمكنك المتابعة دون توقف.',
    question_nl: 'Wat betekenen haaietanden en moet je altijd stoppen?',
    answer_nl: 'Haaietanden verplichten je om voorrang te verlenen aan bestuurders op de kruisende weg. Je hoeft niet verplicht stil te staan; je stopt alleen als er daadwerkelijk verkeer aankomt waaraan je voorrang moet verlenen.',
    question_en: 'What do shark teeth (haaientanden) mean and do you have to stop?',
    answer_en: 'Shark teeth (haaietanden) mean you must give way to drivers on the crossing road. You do not need to come to a full stop unless crossing traffic is approaching.',
    dutchTerms: ['Haaietanden', 'Voorrang verlenen'],
    cbrFocus: true
  },

  // --- TURNING TRAFFIC: STRAIGHT AHEAD ON SAME ROAD & CYCLISTS ---
  {
    id: 'kb-priority-turning-straight-ahead',
    category: 'priority',
    concept: 'Straight-on traffic on same road goes first (Rechtdoor op dezelfde weg)',
    aliases: [
      'rechtdoor op dezelfde weg gaat voor', 'straight ahead goes first', 'المستقيم يسبق المنعطف',
      'دراجة بجانبي', 'دراجة مستقيمة', 'انعطاف يمين ودراجة', 'انعطاف يسار ودراجة'
    ],
    student_phrases: [
      'ما هي قاعدة المستقيم يسبق المنعطف؟',
      'إذا بدي ألف يمين وفي دراجة جنبي مين بيمر؟',
      'ولو في دراجة؟',
      'ولو أنا بدي ألف يسار؟',
      'إذا بدي انعطف وفي مشاة ماشيين مستقيم؟',
      'دراجة ماشية مستقيم وأنا بدي ألف',
      'Rechtdoor op dezelfde weg gaat voor',
      'Als ik afsla en er rijdt een fietser rechtdoor wie mag eerst?',
      'Turning traffic yields to straight cyclists',
      'Straight on traffic on same road'
    ],
    language_variants: {
      ar: ['المستقيم يسبق المنعطف', 'دراجة بجانبي', 'انعطاف ودراجة مستقيمة', 'مشاة مستقيمين'],
      nl: ['rechtdoor op dezelfde weg gaat voor', 'afslaand verkeer', 'fietser rechtdoor', 'voetganger rechtdoor'],
      en: ['straight ahead on same road goes first', 'turning traffic', 'straight cyclist', 'straight pedestrian']
    },
    keywords: ['rechtdoor op dezelfde weg', 'مستقيم', 'انعطاف', 'يسار', 'يمين', 'دراجة بجانبي', 'دراجة مستقيمة', 'afslaan', 'rechtdoor', 'fietser'],
    related_concepts: ['kb-priority-short-turn-vs-long-turn', 'kb-mirrors-spiegelen-routine'],
    question_ar: 'ما هي قاعدة المرور المستقيم على نفس الطريق (Rechtdoor op dezelfde weg gaat voor)؟',
    answer_ar: 'القاعدة: **حركة المرور التي تستمر مستقيمة على نفس الطريق لها الأولوية على حركة المرور المنعطفة (Rechtdoor op dezelfde weg gaat voor afslaand verkeer)**.\n- **تطبيق عملي هام:** إذا كنت تقود وتريد الانعطاف يميناً أو يساراً، وهناك دراجة هوائية أو مشاة بجانبك يسيرون بشكل مستقيم على نفس الطريق، يجب عليك التوقف وإعطاؤهم حق المرور قبل أن تنعطف.',
    question_nl: 'Wat betekent rechtdoor op dezelfde weg gaat voor?',
    answer_nl: 'Rechtdoorgaand verkeer op dezelfde weg heeft voorrang op afslaand verkeer. Sla je rechts of links af, dan moet je rechtdoorgaande fietsers en voetgangers op dezelfde weg voor laten gaan.',
    question_en: 'What does straight-on traffic on the same road goes first mean?',
    answer_en: 'Traffic going straight ahead on the same road has priority over turning traffic. If you turn right or left, you must yield to cyclists and pedestrians going straight ahead on the same road.',
    dutchTerms: ['Rechtdoor op dezelfde weg gaat voor afslaand verkeer', 'Afslaan', 'Rechtdoor'],
    cbrFocus: true
  },

  // --- SHORT TURN VS LONG TURN ---
  {
    id: 'kb-priority-short-turn-vs-long-turn',
    category: 'priority',
    concept: 'Short Turn vs Long Turn (Korte bocht gaat voor lange bocht)',
    aliases: [
      'korte bocht gaat voor lange bocht', 'short turn before long turn', 'منعطف قصير يسبق المنعطف الطويل',
      'سيارتان متقابلتان تلفان في نفس الشارع', 'انعطاف يمين مقابل يسار'
    ],
    student_phrases: [
      'ما هي قاعدة المنعطف القصير والمنعطف الطويل؟',
      'سيارتين مقابل بعض بدهم يدخلوا نفس الشارع مين بيمر؟',
      'أنا بدي ألف يمين والمقابل بدو يلف يسار مين يمر أول؟',
      'ولو أنا بدي ألف يسار؟',
      'Korte bocht gaat voor lange bocht',
      'Two oncoming cars turning into same road who goes first?',
      'Short turn vs long turn'
    ],
    language_variants: {
      ar: ['المنعطف القصير يسبق المنعطف الطويل', 'انعطاف يمين مقابل يسار', 'سيارتان متقابلتان'],
      nl: ['korte bocht gaat voor lange bocht', 'rechtsafslaand voor linksafslaand'],
      en: ['short turn goes before long turn', 'right turn before oncoming left turn']
    },
    keywords: ['korte bocht', 'lange bocht', 'منعطف قصير', 'منعطف طويل', 'انعطاف يمين مقابل يسار', 'سيارتان متقابلتان', 'يسار'],
    related_concepts: ['kb-priority-turning-straight-ahead', 'kb-priority-equal-intersection'],
    question_ar: 'ما هي قاعدة المنعطف القصير يسبق المنعطف الطويل (Korte bocht gaat voor lange bocht)؟',
    answer_ar: 'عندما تتقابل سيارتان وجهاً لوجه في تقاطع وكلتاهما تريد الانعطاف في نفس الشارع المتقاطع: **السيارة التي تنعطف يميناً (منعطف قصير Korte bocht) تمر قبل السيارة المقابلة التي تنعطف يساراً (منعطف طويل Lange bocht)**.',
    question_nl: 'Wat is de regel korte bocht gaat voor lange bocht?',
    answer_nl: 'Als twee tegemoetkomende bestuurders dezelfde weg in willen slaan, gaat de rechtsafslaande bestuurder (korte bocht) voor de linksafslaande bestuurder (lange bocht).',
    question_en: 'What is the short turn goes before long turn rule?',
    answer_en: 'When two oncoming vehicles want to turn into the same street, the right-turning driver (short turn) has priority over the oncoming left-turning driver (long turn).',
    dutchTerms: ['Korte bocht gaat voor lange bocht'],
    cbrFocus: true
  },

  // --- EXIT CONSTRUCTIONS & UNPAVED ROADS ---
  {
    id: 'kb-priority-uitrit-unpaved',
    category: 'priority',
    concept: 'Exit Construction (Uitrit) and Unpaved Road Priority',
    aliases: [
      'uitritconstructie', 'onverharde weg', 'verharde weg', 'طريق غير معبد', 'مخرج', 'رصيف مائل', 'عتبة مخرج'
    ],
    student_phrases: [
      'من له الأولوية عند الخروج من مخرج أو كراج؟',
      'إذا طالع من uitrit مين بيمر؟',
      'من له الأولوية بين طريق ترابي وطريق معبد؟',
      'طالع من كراج وفي مشاة مين إله الحق؟',
      'Uitritconstructie voorrang',
      'Onverharde weg naar verharde weg',
      'Exit construction right of way'
    ],
    language_variants: {
      ar: ['الخروج من مخرج', 'طريق ترابي غير معبد', 'رصيف مائل', 'كراج موقف'],
      nl: ['uitritconstructie', 'onverharde weg', 'verharde weg', 'inrit uitrit'],
      en: ['exit construction', 'unpaved road', 'paved road', 'driveway exit']
    },
    keywords: ['uitrit', 'uitritconstructie', 'مخرج', 'طريق غير معبد', 'onverhard', 'رصيف مائل', 'drempel', 'كراج'],
    related_concepts: ['kb-priority-equal-intersection'],
    question_ar: 'من له الأولوية عند الخروج من مخرج (Uitrit) أو طريق غير معبد (Onverharde weg)؟',
    answer_ar: '1. **الخروج من مخرج (Uitrit / Uitritconstructie):** السائق الخارج من كراج، موقف، أو عبر رصيف مائل/عتبة مخرج يجب عليه إعطاء الأولوية لجميع مستخدمي الطريق الآخرين بلا استثناء (مشاة، دراجات، سيارات من اليمين واليسار).\n2. **الطريق غير المعبد (Onverharde weg):** السائق القادم من طريق ترابي/غير معبد إلى طريق معبد يجب عليه إعطاء الأولوية لجميع السائقين على الطريق المعبد (قاعدة اليمين لا تنطبق عليه).',
    question_nl: 'Wie heeft voorrang bij een uitrit of onverharde weg?',
    answer_nl: 'Wie een uitritconstructie verlaat of van een onverharde weg een verharde weg oprijdt, moet álle overige weggebruikers (inclusief voetgangers bij een uitrit) voor laten gaan.',
    question_en: 'Who has priority at an exit construction (uitrit) or unpaved road?',
    answer_en: 'Anyone leaving an exit construction (uitrit) or driving from an unpaved road onto a paved road must yield to all other road users.',
    dutchTerms: ['Uitritconstructie', 'Onverharde weg', 'Verharde weg'],
    cbrFocus: true
  },

  // --- ROUNDABOUTS (ROTONDES) ---
  {
    id: 'kb-roundabout-rules',
    category: 'roundabouts',
    concept: 'Roundabout Priority, Indicating & Blind Spot Check',
    aliases: [
      'rotonde regels', 'voorrang op rotonde', 'richting aangeven rotonde', 'دوار', 'الدوار الهولندي', 'قواعد الدوار', 'غماز الدوار'
    ],
    student_phrases: [
      'كيف أتعامل مع الدوار؟',
      'اشرح لي الدوار في هولندا',
      'مين إله الأولوية بالدوار؟',
      'متى أشغل الغماز في الدوار؟',
      'الدوار والمخرج الأول والثاني والثالث',
      'خروج من الدوار وفي دراجة',
      'Rotonde voorrang en richting aangeven',
      'Hoe werkt een rotonde in Nederland?',
      'Roundabout rules in Netherlands'
    ],
    language_variants: {
      ar: ['قواعد الدوار', 'الأولوية في الدوار', 'غماز الدوار', 'دراجات عند مخرج الدوار'],
      nl: ['rotonde regels', 'voorrang rotonde', 'richting aangeven rotonde', 'dode hoek rotonde'],
      en: ['roundabout rules', 'roundabout priority', 'indicating on roundabout', 'roundabout cyclists']
    },
    keywords: ['دوار', 'الدوار', 'rotonde', 'roundabout', 'غماز في الدوار', 'أولوية في الدوار', 'خروج من الدوار', 'مخرج'],
    related_concepts: ['kb-mirrors-spiegelen-routine', 'kb-priority-signs-b1-b6-b7'],
    question_ar: 'كيف أتعامل مع الدوار (Rotonde) في هولندا وما هي قواعد الأولوية والغماز؟',
    answer_ar: '1. **الأولوية عند الدخول:** في معظم الدوارات في هولندا توجد شاخصة B6 وأسنان قرش عند المداخل، مما يعني أن الأولوية للمركبات الموجودة بالفعل داخل الدوار.\n2. **استخدام الغماز (Richtingaanwijzer):**\n   - المخرج الأول (يميناً): شغّل الغماز الأيمن قبل دخول الدوار.\n   - المخرج الثاني (مستقيم للأمام): لا تشغل أي غماز عند الدخول، وشغّل الغماز الأيمن بمجرد تجاوز المخرج الأول.\n   - المخرج الثالث (يساراً/دوران كامل): شغّل الغماز الأيسر عند الدخول والالتفاف، ثم حوّل للغماز الأيمن قبل المخرج المطلوب مباشرة.\n3. **مراقبة الدراجات والمشاة:** عند الخروج من الدوار، افحص المرآة اليمنى والنقطة العمياء (Dode hoek) وأعطِ الأولوية للدراجات الهوائية والمشاة العابرين إذا كان مسارهم يتقاطع مع مسارك.',
    question_nl: 'Wat zijn de regels voor rotondes in Nederland qua voorrang en richting aangeven?',
    answer_nl: '1. Voorrang: Bij bord B6 en haaietanden heeft verkeer op de rotonde voorrang.\n2. Richting aangeven:\n   - Rechtsaf: rechts aangeven voor het oprijden.\n   - Rechtdoor: geen richting voor het oprijden, rechts aangeven na het passeren van de voorgaande afslag.\n   - Linksaf: links aangeven voor het oprijden, rechts aangeven direct voor de gewenste afslag.\n3. Fietsers/Voetgangers: Kijk bij het verlaten altijd in de rechterspiegel en over de schouder (dode hoek) en verleen voorrang.',
    question_en: 'What are the rules for roundabouts in the Netherlands regarding priority and signalling?',
    answer_en: '1. Priority: Yield to traffic on the roundabout at sign B6 and shark teeth.\n2. Signalling: Indicate right before entering for 1st exit; no signal on entry for straight, signal right after passing previous exit; indicate left on entry for 3rd exit, then indicate right before exiting.\n3. Blind spot: Check right mirror and right blind spot for cyclists before exiting.',
    dutchTerms: ['Rotonde', 'Richtingaanwijzer', 'Dode hoek'],
    cbrFocus: true
  },

  // --- OBSERVATION, MIRRORS & BLIND SPOT ---
  {
    id: 'kb-mirrors-spiegelen-routine',
    category: 'mirrors',
    concept: 'Mirror Routine (Spiegelen) & Blind Spot Check (Dode hoek)',
    aliases: [
      'spiegelen', 'kijktechniek', 'dode hoek', 'binnenspiegel', 'buitenspiegel',
      'تسلسل النظر', 'المرايا', 'النقطة العمياء', 'مرآة الوسط', 'المرآة الجانبية'
    ],
    student_phrases: [
      'ما هو تسلسل النظر الصحيح بالمرايا؟',
      'كيف أنظر بالمرايا spiegelen؟',
      'متى لازم أفحص النقطة العمياء؟',
      'شو ترتيب المرايا قبل الانعطاف؟',
      'Dode hoek controleren',
      'CBR kijkvolgorde',
      'Mirror routine before turning',
      'Blind spot check'
    ],
    language_variants: {
      ar: ['تسلسل النظر', 'المرايا', 'النقطة العمياء', 'مرآة الوسط', 'مرآة جانبية', 'نظرة فوق الكتف'],
      nl: ['spiegelen', 'kijktechniek', 'dode hoek', 'binnenspiegel', 'buitenspiegel', 'over de schouder'],
      en: ['mirror routine', 'observation technique', 'blind spot', 'interior mirror', 'shoulder check']
    },
    keywords: ['مرايا', 'مرآة', 'spiegelen', 'spiegel', 'نقطة عمياء', 'dode hoek', 'تسلسل النظر', 'kijktechniek', 'مراقبة'],
    related_concepts: ['kb-roundabout-rules', 'kb-priority-turning-straight-ahead'],
    question_ar: 'ما هو تسلسل النظر الصحيح بالمرايا (Spiegelen) ومتى أفحص النقطة العمياء (Dode hoek)؟',
    answer_ar: 'نظام المراقبة المعتمد لدى CBR (Kijktechniek):\n1. **التسلسل الأساسي:**\n   - انظر في مرآة الوسط الداخلية (Binnenspiegel).\n   - انظر في المرآة الجانبية للجهة المقصودة (Buitenspiegel).\n   - ألقِ نظرة فوق الكتف للنقطة العمياء (Dode hoek) للتأكد من عدم وجود دراجة أو سيارة محاذية.\n   - شغّل الغماز (Richting aangeven).\n   - تحقق مرة أخيرة ثم نفّذ الحركة بسلاسة.\n2. **متى تراقب؟** قبل كل فرملة، قبل كل انعطاف، قبل تغيير الحارة، وقبل تجاوز أي مستخدم طريق.',
    question_nl: 'Wat is de juiste kijktechniek (spiegelen) en wanneer controleer je de dode hoek?',
    answer_nl: 'De vaste CBR kijkvolgorde:\n1. Binnenspiegel.\n2. Buitenspiegel naar de kant waar je heen gaat.\n3. Over de schouder kijken voor de dode hoek.\n4. Richting aangeven.\n5. Nogmaals controleren en vloeiend uitvoeren.\nVoer dit altijd uit vóór remmen, afslaan, van rijstrook wisselen of inhalen.',
    question_en: 'What is the correct mirror routine (spiegelen) and when to check the blind spot (dode hoek)?',
    answer_en: 'The standard CBR observation routine:\n1. Interior mirror (Binnenspiegel).\n2. Exterior side mirror to intended side (Buitenspiegel).\n3. Over the shoulder check for the blind spot (Dode hoek).\n4. Indicate direction.\n5. Re-check and smoothly execute maneuver.',
    dutchTerms: ['Spiegelen', 'Binnenspiegel', 'Buitenspiegel', 'Dode hoek', 'Kijktechniek'],
    cbrFocus: true
  },

  // --- VEHICLE CONTROLS & CLUTCH VIBRATION ---
  {
    id: 'kb-vehicle-clutch-shaking',
    category: 'vehicle',
    concept: 'Clutch Biting Point (Aangrijpingspunt) & Engine Stalling/Shudder',
    aliases: [
      'aangrijpingspunt', 'koppeling trillen', 'auto slaat af', 'clutch shudder', 'car shaking on moving off',
      'نقطة التلامس', 'الكلتش يرج', 'السيارة ترج', 'اهتزاز السيارة عند الانطلاق', 'انطفاء محرك السيارة'
    ],
    student_phrases: [
      'ليش السيارة ترج؟',
      'ليش الكلتش برج السيارة؟',
      'شو سبب الرجفة عند الانطلاق؟',
      'ليش السيارة بتطفي معي لما أمشي؟',
      'كيف أتحكم بنقطة التلامس بالدبرياج؟',
      'Waarom trilt of schudt de auto bij het wegrijden?',
      'Waarom slaat de motor af?',
      'Hoe vind ik het aangrijpingspunt?',
      'Why does the car shudder when moving off?',
      'Why does the clutch shake the car?',
      'How to control the clutch biting point?'
    ],
    language_variants: {
      ar: ['السيارة ترج', 'رجفة الكلتش', 'نقطة التلامس', 'انطفاء السيارة عند الانطلاق', 'دبرياج'],
      nl: ['auto trilt bij wegrijden', 'koppeling aangrijpingspunt', 'motor slaat af', 'stotteren'],
      en: ['car shaking moving off', 'clutch biting point', 'engine stall', 'shuddering']
    },
    keywords: ['تهتز', 'اهتزاز', 'ترج', 'ترجف', 'تنطفئ', 'تطفي', 'دبرياج', 'كلتش', 'aangrijpingspunt', 'koppeling', 'afslaan', 'trillen', 'stotteren', 'clutch', 'stall', 'رجفة'],
    related_concepts: ['kb-cbr-exam-tips-mistakes'],
    question_ar: 'لماذا تهتز السيارة أو تنطفئ عند الانطلاق وما هي نقطة التلامس (Aangrijpingspunt)؟',
    answer_ar: '1. **سبب اهتزاز/انطفاء السيارة (أسلوب قيادة):** رفع القدم بسرعة زائدة عن نقطة التلامس (Aangrijpingspunt) قبل إعطاء كمية كافية من الوقود، أو محاولة الانطلاق بغيار مرتفع (مثل الغيار الثالث بدلاً من الأول).\n2. **الحل العملي:** اضغط قليلاً على دواسة الوقود (حوالي 1500 دورة)، ارفع الكلتش ببطء حتى تشعر بنقطة التلامس (صوت المحرك ينخفض والسيارة تبدأ بالتحرك)، **ثبّت قدمك عند نقطة التلامس لمدة ثانية إلى ثانيتين** حتى تمشي السيارة، ثم ارفع قدمك بالكامل بسلاسة.\n3. **الاحتمال الميكانيكي:** إذا استمر الاهتزاز أثناء القيادة بسرعة ثابتة أو عند الفرملة، فقد يكون السبب تآكل أقراص الكلتش، أو خلل في ميزان العجلات (Uitlijnen/Balanceren)، ويلزم فحصها لدى ورشة صيانة.',
    question_nl: 'Waarom schudt of slaat de auto af bij het wegrijden en wat is het aangrijpingspunt?',
    answer_nl: '1. Oorzaak: Te snel op laten komen van de koppeling voorbij het aangrijpingspunt zonder voldoende gas, of wegrijden in een te hoge versnelling.\n2. Oplossing: Geef een beetje gas, laat de koppeling rustig opkomen tot het aangrijpingspunt, houd de voet 1-2 seconden stil op het aangrijpingspunt terwijl de auto rolt, en laat dan rustig helemaal los.\n3. Mechanisch: Als trillingen blijven bestaan tijdens constant rijden of remmen, kan dit duiden op een versleten koppeling of onbalans in de wielen.',
    question_en: 'Why does the car shudder or stall when moving off and what is the biting point (aangrijpingspunt)?',
    answer_en: '1. Cause: Releasing the clutch too quickly past the biting point (aangrijpingspunt) without enough throttle.\n2. Solution: Apply gentle throttle, raise clutch to biting point, hold steady for 1-2 seconds until rolling, then release smoothly.\n3. Mechanical check: Ongoing vibrations during steady cruising or braking indicate clutch wear or wheel imbalance.',
    dutchTerms: ['Aangrijpingspunt', 'Koppeling', 'Afslaan', 'Trillen'],
    cbrFocus: true
  },

  // --- VEHICLE DASHBOARD WARNING LIGHTS & SAFETY ---
  {
    id: 'kb-vehicle-warning-lights-safety',
    category: 'vehicle',
    concept: 'Dashboard Warning Lights and Safety Rules',
    aliases: [
      'waarschuwingslampjes', 'olielampje', 'acculampje', 'motorstoringslampje', 'koelvloeistof',
      'لمبات التابلوه', 'لمبة الزيت', 'لمبة البطارية', 'لمبة المحرك', 'سائل التبريد حرارة'
    ],
    student_phrases: [
      'ما معنى لمبات التحذير في السيارة؟',
      'أضواء التابلوه الحمراء والصفراء',
      'شو أعمل لو ضوت لمبة الزيت الحمراء؟',
      'هل أفتح غطاء الرديتر والمحرك حامي؟',
      'Waarschuwingslampjes op het dashboard',
      'Rood olielampje wat te doen?',
      'What to do if red oil light comes on?',
      'Dashboard warning lights meaning'
    ],
    language_variants: {
      ar: ['لمبات التحذير', 'لمبة الزيت الحمراء', 'لمبة البطارية', 'لمبة المحرك', 'حرارة المحرك'],
      nl: ['waarschuwingslampjes dashboard', 'rood olielampje', 'acculampje', 'motortemperatuur'],
      en: ['dashboard warning lights', 'oil light', 'battery alternator', 'coolant overheating']
    },
    keywords: ['لمبة', 'ضوء', 'تحذير', 'زيت', 'بطارية', 'محرك', 'حرارة', 'رديتر', 'تبريد', 'abs', 'tpms', 'اطارات', 'فرامل', 'lampje', 'olie', 'accu', 'motorlampje', 'koelvloeistof', 'warning light'],
    related_concepts: ['kb-vehicle-clutch-shaking'],
    question_ar: 'ما معنى لمبات التحذير في تابلوه السيارة وما هي إجراءات السلامة؟',
    answer_ar: 'إرشادات أضواء التحذير في التابلوه:\n- **لمبة الزيت الحمراء (Oliedruk):** خطر شديد! تدل على هبوط ضغط زيت المحرك. يجب التوقف فوراً في مكان آمن وإطفاء المحرك لتجنب تلفه التام.\n- **لمبة البطارية الحمراء (Accu/Dynamo):** تعني وجود خلل في نظام الشحن أو مولد الكهرباء (Alternator).\n- **لمبة فحص المحرك الصفراء (Check Engine):** تشير لخلل مسجل في منظومة المحرك أو الانبعاثات، وتتطلب فحصاً تشخيصياً بالجهاز.\n- **ارتفاع حرارة المحرك وسائل التبريد (Koelvloeistof):** توقف بأمان. **تحذير سلامة هام:** لا تفتح غطاء سائل التبريد/الرديتر أبداً والمحرك ساخن لتفادي انفجار البخار والحروق البالغة.\n- **لمبة ضغط الإطارات (TPMS):** تدل على نقص الهواء في أحد الإطارات. تجد ضغط الهواء الصحيح على ملصق قائم باب السائق أو غطاء خزان الوقود.',
    question_nl: 'Wat betekenen de waarschuwingslampjes op het dashboard en wat zijn de veiligheidsregels?',
    answer_nl: '- Rood olielampje: Ernstig te lage oliedruk. Direct veilig stoppen en motor afzetten.\n- Rood acculampje: Storing in laadsysteem/dynamo.\n- Oranje motorlampje: Storing in het motormanagement/emissiesysteem; laten uitlezen.\n- Hoge motortemperatuur: Stop veilig. Open nooit de radiatordop als de motor heet is wegens verbrandingsgevaar!\n- TPMS bandenspanningslampje: Bandenspanning controleren via label op de deurstijl.',
    question_en: 'What do dashboard warning lights mean and what safety actions are required?',
    answer_en: '- Red Oil Light: Dangerously low oil pressure. Safely stop and turn off engine immediately.\n- Red Battery Light: Charging system/alternator malfunction.\n- Yellow Engine Light: Emission or engine management fault; requires diagnostic scan.\n- Overheating: Stop safely. Never open the radiator cap while engine is hot!\n- TPMS: Low tyre pressure; check label on driver door pillar.',
    dutchTerms: ['Oliedruklampje', 'Acculampje', 'Motorstoringslampje', 'Koelvloeistof', 'Bandenspanning TPMS'],
    cbrFocus: true
  },

  // --- CBR PRACTICAL EXAM GUIDELINES ---
  {
    id: 'kb-cbr-exam-tips-mistakes',
    category: 'exam',
    concept: 'CBR Practical Exam Criteria and Wrong Turn Handling',
    aliases: [
      'cbr praktijkexamen', 'verkeerd gereden examen', 'examinator beoordeling', 'cbr exam tips',
      'امتحان القيادة العملي cbr', 'الخطأ في الطريق بالامتحان', 'معايير فاحص cbr'
    ],
    student_phrases: [
      'ما هي متطلبات النجاح في امتحان CBR؟',
      'شو أعمل لو غلطت بالطريق أثناء الامتحان؟',
      'هل الخطأ في الاتجاه يرسب في امتحان السياقة؟',
      'نصائح لامتحان السياقة العملي',
      'Wat doe je als je verkeerd rijdt tijdens het CBR examen?',
      'CBR praktijkexamen tips en beoordeling',
      'What if I take a wrong turn during the CBR driving exam?'
    ],
    language_variants: {
      ar: ['امتحان CBR العملي', 'الخطأ في مسار الطريق', 'معايير الفاحص', 'سلوك القيادة المتوقع'],
      nl: ['CBR praktijkexamen', 'verkeerd rijden tijdens examen', 'examinator beoordeling', 'voorspelbaar gedrag'],
      en: ['CBR driving exam', 'wrong turn during test', 'examiner expectations', 'predictable driving']
    },
    keywords: ['امتحان', 'فاحص', 'cbr', 'أخطأت', 'اخطات', 'examen', 'examinator', 'fout', 'exam', 'امتحان عملي', 'غلطت'],
    related_concepts: ['kb-mirrors-spiegelen-routine'],
    question_ar: 'ما أهم متطلبات النجاح في امتحان القيادة العملي لدى CBR وماذا أفعل إذا أخطأت في الطريق؟',
    answer_ar: '1. **ما يبحث عنه فاحص CBR:** قيادة آمنة، مستقلة، متوقعة (Voorspelbaar gedrag)، تحكم كامل بالسيارة، تطبيق متقن لتسلسل النظر بالمرايا (Spiegelen)، والقيادة الوقائية وتوقع تصرفات الآخرين.\n2. **إذا أخطأت في مسار الطريق:** لا ترتكب أي مناورة خطرة أو مفاجئة لتصحيح المسار! تابع السير بأمان في المسار الخاطئ وأخبر الفاحص بهدوء. الخطأ في الاتجاه لا يؤدي للرسوب، بينما المناورة المفاجئة غير الآمنة هي التي تؤدي للرسوب.\n3. **السرعة في الامتحان:** لا تقُد ببطء شديد يعيق حركة المرور، ولا تتجاوز السرعة القصوى. اختر دائماً سرعة آمنة ومناسبة للظروف.',
    question_nl: 'Wat zijn de belangrijkste eisen voor het CBR praktijkexamen en wat doe je bij verkeerd rijden?',
    answer_nl: '1. CBR beoordeling: Veilig, zelfstandig en voorspelbaar rijgedrag met goede kijktechniek en wagenbeheersing.\n2. Verkeerd gereden? Maak nooit een gevaarlijke herstelactie! Rijd veilig door en meld het rustig. Verkeerd rijden is geen fout; onveilig handelen wel.\n3. Snelheid: Rijd vlot en veilig aangepast aan de omstandigheden.',
    question_en: 'What are key CBR practical driving exam requirements and what if I take a wrong turn?',
    answer_en: '1. Assessment: Safe, independent, and predictable driving with effective observation and car control.\n2. Wrong turn: Never make an abrupt or dangerous correction! Safely continue and inform the examiner. Missing a turn is not a failure; unsafe maneuvers are.\n3. Speed: Drive briskly and safely according to conditions.',
    dutchTerms: ['CBR praktijkexamen', 'Zelfstandig rijden', 'Voorspelbaar gedrag'],
    cbrFocus: true
  },

  // --- PARKING & SPECIAL MANEUVERS ---
  {
    id: 'kb-maneuvers-parking-reverse-parallel',
    category: 'maneuvers',
    concept: 'Parking Maneuvers, Parallel Parking (Fileparkeren) & Reverse Parking (Achteruit inparkeren)',
    aliases: [
      'parkeren', 'fileparkeren', 'achteruit inparkeren', 'vakparkeren', 'bijzondere verrichtingen',
      'الاصطفاف للخلف', 'الاصطفاف الموازي', 'ركن السيارة', 'صف السيارة', 'كيف أصف السيارة', 'مناورات خاصة'
    ],
    student_phrases: [
      'كيف أصف السيارة للخلف؟',
      'كيف اصف السياره للخلف؟',
      'كيف أصف السيارة؟',
      'كيف أركن السيارة؟',
      'كيف أعمل اصطفاف موازي؟',
      'طريقة الاصطفاف للخلف',
      'خطوات ركن السيارة بالموقف',
      'Hoe moet ik achteruit inparkeren?',
      'Hoe werkt fileparkeren?',
      'How to reverse park?',
      'How to parallel park?'
    ],
    language_variants: {
      ar: ['الاصطفاف للخلف', 'الاصطفاف الموازي', 'صف السيارة للخلف', 'ركن السيارة بالموقف', 'مناورة الاصطفاف'],
      nl: ['achteruit inparkeren', 'fileparkeren', 'inparkeren vak', 'bijzondere manoeuvre parkeren'],
      en: ['reverse bay parking', 'parallel parking', 'reverse parking steps', 'parking maneuver']
    },
    keywords: ['أصف', 'اصف', 'صف', 'ركن', 'اصطفاف', 'موقف', 'باركينغ', 'خلف', 'لخلف', 'موازي', 'parkeren', 'fileparkeren', 'achteruit', 'parking'],
    related_concepts: ['kb-mirrors-spiegelen-routine', 'kb-vehicle-clutch-shaking'],
    question_ar: 'كيف أصف السيارة للخلف (Achteruit inparkeren) أو أقوم بالاصطفاف الموازي (Fileparkeren)؟',
    answer_ar: 'خطوات الاصطفاف والمناورات الخاصة:\n1. **الاصطفاف للخلف في الموقف (Achteruit inparkeren):** توقف بمحاذاة المواقف على بعد حوالي متر، افحص المرايا والنقطة العمياء (Spiegelen & Dode hoek) لتأمين محيط السيارة، شغّل الغماز باتجاه الموقف، ارجع ببطء شديد وبسرعة المشي بالاعتماد على نقطة تلامس الكلتش (Aangrijpingspunt)، ولف المقود بهدوء حتى تستقيم السيارة تماماً في الموقف.\n2. **الاصطفاف الموازي (Fileparkeren):** قف بمحاذاة السيارة المجاورة على بعد متر، ارجع للخلف بزاوية 45 درجة عند محاذاة مؤخرتها، ثم عدل المقود.\n3. **الأولوية:** الاصطفاف مناورة خاصة (Bijzondere verrichting) ويجب إعطاء الأولوية لجميع مستخدمي الطريق الآخرين.',
    question_nl: 'Hoe voer je achteruit inparkeren en fileparkeren correct uit?',
    answer_nl: '1. Achteruit inparkeren: Stop op 1 meter afstand, voer de volledige kijkroutine uit (spiegelen en dode hoeken), geef richting aan, rijd stapvoets met de koppeling en stuur rustig in tot de auto recht staat.\n2. Fileparkeren: Stop naast de auto, stuur achteruit in onder 45 graden en stuur tijdig terug.\n3. Voorrang: Bijzondere verrichtingen vereisen dat je álle overige weggebruikers voor laat gaan.',
    question_en: 'How to perform reverse bay parking and parallel parking correctly?',
    answer_en: '1. Reverse Parking: Stop 1m away, perform 360-degree observation, indicate, reverse at walking pace with clutch control, and steer smoothly until straight.\n2. Parallel Parking: Align parallel, reverse at 45 degrees, and straighten out.\n3. Priority: Special maneuvers require yielding to all other traffic.',
    dutchTerms: ['Achteruit inparkeren', 'Fileparkeren', 'Bijzondere verrichting'],
    cbrFocus: true
  },

  // --- LESSON PREPARATION & MINDSET ---
  {
    id: 'kb-lesson-preparation-advice',
    category: 'exam',
    concept: 'Lesson Preparation and Driving Mindset (Rijles Voorbereiding)',
    aliases: [
      'rijles voorbereiden', 'voorbereiding rijles', 'driving lesson preparation',
      'الاستعداد لدرس القيادة', 'تجهيز لدرس القيادة', 'نصائح قبل الدرس', 'كيف أستعد للدرس'
    ],
    student_phrases: [
      'كيف أستعد لدرس القيادة؟',
      'كيف استعد لدرس القيادة؟',
      'كيف أجهز لدرسي القادم؟',
      'نصائح قبل درس القيادة',
      'كيف أستفيد من درس السياقة؟',
      'Hoe bereid ik me voor op de rijles?',
      'Tips voor de rijles',
      'How to prepare for driving lesson?'
    ],
    language_variants: {
      ar: ['الاستعداد لدرس القيادة', 'التحضير للدرس', 'نصائح قبل الدرس', 'جاهزية درس السياقة'],
      nl: ['rijles voorbereiden', 'voorbereiding rijles', 'tips voor de les'],
      en: ['prepare for driving lesson', 'lesson tips', 'driving readiness']
    },
    keywords: ['أستعد', 'استعد', 'استعداد', 'تحضير', 'تجهيز', 'درس', 'درسي', 'voorbereiden', 'rijles', 'prepare', 'lesson'],
    related_concepts: ['kb-cbr-exam-tips-mistakes', 'kb-mirrors-spiegelen-routine'],
    question_ar: 'كيف أستعد لدرس القيادة القادم بطريقة مثالية؟',
    answer_ar: 'نصائح عملية للاستعداد لدرس القيادة القادم:\n1. **مراجعة ملاحظات الدرس السابق:** تذكر توجيهات المدرب ونقاط التحسين التي حددها لك في الدرس الماضي.\n2. **التدريب الذهني على تسلسل النظر (Spiegelen):** رسخ في ذهنك ترتيب النظر (مرآة الوسط -> المرآة الجانبية -> النظرة فوق الكتف للنقطة العمياء).\n3. **الراحة والحذاء المناسب:** احرص على أخذ قسط كافٍ من النوم، وارتداء حذاء خفيف بنعل مستوٍ ومريح للتحكم الدقيق بالدواسات.\n4. **الالتزام بالموعد:** تأكد من موعدك وتواجدك في نقطة الانطلاق في الوقت المحدد.',
    question_nl: 'Hoe bereid ik me optimaal voor op mijn volgende rijles?',
    answer_nl: '1. Bekijk de feedback en leerdoelen van je vorige les.\n2. Visualiseer de kijktechniek (binnenspiegel, buitenspiegel, dode hoek).\n3. Zorg voor voldoende rust en draag schoenen met een soepele, vlakke zool.\n4. Wees op tijd aanwezig op de afgesproken locatie.',
    question_en: 'How to prepare effectively for your upcoming driving lesson?',
    answer_en: '1. Review feedback from your previous lesson.\n2. Mentally rehearse the mirror observation sequence (interior, side, shoulder).\n3. Rest well and wear flat, comfortable shoes for optimal pedal control.\n4. Be punctual at the pickup location.',
    dutchTerms: ['Rijles voorbereiding', 'Kijktechniek visualiseren', 'Feedback'],
    cbrFocus: true
  }
];

// Populate composite embedding_text for dense vector embeddings
DRIVING_KNOWLEDGE_BASE.forEach(item => {
  item.embedding_text = [
    item.concept,
    item.question_ar,
    item.question_nl,
    item.question_en,
    item.aliases.join(' '),
    item.student_phrases.join(' '),
    item.dutchTerms.join(' '),
    item.answer_ar,
    item.answer_nl
  ].join(' | ');
});

/**
 * Knowledge Base Metadata and Approved Sources
 */
export const KNOWLEDGE_BASE_SOURCES = [
  'Reglement verkeersregels en verkeerstekens 1990 (RVV 1990)',
  'Wegenverkeerswet 1994 (WVW 1994)',
  'CBR Rijprocedure B (Praktijkexamen normen)',
  'ANWB Verkeersregels Nederland'
];
