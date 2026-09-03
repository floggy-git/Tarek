import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit2,
  CheckCircle2,
  X,
  Save,
  Tag,
  Clock,
  Sparkles
} from 'lucide-react';
import { DrivePackage } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { syncPackagesFromSheet, writePackagesToSheet } from '../../services/googleSheetsService';

interface AdminPackagesViewProps {
  lang: AdminLang;
  packages: DrivePackage[];
  setPackages: React.Dispatch<React.SetStateAction<DrivePackage[]>>;
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminPackagesView({
  lang,
  packages,
  setPackages,
  spreadsheetId,
  onShowMessage
}: AdminPackagesViewProps) {
  const [selectedPkg, setSelectedPkg] = useState<DrivePackage | null>(null);
  const [isNewPkg, setIsNewPkg] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [featuresInput, setFeaturesInput] = useState('');

  const t = ADMIN_I18N[lang];

  const handleOpenEdit = (pkg: DrivePackage) => {
    setSelectedPkg({ ...pkg });
    setIsNewPkg(false);
    setFeaturesInput((pkg.features || []).join('\n'));
  };

  const handleOpenNew = () => {
    const nextNum = packages.length + 1;
    const nextId = `PKG-${String(nextNum).padStart(6, '0')}`;
    setSelectedPkg({
      id: nextId,
      name: `Special Driving Package ${nextNum}`,
      description: 'Comprehensive driving package tailored for rapid CBR success.',
      hours: 20,
      price: 1200,
      discountPrice: 1100,
      badge: 'Special Offer',
      popular: false,
      recommended: false,
      colorTheme: 'classic-blue',
      displayOrder: nextNum,
      isActive: true,
      features: [
        'Personal dedicated instructor',
        'Theory exam training materials',
        'Official CBR practical exam booking'
      ]
    });
    setIsNewPkg(true);
    setFeaturesInput(
      'Personal dedicated instructor\nTheory exam training materials\nOfficial CBR practical exam booking'
    );
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    const parsedFeatures = featuresInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const finalPkg: DrivePackage = {
      ...selectedPkg,
      features: parsedFeatures
    };

    let updatedPackages: DrivePackage[];
    if (isNewPkg) {
      updatedPackages = [...packages, finalPkg].sort((a, b) => a.displayOrder - b.displayOrder);
    } else {
      updatedPackages = packages
        .map(p => (p.id === finalPkg.id ? finalPkg : p))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }

    setPackages(updatedPackages);
    try {
      localStorage.setItem('drivingschool_packages', JSON.stringify(updatedPackages));
    } catch (e) {
      console.error('Storage error:', e);
    }

    await recordAdminAuditLog({
      action: isNewPkg ? 'Package Created' : 'Package Updated',
      targetRecord: `Package ID: ${finalPkg.id} (${finalPkg.name})`,
      previousValue: 'None',
      newValue: `${finalPkg.hours}h - €${finalPkg.price}, Active: ${finalPkg.isActive}`,
      changedBy: 'Admin Control Center',
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? `تم حفظ الباقة ${finalPkg.name} بنجاح`
        : `Package ${finalPkg.name} saved successfully.`
    );
    setSelectedPkg(null);
  };

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPackagesFromSheet(spreadsheetId);
      if (res.success && res.data) {
        setPackages(res.data);
        localStorage.setItem('drivingschool_packages', JSON.stringify(res.data));
        await recordAdminAuditLog({
          action: 'Packages Synced from Sheet',
          targetRecord: 'Tab: Packages',
          newValue: `${res.data.length} packages imported`,
          source: 'Google Sheets'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم جلب ${res.data.length} باقة من Google Sheets`
            : `Pulled ${res.data.length} packages from Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to sync packages.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing packages.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await writePackagesToSheet(spreadsheetId, packages);
      if (res.success) {
        await recordAdminAuditLog({
          action: 'Packages Pushed to Sheet',
          targetRecord: 'Tab: Packages',
          newValue: `${packages.length} packages written`,
          source: 'Control Center'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم تصدير ${packages.length} باقة إلى Google Sheets بنجاح`
            : `Pushed ${packages.length} packages to Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to write packages.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error writing packages.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
        <div>
          <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {lang === 'ar' ? 'إدارة كتالوج باقات القيادة' : 'Driving Packages Catalog'}
          </h5>
          <p className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? 'تعديل الساعات والأسعار والمميزات والخصومات المعروضة للمتدربين'
              : 'Control package hours, pricing, discounts, badges & student visibility'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePullFromSheet}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowDownToLine size={14} />
            <span>{t.actions.syncFromSheet}</span>
          </button>

          <button
            onClick={handlePushToSheet}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowUpFromLine size={14} />
            <span>{t.actions.syncToSheet}</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>{lang === 'ar' ? 'إضافة باقة جديدة' : 'Add Package'}</span>
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map(pkg => (
          <div
            key={pkg.id}
            className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
              pkg.isActive
                ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-xs'
                : 'bg-slate-50 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-800 opacity-75'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400">
                  {pkg.id}
                </span>
                <div className="flex items-center gap-1">
                  {pkg.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {pkg.badge}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <h6 className="font-bold text-sm text-slate-900 dark:text-white">{pkg.name}</h6>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{pkg.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  €{pkg.price}
                </span>
                {pkg.discountPrice && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    Save €{pkg.price - pkg.discountPrice}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium ml-auto flex items-center gap-1">
                  <Clock size={12} />
                  {pkg.hours} hrs
                </span>
              </div>

              {pkg.features && pkg.features.length > 0 && (
                <ul className="space-y-1 pt-2 text-[11px] text-slate-600 dark:text-zinc-400">
                  {pkg.features.slice(0, 3).map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                  {pkg.features.length > 3 && (
                    <li className="text-[10px] text-slate-400 font-semibold">
                      +{pkg.features.length - 3} more features
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => handleOpenEdit(pkg)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>{t.actions.edit}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / New Package Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package size={16} className="text-teal-600" />
                <span>
                  {isNewPkg ? (lang === 'ar' ? 'إضافة باقة جديدة' : 'Add New Package') : `Edit: ${selectedPkg.name}`}
                </span>
              </h5>
              <button
                onClick={() => setSelectedPkg(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Package ID</label>
                  <input
                    type="text"
                    disabled
                    value={selectedPkg.id}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono font-bold text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={selectedPkg.displayOrder}
                    onChange={e => setSelectedPkg({ ...selectedPkg, displayOrder: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={selectedPkg.name}
                  onChange={e => setSelectedPkg({ ...selectedPkg, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={selectedPkg.description}
                  onChange={e => setSelectedPkg({ ...selectedPkg, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Hours</label>
                  <input
                    type="number"
                    required
                    value={selectedPkg.hours}
                    onChange={e => setSelectedPkg({ ...selectedPkg, hours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Price (€)</label>
                  <input
                    type="number"
                    required
                    value={selectedPkg.price}
                    onChange={e => setSelectedPkg({ ...selectedPkg, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Discount Price (€)</label>
                  <input
                    type="number"
                    value={selectedPkg.discountPrice || ''}
                    onChange={e => setSelectedPkg({ ...selectedPkg, discountPrice: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Most Popular"
                    value={selectedPkg.badge || ''}
                    onChange={e => setSelectedPkg({ ...selectedPkg, badge: e.target.value || undefined })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedPkg.isActive}
                      onChange={e => setSelectedPkg({ ...selectedPkg, isActive: e.target.checked })}
                      className="accent-teal-600 rounded"
                    />
                    <span>Is Active</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedPkg.popular || false}
                      onChange={e => setSelectedPkg({ ...selectedPkg, popular: e.target.checked })}
                      className="accent-amber-600 rounded"
                    />
                    <span>Popular</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Included Features (1 per line)</label>
                <textarea
                  rows={3}
                  value={featuresInput}
                  onChange={e => setFeaturesInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPkg(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  <span>{t.actions.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
