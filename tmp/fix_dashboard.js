const fs = require('fs');
const file = './src/components/TrainerDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the marker line
const marker = 'className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer"';
const markerIndex = content.indexOf(marker);
if (markerIndex === -1) {
  console.log("Marker not found");
  process.exit(1);
}

// Find "Basic Video Trimming Section"
const endMarker = '{/* Basic Video Trimming Section */}';
const endIndex = content.indexOf(endMarker);
if (endIndex === -1) {
  console.log("End marker not found");
  process.exit(1);
}

// Find the ") : (" just before the marker
const openBraceIndex = content.lastIndexOf(') : (', markerIndex);
if (openBraceIndex === -1) {
  console.log("Open brace not found");
  process.exit(1);
}

const before = content.substring(0, openBraceIndex);
const after = content.substring(endIndex);

const replacement = `) : (
                                 <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-4 space-y-4 shadow-sm text-center">
                                   <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                     <Check className="h-5 w-5" />
                                   </div>
                                   <div className="space-y-1">
                                     <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                                       {lang === 'ar' ? 'تم تسجيل الفيديو بنجاح!' : 'Video Masterclass Captured!'}
                                     </h4>
                                     <p className="text-[11px] text-emerald-600">
                                       {lang === 'ar' ? 'التسجيل محفوظ ومؤمن محلياً وجاهز للحفظ في مكتبتك التعليمية.' : 'Your educational masterclass is locked in, locally cached, and ready to be uploaded.'}
                                     </p>
                                   </div>

                                   <div className="pt-2 border-t border-emerald-200/50 flex flex-col gap-2">
                                     <button
                                       type="button"
                                       onClick={handleResetCameraSession}
                                       className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow transition"
                                     >
                                       <RefreshCw className="h-3.5 w-3.5" />
                                       <span>{lang === 'ar' ? 'تسجيل كليب جديد' : 'Record Another Clip'}</span>
                                     </button>
                                     <button
                                       type="button"
                                       onClick={cancelCameraRecording}
                                       className="w-full py-2 border border-slate-300 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 rounded-xl text-xs font-bold cursor-pointer transition"
                                     >
                                       {lang === 'ar' ? 'مسح الحالي' : 'Clear Current'}
                                     </button>
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       )}

                       `;

fs.writeFileSync(file, before + replacement + after, 'utf8');
console.log("Successfully replaced!");
