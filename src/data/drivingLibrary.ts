export interface LibraryModule {
  id: string;
  icon: string;
  titleEn: string;
  titleNl: string;
  titleAr: string;
  topic: string;
  summaryEn: string;
  summaryNl: string;
  summaryAr: string;
  rulesEn: string[];
  rulesNl: string[];
  rulesAr: string[];
  rvvReference: string;
}

export const DRIVING_LIBRARY: LibraryModule[] = [
  {
    id: "priority",
    icon: "git-commit",
    titleEn: "Priority & Right-of-Way",
    titleNl: "Voorrang & Gelijkwaardige Kruispunten",
    titleAr: "الأولوية وأسبقية المرور",
    topic: "Intersections, Shark Teeth & Yielding Rules",
    summaryEn: "Understanding right-of-way is the most critical part of the theory exam. Dutch traffic law distinguishes between equivalent intersections, priority roads, and special exit constructions.",
    summaryNl: "Het begrijpen van voorrang is het belangrijkste onderdeel van het theorie-examen. De Nederlandse wet maakt onderscheid tussen gelijkwaardige kruispunten, voorrangswegen en uitritconstructies.",
    summaryAr: "فهم قواعد الأولوية هو الجزء الأكثر أهمية في امتحان رخصة القيادة الهولندي. يميز القانون بين التقاطعات المتساوية، طرق الأولوية، والمنعطفات الخاصة.",
    rulesEn: [
      "On equivalent intersections (no signs/markings), all drivers coming from the right have priority. This includes cyclists and moped riders!",
      "Turning traffic must yield to straight-ahead traffic on the same road. Remember: 'Rechtdoor op dezelfde weg gaat voor'.",
      "Short turns go before long turns (korte bocht gaat voor lange bocht) when turning into the same street.",
      "An exit-construction (uitritconstructie), identified by continuous sidewalk paving across the road entrance, requires you to yield to ALL traffic, including pedestrians."
    ],
    rulesNl: [
      "Op gelijkwaardige kruispunten (geen borden) hebben alle bestuurders van rechts voorrang. Dit geldt dus ook voor fietsers!",
      "Rechtdoorgaand verkeer op dezelfde weg gaat voor afslaand verkeer. Dit geldt voor zowel motorvoertuigen als voetgangers.",
      "Bij tegemoetkomend verkeer dat dezelfde straat in wil slaan, gaat de korte bocht voor de lange bocht.",
      "Bij het verlaten van een uitrit (te herkennen aan een doorlopende stoep of drempel) moet u al het verkeer (inclusief voetgangers) voor laten gaan."
    ],
    rulesAr: [
      "في التقاطعات المتكافئة (الخالية من الإشارات)، تكون الأولوية للقادم من اليمين. يشمل ذلك الدراجات العادية والنارية!",
      "حركة المرور المستقيمة على نفس الطريق لها الأولوية على حركة المرور المنعطفة. تذكر دائماً: المستقيم على نفس الطريق يسبق المنعطف.",
      "المنعطف القصير يسبق المنعطف الطويل عند الالتفاف والدخول إلى نفس الشارع المتقاطع.",
      "مخارج المناطق أو المنشآت المصممة كمنحدر رصيف متصل (uitritconstructie) تلزمك بإعطاء الأولوية لجميع عابري الطريق بما في ذلك المشاة."
    ],
    rvvReference: "RVV 1990 Artikel 15 & 18"
  },
  {
    id: "roundabouts",
    icon: "refresh-cw",
    titleEn: "Roundabout Mastery",
    titleNl: "Rotondes & Turborotondes",
    titleAr: "قواعد واجتياز الدوارات",
    topic: "Right of Way, Lane Choice & Signaling",
    summaryEn: "Roundabouts improve traffic flow but have strict rules. In the Netherlands, layout design often dictates whether cyclists on the roundabout track have priority or not.",
    summaryNl: "Rotondes zorgen voor een betere doorstroming maar hebben strenge regels. Binnen de bebouwde kom hebben fietsers op de rotonde meestal wel voorrang, buiten de bebouwde kom niet.",
    summaryAr: "تسهل الدوارات تدفق حركة المرور ولكنها تخضع لقواعد صارمة. في هولندا، يحدد التصميم والشاخصات ما إذا كان لراكبي الدراجات على الدوار حق الأولوية أم لا.",
    rulesEn: [
      "Yield to traffic already on the roundabout before entering (marked by triangle sign B6 and shark teeth).",
      "Always signal to the right immediately BEFORE exiting the roundabout to inform other drivers.",
      "Bicycles inside built-up areas usually have priority on roundabouts (marked by shark teeth across the entrance). Outside built-up areas, bicycles must yield.",
      "Turbo-roundabouts require you to choose your lane BEFORE entering. You cannot change lanes once inside due to solid barriers."
    ],
    rulesNl: [
      "Verleen voorrang aan bestuurders die al op de rotonde rijden voordat u oprijdt (aangegeven door bord B6 en haaientanden).",
      "Geef ALTIJD richting aan naar rechts direct voordat u de rotonde verlaat.",
      "Binnen de bebouwde kom hebben fietsers op de rotonde meestal voorrang. Buiten de bebouwde kom moeten fietsers meestal wachten.",
      "Bij een turborotonde moet u de juiste rijstrook kiezen VOORDAT u oprijdt. Eenmaal op de rotonde kunt u niet meer wisselen vanwege verhoogde rijstrookscheiders."
    ],
    rulesAr: [
      "يجب إعطاء الأولوية للمركبات المتواجدة بالفعل داخل الدوار قبل الدخول (محددة بالشاخصة B6 وأسنان القرش).",
      "يجب دائماً تشغيل الغماز الأيمن مباشرة قبل الخروج من الدوار لتنبيه السائقين الآخرين.",
      "داخل المناطق السكنية والمبنية، تكون الأسبقية للدراجات على الدوار عادةً. أما خارج المدن، فيجب على الدراجات إعطاء الأولوية للسيارات.",
      "الدوارات التوربينية (Turbo-roundabouts) تلزمك باختيار مسارك الصحيح قبل الدخول؛ حيث يمنع تغيير المسار بالداخل لوجود حواجز إسمنتية متصلة."
    ],
    rvvReference: "RVV 1990 Artikel 12"
  },
  {
    id: "markings",
    icon: "milestone",
    titleEn: "Road Markings",
    titleNl: "Wegmarkeringen & Haaientanden",
    titleAr: "العلامات والخطوط الأرضية",
    topic: "Asphalt Signals, Shark Teeth & Curb Lines",
    summaryEn: "Road markings on Dutch roads have the same legal authority as physical signs. Missing a line type can lead to instant failure or heavy fines.",
    summaryNl: "Wegmarkeringen hebben in Nederland dezelfde wettelijke kracht als verkeersborden. Het negeren van lijnen kan leiden tot boetes of gevaarlijke situaties.",
    summaryAr: "تتمتع العلامات والخطوط المرسومة على الإسفلت في هولندا بقوة قانونية مساوية للشاخصات المرورية. تجاهل هذه العلامات يعرضك لمخالفات جسيمة.",
    rulesEn: [
      "Shark Teeth (Haaientanden): White triangles painted on the road requiring you to yield to crossing traffic.",
      "Solid White Line: Never cross a solid line except in emergencies or when directed by officials.",
      "Broken/Continuous Combo: If the line on your side is broken, you may cross it to overtake. If solid on your side, you may not.",
      "Yellow Curb Lines: A solid yellow line means NO stopping/stilstaan. A broken yellow line means NO parking/parkeren."
    ],
    rulesNl: [
      "Haaientanden: Witte driehoeken op het wegdek die verplichten voorrang te verlenen aan kruisend verkeer.",
      "Doorgetrokken streep: Mag u nooit overschrijden, tenzij er een noodsituatie is of bij specifieke instructie.",
      "Gecombineerde streep: Is de streep aan uw kant onderbroken, dan mag u eroverheen. Is hij aan uw kant doorgetrokken, dan niet.",
      "Gele strepen: Een doorgetrokken gele streep betekent verboden stil te staan. Een onderbroken gele streep betekent verboden te parkeren."
    ],
    rulesAr: [
      "أسنان القرش (Haaientanden): مثلثات بيضاء مرسومة على الإسفلت تلزمك بإعطاء الأولوية للمرور العابر في التقاطع.",
      "الخط الأبيض المتصل: يمنع منعاً باتاً تجاوزه أو القيادة فوقه إلا في حالات الطوارئ القصوى.",
      "الخط المزدوج (متصل ومتقطع): إذا كان الخط المتقطع في جانبك، يُسمح لك بتجاوزه للتجاوز؛ وإذا كان المتصل في جانبك، يمنع ذلك تماماً.",
      "الخطوط الصفراء على الرصيف: الخط الأصفر المتصل يعني منع التوقف المؤقت (stilstaan)؛ الخط المتقطع يعني منع ركن السيارة (parkeren)."
    ],
    rvvReference: "RVV 1990 Artikel 76 - 81"
  },
  {
    id: "highways",
    icon: "navigation",
    titleEn: "Highway & Motorway Driving",
    titleNl: "Snelwegen & Autowegen",
    titleAr: "القيادة على الطرق السريعة",
    topic: "Keeping Right, Spitsstrook & Overtaking",
    summaryEn: "Dutch highways (Snelweg, max 130 km/h) and motorways (Autoweg, max 100 km/h) feature advanced active traffic management. Keeping right is a legal mandate.",
    summaryNl: "Nederlandse snelwegen (A-wegen, max 130 km/u) en autowegen (N-wegen, max 100 km/u) hebben een actieve verkeerssignalering. Rechts houden is verplicht.",
    summaryAr: "تتميز الطرق السريعة الهولندية (Snelweg - سرعة قصوى 130 كم/ساعة) والطرق الخارجية (Autoweg - سرعة قصوى 100 كم/ساعة) بإشارات إلكترونية متطورة. الالتزام بالمسار الأيمن واجب قانوني.",
    rulesEn: [
      "Keep Right: You must always drive in the rightmost lane. The left lanes are strictly for overtaking. Driving unnecessarily in middle or left lanes is heavily fined.",
      "Daytime Speed Limit: The standard highway speed limit is 100 km/h from 06:00 to 19:00. From 19:00 to 06:00, you may drive up to 130 km/h where permitted.",
      "Rush-Hour Lane (Spitsstrook): When open (indicated by green arrows overhead), you MUST drive on this lane, even if it crosses a continuous line.",
      "Zipper Merging (Ritsen): When lanes merge, continue driving to the end of the collapsing lane, then smoothly merge in a 1-to-1 alternate fashion."
    ],
    rulesNl: [
      "Rechts houden: U bent verplicht zo veel mogelijk rechts te rijden. De linkerstroken zijn uitsluitend om in te halen.",
      "Snelheidslimiet overdag: Tussen 06:00 en 19:00 uur geldt een landelijke limiet van 100 km/u op snelwegen. Daarbuiten 130 km/u (waar toegestaan).",
      "Spitsstrook: Als deze geopend is (groene pijl), bent u verplicht hierop te rijden. Dit is vaak de vluchtstrook.",
      "Ritsen: Bij een rijstrookvermindering rijdt u door tot het einde van de invoegstrook om vervolgens om-en-om (ritssluiting) in te voegen."
    ],
    rulesAr: [
      "الزم اليمين: يجب القيادة دائماً في المسار الواقع في أقصى اليمين. المسارات اليسرى مخصصة للتجاوز فقط، والقيادة غير المبررة في اليسار تعرضك لمخالفة مالية كبيرة.",
      "سرعة النهار السريعة: الحد الأقصى للسرعة نهاراً (من 06:00 إلى 19:00) هو 100 كم/ساعة؛ ويرتفع ليلاً (من 19:00 إلى 06:00) إلى 130 كم/ساعة.",
      "مسار الذروة (Spitsstrook): عند تفعيله (بظهور سهم أخضر علوي)، يجب عليك القيادة فوقه كونه أقصى اليمين، حتى وإن كان الممر يبدو كمسار طوارئ.",
      "الدمج التناوبي (Ritsen): عند اندماج مسارين، يجب على السائقين السير حتى نهاية مسارهم المنتهي ثم الاندماج بالتناوب (سيارة بسيارة) بمرونة."
    ],
    rvvReference: "RVV 1990 Artikel 3, 21 & 43"
  },
  {
    id: "woonerf",
    icon: "home",
    titleEn: "Residential Home Zones (Woonerf)",
    titleNl: "Woonerf & Erf-regels",
    titleAr: "المناطق السكنية المشتركة (Woonerf)",
    topic: "Walking Pace Speed & Pedestrian Priority",
    summaryEn: "A Woonerf is designed to be a safe, shared living street. Pedestrians can use the entire width of the street, and vehicles must move at walking speed.",
    summaryNl: "Een erf of woonerf is ontworpen als een veilige, gedeelde leefruimte. Voetgangers mogen de hele straat gebruiken en voertuigen moeten stapvoets rijden.",
    summaryAr: "تم تصميم الـ Woonerf لتكون منطقة معيشية آمنة ومشاركة بين السيارات والمشاة. يُسمح للمشاة باستخدام عرض الطريق بالكامل، وتتحرك المركبات بسرعة المشي.",
    rulesEn: [
      "Speed Limit: Strictly limited to walking pace, which is legally defined and tested as 15 km/h.",
      "Pedestrian Priority: Pedestrians and playing children can use the entire street width. You must never endanger or hinder them.",
      "Parking: You may only park inside marked parking bays (indicated with a blue P sign or white lines). Parking on the street surface is banned.",
      "Exiting the Zone: When leaving a Woonerf, you are performing a special maneuver (uitrit) and must yield to all crossing traffic."
    ],
    rulesNl: [
      "Maximumsnelheid: Strikt beperkt tot stapvoets rijden, wat wettelijk is vastgesteld op 15 km/u.",
      "Voetgangers: Voetgangers en spelende kinderen mogen de weg over de volle breedte gebruiken.",
      "Parkeren: U mag alleen parkeren in de speciaal daartoe bestemde parkeervakken (gemarkeerd met een 'P' of witte lijnen).",
      "Erf verlaten: Bij het verlaten van een erf verricht u een bijzondere manoeuvre en moet u alle weggebruikers voorrang verlenen."
    ],
    rulesAr: [
      "حد السرعة الأقصى: يقتصر بشكل صارم على سرعة المشي، المحددة قانوناً ومدرجة في الاختبار بـ 15 كم/ساعة فقط.",
      "أسبقية المشاة: يمكن للمشاة والأطفال اللعب واستخدام كامل عرض الشارع السكني، ويحظر إعاقتهم أو تعريضهم للخطر.",
      "ركن السيارات: يسمح بالصف فقط داخل المواقف المخصصة والمعلمة (المشار إليها بالرمز P أو بالخطوط البيضاء)؛ ويمنع الصف في الشارع.",
      "مغادرة المنطقة: عند الخروج من الـ Woonerf، فإنك تقوم بطلب دخول حركة سير عادية (Uitrit) ويجب منح الأولوية لجميع مستخدمي الطريق العابر."
    ],
    rvvReference: "RVV 1990 Artikel 44 - 46"
  },
  {
    id: "milieuzone",
    icon: "leaf",
    titleEn: "Environmental Zones",
    titleNl: "Milieuzones & Groene Zones",
    titleAr: "المناطق البيئية المحمية",
    topic: "Emission Controls & Diesel Restrictions",
    summaryEn: "Environmental zones (milieuzone) restrict highly polluting vehicles from entering urban centers. Fines for unauthorized entry are severe.",
    summaryNl: "Milieuzones weren vervuilende voertuigen uit de binnensteden om de luchtkwaliteit te verbeteren. De boetes voor overtredingen zijn erg hoog.",
    summaryAr: "تمنع المناطق البيئية (milieuzone) دخول السيارات الملوثة بشدة إلى مراكز المدن الكبرى للحفاظ على جودة الهواء وصحة المجتمع.",
    rulesEn: [
      "Signage: Zones are signaled by green circular signs showing vehicle types and emission classes (usually diesel Euro 4 or below are banned).",
      "Diesel Passenger Cars: Older diesel passenger cars (generally built before 2005 or 2006) are banned from entering active urban milieuzones.",
      "Petrol Vehicles: Standard petrol (benzine) vehicles are currently exempt and can enter all active environmental zones without stickers.",
      "Camera Enforcement: Entrances are strictly monitored by automatic number plate recognition (ANPR) cameras. Check your plate status online before entering."
    ],
    rulesNl: [
      "Bordering: Milieuzones worden aangegeven met groene ronde borden met voertuigtypen en emissieklassen.",
      "Dieselvoertuigen: Oudere dieselauto's (meestal van vóór 2005/2006) mogen de milieuzones in steden als Amsterdam en Utrecht niet in.",
      "Benzineauto's: Standaard benzinevoertuigen hebben op dit moment vrije toegang tot alle milieuzones.",
      "Handhaving: Toegang wordt gecontroleerd via ANPR-camera's die kentekens automatisch scannen. Voorkom hoge boetes."
    ],
    rulesAr: [
      "الشاخصات المرورية: يُعلن عن بداية المناطق البيئية بلوحات خضراء دائرية تحدد أصناف المركبات وفئات الانبعاثات الممنوعة (عادة الديزل فئة Euro 4 أو أقل).",
      "مركبات الديزل: يمنع دخول سيارات الركاب القديمة العاملة بالديزل (المصنعة عادةً قبل عام 2005 أو 2006) إلى مراكز المدن الكبرى.",
      "سيارات البنزين: سيارات البنزين القياسية معفاة حالياً من هذه القيود ويمكنها الدخول دون أي مشاكل أو ملصقات بيئية.",
      "الرقابة بالكاميرات: يتم مراقبة مداخل المناطق بكاميرات آلية ذكية تقرأ لوحات الأرقام فوراً وترسل الغرامات تلقائياً للمخالفين."
    ],
    rvvReference: "RVV 1990 Artikel 86"
  },
  {
    id: "parking",
    icon: "toggle-left",
    titleEn: "Parking & Stopping Regulations",
    titleNl: "Parkeren, Stilstaan & Blauwe Zones",
    titleAr: "قواعد ركن وتوقف السيارات",
    topic: "Distance Limits, Blue Zones & Restrictions",
    summaryEn: "Dutch rules define exactly where you may briefly stop to let passengers exit vs where you may park your car and leave it.",
    summaryNl: "De Nederlandse wet definieert exact waar u kort mag stilstaan (direct laden/lossen of in-/uitstappen) versus waar u mag parkeren.",
    summaryAr: "تحدد القوانين الهولندية بدقة الأماكن التي يُسمح فيها بالتوقف المؤقت السريع (stilstaan) لتنزيل الركاب مقابل الأماكن المخصصة للركن الكامل والصف (parkeren).",
    rulesEn: [
      "Stopping (Stilstaan) vs Parking (Parkeren): Stopping is strictly for loading cargo or letting passengers in/out. Checking your map or waiting is parking.",
      "Prohibitions: You may not park within 5 meters of an intersection or crossing.",
      "Blue Disk Zones (Parkeerschijf): In spaces marked with a blue line, you must place your blue parking disc visible behind the windshield with arrival time set.",
      "Yellow lines: Solid yellow lines on the curb prohibit both stopping and parking. Broken yellow lines prohibit parking only."
    ],
    rulesNl: [
      "Stilstaan vs Parkeren: Stilstaan is uitsluitend voor onmiddellijk in- en uitstappen of laden/lossen. Elk ander oponthoud is parkeren.",
      "Kruispunten: U mag niet parkeren binnen een afstand van 5 meter van een kruispunt.",
      "Blauwe zone (parkeerschijf): Bij blauwe strepen moet u de blauwe parkeerschijf gebruiken, afgerond op het volgende halve uur.",
      "Gele trottoirbanden: Een doorgetrokken gele streep betekent verboden stil te staan. Een onderbroken gele streep betekent verboden te parkeren."
    ],
    rulesAr: [
      "التوقف (Stilstaan) مقابل الركن (Parkeren): التوقف يقتصر على صعود/نزول ركاب أو شحن سريع للبضائع. الانتظار أو تصفح الهاتف يعد ركناً كاملاً.",
      "المسافة الآمنة من التقاطع: يُمنع صف أو ركن السيارة على مسافة تقل عن 5 أمتار من أي تقاطع طرق أو معبر مشاة.",
      "المنطقة الزرقاء (Parkeerschijf): في المواقف ذات الخطوط الزرقاء، يجب استخدام قرص مواقف أزرق لضبط وقت وصولك وعرضه خلف الزجاج الأمامي.",
      "خطوط الأرصفة الملونة: الخط الأصفر المتصل يمنع التوقف والصف معاً؛ والخط الأصفر المتقطع يمنع الصف والركود فقط ويسمح بالتنزيل السريع."
    ],
    rvvReference: "RVV 1990 Artikel 23 & 24"
  },
  {
    id: "bicycles",
    icon: "bike",
    titleEn: "Bicycle Infrastructure",
    titleNl: "Fietspaden & Fietsstraten",
    titleAr: "البنية التحتية لمسارات الدراجات",
    topic: "Cycle Paths, Advisory Lanes & Fietsstraten",
    summaryEn: "Cycling is a cornerstone of Dutch transit. Bicycles have unique infrastructure with strict rules regarding car presence and priority.",
    summaryNl: "Fietsen is de hoeksteen van het Nederlandse verkeer. Fietsers hebben een unieke infrastructuur met zeer strenge voorrangsregels.",
    summaryAr: "تعتبر الدراجات الهوائية ركيزة أساسية للنقل والمواصلات في هولندا. تمتلك الدراجات شبكة مسارات وبنية تحتية فريدة ذات قوانين صارمة.",
    rulesEn: [
      "Mandatory Cycle Path (Fietspad - Sign G11): Cars and mopeds are strictly banned from entering. You may not even cross with a wheel.",
      "Advisory Cycle Lane (Fietsstrook): If separated by a solid white line, cars may not drive or park on it. If broken, cars may use it if they do not hinder cyclists.",
      "Bicycle Street (Fietsstraat): A street where 'Bicycles are kings, cars are guests'. Cars are permitted but must drive slowly and never overtake cyclists.",
      "Priority from Right: On equivalent crossings, cyclists coming from the right have full priority over cars. Always yield!"
    ],
    rulesNl: [
      "Verplicht fietspad (Bord G11): Hierop mag u met een motorvoertuig nooit rijden of stilstaan.",
      "Fietsstrook met doorgetrokken streep: Auto's mogen hier nooit op rijden, stilstaan of parkeren. Bij een onderbroken streep mag u er kort op rijden mits u fietsers niet hindert.",
      "Fietsstraat: Een straat ontworpen voor fietsers waar 'auto's te gast zijn'. Auto's mogen fietsers hier absoluut niet hinderen of opjagen.",
      "Voorrang van rechts: Op gelijkwaardige kruispunten hebben fietsers van rechts gewoon voorrang op auto's!"
    ],
    rulesAr: [
      "مسار الدراجات الإجباري (Fietspad - الشاخصة G11): يُمنع تماماً دخول السيارات أو ركنها فيه، ولا يُسمح حتى بملامسة الخط الفاصل بعجلات السيارة.",
      "حافة الدراجات الاستشارية (Fietsstrook): تفصلها خطوط متقطعة أو متصلة؛ الخط المتصل يمنع دخول السيارات، المتقطع يسمح بالعبور العابر دون مضايقة الدراجين.",
      "شارع الدراجات (Fietsstraat): شارع يحمل شعار 'الدراجون هم الملوك، والسيارات ضيوف'. تسير السيارات ببطء تام ويُمنع مضايقة أو تجاوز الدراجات.",
      "الأولوية لليمين: في التقاطعات المتكافئة، تُمنح الدراجات القادمة من اليمين الأولوية الكاملة على السيارات. يجب التوقف وإعطاؤهم حق العبور."
    ],
    rvvReference: "RVV 1990 Artikel 5 & 10"
  },
  {
    id: "trams",
    icon: "train",
    titleEn: "Tram Situations",
    titleNl: "Trams & Railsverkeer",
    titleAr: "حالات المرور مع الترامواي",
    topic: "Tram Priority, Rail Crossings & Special Rules",
    summaryEn: "Trams enjoy extraordinary privileges under Dutch traffic law. They often break general priority rules that apply to standard vehicles.",
    summaryNl: "Trams genieten van buitengewone voorrechten in de Nederlandse verkeerswet. Zij gaan vaak voor op de normale voorrangsregels.",
    summaryAr: "يتمتع الترام بامتيازات استثنائية واسعة في قانون المرور الهولندي؛ حيث يعلو الترام فوق العديد من القواعد العامة المطبقة على السيارات العادية.",
    rulesEn: [
      "Equivalent Intersections: Trams ALWAYS have priority on equal crossings, regardless of whether they come from your left, right, or are turning across your path.",
      "Turning Traffic: While a turning car must yield to straight-ahead traffic, a turning TRAM has priority over straight-ahead cars on the same road.",
      "Zebra Crossings (Zebrapad): Pedestrians do NOT have priority over a tram at a zebra crossing unless there are pedestrian lights specifically stopping the tram.",
      "Yielding to Trams: Trams are only bound to yield at intersections where they face a yield sign (B6), shark teeth, or red traffic lights."
    ],
    rulesNl: [
      "Gelijkwaardige kruispunten: Trams hebben ALTIJD voorrang op gelijkwaardige kruispunten, ongeacht of ze van links, rechts komen of afslaan.",
      "Afslaand verkeer: Normaal moet afslaand verkeer rechtdoorgaand verkeer voor laten gaan, maar een afslaande TRAM gaat voor rechtdoorgaande auto's.",
      "Zebrapaden: Voetgangers hebben bij een zebrapad GEEN voorrang op een naderende tram (tenzij er verkeerslichten staan).",
      "Voorrang verlenen door tram: Een tram moet alleen voorrang verlenen als hij haaientanden, een stopbord of rood licht tegenkomt."
    ],
    rulesAr: [
      "التقاطعات المتكافئة: للترام أولوية مرور مطلقة دائماً في التقاطعات المتساوية، بغض النظر عن اتجاه قدومه (من اليسار أو اليمين) أو التفافه.",
      "حركة الالتفاف: الالتفاف العام يلزم صاحبه بإعطاء الطريق، لكن الترام الملتف له الأسبقية على السيارات السائرة بشكل مستقيم في نفس الشارع.",
      "ممرات المشاة (Zebrapad): لا يتمتع المشاة بحق الأولوية على الترام القادم عند ممر المشاة، ويجب عليهم الانتظار ما لم تكن هناك إشارة ضوئية حمراء للترام.",
      "حالات توقف الترام: يلتزم الترام بالتوقف ومنح الأولوية فقط عند مواجهته لإشارة قف، أو أسنان القرش، أو إشارات المرور الضوئية الحمراء."
    ],
    rvvReference: "RVV 1990 Artikel 15 & 18"
  },
  {
    id: "pedestrians",
    icon: "smile",
    titleEn: "Pedestrian Safety",
    titleNl: "Voetgangers & Zebrapaden",
    titleAr: "سلامة وأسبقية المشاة",
    topic: "Zebra Crossings, Blind Pedestrians & Turning Rules",
    summaryEn: "Pedestrians are the most vulnerable road users. Dutch law provides them with strict protection at intersections and designated crossings.",
    summaryNl: "Voetgangers zijn de meest kwetsbare weggebruikers. De Nederlandse wet beschermt hen streng bij kruispunten en oversteekplaatsen.",
    summaryAr: "المشاة هم الفئة الأكثر عرضة للمخاطر على الطريق. يفرض القانون الهولندي حماية صارمة لهم عند التقاطعات ومعابر العبور المخصصة.",
    rulesEn: [
      "Zebra Crossings (Zebrapad): You must yield to any pedestrian who is crossing or clearly preparing to cross at a zebra crossing.",
      "Turning Rules: When turning, you must yield to pedestrians who are walking straight ahead on the same road you are leaving.",
      "Special Needs: You must ALWAYS yield to blind/visually impaired pedestrians carrying a white cane with one or more red stripes.",
      "Difficulty Walking: You must yield to any pedestrian who is obviously walking with difficulty or is physically impaired."
    ],
    rulesNl: [
      "Zebrapad: U moet voorrang verlenen aan voetgangers die oversteken of duidelijk op het punt staan om over te steken.",
      "Afslaan: Bij het afslaan moet u voetgangers die rechtdoor lopen op dezelfde weg voor laten gaan.",
      "Blinden: U moet blinden met een witte stok met rode ringen ALTIJD voor laten gaan.",
      "Moeilijk ter been: Voetgangers die zich duidelijk moeilijk voortbewegen of gehandicapt zijn, moet u altijd voorrang verlenen."
    ],
    rulesAr: [
      "معبر خطوط زيبرا (Zebrapad): يجب التوقف تماماً ومنح الأسبقية لأي من المشاة الذي يعبر أو يتهيأ بوضوح للعبور عند خطوط المشاة.",
      "الالتفاف والنعطف: عند التفافك لشارع آخر، يجب إعطاء حق الطريق للمشاة الذين يسيرون للأمام مباشرة موازين لطريقك قبل الالتفاف.",
      "ذوي الاحتياجات الخاصة: يجب عليك دائماً ومطلقاً التوقف للمشاة المكفوفين الحاملين لعصا بيضاء مميزة بخطوط دائرية حمراء.",
      "صعوبات الحركة: تلتزم دائماً بمنح الطريق وإعطاء الأولوية التامة لأي شخص من المشاة يظهر عليه صعوبة واضحة في المشي أو يعاني إعاقة حركية."
    ],
    rvvReference: "RVV 1990 Artikel 49 & 50"
  },
  {
    id: "emergency",
    icon: "shield-alert",
    titleEn: "Emergency Vehicles",
    titleNl: "Voorrangsvoertuigen & Hulpdiensten",
    titleAr: "سيارات الطوارئ والإسعاف",
    topic: "Sirens, Flashing Lights & Safe Yielding",
    summaryEn: "Emergency services (police, ambulance, fire department) are legally defined as priority vehicles only when active with optical and acoustic signals.",
    summaryNl: "Hulpverleningsdiensten (politie, ambulance, brandweer) zijn wettelijk alleen voorrangsvoertuigen als zij optische én geluidssignalen voeren.",
    summaryAr: "تعتبر خدمات الطوارئ (الشرطة، الإسعاف، الإطفاء) مركبات ذات أولوية مرور قصوى قانوناً فقط عندما تقوم بتشغيل الإشارات الضوئية والصفارات الصوتية معاً.",
    rulesEn: [
      "Definition: A vehicle is only an official 'priority vehicle' (voorrangsvoertuig) when it is emitting BOTH blue flashing lights and a siren.",
      "Yielding: You must yield right-of-way to active priority vehicles as quickly and safely as possible. Prepare to clear the lane or move to the side.",
      "Safe Conduct: Never violate major traffic laws (such as running a red light or speeding excessively) to let an emergency vehicle pass, unless specifically commanded by a police officer.",
      "Zipper/Rescue Lane: In traffic jams on highways, move to the far left of your lane (if in the left lane) or far right (if in the right lane) to create a rescue passage (Rettungsgasse)."
    ],
    rulesNl: [
      "Definitie: Een voertuig is pas een officieel 'voorrangsvoertuig' als het blauwe zwaailichten EN een meertonige sirene voert.",
      "Voorrang verlenen: U moet een voorrangsvoertuig altijd zo snel en veilig mogelijk vrije doorgang verlenen.",
      "Veiligheid: Maak nooit gevaarlijke verkeersovertredingen (zoals door rood licht rijden) om plaats te maken, tenzij de politie u daartoe dwingt.",
      "Filevorming: Bij file op de snelweg houdt u zoveel mogelijk links (linkerstrook) of rechts (rechterstrook) om een hulpverleningsstrook vrij te houden."
    ],
    rulesAr: [
      "التعريف القانوني: تعتبر مركبة الطوارئ ذات أسبقية قانونية رسمية (voorrangsvoertuig) فقط وحصرياً عند تشغيل الأضواء الزرقاء الدوارة مع صفارة الإنذار متعددة النغمات.",
      "منح الطريق: يجب عليك منح الأولوية وتفريغ المسار لمركبة الطوارئ النشطة بأسرع وقت ممكن وبأعلى معايير الأمان والسلامة.",
      "السلوك الآمن: يحظر ارتكاب مخالفات مرورية خطيرة (مثل قطع الإشارة الحمراء أو السرعة المفرطة) لتمرير سيارة طوارئ، ما لم يصدر أمر مباشر من الشرطي.",
      "ممر الإنقاذ في الاختناقات: عند توقف السير على الطرق السريعة، انحرف لأقصى يسار مسارك (إذا كنت يساراً) أو أقصى اليمين (إذا كنت يميناً) لتشكيل ممر آمن لسيارات الإسعاف."
    ],
    rvvReference: "RVV 1990 Artikel 29"
  },
  {
    id: "rvvsigns",
    icon: "compass",
    titleEn: "RVV 1990 Traffic Signs System",
    titleNl: "RVV 1990 Verkeersborden Systeem",
    titleAr: "نظام الشاخصات المرورية RVV 1990",
    topic: "Sign Classification, Series A-K & Zones",
    summaryEn: "The official Dutch traffic sign system is categorized into distinct alphabetical series from A to K. Understanding these categories helps you anticipate rules and passing behaviors.",
    summaryNl: "Het officiële Nederlandse verkeersbordensysteem is gecategoriseerd in verschillende series van A t/m K. Het begrijpen hiervan helpt regels te voorspellen.",
    summaryAr: "يتم تصنيف نظام الشاخصات المرورية الهولندي الرسمي في سلاسل أبجدية مميزة من A إلى K. يساعدك فهم هذه الفئات على توقع القواعد والتصرفات الصحيحة.",
    rulesEn: [
      "A-Series (Speed Limits): Red circles dictate speed limits. Zones apply rules to the entire neighborhood until the end sign is passed.",
      "B-Series (Priority): Diamonds and inverted triangles regulate crossing priority. They define priority roads and intersections.",
      "C-Series (Closed Roads): Red circles with bars or graphics prohibit entry for specific vehicle types (e.g., cars, trucks, motorcycles).",
      "D-Series (Mandatory): Round blue signs with white arrows dictate mandatory directions (e.g. roundabout direction, pass left/right)."
    ],
    rulesNl: [
      "A-Serie (Snelheid): Ronde rode borden geven de maximumsnelheid aan. Een zone-bord geldt voor de hele wijk tot het einde-bord.",
      "B-Serie (Voorrang): Ruit- en driehoeksborden regelen de voorrang op kruispunten en voorrangswegen.",
      "C-Serie (Geslotenverklaring): Ronde rode borden die de toegang voor bepaalde categorieën voertuigen verbieden.",
      "D-Serie (Gebod): Ronde blauwe borden met witte pijlen die een verplichte rijrichting of weggedeelte voorschrijven."
    ],
    rulesAr: [
      "سلسلة A (السرعة): دوائر حمراء تحدد حدود السرعة القصوى. شواخص المنطقة (ZONE) تطبق السرعة على الحي بأكمله حتى شاخصة النهاية.",
      "سلسلة B (الأولوية): شواخص على شكل معين أو مثلث مقلوب تنظم أولوية المرور في التقاطعات والطرق الرئيسية السريعة.",
      "سلسلة C (الطرق المغلقة): دوائر حمراء ذات خطوط أو رسومات تمنع دخول فئات معينة من المركبات (مثل السيارات أو الشاحنات).",
      "سلسلة D (الإلزام): لوحات دائرية زرقاء بأسهم بيضاء تحدد اتجاهات السير الإجبارية (مثل اتجاه الدوران أو التجاوز)."
    ],
    rvvReference: "RVV 1990 Bijlage 1"
  }
];
