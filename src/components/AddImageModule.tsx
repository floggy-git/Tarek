import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Trash2, RefreshCw } from 'lucide-react';
import { getSheetsConfig, uploadVideoToGoogleDrive } from '../utils/googleSheets';
import { translateTextToAllLanguages, detectSourceLanguage, fetchDynamicTranslation } from '../utils/imageTranslation';

interface AddImageModuleProps {
  lang: 'en' | 'nl' | 'ar';
  onSave: (newImage: any) => void;
  onCancel: () => void;
}

export const AddImageModule: React.FC<AddImageModuleProps> = ({
  lang,
  onSave,
  onCancel
}) => {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Single Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [language, setLanguage] = useState<string>('all');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Upload States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Image File Selection - PRESERVE ORIGINAL RESOLUTION & FORMAT
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Read exact uncompressed original file as DataURL (no resizing, no compression, no format changes)
    const reader = new FileReader();
    reader.onloadend = () => {
      const rawBase64 = reader.result as string;
      setImageUrl(rawBase64);
    };
    reader.readAsDataURL(file);

    // Filter out UUIDs, random hashes, and default camera filenames
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const isUuidOrHash =
      /^[0-9a-f]{8}[-0-9a-f]*$/i.test(fileNameWithoutExt) ||
      /^[0-9a-f]{12,}$/i.test(fileNameWithoutExt) ||
      /^IMG_\d+$/i.test(fileNameWithoutExt) ||
      /^[A-[0-9a-zA-Z]{6,}-[0-9a-zA-Z]{4,}/i.test(fileNameWithoutExt) ||
      /^[0-9A-F]{6,}-[0-9A-F]{4,}/i.test(fileNameWithoutExt);

    if (!title && !isUuidOrHash) {
      const formattedName = fileNameWithoutExt.replace(/[-_]/g, ' ').trim();
      if (formattedName) {
        setTitle(formattedName.charAt(0).toUpperCase() + formattedName.slice(1));
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    const finalTitle = title.trim() || (lang === 'ar' ? 'صورة تعليمية' : lang === 'nl' ? 'Instructie afbeelding' : 'Instructional Image');
    const finalDesc = description.trim();
    let finalUrl = imageUrl;
    let driveFileId = '';
    let driveShareUrl = '';

    // Upload to Google Drive if access token exists
    if (selectedFile) {
      const config = getSheetsConfig();
      if (config.accessToken) {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
          const fileExt = selectedFile.type?.split('/')?.[1] || 'png';
          const filename = `${finalTitle}_${Date.now()}.${fileExt}`;

          const uploadResult = await uploadVideoToGoogleDrive(
            config.accessToken,
            selectedFile,
            filename,
            selectedFile.type || 'image/png',
            (progress) => setUploadProgress(progress)
          );

          driveFileId = uploadResult.fileId;
          driveShareUrl = uploadResult.shareUrl;
          finalUrl = uploadResult.shareUrl;
          setUploadProgress(100);
        } catch (err: any) {
          console.warn('Google Drive Image Upload failed, using base64 URL:', err);
          setUploadError(err.message || 'Upload error');
        } finally {
          setIsUploading(false);
        }
      }
    }

    const srcLang = detectSourceLanguage(finalTitle || finalDesc || '');

    const imageObj = {
      id: `custom-img-${Date.now()}`,
      type: 'image',
      title: finalTitle,
      description: finalDesc,
      originalTitle: finalTitle,
      originalDescription: finalDesc,
      rawTitle: finalTitle,
      rawDesc: finalDesc,
      titleAr: srcLang === 'ar' ? finalTitle : undefined,
      titleEn: srcLang === 'en' ? finalTitle : undefined,
      titleNl: srcLang === 'nl' ? finalTitle : undefined,
      descriptionAr: srcLang === 'ar' ? finalDesc : undefined,
      descriptionEn: srcLang === 'en' ? finalDesc : undefined,
      descriptionNl: srcLang === 'nl' ? finalDesc : undefined,
      category: category || 'General',
      url: finalUrl,
      thumbnail: finalUrl || imageUrl,
      duration: '',
      isEnabled,
      language: language || srcLang || 'all',
      driveFileId,
      driveShareUrl,
      isMissingFromDrive: false,
      isDeletedByTrainer: false
    };

    if (finalTitle) {
      fetchDynamicTranslation(finalTitle, true);
    }
    if (finalDesc) {
      fetchDynamicTranslation(finalDesc, false);
    }

    onSave(imageObj);
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
              {lang === 'ar' ? 'إضافة صورة تعليمية جديدة' : lang === 'nl' ? 'Nieuwe Afbeelding Toevoegen' : 'Add New Instructional Image'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {lang === 'ar' ? 'اختر صورة من جهازك لتظهر لطلابك' : lang === 'nl' ? 'Kies een afbeelding van je apparaat' : 'Select an image file from your device to share with students'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!imageUrl ? (
        /* Choice / Drop Zone */
        <div className="py-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group w-full p-8 bg-slate-50 hover:bg-slate-100/90 dark:bg-zinc-850/60 dark:hover:bg-zinc-850 border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl transition-all cursor-pointer flex flex-col items-center text-center space-y-3 shadow-xs hover:shadow-md active:scale-98"
          >
            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">
                {lang === 'ar' ? 'اختر صورة' : lang === 'nl' ? 'Afbeelding Selecteren' : 'Select Image'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                {lang === 'ar' ? 'يدعم PNG, JPG, WEBP من الصور أو الملفات' : lang === 'nl' ? 'Ondersteunt PNG, JPG, WEBP uit galerij of bestanden' : 'Supports PNG, JPG, WEBP from Photos or Files'}
              </div>
            </div>
          </button>
        </div>
      ) : (
        /* Image Form & Metadata */
        <form onSubmit={handleSave} className="space-y-6">
          {/* Action Bar & Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? 'معاينة الصورة' : lang === 'nl' ? 'Afbeeldingsvoorbeeld' : 'Image Preview'}
              </span>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border border-rose-200/60 dark:border-rose-900/50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'إزالة الصورة' : lang === 'nl' ? 'Verwijder afbeelding' : 'Remove Image'}</span>
              </button>
            </div>

            <div className="relative bg-slate-900 rounded-3xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-md max-h-72 flex items-center justify-center p-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-64 object-contain rounded-2xl"
              />
            </div>
          </div>

          {/* Form Metadata */}
          <div className="space-y-4 pt-2 border-t border-slate-150 dark:border-zinc-800">
            {/* Single Image Title */}
            <div className="space-y-1">
              <label className="block text-slate-700 dark:text-zinc-300 font-extrabold text-xs">
                {lang === 'ar' ? 'عنوان الصورة' : lang === 'nl' ? 'Afbeelding titel' : 'Image Title'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: قيادة الطرق السريعة' : lang === 'nl' ? 'bijv. Snelweg rijden' : 'e.g. Highway Driving'}
                className="w-full h-11 text-xs font-semibold px-4 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Single Description (Optional) */}
            <div className="space-y-1">
              <label className="block text-slate-700 dark:text-zinc-300 font-extrabold text-xs">
                {lang === 'ar' ? 'الوصف (اختياري)' : lang === 'nl' ? 'Beschrijving (optioneel)' : 'Description (optional)'}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل وصفاً توضيحياً...' : lang === 'nl' ? 'Voer een optionele beschrijving in...' : 'Enter an optional description...'}
                className="w-full text-xs font-semibold p-3.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="block text-slate-700 dark:text-zinc-300 font-extrabold text-xs">
                  {lang === 'ar' ? 'الفئة' : lang === 'nl' ? 'Categorie' : 'CBR Category'}
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-11 text-xs font-semibold px-3.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Highway">Highway (Snelweg)</option>
                  <option value="Parking">Parking (Parkeren)</option>
                  <option value="Roundabout">Roundabout (Rotonde)</option>
                  <option value="Mirrors">Mirrors (Kijktechniek)</option>
                  <option value="Speed">Speed (Snelheid)</option>
                  <option value="Special Maneuvers">Special Maneuvers</option>
                  <option value="Theory">Theory (Theorie)</option>
                  <option value="General">General (Algemeen)</option>
                </select>
              </div>

              {/* Content Language */}
              <div className="space-y-1">
                <label className="block text-slate-700 dark:text-zinc-300 font-extrabold text-xs">
                  {lang === 'ar' ? 'لغة المحتوى' : lang === 'nl' ? 'Inhoudstaal' : 'Content Language'}
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full h-11 text-xs font-semibold px-3.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All Languages</option>
                  <option value="ar">العربية</option>
                  <option value="nl">Nederlands</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                  isEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? 'تفعيل في بوابة الطلاب' : lang === 'nl' ? 'Publiceren in studentenportaal' : 'Publish in Student Portal'}
              </span>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                    <span>{lang === 'ar' ? 'جاري رفع الصورة...' : lang === 'nl' ? 'Afbeelding uploaden...' : 'Uploading image...'}</span>
                  </div>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-150 dark:border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 px-5 font-bold text-xs border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isUploading || !imageUrl}
              className="h-10 px-6 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md shadow-blue-500/10 transition cursor-pointer disabled:opacity-50"
            >
              {lang === 'ar' ? 'حفظ الصورة' : lang === 'nl' ? 'Afbeelding Opslaan' : 'Save Image'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddImageModule;
