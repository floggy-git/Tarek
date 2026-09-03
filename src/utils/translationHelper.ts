import { WalletTransaction } from '../types';

/**
 * Dynamically localizes transaction descriptions based on the currently selected language.
 */
export function getLocalTxDesc(item: WalletTransaction, lang: 'en' | 'ar' | 'nl'): string {
  const desc = item.description || '';
  
  // 1. Initial Starting Balance
  if (desc.includes("Initial Starting Balance") || desc.includes("رصيد البداية") || desc.includes("Initieel beginsaldo")) {
    const pkgMatch = desc.match(/\(([^)]+)\)/);
    const pkg = pkgMatch ? pkgMatch[1] : '';
    if (lang === 'ar') {
      return `رصيد البداية - شراء باقة التدريب ${pkg ? `(${pkg})` : ''}`;
    } else if (lang === 'nl') {
      return `Initieel beginsaldo - Pakketaankoop ${pkg ? `(${pkg})` : ''}`;
    } else {
      return `Initial Starting Balance - Package Purchase ${pkg ? `(${pkg})` : ''}`;
    }
  }

  // 2. Driving Lesson fee / Payment for Completed Lesson
  if (
    desc.includes("Driving Lesson fee") || 
    desc.includes("Payment for Completed Lesson") || 
    desc.includes("دفع درس قيادة") || 
    desc.includes("دفع مقابل درس مكتمل") ||
    desc.includes("Rijlestarief") ||
    desc.includes("Betaling voor voltooide les")
  ) {
    const dateMatch = desc.match(/\((\d{4}-\d{2}-\d{2})\)/);
    const date = dateMatch ? dateMatch[1] : '';
    const isWallet = desc.toLowerCase().includes("wallet") || desc.includes("المحفظة");
    const isCash = desc.toLowerCase().includes("cash") || desc.includes("كاش") || desc.toLowerCase().includes("contant");
    const isTransfer = desc.toLowerCase().includes("transfer") || desc.includes("تحويل") || desc.toLowerCase().includes("overschrijving");
    const isCard = desc.toLowerCase().includes("card") || desc.includes("بطاقة") || desc.toLowerCase().includes("betaalpas");

    const methodAr = isWallet ? 'المحفظة' : isCash ? 'كاش (نقدي)' : isTransfer ? 'تحويل بنكي' : 'بطاقة الدفع';
    const methodNl = isWallet ? 'Wallet' : isCash ? 'Contant' : isTransfer ? 'Bankoverschrijving' : 'Betaalpas';
    const methodEn = isWallet ? 'Wallet' : isCash ? 'Cash' : isTransfer ? 'Bank Transfer' : 'Card';

    const lMatch = desc.match(/\((l\d+)\)/);
    const lessonId = lMatch ? lMatch[1] : '';

    if (lang === 'ar') {
      return lessonId 
        ? `دفع مقابل درس مكتمل (${lessonId})`
        : `دفع درس قيادة (${date}) - طريقة الدفع: ${methodAr}`;
    } else if (lang === 'nl') {
      return lessonId
        ? `Betaling voor voltooide les (${lessonId})`
        : `Rijlestarief (${date}) - Betaalmethode: ${methodNl}`;
    } else {
      return lessonId
        ? `Payment for Completed Lesson (${lessonId})`
        : `Driving Lesson fee (${date}) - Method: ${methodEn}`;
    }
  }

  // 3. Direct deposit for lesson
  if (desc.includes("Direct deposit for lesson") || desc.includes("إيداع فوري للدرس") || desc.includes("Directe storting voor les")) {
    const dateMatch = desc.match(/\((\d{4}-\d{2}-\d{2})\)/);
    const date = dateMatch ? dateMatch[1] : '';
    const isWallet = desc.toLowerCase().includes("wallet") || desc.includes("المحفظة");
    const isCash = desc.toLowerCase().includes("cash") || desc.includes("كاش") || desc.toLowerCase().includes("contant");
    const isTransfer = desc.toLowerCase().includes("transfer") || desc.includes("تحويل") || desc.toLowerCase().includes("overschrijving");
    const isCard = desc.toLowerCase().includes("card") || desc.includes("بطاقة") || desc.toLowerCase().includes("betaalpas");

    const methodAr = isWallet ? 'المحفظة' : isCash ? 'كاش (نقدي)' : isTransfer ? 'تحويل بنكي' : 'بطاقة الدفع';
    const methodNl = isWallet ? 'Wallet' : isCash ? 'Contant' : isTransfer ? 'Bankoverschrijving' : 'Betaalpas';
    const methodEn = isWallet ? 'Wallet' : isCash ? 'Cash' : isTransfer ? 'Bank Transfer' : 'Card';

    if (lang === 'ar') {
      return `إيداع فوري للدرس (${date}) - طريقة الدفع: ${methodAr}`;
    } else if (lang === 'nl') {
      return `Directe storting voor les (${date}) - Betaalmethode: ${methodNl}`;
    } else {
      return `Direct deposit for lesson (${date}) - Method: ${methodEn}`;
    }
  }

  // 4. iDEAL Bank Transfer
  if (desc.includes("iDEAL Bank Transfer") || desc.includes("تحويل مصرفي عبر iDEAL") || desc.toLowerCase().includes("ideal")) {
    if (lang === 'ar') {
      return "تحويل مصرفي عبر iDEAL (بوابة المتدرب)";
    } else if (lang === 'nl') {
      return "iDEAL bankoverschrijving (Studentenportal)";
    } else {
      return "iDEAL Bank Transfer (Student Portal)";
    }
  }

  // 5. Mastercard Credit Deposit
  if (desc.includes("Mastercard Credit Deposit") || desc.includes("إيداع ائتماني عبر ماستركارد") || desc.toLowerCase().includes("mastercard")) {
    if (lang === 'ar') {
      return "إيداع ائتماني عبر ماستركارد";
    } else if (lang === 'nl') {
      return "Mastercard Credit Storting";
    } else {
      return "Mastercard Credit Deposit";
    }
  }

  // 6. Theory Mock Test Bundle Access
  if (desc.includes("Theory Mock Test Bundle Access") || desc.includes("شراء باقة نماذج اختبارات النظرية") || desc.includes("theorie proefexamens")) {
    if (lang === 'ar') {
      return "شراء باقة نماذج اختبارات النظرية";
    } else if (lang === 'nl') {
      return "Toegang tot theorie proefexamens-pakket";
    } else {
      return "Theory Mock Test Bundle Access";
    }
  }

  // 7. Manual Cash Deposit
  if (desc.includes("Manual Cash Deposit") || desc.includes("إيداع نقدي يدوي") || desc.includes("Handmatige contante storting")) {
    if (lang === 'ar') {
      return `إيداع نقدي يدوي بواسطة المدرب`;
    } else if (lang === 'nl') {
      return `Handmatige contante storting door instructeur`;
    } else {
      return `Manual Cash Deposit by Instructor`;
    }
  }

  // 8. Driving Lesson Cost Deduction
  if (desc.includes("Driving Lesson Cost Deduction") || desc.includes("خصم تكلفة درس تدريبي") || desc.includes("Kosten rijles afgeschreven")) {
    if (lang === 'ar') {
      return `خصم تكلفة درس تدريبي`;
    } else if (lang === 'nl') {
      return `Kosten rijles afgeschreven`;
    } else {
      return `Driving Lesson Cost Deduction`;
    }
  }

  // 9. Manual Wallet Balance Adjustment
  if (desc.includes("Manual Wallet Balance Adjustment") || desc.includes("تعديل رصيد المحفظة يدوياً") || desc.includes("Handmatige correctie saldo wallet")) {
    if (lang === 'ar') {
      return `تعديل رصيد المحفظة يدوياً`;
    } else if (lang === 'nl') {
      return `Handmatige correctie saldo wallet`;
    } else {
      return `Manual Wallet Balance Adjustment`;
    }
  }

  return desc;
}
