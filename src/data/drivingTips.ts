export interface DrivingTip {
  id: string;
  category: 
    | 'observation'
    | 'anticipation'
    | 'risk_awareness'
    | 'self_reflection'
    | 'social_driving'
    | 'speed_and_space'
    | 'intersections'
    | 'vehicle_control'
    | 'driver_assistance'
    | 'trip_preparation'
    | 'eco_driving'
    | 'vulnerable_users'
    | 'adverse_conditions'
    | 'priority_rules'
    | 'roundabouts'
    | 'traffic_signs'
    | 'highway_driving'
    | 'parking'
    | 'cyclists'
    | 'pedestrians'
    | 'rain'
    | 'snow'
    | 'fog'
    | 'night_driving'
    | 'safety'
    | 'cbr_exam_prep'
    | 'vehicle_checks'
    | 'emergency_situations'
    | 'dutch_traffic_law';
  title: {
    en: string;
    nl: string;
    ar: string;
  };
  description: {
    en: string;
    nl: string;
    ar: string;
  };
}

/**
 * Predefined collection of 45 high-quality, practical Dutch Category B driving tips
 * covering all required topics with full trilingual parity (English, Dutch, Arabic).
 * Focused strictly on: ONE TIP -> ONE SKILL -> ONE PRACTICAL ACTION.
 */
export const DRIVING_TIPS: DrivingTip[] = [
  // 1. Observation: Blind Spot Check
  {
    id: 'tip-blind-spot',
    category: 'observation',
    title: {
      en: "Check your blind spot before moving",
      nl: "Kijk over je schouder vóór elke zijdelingse actie",
      ar: "افحص النقطة العمياء قبل تغيير المسار أو الانعطاف"
    },
    description: {
      en: "Before changing lanes or turning, check your interior and side mirrors, then glance over your shoulder to make sure no cyclist or vehicle is beside you.",
      nl: "Kijk vóór het wisselen van rijstrook of afslaan eerst in je binnenspiegel en buitenspiegel, en werp daarna direct een snelle schouderblik om te controleren of er niemand naast je zit.",
      ar: "قبل تغيير المسار أو الانعطاف، افحص المرآة الداخلية والجانبية سريعاً، ثم ألقِ نظرة فوق كتفك للتأكد من خلو المنطقة بجانبك من الدراجات أو المركبات."
    }
  },

  // 2. Speed & Space: 2-Second Rule
  {
    id: 'tip-following-distance',
    category: 'speed_and_space',
    title: {
      en: "Keep a 2-second following distance",
      nl: "Houd altijd minimaal 2 seconden afstand",
      ar: "حافظ على مسافة أمان لا تقل عن ثانيتين"
    },
    description: {
      en: "Pick a fixed point ahead like a signpost. When the car in front passes it, count two full seconds. If you pass it sooner, ease off the accelerator.",
      nl: "Kies een vast punt langs de weg zoals een lantaarnpaal. Als je voorganger passeert, tel je twee volle seconden. Kom je er eerder langs, laat dan rustig het gas los.",
      ar: "اختر نقطة ثابتة كالعمود أو الشاخصة. عندما تمر السيارة أمامك بها، عد ثانيتين كاملتين. إذا وصلت إليها قبل ذلك، خفف سرعتك بهدوء."
    }
  },

  // 3. Intersections: Scanning early
  {
    id: 'tip-look-ahead-intersections',
    category: 'intersections',
    title: {
      en: "Look well ahead before approaching an intersection",
      nl: "Kijk ver vooruit bij het naderen van een kruispunt",
      ar: "استكشف التقاطعات مبكراً قبل الوصول إليها"
    },
    description: {
      en: "Scan priority signs, cyclists, and crossing traffic 50 to 100 meters ahead so you can adjust your speed smoothly without sudden braking.",
      nl: "Kijk al 50 tot 100 meter vooruit naar voorrangsborden, fietsers en kruisend verkeer. Zo pas je je snelheid rustig aan zonder hard te hoeven remmen.",
      ar: "انتبه لشواخص الأولوية وحركة المشاة والدراجات قبل التقاطع بـ 50 إلى 100 متر، لتتمكن من ضبط سرعتك بسلاسة دون فرملة مفاجئة."
    }
  },

  // 4. Vehicle Control: Speed in bends
  {
    id: 'tip-speed-in-bends',
    category: 'vehicle_control',
    title: {
      en: "Adjust your speed before entering a bend",
      nl: "Rem vóór de bocht, niet in de bocht",
      ar: "هدئ سرعتك قبل المنعطف وليس داخله"
    },
    description: {
      en: "Brake smoothly on the straight approach to the turn, select the right gear, and accelerate gently as you steer out of the curve.",
      nl: "Verlaag je snelheid op het rechte stuk vóór de bocht, schakel naar de juiste versnelling en geef pas weer rustig gas als je de bocht uitstuurt.",
      ar: "خفف سرعتك على المسار المستقيم قبل المنعطف، واختر الغيار المناسب، ثم زد سرعتك بنعومة عند الخروج من المنعطف."
    }
  },

  // 5. Vulnerable Users: Dutch Reach for opening doors
  {
    id: 'tip-dutch-reach',
    category: 'vulnerable_users',
    title: {
      en: "Check for cyclists before opening your door",
      nl: "Open je portier altijd met de verre hand",
      ar: "افتح باب السيارة باليد البعيدة لحماية الدراجات"
    },
    description: {
      en: "Opening the car door with your far hand naturally turns your body, allowing you to easily spot oncoming cyclists before pushing the door open.",
      nl: "Door je portier met je rechterhand te openen, draait je bovenlichaam automatisch en zie je achteropkomende fietsers direct in je blikveld.",
      ar: "استخدام اليد البعيدة لفتح الباب يجعل جسمك يلتفت تلقائياً نحو الخلف، مما يمكنك من رؤية الدراجات القادمة وتفادي فتح الباب فجأة."
    }
  },

  // 6. Observation: Mirrors before braking
  {
    id: 'tip-mirror-before-braking',
    category: 'observation',
    title: {
      en: "Glance in your rearview mirror before braking",
      nl: "Kijk in je binnenspiegel vóórdat je remt",
      ar: "ألقِ نظرة في المرآة الداخلية قبل الضغط على الفرامل"
    },
    description: {
      en: "A quick glance in the interior mirror tells you how close the vehicle behind you is, allowing you to brake with a safe and measured tempo.",
      nl: "Een snelle blik in je binnenspiegel laat zien wie er achter je rijdt, zodat je rustig en beheerst kunt afremmen zonder de auto achter je te verrassen.",
      ar: "نظرة خاطفة في المرآة الداخلية توضح مدى قرب السيارة خلفك، مما يساعدك على استخدام الفرامل بسلاسة وتفادي مباغتة السائق خلفك."
    }
  },

  // 7. Intersections: Keep junctions clear
  {
    id: 'tip-do-not-block-intersections',
    category: 'intersections',
    title: {
      en: "Do not enter an intersection if there is no space beyond it",
      nl: "Blokkeer nooit een kruispunt bij druk verkeer",
      ar: "لا تدخل التقاطع إذا كان المسار المقابل غير سالك"
    },
    description: {
      en: "Even if the traffic light is green, stop before the line if traffic is jammed so you do not block cross-traffic or emergency vehicles.",
      nl: "Blijf vóór de stopstreep wachten als het verkeer vaststaat, ook bij groen licht. Zo blijft het kruispunt vrij voor kruisend verkeer.",
      ar: "حتى لو كانت الإشارة خضراء، توقف قبل التقاطع إذا كانت حركة السير متوقفة، حتى لا تسد الطريق أمام السيارات المتقاطعة أو الإسعاف."
    }
  },

  // 8. Vulnerable Users: Pedestrian crossings
  {
    id: 'tip-give-pedestrians-space',
    category: 'vulnerable_users',
    title: {
      en: "Give pedestrians enough time and space to cross",
      nl: "Geef voetgangers ruim de tijd en rust bij oversteekplaatsen",
      ar: "امنح المشاة وقتاً ومساحة كافية للعبور"
    },
    description: {
      en: "When approaching a zebra crossing, slow down early and make eye contact so pedestrians know you have seen them and are stopping safely.",
      nl: "Nader een zebrapad met een rustige snelheid en zoek oogcontact. Zo weet de voetganger dat je stopt en ontstaat er geen twijfel.",
      ar: "اقترب من ممر المشاة بسرعة هادئة وتواصل بصرياً، ليتأكد المشاة من أنك شاهدتهم وتتوقف بهدوء وأمان."
    }
  },

  // 9. Social Driving: Early indicators
  {
    id: 'tip-indicate-early',
    category: 'social_driving',
    title: {
      en: "Use your indicators early and clearly",
      nl: "Geef tijdig en duidelijk richting aan",
      ar: "أعطِ إشارة الانعطاف مبكراً وبوضوح"
    },
    description: {
      en: "Signal after checking your mirrors but well before braking or turning, giving drivers and cyclists around you plenty of time to anticipate.",
      nl: "Zet je knipperlicht aan na je spiegelcontrole maar ruim vóór het afremmen of insturen. Zo weten medeweggebruikers precies wat je gaat doen.",
      ar: "شغل إشارة الانعطاف بعد فحص المرايا وقبل الفرملة أو الانعطاف بمسافة كافية، ليعرف السائقون والدراجات حولك خطوتك القادمة مسبقاً."
    }
  },

  // 10. Eco Driving: Coasting in gear
  {
    id: 'tip-eco-coasting',
    category: 'eco_driving',
    title: {
      en: "Ease off the gas early to roll smoothly",
      nl: "Laat de auto tijdig uitrollen in de versnelling",
      ar: "دع السيارة تتباطأ تدريجياً داخل الغيار عند التوقف"
    },
    description: {
      en: "When you see a red light ahead, release the accelerator early while leaving the car in gear. This saves fuel, reduces brake wear, and gives a smooth ride.",
      nl: "Zie je in de verte een rood verkeerslicht? Laat direct het gas los en laat de auto in de versnelling rollen. Dat bespaart brandstof en remt comfortabel af.",
      ar: "عندما ترى إشارة حمراء من مسافة، ارفع قدمك عن دواسة الوقود ودع السيارة تتباطأ داخل الغيار. هذا يوفر الوقود ويجعل القيادة مريحة."
    }
  },

  // 11. Roundabouts: Lane positioning
  {
    id: 'tip-roundabout-lane',
    category: 'roundabouts',
    title: {
      en: "Position your car early when approaching roundabouts",
      nl: "Kies tijdig je rijstrook bij het naderen van een rotonde",
      ar: "اختر مسارك مبكراً عند الاقتراب من الدوار"
    },
    description: {
      en: "Select the right lane for turning right or going straight, and the left lane for turning left. Always check your right shoulder for cyclists before exiting.",
      nl: "Kies rechts voor rechtsaf/rechtdoor en links voor linksaf. Kijk altijd over je rechterschouder naar het fietspad voordat je de rotonde verlaat.",
      ar: "اختر المسار الأيمن للانعطاف يميناً أو المتابعة للأمام، والأيسر لليسار. وافحص كتفك الأيمن دائماً قبل الخروج لحماية الدراجات."
    }
  },

  // 12. Adverse Conditions: Rain margins
  {
    id: 'tip-rain-margins',
    category: 'adverse_conditions',
    title: {
      en: "Double your distance on wet roads",
      nl: "Verdubbel je volgafstand bij nat wegdek en regen",
      ar: "ضاعف مسافة الأمان أثناء هطول المطر أو البلل"
    },
    description: {
      en: "Wet roads increase braking distances significantly. Leave at least 3 to 4 seconds of buffer space and switch on your dipped headlights.",
      nl: "Een nat wegdek maakt je remweg een stuk langer. Houd minstens 3 tot 4 seconden afstand tot je voorligger en schakel altijd je dimlicht in.",
      ar: "الطرق المبتلة تزيد مسافة التوقف بشكل ملحوظ. اترك مسافة 3 إلى 4 ثوانٍ على الأقل وشغل الأضواء الخافتة (Dimlicht)."
    }
  },

  // 13. Social Driving: Forgiving others' mistakes
  {
    id: 'tip-compensate-others',
    category: 'social_driving',
    title: {
      en: "Stay calm and give space when another driver makes a mistake",
      nl: "Blijf rustig en geef ruimte bij fouten van anderen",
      ar: "حافظ على هدوئك وافسح المجال عند وقوع خطأ من سائق آخر"
    },
    description: {
      en: "If another driver hesitates or forgets priority, do not force your right of way. Simply ease off the gas, stay patient, and keep everyone safe.",
      nl: "Maakt een medeweggebruiker een inschattingsfout? Dwing geen voorrang af, maar laat rustig het gas los en geef elkaar de ruimte.",
      ar: "إذا تردد سائق آخر أو أخطأ في تقدير الأولوية، لا تصر على حقك بعناد، بل خفف سرعتك بهدوء وافسح المجال لضمان سلامة الجميع."
    }
  },

  // 14. Trip Prep: Ergonomics
  {
    id: 'tip-cockpit-setup',
    category: 'trip_preparation',
    title: {
      en: "Adjust your seat and mirrors before driving off",
      nl: "Stel je stoel en spiegels goed in vóór vertrek",
      ar: "اضبط المقعد والمرايا بشكل صحيح قبل الانطلاق"
    },
    description: {
      en: "Ensure you can press pedals completely with a slightly bent knee, and position your mirrors so you can see the road with minimal head movements.",
      nl: "Zorg dat je de pedalen helemaal kunt intrappen met een lichte buiging in je knie, en stel je spiegels zo af dat je dode hoeken minimaal zijn.",
      ar: "تأكد من قدرتك على الضغط الكامل على الدواسات مع انثناء بسيط في الركبة، واضبط المرايا لتكشف الطريق بأقل حركة ممكنة لرأسك."
    }
  },

  // 15. Vehicle Control: Smooth braking
  {
    id: 'tip-smooth-braking',
    category: 'vehicle_control',
    title: {
      en: "Brake smoothly and ease off just before stopping",
      nl: "Rem gedoseerd voor een soepele, comfortabele stop",
      ar: "استخدم الفرامل بتدرج لتوقف ناعم ومريح"
    },
    description: {
      en: "Start braking gently, apply steady pressure, and release the pedal slightly just before coming to a standstill to avoid any jolt.",
      nl: "Begin rustig met remmen, bouw de druk gecontroleerd op en laat het pedaal net voor stilstand iets opkomen voor een comfortabele stop.",
      ar: "ابدأ بضغط خفيف على الفرامل، ثم زده تدريجياً، وخفف الضغط قليلاً قبل التوقف التام لتجنب أي هزة مفاجئة للركاب."
    }
  },

  // 16. Anticipation: Parked cars
  {
    id: 'tip-parked-cars-hazard',
    category: 'anticipation',
    title: {
      en: "Scan for hazards along lines of parked cars",
      nl: "Let op openslaande deuren en voetgangers bij geparkeerde auto's",
      ar: "انتبه لفتح الأبواب وحركة المشاة بين السيارات المتوقفة"
    },
    description: {
      en: "Keep at least 1 meter distance from parked cars, look for people inside or front wheels turning, and cover the brake if sight is limited.",
      nl: "Houd minimaal 1 meter afstand van geparkeerde auto's. Let op inzittenden, draaiende wielen of kinderen die tussen auto's vandaan kunnen komen.",
      ar: "اترك مسافة متر على الأقل بجانب السيارات المتوقفة، وراقب حركة العجلات أو الركاب بالداخل وضع قدمك على أهبة الاستعداد فوق الفرامل."
    }
  },

  // 17. Speed & Space: Stopped vehicle cushion
  {
    id: 'tip-safety-cushion-stopped',
    category: 'speed_and_space',
    title: {
      en: "Stop where you can still see the rear tires of the car in front",
      nl: "Stop zodat je de achterbanden van je voorligger ziet",
      ar: "توقف بحيث تظل ترى الإطارات الخلفية للسيارة أمامك"
    },
    description: {
      en: "When stopping in traffic, leave enough room to see the rear tires of the car ahead touching the tarmac. This gives you space to steer around if they stall.",
      nl: "Houd bij stilstand zoveel afstand dat je de achterbanden van de auto vóór je het asfalt ziet raken. Zo kun je er altijd omheen sturen bij pech.",
      ar: "عند التوقف خلف سيارة، اترك مسافة تمكنك من رؤية ملامسة إطاراتها الخلفية للإسفلت. هذا يمنحك مسافة أمان ومخرجاً إذا تعطلت السيارة أمامك."
    }
  },

  // 18. Driver Assistance / Lights: Dipped headlights
  {
    id: 'tip-fog-lights',
    category: 'driver_assistance',
    title: {
      en: "Turn on dipped headlights in fog, rain, or twilight",
      nl: "Gebruik altijd dimlicht bij regen, mist of schemering",
      ar: "شغل الأضواء الخافتة في المطر والضباب والغسق"
    },
    description: {
      en: "Daytime running lights do not light up your rear lights. Switch manually to dipped headlights so traffic behind you can see your car clearly.",
      nl: "Dagrijverlichting verlicht je achterlichten meestal niet. Zet handmatig je dimlicht aan zodat achterliggers je tijdig en duidelijk zien.",
      ar: "أضواء النهار لا تشغل المصابيح الخلفية غالباً. شغل الأضواء الخافتة (Dimlicht) يدوياً لتكون مرئياً بوضوح لمن يقود خلفك."
    }
  },

  // 19. Vehicle Control: Steering grip
  {
    id: 'tip-steering-position',
    category: 'vehicle_control',
    title: {
      en: "Keep both hands on the wheel at quarter-to-three",
      nl: "Houd het stuur ontspannen vast in de kwart-voor-drie positie",
      ar: "امسك المقود باسترخاء في وضعية (تسعة وثلاثة)"
    },
    description: {
      en: "Placing your hands at 9 and 3 gives you maximum steering control, smooth turns, and keeps your arms safe if the airbag deploys.",
      nl: "De kwart-voor-drie positie geeft je optimale controle over het stuur, zorgt voor soepele bochten en is het veiligst voor je armen bij een airbag.",
      ar: "وضعية (9 و3) تمنحك تحكماً مثالياً ودقة في التوجيه، وهي الأكثر أماناً لحماية ذراعيك عند فتح الوسادة الهوائية."
    }
  },

  // 20. Anticipation: Looking deep into turns
  {
    id: 'tip-look-deep-in-turns',
    category: 'anticipation',
    title: {
      en: "Look far through the curve where you want to go",
      nl: "Kijk ver door de bocht heen naar waar je heen wilt",
      ar: "وجه نظرك نحو مخرج المنعطف إلى حيث تريد الذهاب"
    },
    description: {
      en: "Your car naturally goes where your eyes look. Direct your gaze through the curve rather than right in front of the hood to maintain a smooth line.",
      nl: "Je stuurt automatisch waar je naar kijkt. Richt je blik ver door de bocht in plaats van vlak voor je motorkap om een vloeiende lijn te rijden.",
      ar: "تتجه السيارة تلقائياً إلى حيث تنظر. انظر لمدى بعيد نحو مخرج المنعطف بدلاً من النظر لمقدمة السيارة، لتحافظ على مسار سلس ومتوازن."
    }
  },

  // 21. Priority Rules: Equal Intersections
  {
    id: 'tip-priority-right-equal',
    category: 'priority_rules',
    title: {
      en: "Yield to drivers from the right on equal intersections",
      nl: "Verleen voorrang aan bestuurders van rechts op gelijkwaardige kruispunten",
      ar: "امنح الأولوية للمركبات القادمة من اليمين في التقاطعات المتساوية"
    },
    description: {
      en: "Without priority signs or road markings, all drivers coming from the right have right-of-way. Approach at low speed and scan carefully between parked cars.",
      nl: "Zonder voorrangsborden of haaientanden heeft verkeer van rechts altijd voorrang. Nader rustig en kijk actief tussen geparkeerde auto's door.",
      ar: "في غياب الشواخص أو أسنان القرش، الأولوية دائماً للمركبات القادمة من اليمين. اقترب ببطء وانتبه جيداً بين السيارات المتوقفة."
    }
  },

  // 22. Traffic Signs: Shark teeth markings
  {
    id: 'tip-shark-teeth-rules',
    category: 'traffic_signs',
    title: {
      en: "Shark teeth require yielding to crossing drivers",
      nl: "Haaientanden verplichten voorrang verlenen aan kruisende bestuurders",
      ar: "علامات أسنان القرش تلزمك بمنح الأولوية للمرور المتقاطع"
    },
    description: {
      en: "Shark teeth indicate you must give way to drivers on the intersecting road. Note that pedestrians crossing straight on foot without a zebra are not drivers.",
      nl: "Haaientanden betekenen dat je voorrang moet verlenen aan bestuurders op de kruisende weg. Pas je naderingssnelheid tijdig aan.",
      ar: "أسنان القرش تعني وجوب إعطاء الأولوية لسائقي المركبات على الطريق المتقاطع. خفف سرعتك مبكراً وتحقق من خلو الطريق."
    }
  },

  // 23. Parking: Parallel Parking Reference Points
  {
    id: 'tip-parallel-parking-reference',
    category: 'parking',
    title: {
      en: "Use clear reference points for parallel parking",
      nl: "Gebruik duidelijke referentiepunten bij fileparkeren",
      ar: "استخدم نقاط استرشادية واضحة عند الاصطفاف الموازي (Fileparkeren)"
    },
    description: {
      en: "Line up rear bumpers 50 cm away from the adjacent car, reverse straight until your rear seat aligns with their bumper, then steer fully toward the curb.",
      nl: "Zet je achterbumper gelijk met de naastgelegen auto op 50 cm afstand. Rijd recht achteruit tot je achterbank bij hun bumper is en stuur volledig in.",
      ar: "حاذِ المصد الخلفي بجانب السيارة الأخرى على مسافة 50 سم، ثم ارجع باستقامة حتى يحاذي مقعدك الخلفي مصدهم، وابدأ بتوجيه المقود كاملاً نحو الرصيف."
    }
  },

  // 24. Parking: Bay Parking Reverse
  {
    id: 'tip-bay-parking-reverse',
    category: 'parking',
    title: {
      en: "Reverse into parking bays for a safer exit",
      nl: "Parkeer achterwaarts in een vak voor een veilig vertrek",
      ar: "اصطف للخلف في مواقف السيارات لخروج أكثر أماناً"
    },
    description: {
      en: "Reversing into a parking space allows you to pull forward when leaving, providing a full and unobstructed view of pedestrians and passing vehicles.",
      nl: "Achteruit inparkeren zorgt ervoor dat je bij vertrek vooruit wegrijdt met optimaal overzicht over voetgangers en overig verkeer.",
      ar: "الاصطفاف للخلف يتيح لك الخروج للأمام برؤية كاملة وواضحة للمشاة والسيارات العابرة دون مخاطرة الرجوع الأعمى."
    }
  },

  // 25. Highway Driving: Safe Merging (Invoegen)
  {
    id: 'tip-highway-merging-speed',
    category: 'highway_driving',
    title: {
      en: "Match highway traffic speed before merging",
      nl: "Pas je snelheid aan op de invoegstrook vóór het invoegen",
      ar: "طابق سرعة الطريق السريع على مسار الاندماج قبل الدخول"
    },
    description: {
      en: "Accelerate decisively on the slip road to match the speed of highway traffic (around 100 km/h), find a gap, check mirrors and blind spot, then merge smoothly.",
      nl: "Trek vlot op op de invoegstrook tot de snelheid van het verkeer, kies een veilige tussenruimte, check je dode hoek en voeg vloeiend in.",
      ar: "تسارع بثقة على مسار الدخول لتصل لسرعة الطريق السريع (قرابة 100 كم/س)، حدد مسافة مناسبة، افحص المرايا والنقطة العمياء ثم اندمج بسلاسة."
    }
  },

  // 26. Highway Driving: Leaving the Highway (Uitvoegen)
  {
    id: 'tip-highway-exit-braking',
    category: 'highway_driving',
    title: {
      en: "Brake only after entering the deceleration lane",
      nl: "Rem pas af nádat je op de uitvoegstrook rijdt",
      ar: "لا تخفف السرعة إلا بعد الدخول الكامل في مسار الخروج (Uitvoegstrook)"
    },
    description: {
      en: "Indicate 300 meters before the exit, maintain your cruising speed until fully in the exit lane, then apply smooth braking for the curve ahead.",
      nl: "Geef 300 meter voor de afrit richting aan, blijf op snelheid tot je volledig op de uitvoegstrook rijdt en rem daarna pas rustig af.",
      ar: "أعطِ إشارة الانعطاف قبل المخرج بـ 300 متر، وحافظ على سرعتك حتى تدخل مسار الخروج بالكامل، ثم ابدأ بالتهدئة السلسة."
    }
  },

  // 27. Cyclists: Right Turn Across Bike Lanes
  {
    id: 'tip-cyclists-turning-right',
    category: 'cyclists',
    title: {
      en: "Yield to cyclists going straight when you turn right",
      nl: "Verleen voorrang aan rechtdoorgaande fietsers bij rechts afslaan",
      ar: "أعطِ الأولوية للدراجات المتابعة للأمام عند انعطافك يميناً"
    },
    description: {
      en: "Under Dutch law, traffic continuing straight on the same road has priority over turning vehicles. Check your right mirror and blind spot before steering across a bike lane.",
      nl: "Rechtdoorgaand verkeer op dezelfde weg gaat voor afslaand verkeer. Kijk altijd binnenspiegel, rechterbuitenspiegel en over je rechterschouder.",
      ar: "القانون الهولندي يمنح الأولوية للمرور المتابع للأمام على نفس الطريق. افحص المرآة الداخلية واليمنى ونظرة الكتف قبل قطع مسار الدراجات."
    }
  },

  // 28. Vehicle Control: Clutch Biting Point Control
  {
    id: 'tip-clutch-biting-point',
    category: 'vehicle_control',
    title: {
      en: "Hold the clutch at the biting point for 1 second",
      nl: "Houd de koppeling 1 seconde vast op het aangrijpingspunt",
      ar: "ثبت دواسة الدبرياج لثانية واحدة عند نقطة التلامس (Aangrijpingspunt)"
    },
    description: {
      en: "When moving off, raise the clutch to the biting point and pause for a beat until the car gains momentum, preventing the engine from stalling or jerking.",
      nl: "Laat bij het wegrijden de koppeling opkomen tot het aangrijpingspunt en houd hem even stil tot de auto rolt. Zo slaat de motor nooit af.",
      ar: "عند الانطلاق، ارفع الدبرياج لنقطة التلامس وثبت قدمك لثانية حتى تتحرك السيارة بثبات، مما يمنع انطفاء المحرك أو الاهتزاز."
    }
  },

  // 29. Vehicle Control: Hill Start with Clutch & Footbrake
  {
    id: 'tip-hill-start-technique',
    category: 'vehicle_control',
    title: {
      en: "Master hill starts by finding the biting point before releasing the brake",
      nl: "Hellingproef: zoek eerst het aangrijpingspunt vóórdat je de rem loslaat",
      ar: "الانطلاق في المرتفعات: ابحث عن نقطة تلامس الدبرياج قبل ترك الفرامل"
    },
    description: {
      en: "On an incline, hold the footbrake, bring the clutch up until you hear the engine pitch change, then release the brake and add gas without rolling back.",
      nl: "Houd de voetrem ingedrukt, laat de koppeling opkomen tot de auto wil rijden, laat dan de rem los en geef direct rustig gas.",
      ar: "على المرتفع، اضغط الفرامل وارفع الدبرياج حتى تشعر بعزم المحرك، ثم حرر الفرامل وزد الوقود بسلاسة دون التراجع للخلف."
    }
  },

  // 30. Speed Management: 30 km/h Zone Observation
  {
    id: 'tip-30-zone-scanning',
    category: 'speed_and_space',
    title: {
      en: "Drive around 25 to 30 km/h in residential zones",
      nl: "Rijd rustig en alert in 30 km/u zones",
      ar: "قد بهدوء وبسرعة 25 إلى 30 كم/س في المناطق السكنية"
    },
    description: {
      en: "In 30 km/h zones, all intersections are equal by default and children or pets may cross unexpectedly. Keep your right foot ready over the brake pedal.",
      nl: "In 30-zones zijn vrijwel alle kruispunten gelijkwaardig en kunnen kinderen plotseling oversteken. Houd je voet paraat boven het rempedaal.",
      ar: "في مناطق 30 كم/س، غالبية التقاطعات متساوية والأولوية لليمين، مع احتمال عبور أطفال. ضع قدمك على أهبة الاستعداد فوق الفرامل."
    }
  },

  // 31. Adverse Conditions: Aquaplaning prevention
  {
    id: 'tip-aquaplaning-safety',
    category: 'adverse_conditions',
    title: {
      en: "Do not brake if you encounter standing water or aquaplaning",
      nl: "Rem niet bij aquaplaning: laat rustig het gas los",
      ar: "لا تضغط على الفرامل عند الانزلاق المائي (Aquaplaning)"
    },
    description: {
      en: "If tires lose grip on deep water, hold the steering wheel straight and ease off the gas. Never brake abruptly until traction is fully restored.",
      nl: "Verliest de auto grip door water op de weg? Houd het stuur recht, trap de koppeling in en rem niet totdat de banden weer contact maken.",
      ar: "إذا فقدت الإطارات تماسكها بسبب تجمع المياه، حافظ على استقامة المقود وارفع قدمك عن الوقود دون فرملة مفاجئة حتى يعود التماسك."
    }
  },

  // 32. CBR Exam Prep: Active Looking Behaviour (Kijkgedrag)
  {
    id: 'tip-cbr-active-looking',
    category: 'cbr_exam_prep',
    title: {
      en: "Demonstrate clear head movement during mirror checks",
      nl: "Beweeg je hoofd licht bij het spiegelen voor duidelijk kijkgedrag",
      ar: "حرك رأسك بوضوح أثناء فحص المرايا لإظهار المراقبة النشطة"
    },
    description: {
      en: "CBR examiners assess active observation. Turn your head slightly towards mirrors and blind spots so your scanning routine is unmistakable.",
      nl: "De examinator beoordeelt je kijkgedrag. Beweeg je hoofd licht mee bij het kijken in de spiegels en over je schouder, niet alleen je ogen.",
      ar: "فاحص الـ CBR يركز على المراقبة النشطة. أمل رأسك بحركة واضحة نحو المرايا والنقطة العمياء ليتأكد الفاحص من يقظتك التامة."
    }
  },

  // 33. CBR Exam Prep: Decisiveness over hesitation (Vlot en veilig)
  {
    id: 'tip-cbr-decisiveness',
    category: 'cbr_exam_prep',
    title: {
      en: "Drive smoothly and take safe opportunities without hesitation",
      nl: "Rijd vlot en zelfverzekerd: pak veilige kansen direct",
      ar: "قد بثقة وسلاسة واستغل الفرص الآمنة دون تردد مفرط"
    },
    description: {
      en: "Examiners want to see that you dare to drive. When a safe gap opens at an intersection or roundabout, accelerate cleanly without endless hesitation.",
      nl: "Laat zien dat je zelfstandig beslissingen durft te nemen. Is er een veilige ruimte? Pak die dan vlot en zelfverzekerd zonder onnodig te twijfelen.",
      ar: "يبحث الفاحص عن القيادة الواثقة والآمنة. عند توفر فجوة مرورية آمنة في تقاطع أو دوار، انطلق بسلاسة ودون تردد زائد."
    }
  },

  // 34. Traffic Signs: Mandatory vs Prohibition Circles
  {
    id: 'tip-traffic-sign-shapes',
    category: 'traffic_signs',
    title: {
      en: "Red borders prohibit, blue circles mandate",
      nl: "Rode randen verbieden, blauwe ronde borden verplichten",
      ar: "الإطارات الحمراء تدل على المنع، والدوائر الزرقاء تلزم باتباع المسار"
    },
    description: {
      en: "Round signs with a red border set a prohibition or maximum speed, while solid blue round signs indicate a mandatory driving direction or dedicated lane.",
      nl: "Ronde borden met een rode rand geven een verbod of maximumsnelheid aan; blauwe ronde borden met een witte pijl verplichten een rijrichting.",
      ar: "الشواخص الدائرية ذات الإطار الأحمر تفيد بالمنع أو السرعة القصوى، بينما الشواخص الدائرية الزرقاء تلزمك بالاتجاه الإجباري أو مسار محدد."
    }
  },

  // 35. Defensive Driving: Space Cushion on Both Sides
  {
    id: 'tip-defensive-side-space',
    category: 'anticipation',
    title: {
      en: "Keep a safety margin on both sides of your car",
      nl: "Houd aan beide zijden van je auto een veilige tussenruimte",
      ar: "حافظ على هامش أمان جانبي على يمين ويسار سيارتك"
    },
    description: {
      en: "Do not hug the curb or drive too close to oncoming traffic. Stay centered in your lane and create extra clearance when passing large trucks or buses.",
      nl: "Rijd mooi in het midden van je rijstrook. Houd extra afstand bij het passeren van vrachtwagens, bussen of rijen geparkeerde auto's.",
      ar: "تمركز في منتصف مسارك ولا تقترب بإفراط من الرصيف أو السيارات المقابلة، واترك مسافة جانبية إضافية عند تجاوز الشاحنات والحافلات."
    }
  },

  // 36. Vehicle Control: Downshifting & Engine Braking
  {
    id: 'tip-engine-braking-downshift',
    category: 'vehicle_control',
    title: {
      en: "Use engine braking by releasing the gas in gear",
      nl: "Gebruik de motorrem door tijdig het gas los te laten",
      ar: "استفد من فرملة المحرك برفع القدم عن دواسة الوقود داخل الغيار"
    },
    description: {
      en: "Downshifting smoothly into 3rd or 2nd gear before turns lets the engine slow the car naturally, giving you instant acceleration power when exiting.",
      nl: "Schakel rustig terug naar zijn 3 of 2 vóór een afslag. De motor remt mee en je hebt direct weer trekkracht bij het uitsturen van de bocht.",
      ar: "الانتقال للغيار الأدنى (الثالث أو الثاني) قبل المنعطف يتيح للمحرك تهدئة السيارة طبيعياً ويمنحك عزماً مباشراً عند الخروج من المنعطف."
    }
  },

  // 37. Pedestrians: Turning vehicles must yield to crossing pedestrians
  {
    id: 'tip-turning-across-pedestrians',
    category: 'pedestrians',
    title: {
      en: "Yield to pedestrians walking straight along the same road",
      nl: "Verleen voorrang aan voetgangers die rechtdoor gaan op dezelfde weg",
      ar: "امنح الأولوية للمشاة المتابعين للسير باستقامة على نفس الطريق"
    },
    description: {
      en: "When turning into a side street, you must yield to pedestrians continuing straight on the sidewalk beside your road, even without a zebra crossing.",
      nl: "Sla je af naar een zijstraat? Dan moet je voorrang verlenen aan voetgangers die rechtdoor lopen op het trottoir langs jouw weg.",
      ar: "عند الانعطاف نحو شارع جانبي، يجب عليك إعطاء الأولوية للمشاة السائرين باستقامة على الرصيف بمحاذاة طريقك، حتى لو لم يوجد ممر مشاة."
    }
  },

  // 38. Lane Positioning: Road center line & pre-sorting
  {
    id: 'tip-lane-presorting-turn',
    category: 'vehicle_control',
    title: {
      en: "Pre-sort cleanly to the left or right before turning",
      nl: "Sorteer tijdig en duidelijk voor vóór het afslaan",
      ar: "تموضع مبكراً نحو اليمين أو اليسار قبل الانعطاف (Voorsorteren)"
    },
    description: {
      en: "For turning left on two-way roads, position your car close against the road axis without crossing it, allowing traffic behind you to pass on the right.",
      nl: "Ga voor links afslaan strak tegen de wegas rijden op tweerichtingswegen, zodat achteropkomend verkeer je veilig rechts kan passeren.",
      ar: "للانعطاف يساراً في طريق باتجاهين، تموضع بمحاذاة خط المنتصف دون تجاوزه، لتمكين السيارات خلفك من مواصلة السير يميناً بأمان."
    }
  },

  // 39. Night Driving: High beam etiquette
  {
    id: 'tip-night-driving-lights',
    category: 'night_driving',
    title: {
      en: "Switch off high beams when oncoming traffic appears",
      nl: "Schakel groot licht direct uit bij tegenliggers of voorliggers",
      ar: "أطفئ الضوء العالي فوراً عند ظهور سيارات قادمة أو أمامك"
    },
    description: {
      en: "High beams blind oncoming drivers and vehicles ahead via their mirrors. Switch to dipped headlights immediately whenever another vehicle is visible.",
      nl: "Groot licht verblindt tegenliggers en voorliggers via hun spiegels. Schakel direct terug naar dimlicht zodra je andere lichten ziet.",
      ar: "الضوء العالي يبهر السائقين المقابلين ومن يسبقك عبر المرايا. حول إلى الضوء الخافت فور رؤية أي سيارة أمامك."
    }
  },

  // 40. CBR Exam Prep: What to do after an error
  {
    id: 'tip-cbr-recovering-mistakes',
    category: 'cbr_exam_prep',
    title: {
      en: "Do not dwell on a minor mistake during your driving lesson or test",
      nl: "Blijf niet piekeren over een klein foutje tijdens het rijden",
      ar: "لا تنشغل بالتفكير في خطأ بسيط ارتكبته أثناء الدرس أو الاختبار"
    },
    description: {
      en: "CBR examiners evaluate the overall drive, not perfection. If you stall the engine or miss a turn, solve it calmly and stay fully focused on the road ahead.",
      nl: "De examinator kijkt naar het totaalbeeld. Slaat de motor af of mis je een afslag? Herstel rustig en houd je aandacht bij de volgende verkeerssituatie.",
      ar: "فاحص القيادة يقيّم سلامة القيادة العامة وليس الكمال المطلق. إذا انطفأ المحرك، أعد تشغيله بهدوء وواصل تركيزك على الطريق أمامك."
    }
  },

  // 41. Self Reflection: Scan mirror after every turn
  {
    id: 'tip-mirror-after-turning',
    category: 'self_reflection',
    title: {
      en: "Check your interior mirror right after completing a turn",
      nl: "Kijk direct na het afronden van een bocht in je binnenspiegel",
      ar: "ألقِ نظرة في المرآة الداخلية فور الانتهاء من الانعطاف"
    },
    description: {
      en: "After completing a turn and straightening the wheel, check the interior mirror to assess new traffic behind you and verify your speed tempo.",
      nl: "Zodra de auto recht staat na een bocht, kijk je even in je binnenspiegel om te zien wie er achter je rijdt en hoe snel het verkeer nadert.",
      ar: "فور استقامة عجلات السيارة بعد المنعطف، افحص المرآة الداخلية لمعرفة المركبات خلفك والتأكد من ملاءمة سرعتك."
    }
  },

  // 42. Vehicle Checks: Tire pressure & tread depth
  {
    id: 'tip-tire-checks-safety',
    category: 'vehicle_checks',
    title: {
      en: "Check your tire tread and pressure monthly",
      nl: "Controleer maandelijks je bandenspanning en profieldiepte",
      ar: "افحص ضغط الإطارات وعمق النقشة شهرياً"
    },
    description: {
      en: "Proper tire pressure ensures shorter braking distances and optimal fuel economy. The minimum legal tread depth in the Netherlands is 1.6 mm, recommended 3 mm.",
      nl: "De juiste bandenspanning verlaagt het verbruik en verkort je remweg. De wettelijke minimum profieldiepte is 1,6 mm, veilig advies is minimaal 3 mm.",
      ar: "ضغط الإطارات الصحيح يقلل استهلاك الوقود ويقصر مسافة الفرملة. الحد الأدنى القانوني لعمق النقشة في هولندا 1.6 ملم، والموصى به 3 ملم."
    }
  },

  // 43. Intersections: Mini-roundabouts with priority from left
  {
    id: 'tip-mini-roundabout-scan',
    category: 'roundabouts',
    title: {
      en: "Traffic on the roundabout has priority",
      nl: "Bestuurders op de rotonde hebben voorrang door bord B6",
      ar: "المركبات داخل الدوار لها حق الأولوية بوجود شاخصة B6 وأسنان القرش"
    },
    description: {
      en: "Almost all roundabouts in the Netherlands feature yield signs (B6) and shark teeth at the entrance, meaning traffic on the roundabout has priority.",
      nl: "Vrijwel alle Nederlandse rotondes zijn voorzien van bord B6 en haaientanden. Verleen altijd voorrang aan alle bestuurders op de rotonde.",
      ar: "شبه جميع الدوارات في هولندا مزودة بشاخصة المثلث المقلوب (B6) وأسنان القرش، مما يمنح الأولوية للمركبات المتواجدة داخل الدوار."
    }
  },

  // 44. Vulnerable Users: School zones & children
  {
    id: 'tip-school-zones-anticipation',
    category: 'vulnerable_users',
    title: {
      en: "Reduce speed and increase alertness near schools",
      nl: "Verlaag je snelheid en wees extra alert bij scholen en speelplaatsen",
      ar: "خفف سرعتك وكن في غاية اليقظة بالقرب من المدارس والملاعب"
    },
    description: {
      en: "Children have limited hazard perception and may dart into the street chasing a ball or friend. Drive slowly and expect sudden movements.",
      nl: "Kinderen kunnen onverwacht de weg op rennen achter een bal aan. Rijd stapvoets langs schoolzones en houd je remmen paraat.",
      ar: "الأطفال قد يندفعون نحو الشارع فجأة وراء كرة أو زميل. قد ببطء شديد قرب المدارس وضع قدمك على أهبة الاستعداد فوق الفرامل."
    }
  },

  // 45. Safe Habits: Phone distraction avoidance
  {
    id: 'tip-phone-distraction-focus',
    category: 'risk_awareness',
    title: {
      en: "Keep your smartphone mounted and do not hold it while driving",
      nl: "Houd je telefoon in de houder en bedien hem niet rijdend",
      ar: "ثبت هاتفك في الحامل المخصص وتجنب لمسه أثناء القيادة"
    },
    description: {
      en: "Holding a phone while driving is strictly illegal in the Netherlands and dramatically increases reaction times. Set up navigation before driving off.",
      nl: "Een telefoon vasthouden tijdens het rijden is verboden en leidt enorm af. Stel je navigatie en muziek altijd in vóórdat je wegrijdt.",
      ar: "حمل الهاتف باليد أثناء القيادة مخالف للقانون الهولندي ويزيد وقت رد الفعل بشكل خطير. اضبط الملاحة دائماً قبل التحرك."
    }
  }
];

/**
 * Returns active driving tips database
 */
export function getFullDrivingTipsDatabase(): DrivingTip[] {
  return DRIVING_TIPS;
}
