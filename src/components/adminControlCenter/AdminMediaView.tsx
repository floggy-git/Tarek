import React, { useState } from 'react';
import {
  Film,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Edit2,
  CheckCircle2,
  X,
  Save,
  Play
} from 'lucide-react';
import { MediaVideo } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';

interface AdminMediaViewProps {
  lang: AdminLang;
  mediaVideos: MediaVideo[];
  setMediaVideos: React.Dispatch<React.SetStateAction<MediaVideo[]>>;
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminMediaView({
  lang,
  mediaVideos,
  setMediaVideos,
  spreadsheetId,
  onShowMessage
}: AdminMediaViewProps) {
  const [selectedVideo, setSelectedVideo] = useState<MediaVideo | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = ADMIN_I18N[lang];

  const filtered = mediaVideos.filter(v => {
    const q = searchQuery.toLowerCase();
    return (
      (v.title || '').toLowerCase().includes(q) ||
      (v.titleAr || '').toLowerCase().includes(q) ||
      (v.category || '').toLowerCase().includes(q)
    );
  });

  const handleOpenEdit = (v: MediaVideo) => {
    setSelectedVideo({ ...v });
    setIsNew(false);
  };

  const handleOpenNew = () => {
    const nextNum = mediaVideos.length + 1;
    setSelectedVideo({
      id: `VID-${String(nextNum).padStart(3, '0')}`,
      title: 'Priority Rules at Dutch Roundabouts',
      titleAr: 'قواعد الأولوية عند الدوارات الهولندية',
      titleNl: 'Voorrangsregels op Nederlandse rotondes',
      category: 'Traffic Rules',
      duration: '06:45',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isEnabled: true,
      displayOrder: nextNum
    });
    setIsNew(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo) return;

    let updated: MediaVideo[];
    if (isNew) {
      updated = [...mediaVideos, selectedVideo];
    } else {
      updated = mediaVideos.map(v => (v.id === selectedVideo.id ? selectedVideo : v));
    }

    setMediaVideos(updated);
    try {
      localStorage.setItem('drivingschool_media_videos', JSON.stringify(updated));
    } catch (e) {
      console.error('Storage error:', e);
    }

    await recordAdminAuditLog({
      action: isNew ? 'Media Video Created' : 'Media Video Updated',
      targetRecord: `Video: ${selectedVideo.title}`,
      newValue: `Category: ${selectedVideo.category}, Active: ${selectedVideo.isEnabled !== false}`,
      changedBy: 'Admin Control Center',
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar' ? 'تم حفظ الفيديو التعليمي بنجاح' : 'Educational video saved successfully.'
    );
    setSelectedVideo(null);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={t.actions.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>{lang === 'ar' ? 'إضافة فيديو تعليمي' : 'Add Video'}</span>
        </button>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(v => (
          <div
            key={v.id}
            className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-orange-600 dark:text-orange-400">
                  {v.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  {v.category || 'General'}
                </span>
              </div>

              <div>
                <h6 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{v.title}</h6>
                {v.titleAr && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" dir="rtl">
                    {v.titleAr}
                  </p>
                )}
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span>Duration: {v.duration || '05:00'}</span>
                {v.url && (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                  >
                    <span>Watch</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => handleOpenEdit(v)}
                className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {t.actions.edit}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / New Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Film size={16} className="text-orange-600" />
                <span>{isNew ? 'Add Video' : `Edit: ${selectedVideo.id}`}</span>
              </h5>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Title (English / Default)</label>
                <input
                  type="text"
                  required
                  value={selectedVideo.title}
                  onChange={e => setSelectedVideo({ ...selectedVideo, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={selectedVideo.titleAr || ''}
                  onChange={e => setSelectedVideo({ ...selectedVideo, titleAr: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                  <input
                    type="text"
                    value={selectedVideo.category || ''}
                    onChange={e => setSelectedVideo({ ...selectedVideo, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:30"
                    value={selectedVideo.duration || ''}
                    onChange={e => setSelectedVideo({ ...selectedVideo, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Video or Drive URL</label>
                <input
                  type="url"
                  value={selectedVideo.url || ''}
                  onChange={e => setSelectedVideo({ ...selectedVideo, url: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
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
