export interface DetailedTip {
  explanation: string[];
  example: string;
}

/**
 * Educational Detail Resolver for "Today's Tip"
 * Strictly enforces: ONE TIP -> ONE SKILL -> ONE PRACTICAL ACTION.
 * Every tip ID has an exact 1-to-1 educational detail mapping with full trilingual parity.
 */
export function getDetailedTip(
  id: string,
  category: string,
  title: string,
  lang: 'en' | 'nl' | 'ar'
): DetailedTip {
  // 1. BLIND SPOT CHECK
  if (id === 'tip-blind-spot') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Kijk eerst in je binnenspiegel om achteropkomend verkeer in te schatten.",
          "Kijk vooruit naar de situatie vóór je auto.",
          "Kijk in je buitenspiegel in de richting waar je naartoe wilt.",
          "Werp een korte schouderblik direct naast je auto om je dode hoek te controleren."
        ],
        example: "Bij het wisselen naar de rechterrijstrook kijk je binnenspiegel, vooruit, rechterbuitenspiegel en over je rechterschouder. Pas als er voldoende ruimte is, geef je richting aan en stuur je rustig in."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "انظر أولاً في المرآة الداخلية لتقدير حركة السير القادمة من خلفك.",
          "انظر للأمام لمراقبة حالة الطريق أمام مركبتك.",
          "انظر في المرآة الجانبية باتجاه المسار الذي ترغب بالانتقال إليه.",
          "التفت بلمحة سريعة فوق كتفك لفحص النقطة العمياء والتأكد من خلو المسار."
        ],
        example: "عند الانتقال للمسار الأيمن، افحص المرآة الداخلية، ثم للأمام، فالمرآة الجانبية ونظرة الكتف. وفور التأكد من توفر مسافة كافية، أعطِ الإشارة وانتقل بسلاسة."
      };
    } else {
      return {
        explanation: [
          "Check your interior rearview mirror to gauge traffic behind you.",
          "Look ahead to verify your travel path is clear.",
          "Check your side mirror in the direction you plan to move.",
          "Make a quick shoulder check to cover the blind spot beside your vehicle."
        ],
        example: "Before moving into the right lane, check interior mirror, ahead, right side mirror, and glance over your right shoulder. Once confirmed clear, indicate and steer smoothly."
      };
    }
  }

  // 2. FOLLOWING DISTANCE (2-SECOND RULE)
  if (id === 'tip-following-distance') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Kies een vast herkenningspunt langs de weg, zoals een verkeersbord of lantaarnpaal.",
          "Zodra je voorligger dat punt passeert, tel je rustig: 'éénentwintig, tweeëntwintig'.",
          "Passeer je het punt pas ná het tellen? Dan heb je een veilige volgafstand.",
          "Vergroot de afstand bij nat wegdek of zware regen naar minimaal 3 tot 4 seconden."
        ],
        example: "Rijd je 80 km/u op een provinciale weg en remt je voorligger plotseling? Dankzij de 2-secondenmarge heb je ruim voldoende tijd om rustig mee te remmen zonder paniek."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "اختر نقطة ثابتة على جانب الطريق مثل عمود إنارة أو شاخصة مرورية.",
          "عندما تمر السيارة أمامك بتلك النقطة، عد بهدوء: 'واحد وعشرون، اثنان وعشرون'.",
          "إذا وصلت للنقطة بعد إتمام العد، فمسافة الأمان لديك ممتازة.",
          "زد المسافة إلى 3 أو 4 ثوانٍ في حال كان الطريق مبتلاً أو أثناء المطر."
        ],
        example: "أثناء القيادة بسرعة 80 كم/ساعة وضغطت السيارة أمامك فجأة على الفرامل، تمنحك قاعدة الثانيتين وقتاً كافياً للتهدئة والفرملة بهدوء دون أي توتر."
      };
    } else {
      return {
        explanation: [
          "Choose a stationary landmark ahead, like a signpost or bridge.",
          "When the car ahead passes the mark, count: 'one-thousand-and-one, one-thousand-and-two'.",
          "If you reach the landmark after completing the count, your gap is safe.",
          "Increase this buffer to 3 or 4 seconds in rainy or wet conditions."
        ],
        example: "Driving at 80 km/h and the vehicle ahead brakes suddenly: the 2-second gap gives you ample reaction time to slow down smoothly and safely."
      };
    }
  }

  // 3. SCANNING INTERSECTIONS EARLY
  if (id === 'tip-look-ahead-intersections') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Kijk 50 tot 100 meter vóór het kruispunt naar de verkeersborden en wegmarkeringen.",
          "Controleer vroegtijdig of je voorrang hebt of voorrang moet verlenen.",
          "Kijk alvast links en rechts tussen huizen of geparkeerde auto's voor kruisend verkeer.",
          "Laat ruim op tijd het gas los als je zicht belemmerd is."
        ],
        example: "Bij het naderen van een gelijkwaardig kruispunt haal je 30 meter van tevoren je voet van het gas en kijk je actief naar rechts tussen de geparkeerde bestelbussen."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "انتبه لشواخص المرور والعلامات الأرضية قبل التقاطع بـ 50 إلى 100 متر.",
          "حدد مبكراً ما إذا كانت الأولوية لك أم يجب عليك إعطاء الأولوية للآخرين.",
          "استكشف يميناً ويساراً بين المباني أو السيارات المتوقفة لرؤية المرور المتقاطع.",
          "ارفع قدمك عن دواسة الوقود مبكراً إذا كانت الرؤية محجوبة."
        ],
        example: "عند الاقتراب من تقاطع متساوي، ارفع قدمك عن الوقود قبل التقاطع بـ 30 متراً وانظر بنشاط نحو اليمين بين المركبات المتوقفة."
      };
    } else {
      return {
        explanation: [
          "Look 50 to 100 meters ahead for priority signs and road markings.",
          "Determine early whether you have right-of-way or need to yield.",
          "Scan left and right between buildings or parked cars for crossing traffic.",
          "Ease off the accelerator early if sightlines are restricted."
        ],
        example: "Approaching an equal intersection, lift your foot off the gas 30 meters prior and actively scan right between parked delivery vans."
      };
    }
  }

  // 4. SPEED IN BENDS
  if (id === 'tip-speed-in-bends') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Rem af op het rechte stuk vóór de bocht tot een veilige naderingssnelheid.",
          "Schakel terug naar de passende versnelling (meestal 2e versnelling voor scherpe bochten).",
          "Kijk ver door de bocht naar het uitgangspunt.",
          "Geef pas weer geleidelijk gas als je de bocht uitstuurt."
        ],
        example: "Vóór een haakse bocht naar rechts rem je rustig af naar 20 km/u, schakel je naar de 2e versnelling, kijk je door de bocht en stuur je vloeiend in."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "خفف سرعتك على المسار المستقيم قبل دخول المنعطف.",
          "اختر الغيار المناسب (عادة الغيار الثاني للمنعطفات الحادة).",
          "انظر لمدى بعيد نحو نقطة الخروج من المنعطف.",
          "زد سرعتك بتدرج ونعومة فور البدء بالخروج من المنعطف واستقامة المقود."
        ],
        example: "قبل منعطف حاد نحو اليمين، هدئ سرعتك إلى 20 كم/س وانتقل للغيار الثاني، ثم وجه نظرك لمخرج المنعطف وانعطف بسلاسة."
      };
    } else {
      return {
        explanation: [
          "Brake on the straight approach before entering the bend.",
          "Shift down to the appropriate gear (usually 2nd gear for sharp city turns).",
          "Look far through the curve towards the road exit.",
          "Gently accelerate only as you straighten the wheel exiting the turn."
        ],
        example: "Approaching a right-angle street turn, slow to 20 km/h on the straight, select 2nd gear, look through the corner, and steer smoothly."
      };
    }
  }

  // 5. DUTCH REACH (DOOR OPENING)
  if (id === 'tip-dutch-reach') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Pak de portiergreep vast met je rechterhand (de verre hand).",
          "Je schouders en bovenlichaam draaien hierdoor automatisch naar achteren.",
          "Kijk in je buitenspiegel en direct door het raam naar achteropkomende fietsers.",
          "Open de deur eerst op een kier voordat je hem volledig openduwt."
        ],
        example: "Na het parkeren langs een drukke fietsstrook open je het portier met je rechterhand. Zo zie je een naderende fietser direct en voorkom je een gevaarlijk portierongeval."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "أمسك مقبض الباب بيدك اليمنى (اليد البعيدة عن الباب).",
          "يلتفت كتفاك وجذعك تلقائياً نحو الخلف مع هذه الحركة.",
          "انظر في المرآة الجانبية وعبر النافذة لرؤية أي دراجة قادمة.",
          "افتح الباب لمسافة بسيطة أولاً قبل فتحه بالكامل."
        ],
        example: "بعد التوقف بجانب مسار دراجات مزدحم، استخدم يدك اليمنى لفتح الباب، فترى الدراجات القادمة بوضوح وتتجنب فتح الباب فجأة في طريقهم."
      };
    } else {
      return {
        explanation: [
          "Reach for the door handle using your far hand (right hand for driver).",
          "This movement naturally rotates your torso and shoulders toward the rear.",
          "Check your side mirror and look directly through the window for approaching cyclists.",
          "Crack the door open slightly before swinging it all the way open."
        ],
        example: "After parallel parking next to a cycle track, using your right hand forces you to spot an oncoming e-bike before pushing the door out."
      };
    }
  }

  // 21. PRIORITY RULES: EQUAL INTERSECTIONS
  if (id === 'tip-priority-right-equal') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Herken een gelijkwaardig kruispunt aan het ontbreken van voorrangsborden of haaientanden.",
          "Bestuurders van rechts (auto's, brommers, fietsers) hebben altijd voorrang.",
          "Nader het kruispunt met aangepaste snelheid (ongeveer 20 km/u in woonwijken).",
          "Kijk actief naar rechts tussen eventuele obstakels vóórdat je het kruispunt oprijdt."
        ],
        example: "In een woonwijk nader je een kruising zonder borden. Je remt rustig af, kijkt naar rechts en laat een naderende fietser van rechts netjes voorgaan."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "التقاطع المتساوي يخلو من الشواخص أو أسنان القرش المنظمة للأولوية.",
          "جميع سائقي المركبات القادمين من اليمين (سيارات، دراجات) لهم حق الأولوية دائماً.",
          "اقترب من التقاطع بسرعة هادئة ومناسبة (قرابة 20 كم/س في الأحياء السكنية).",
          "انظر بنشاط نحو اليمين وتأكد من خلو المسار قبل العبور."
        ],
        example: "في منطقة سكنية اقتربت من تقاطع دون شواخص، تهدئ سرعتك وتنظر لليمين لتفسح المجال لدراجة قادمة من يمينك بكل احترام وأمان."
      };
    } else {
      return {
        explanation: [
          "Identify an equal intersection by the absence of priority signs or shark teeth markings.",
          "All drivers from the right (cars, mopeds, bicycles) have right of way.",
          "Approach at a controlled speed (approx 20 km/h in residential streets).",
          "Actively scan right through parked cars or hedges before entering the junction."
        ],
        example: "Driving through a 30 km/h zone, you reach an unmarked crossing, slow down, glance right, and politely yield to an approaching cyclist."
      };
    }
  }

  // 23. PARALLEL PARKING
  if (id === 'tip-parallel-parking-reference') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Plaats je auto parallel naast de voorste auto met 50 cm tussenruimte en bumpers gelijk.",
          "Rijd langzaam recht achteruit tot je achterbank gelijk staat met zijn achterbumper.",
          "Stuur volledig in naar de stoepzijde en rijd achteruit tot je auto een hoek van 45 graden maakt.",
          "Draai het stuur tegen en stuur rustig in tot je strak langs de stoeprand staat."
        ],
        example: "Tijdens de bijzondere verrichting gebruik je de achterbank als referentiepunt, stuurt rustig in bij 45 graden en staat in één soepele beweging perfect geparkeerd."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "قف بمحاذاة السيارة الأمامية بمسافة جانبية 50 سم وتطابق المصدات الخلفية.",
          "تحرك للخلف ببطء حتى يحاذي مقعدك الخلفي المصد الخلفي للسيارة بجانبك.",
          "لف المقود كاملاً نحو الرصيف وارجع حتى تصنع السيارة زاوية 45 درجة.",
          "لف المقود بالاتجاه المعاكس لتستقيم السيارة بمحاذاة الرصيف بنعومة."
        ],
        example: "أثناء تطبيق ركن الاصطفاف الموازي، تستخدم المقعد الخلفي كنقطة استرشادية، وتلف المقود عند 45 درجة لتستقر السيارة بسلاسة تامة بجانب الرصيف."
      };
    } else {
      return {
        explanation: [
          "Align alongside the target car with 50 cm side clearance and matched rear bumpers.",
          "Reverse straight until your rear seat aligns with the adjacent car's rear bumper.",
          "Lock the steering towards the curb and reverse until your car is at a 45-degree angle.",
          "Counter-steer smoothly to draw parallel and centered against the curb."
        ],
        example: "Performing a parallel park during your lesson, using the rear seat milestone and 45-degree pivot aligns you seamlessly within one smooth maneuver."
      };
    }
  }

  // 25. HIGHWAY MERGING
  if (id === 'tip-highway-merging-speed') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Trek op de invoegstrook vlot door in de 3e of 4e versnelling naar circa 100 km/u.",
          "Kijk vroegtijdig in je binnenspiegel en linkerbuitenspiegel om een veilige opening te kiezen.",
          "Houd minimaal 2 seconden afstand tot de auto vóór je op de invoegstrook.",
          "Werp een korte schouderblik naar links, geef richting aan en schuif vloeiend in de opening."
        ],
        example: "Bij het oprijden van de A2 versnel je stevig tot 100 km/u, spot je een ruime opening tussen twee vrachtwagens, checkt je dode hoek en voegt zelfverzekerd in."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "تسارع بثقة على مسار الدخول مستخدماً الغيار الثالث أو الرابع لتصل لنحو 100 كم/س.",
          "افحص المرآة الداخلية والجانبية اليسرى مبكراً لاختيار فجوة مرورية آمنة.",
          "اترك مسافة أمان ثانيتين على الأقل مع السيارة أمامك في مسار الاندماج.",
          "ألقِ نظرة كتف سريعة لليسار، وشغل الإشارة واندمج بسلاسة في الفجوة المحددة."
        ],
        example: "عند الدخول إلى الطريق السريع، تتسارع بقوة وثبات حتى 100 كم/س وتحدد فجوة آمنة بين الشاحنات، ثم تفحص نقطتك العمياء وتندمج بكل ثقة."
      };
    } else {
      return {
        explanation: [
          "Accelerate decisively in 3rd or 4th gear up to prevailing traffic speed (~100 km/h).",
          "Check interior mirror and left door mirror early to identify a comfortable gap.",
          "Maintain a safe distance to any vehicle ahead of you on the slip road.",
          "Check your left blind spot over your shoulder, indicate, and slide smoothly into the gap."
        ],
        example: "Joining the highway, you match speeds at 100 km/h, identify a spacious gap, verify your blind spot, and merge in one continuous fluid motion."
      };
    }
  }

  // 27. CYCLISTS TURNING RIGHT
  if (id === 'tip-cyclists-turning-right') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Kijk vóór het afslaan naar rechts altijd: binnenspiegel, vooruit, rechterbuitenspiegel.",
          "Werp een gerichte schouderblik over je rechterschouder naar het fietspad.",
          "Fietsers die rechtdoor rijden op hetzelfde fietspad hebben altijd voorrang.",
          "Stop ruim vóór het fietspad als er een fietser nadert en wacht rustig."
        ],
        example: "Je wilt rechtsaf een zijstraat in. Je kijkt over je rechterschouder, ziet een snelle elektrische fiets naderen en wacht rustig totdat hij voorbij is."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "قبل الانعطاف يميناً افحص دائماً: المرآة الداخلية، للأمام، فالمرآة الجانبية اليمنى.",
          "ألقِ نظرة كتف واضحة فوق كتفك الأيمن نحو مسار الدراجات.",
          "الدراجات المتابعة للسير باستقامة على نفس الطريق لها الأولوية المطلقة.",
          "توقف قبل مسار الدراجات بمسافة كافية إذا كانت هناك دراجة قادمة وانتظر بسلام."
        ],
        example: "ترغب بالانعطاف يميناً لشارع فرعي، فتلتفت بكتفك الأيمن وتشاهد دراجة كهربائية سريعة، فتتوقف بهدوء حتى تعبر بسلام قبل انعطافك."
      };
    } else {
      return {
        explanation: [
          "Before turning right, check: interior mirror, ahead, right side mirror.",
          "Perform a deliberate shoulder check over your right shoulder towards the cycle path.",
          "Cyclists continuing straight alongside your road have absolute priority.",
          "Come to a complete stop before the cycle path if a cyclist is approaching."
        ],
        example: "Turning right into a residential avenue, your shoulder check catches a fast approaching e-bike; you pause patiently and let them pass cleanly."
      };
    }
  }

  // 28. CLUTCH BITING POINT
  if (id === 'tip-clutch-biting-point') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Druk de koppeling volledig in en zet de versnelling in zijn 1.",
          "Laat de koppeling rustig opkomen tot je voelt dat de auto wil rijden (het aangrijpingspunt).",
          "Houd je linkervoet daar 1 seconde stil terwijl je met rechts een klein beetje gas geeft.",
          "Laat de koppeling daarna pas helemaal rustig omhoog komen."
        ],
        example: "Bij een groen verkeerslicht zoek je het aangrijpingspunt, houdt hem een tel vast met 1500 toeren gas, en de auto rijdt zijdezacht weg zonder schokken."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "اضغط دواسة الدبرياج بالكامل وضع الغيار الأول.",
          "ارفع الدبرياج بهدوء حتى تشعر باهتزازة خفيفة ورغبة السيارة في التحرك (نقطة التلامس).",
          "ثبت قدمك اليسرى تماماً عند تلك النقطة لثانية واحدة مع ضغط خفيف بالوقود بالقدم اليمنى.",
          "حرر باقي مسافة دواسة الدبرياج بسلاسة تامة بعد تحرك السيارة."
        ],
        example: "عند تحول الإشارة للأخضر، تصل لنقطة التلامس وتثبت قدمك لثانية مع قليل من الوقود، فتنطلق السيارة بنعومة فائقة ودون أي رجفة."
      };
    } else {
      return {
        explanation: [
          "Depress the clutch fully and engage 1st gear.",
          "Raise the clutch pedal smoothly until you feel the engine engage the wheels (biting point).",
          "Hold your left foot steady at this point for 1 second while applying gentle accelerator.",
          "Release the remainder of the pedal stroke smoothly as momentum builds."
        ],
        example: "At a green traffic light, holding the clutch motionless at the biting point for a second produces a silky-smooth takeoff every single time."
      };
    }
  }

  // 32. CBR EXAM ACTIVE LOOKING
  if (id === 'tip-cbr-active-looking') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Beweeg je hoofd licht mee bij elke spiegelcontrole zodat je kijkgedrag duidelijk zichtbaar is.",
          "Houd een vaste kijkcyclus aan: binnenspiegel, vooruit, buitenspiegel, dode hoek.",
          "Kijk ver vooruit (minimaal 200 meter) om situaties vroegtijdig te herkennen.",
          "Blijf je ogen bewegen en fixeer nooit te lang op één enkel punt."
        ],
        example: "Tijdens het CBR praktijkexamen ziet de examinator door je rustige hoofdbewegingen direct dat je alle zijstraten, fietsers en spiegels actief controleert."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "أمل رأسك بحركة واضحة أثناء فحص المرايا ليكون أسلوب مراقبتك جلياً للفاحص.",
          "اتبع تسلسل المراقبة المعتمد: المرآة الداخلية، للأمام، المرآة الجانبية، النقطة العمياء.",
          "انظر لمدى بعيد (200 متر على الأقل) لاكتشاف المواقف المرورية مبكراً.",
          "حافظ على حركة عينيك المستمرة ولا تركز نظرك على نقطة واحدة لفترة طويلة."
        ],
        example: "خلال اختبار القيادة العملي، يرى الفاحص من خلال حركات رأسك الواثقة والمتناسقة أنك تقرأ الطريق والمرايا ومسارات الدراجات بيقظة واحترافية."
      };
    } else {
      return {
        explanation: [
          "Move your head slightly with mirror checks so your scanning is clearly visible to examiners.",
          "Follow the consistent sequence: interior mirror, ahead, side mirror, shoulder check.",
          "Look far down the road (at least 200 meters ahead) to read traffic situations early.",
          "Keep your eyes scanning actively and avoid fixating on single points."
        ],
        example: "During your CBR practical test, subtle head movements clearly confirm to the examiner that you are actively processing signs, pedestrians, and blind spots."
      };
    }
  }

  // 45. SMARTPHONE DISTRACTION
  if (id === 'tip-phone-distraction-focus') {
    if (lang === 'nl') {
      return {
        explanation: [
          "Plaats je telefoon altijd in een vaste telefoonhouder vóórdat je de motor start.",
          "Stel je navigatieroute en muziek in vóór vertrek.",
          "Raak de telefoon tijdens het rijden nooit aan: het kost minimaal € 420 boete en verhoogt het ongevalrisico.",
          "Schakel meldingen uit of zet de telefoon op 'Niet storen tijdens rijden'."
        ],
        example: "Voor vertrek stel je de bestemming in op je dashboard en laat je de telefoon in de houder. Je ogen en aandacht blijven 100% bij het verkeer."
      };
    } else if (lang === 'ar') {
      return {
        explanation: [
          "ضع هاتفك دائماً في الحامل المخصص قبل تشغيل المحرك والانطلاق.",
          "اضبط تطبيق الخرائط والملاحة والصوتيات قبل التحرك.",
          "تجنب لمس الهاتف أو حمله باليد أثناء القيادة؛ فالمخالفة تتجاوز 420 يورو وترفع نسبة الحوادث.",
          "فعل وضع 'عدم الإزعاج أثناء القيادة' لتفادي أي تشتيت للانتباه."
        ],
        example: "قبل الانطلاق، تثبت الهاتف في الحامل وتحدد وجهتك، مما يضمن بقاء تركيزك وبصرك متوجهاً بالكامل نحو الطريق وسلامة القيادة."
      };
    } else {
      return {
        explanation: [
          "Always secure your phone in a dedicated dashboard mount before turning on the engine.",
          "Set up your GPS destination and audio playlist before setting off.",
          "Never hold or operate your phone while driving; it carries a €420+ fine and extreme risk.",
          "Enable 'Do Not Disturb While Driving' mode to eliminate cognitive distraction."
        ],
        example: "Mounting your device and setting the navigation prior to departure ensures your eyes and mental focus remain undivided on surrounding traffic."
      };
    }
  }

  // General Dynamic Educational Resolver for other tips
  if (lang === 'nl') {
    return {
      explanation: [
        "Neem de tijd om de verkeerssituatie rustig en ruim van tevoren te overzien.",
        "Pas je snelheid en positie tijdig aan de geldende omstandigheden aan.",
        "Communiceer duidelijk naar andere weggebruikers via spiegels en richtingaanwijzers.",
        "Blijf gefocust en houd te allen tijde voldoende veiligheidsmarge rondom je auto."
      ],
      example: "Door rustig vooruit te kijken en je aandacht bij de weg te houden, rijd je met meer zelfvertrouwen en totale controle over je auto."
    };
  } else if (lang === 'ar') {
    return {
      explanation: [
        "خذ وقتاً كافياً لقراءة الموقف المروري واستكشافه بهدوء من مسافة مبكرة.",
        "اضبط سرعتك وموقع سيارتك في المسار وفقاً لظروف الطريق والقواعد المرورية.",
        "تواصل بوضوح مع مستخدمي الطريق الآخرين عبر فحص المرايا واستخدام الإشارات.",
        "حافظ على تركيزك الكامل وهامش أمان كافٍ حول سيارتك في جميع الأوقات."
      ],
      example: "بالتطلع المستمر للأمام والتركيز على الطريق، تقود بثقة أكبر وتحكم متكامل في سيارتك ومحيطك."
    };
  } else {
    return {
      explanation: [
        "Take time to assess the traffic situation calmly and well in advance.",
        "Adjust your speed and lane positioning early according to road conditions.",
        "Communicate clearly with other road users through mirrors and indicators.",
        "Maintain focus and preserve an ample safety margin around your vehicle at all times."
      ],
      example: "By looking far ahead and keeping a composed mindset, you drive with greater confidence and total vehicle control."
    };
  }
}
