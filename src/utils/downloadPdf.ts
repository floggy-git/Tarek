import type { jsPDF } from 'jspdf';
import type { Language } from '../types';

/** Reserve the iOS preview during the tap, before asynchronous font/PDF loading. */
export async function downloadPdf(create: () => Promise<jsPDF>, filename: string, lang: Language) {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const preview = ios ? window.open('', '_blank') : null;
  if (preview) {
    preview.document.title = filename;
    preview.document.body.textContent = lang === 'ar' ? 'جارٍ تجهيز ملف PDF…' : lang === 'nl' ? 'PDF wordt voorbereid…' : 'Preparing PDF…';
    preview.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
  try {
    const doc = await create();
    if (preview && !preview.closed) {
      const url = URL.createObjectURL(doc.output('blob'));
      preview.location.replace(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 300000);
    } else {
      await doc.save(filename, { returnPromise: true });
    }
  } catch (error) {
    preview?.close();
    console.error('PDF download failed', error);
    alert(lang === 'ar' ? 'تعذر تحميل PDF. يرجى المحاولة مجددًا.' : lang === 'nl' ? 'PDF downloaden mislukt. Probeer het opnieuw.' : 'PDF download failed. Please try again.');
  }
}
