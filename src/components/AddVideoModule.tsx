import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Link, Video, Trash2, RefreshCw, X, AlertCircle, CheckCircle2, Film } from 'lucide-react';
import { getSheetsConfig, uploadVideoToGoogleDrive } from '../utils/googleSheets';
import { DEFAULT_VIDEO_THUMBNAIL } from '../data';
import { saveLocalVideoBlob, getRealVideoFileDuration } from '../utils/localVideoStore';
import { detectSourceLanguage, fetchDynamicTranslation } from '../utils/imageTranslation';

interface AddVideoModuleProps {
  lang: 'en' | 'nl' | 'ar';
  onSave: (newVideo: any) => void;
  onCancel: () => void;
}

export interface ParsedVideoUrl {
  isValid: boolean;
  provider: 'youtube' | 'vimeo' | 'direct' | 'drive' | 'unknown';
  embedUrl: string;
  directUrl: string;
  error?: string;
}

export function parseVideoUrl(inputUrl: string): ParsedVideoUrl {
  const url = inputUrl.trim();
  if (!url) {
    return { isValid: false, provider: 'unknown', embedUrl: '', directUrl: '', error: '' };
  }

  try {
    // 1. YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/')[1];
        videoId = parts ? parts.split('?')[0].split('/')[0] : '';
      } else if (url.includes('youtube.com/embed/')) {
        const parts = url.split('youtube.com/embed/')[1];
        videoId = parts ? parts.split('?')[0].split('/')[0] : '';
      } else if (url.includes('youtube.com/shorts/')) {
        const parts = url.split('youtube.com/shorts/')[1];
        videoId = parts ? parts.split('?')[0].split('/')[0] : '';
      }

      if (videoId && /^[a-zA-Z0-9_-]{5,}$/.test(videoId)) {
        return {
          isValid: true,
          provider: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
          directUrl: url
        };
      }
      return { isValid: false, provider: 'youtube', embedUrl: '', directUrl: '', error: 'Invalid YouTube link format.' };
    }

    // 2. Vimeo
    if (url.includes('vimeo.com')) {
      let videoId = '';
      const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
      if (match && match[3]) {
        videoId = match[3];
      } else if (url.includes('player.vimeo.com/video/')) {
        const parts = url.split('player.vimeo.com/video/')[1];
        videoId = parts ? parts.split('?')[0].split('/')[0] : '';
      }

      if (videoId) {
        return {
          isValid: true,
          provider: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          directUrl: url
        };
      }
      return { isValid: false, provider: 'vimeo', embedUrl: '', directUrl: '', error: 'Invalid Vimeo link format.' };
    }

    // 3. Google Drive
    if (url.includes('drive.google.com')) {
      const parts = url.split('/file/d/');
      if (parts.length > 1) {
        const fileId = parts[1].split('?')[0].split('/')[0];
        if (fileId) {
          return {
            isValid: true,
            provider: 'drive',
            embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
            directUrl: url
          };
        }
      }
    }

    // 4. Direct video link (MP4, WebM, MOV, M4V, OGG, blob, data) or HTTP(S) video URL
    if (
      url.startsWith('blob:') ||
      url.startsWith('data:video/') ||
      /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) ||
      /^https?:\/\//i.test(url)
    ) {
      return {
        isValid: true,
        provider: 'direct',
        embedUrl: url,
        directUrl: url
      };
    }

    return {
      isValid: false,
      provider: 'unknown',
      embedUrl: '',
      directUrl: '',
      error: 'Unable to play this video link. Please check the URL.'
    };
  } catch {
    return {
      isValid: false,
      provider: 'unknown',
      embedUrl: '',
      directUrl: '',
      error: 'Unable to play this video link. Please check the URL.'
    };
  }
}

export const AddVideoModule: React.FC<AddVideoModuleProps> = ({
  lang,
  onSave,
  onCancel
}) => {
  // Source Selection: 'file' | 'url'
  const [sourceOption, setSourceOption] = useState<'file' | 'url'>('file');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileObjectUrl, setFileObjectUrl] = useState<string>('');

  // Video URL State
  const [rawVideoUrl, setRawVideoUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [language, setLanguage] = useState<string>('all');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Uploading / Saving State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string>('');
  const pickerTriggerTimeRef = useRef<number>(0);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Trigger file picker with timing start
  const triggerFilePicker = () => {
    pickerTriggerTimeRef.current = performance.now();
    console.log('[VideoUpload] File picker opened at:', pickerTriggerTimeRef.current);
    fileInputRef.current?.click();
  };

  // Handle Local File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReceivedTime = performance.now();
    const pickerDuration = pickerTriggerTimeRef.current > 0
      ? fileReceivedTime - pickerTriggerTimeRef.current
      : 0;

    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`[VideoUpload] STAGE 1 - File object received by JS: ${fileReceivedTime.toFixed(1)} ms`);
    console.log(`[VideoUpload] Time in OS/Browser File Picker: ${pickerDuration.toFixed(1)} ms`);
    console.log(`[VideoUpload] Selected file metadata: name=${file.name}, size=${(file.size / (1024 * 1024)).toFixed(2)} MB, type=${file.type}`);

    // Revoke previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    // Instant local object URL
    const urlCreateStart = performance.now();
    const newUrl = URL.createObjectURL(file);
    const urlCreateEnd = performance.now();
    objectUrlRef.current = newUrl;

    console.log(`[VideoUpload] STAGE 2 - URL.createObjectURL created in ${(urlCreateEnd - urlCreateStart).toFixed(2)} ms`);

    setSelectedFile(file);
    setFileObjectUrl(newUrl);
    setSaveError(null);

    // Reset file input value to allow re-selecting same file if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  // Handle Remove / Reset Selected Video
  const handleRemoveVideo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
    setSelectedFile(null);
    setFileObjectUrl('');
    setRawVideoUrl('');
    setUrlError(null);
    setSaveError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Parsed video URL info
  const parsedUrl = sourceOption === 'url' ? parseVideoUrl(rawVideoUrl) : null;

  // Active Video Preview Source
  const activePreviewUrl = sourceOption === 'file' ? fileObjectUrl : (parsedUrl?.isValid ? parsedUrl.embedUrl : '');
  const isDirectVideoPreview = sourceOption === 'file' || (parsedUrl?.isValid && parsedUrl.provider === 'direct');

  // Handle Form Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Validation
    if (sourceOption === 'file' && !selectedFile) {
      setSaveError(
        lang === 'ar'
          ? 'يرجى اختيار ملف فيديو من جهازك'
          : lang === 'nl'
          ? 'Selecteer een videobestand op uw apparaat'
          : 'Please select a video file from your device'
      );
      return;
    }

    if (sourceOption === 'url') {
      if (!rawVideoUrl.trim()) {
        setUrlError(
          lang === 'ar'
            ? 'يرجى إدخال رابط الفيديو'
            : lang === 'nl'
            ? 'Voer een video URL in'
            : 'Please enter a video URL'
        );
        return;
      }

      if (!parsedUrl || !parsedUrl.isValid) {
        const err =
          parsedUrl?.error ||
          (lang === 'ar'
            ? 'تعذر تشغيل رابط الفيديو هذا. يرجى التحقق من الرابط.'
            : lang === 'nl'
            ? 'Kan deze videolink niet afspelen. Controleer de URL.'
            : 'Unable to play this video link. Please check the URL.');
        setUrlError(err);
        return;
      }
    }

    const finalTitle =
      title.trim() ||
      (lang === 'ar' ? 'فيديو تعليمي' : lang === 'nl' ? 'Instructie video' : 'Instructional Video');
    const finalDesc = description.trim();

    let finalVideoUrl = sourceOption === 'url' ? rawVideoUrl.trim() : fileObjectUrl;
    let driveFileId = '';

    // Upload to Google Drive if Drive token is configured; otherwise use instant local reference
    if (sourceOption === 'file') {
      if (!selectedFile) {
        setSaveError(
          lang === 'ar'
            ? 'يرجى اختيار ملف فيديو من جهازك'
            : lang === 'nl'
            ? 'Selecteer een videobestand op uw apparaat'
            : 'Please select a video file from your device'
        );
        return;
      }

      const config = getSheetsConfig();
      if (config.accessToken) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          const fileExt = selectedFile.name.split('.').pop() || 'mp4';
          const filename = `${finalTitle.replace(/[^a-zA-Z0-9_\- ]/g, '')}_${Date.now()}.${fileExt}`;

          const uploadResult = await uploadVideoToGoogleDrive(
            config.accessToken,
            selectedFile,
            filename,
            selectedFile.type || 'video/mp4',
            (progress) => setUploadProgress(progress)
          );

          driveFileId = uploadResult.fileId;
          finalVideoUrl = `https://lh3.googleusercontent.com/d/${driveFileId}`;
          setUploadProgress(100);
        } catch (err: any) {
          console.warn('Google Drive video upload warning (using local video reference):', err);
          finalVideoUrl = fileObjectUrl;
        } finally {
          setIsUploading(false);
        }
      } else {
        // Google Drive is not connected yet (Phase 1 local testing) -> use instant local video URL
        finalVideoUrl = fileObjectUrl;
      }
    }

    const newVideoId = `custom-vid-${Date.now()}`;

    // Persist local file to IndexedDB for cross-session/cross-component retrieval
    if (sourceOption === 'file' && selectedFile) {
      saveLocalVideoBlob(newVideoId, selectedFile);
    }

    const parsedInfo = sourceOption === 'url' ? parseVideoUrl(finalVideoUrl) : null;
    const embedUrlToSave =
      sourceOption === 'url'
        ? parsedInfo?.embedUrl || finalVideoUrl
        : finalVideoUrl;

    const srcLang = detectSourceLanguage(finalTitle || finalDesc || '');

    let detectedDuration = '';
    if (sourceOption === 'file' && selectedFile) {
      detectedDuration = await getRealVideoFileDuration(selectedFile);
    } else if (sourceOption === 'url' && finalVideoUrl && !parsedInfo?.provider) {
      detectedDuration = await getRealVideoFileDuration(finalVideoUrl);
    }

    const newVideo = {
      id: newVideoId,
      type: 'video',
      sourceType: sourceOption === 'file' ? 'UPLOAD_FILE' : 'EXTERNAL_URL',
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
      url: finalVideoUrl,
      videoUrl: finalVideoUrl,
      embedUrl: embedUrlToSave,
      thumbnail: DEFAULT_VIDEO_THUMBNAIL,
      driveFileId,
      driveShareUrl: driveFileId ? `https://lh3.googleusercontent.com/d/${driveFileId}` : '',
      provider: sourceOption === 'file' ? (driveFileId ? 'drive' : 'local') : (parsedInfo?.provider || 'direct'),
      category,
      contentLanguage: language || srcLang,
      isEnabled,
      isMissingFromDrive: false,
      isDeletedByTrainer: false,
      duration: detectedDuration || '',
      createdAt: new Date().toISOString()
    };

    if (finalTitle) {
      fetchDynamicTranslation(finalTitle, true);
    }
    if (finalDesc) {
      fetchDynamicTranslation(finalDesc, false);
    }

    // Keep object URL active in app state by detaching ref before unmount
    objectUrlRef.current = '';

    onSave(newVideo);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl">
            <Film className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {lang === 'ar' ? 'إضافة فيديو جديد' : lang === 'nl' ? 'Nieuwe Video Toevoegen' : 'Add Video'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {lang === 'ar'
                ? 'قم بتحميل فيديو من جهازك أو إضافة رابط فيديو من منصة خارجية'
                : lang === 'nl'
                ? 'Upload een video vanaf uw apparaat of voeg een videolink toe'
                : 'Upload a video from your device or paste a video URL'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Source Options Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {lang === 'ar' ? 'مصدر الفيديو' : lang === 'nl' ? 'Videobron' : 'Video Source'}
          </label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-zinc-800/60 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSourceOption('file');
                setUrlError(null);
                setSaveError(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                sourceOption === 'file'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>
                {lang === 'ar' ? 'تحميل من الهاتف' : lang === 'nl' ? 'Uploaden vanaf Telefoon' : 'Upload from Phone'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceOption('url');
                setUrlError(null);
                setSaveError(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                sourceOption === 'url'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Link className="h-4 w-4" />
              <span>
                {lang === 'ar' ? 'رابط الفيديو' : lang === 'nl' ? 'Video URL' : 'Video URL'}
              </span>
            </button>
          </div>
        </div>

        {/* Source Inputs */}
        {sourceOption === 'file' ? (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={triggerFilePicker}
                className="border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-zinc-950/30 hover:bg-blue-50/30 transition group space-y-3"
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm">
                    {lang === 'ar'
                      ? 'اضغط لاختيار فيديو من جهازك'
                      : lang === 'nl'
                      ? 'Klik om een videobestand te kiezen'
                      : 'Click or tap to choose a video file'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'يدعم صيغ MP4, MOV, M4V, WebM'
                      : lang === 'nl'
                      ? 'Ondersteunt MP4, MOV, M4V, WebM'
                      : 'Supports MP4, MOV, M4V, WebM'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
              {lang === 'ar' ? 'رابط الفيديو' : lang === 'nl' ? 'Video URL' : 'Video URL'}
            </label>
            <div className="relative">
              <input
                type="url"
                value={rawVideoUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setRawVideoUrl(val);
                  setUrlError(null);
                  setSaveError(null);
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition ${
                  urlError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-200 dark:border-zinc-800 focus:ring-blue-500'
                }`}
              />
            </div>

            {urlError && (
              <div className="flex items-center gap-2 text-xs text-red-500 font-medium pt-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}

            {parsedUrl?.isValid && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="capitalize">
                  {lang === 'ar'
                    ? `رابط مدعوم (${parsedUrl.provider})`
                    : lang === 'nl'
                    ? `Ondersteunde link (${parsedUrl.provider})`
                    : `Supported video link (${parsedUrl.provider})`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Video Preview Block */}
        {activePreviewUrl && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                {lang === 'ar' ? 'معاينة الفيديو' : lang === 'nl' ? 'Video Preview' : 'Video Preview'}
              </span>
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  {lang === 'ar' ? 'إزالة الفيديو' : lang === 'nl' ? 'Video verwijderen' : 'Remove Video'}
                </span>
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-800">
              {isDirectVideoPreview ? (
                <video
                  src={activePreviewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const now = performance.now();
                    const duration = e.currentTarget.duration;
                    console.log(`[VideoUpload] STAGE 3 - Video metadata loaded in ${now.toFixed(1)} ms. Video duration: ${duration.toFixed(2)}s`);
                  }}
                  onLoadedData={() => {
                    const now = performance.now();
                    console.log(`[VideoUpload] STAGE 4 - First video frame available in ${now.toFixed(1)} ms`);
                  }}
                  onCanPlay={() => {
                    const now = performance.now();
                    console.log(`[VideoUpload] STAGE 5 - Video ready for playback in ${now.toFixed(1)} ms`);
                  }}
                  className="w-full max-h-80 object-contain bg-black"
                />
              ) : (
                <iframe
                  src={activePreviewUrl}
                  className="w-full h-72 border-0 bg-black"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Video Preview"
                />
              )}
            </div>
          </div>
        )}

        {/* Video Information Metadata */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
          {/* Video Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              {lang === 'ar' ? 'عنوان الفيديو' : lang === 'nl' ? 'Video Titel' : 'Video Title'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'مثال: درس الركن الموازي بالتفصيل'
                  : lang === 'nl'
                  ? 'bv. Fileparkeren instructieles'
                  : 'e.g., Parallel Parking Tutorial'
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Video Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              {lang === 'ar' ? 'وصف الفيديو' : lang === 'nl' ? 'Video Beschrijving' : 'Video Description'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'اكتب شرحاً أو نصائح مفيدة لطلابك حول هذا الفيديو...'
                  : lang === 'nl'
                  ? 'Geef een korte toelichting of tips voor uw studenten...'
                  : 'Provide brief instructions or key takeaways for your students...'
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          {/* Category & Content Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                {lang === 'ar' ? 'الفئة' : lang === 'nl' ? 'Categorie' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="General">
                  {lang === 'ar' ? 'عام' : lang === 'nl' ? 'Algemeen' : 'General'}
                </option>
                <option value="Traffic Rules">
                  {lang === 'ar' ? 'قواعد المرور' : lang === 'nl' ? 'Verkeersregels' : 'Traffic Rules'}
                </option>
                <option value="Parking">
                  {lang === 'ar' ? 'الركن والاصطفاف' : lang === 'nl' ? 'Parkeren' : 'Parking'}
                </option>
                <option value="Highway">
                  {lang === 'ar' ? 'الطريق السريع' : lang === 'nl' ? 'Snelweg' : 'Highway'}
                </option>
                <option value="Maneuvers">
                  {lang === 'ar' ? 'المناورات' : lang === 'nl' ? 'Bijzondere verrichtingen' : 'Maneuvers'}
                </option>
                <option value="Safety">
                  {lang === 'ar' ? 'السلامة والأمان' : lang === 'nl' ? 'Veiligheid' : 'Safety'}
                </option>
                <option value="Exam Prep">
                  {lang === 'ar' ? 'تحضير الامتحان' : lang === 'nl' ? 'Examenvoorbereiding' : 'Exam Prep'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                {lang === 'ar' ? 'لغة المحتوى' : lang === 'nl' ? 'Taal van inhoud' : 'Content Language'}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="all">
                  {lang === 'ar' ? 'جميع اللغات' : lang === 'nl' ? 'Alle talen' : 'All Languages'}
                </option>
                <option value="nl">Nederlands</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
            <div>
              <p className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                {lang === 'ar'
                  ? 'نشر في بوابة الطلاب'
                  : lang === 'nl'
                  ? 'Publiceren in Studentenportaal'
                  : 'Publish in Student Portal'}
              </p>
              <p className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? 'جعل هذا الفيديو مرئياً للطلاب فوراً'
                  : lang === 'nl'
                  ? 'Maak deze video direct zichtbaar voor studenten'
                  : 'Make this video visible to students immediately'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>
                {lang === 'ar'
                  ? 'جاري تحميل الفيديو إلى Google Drive...'
                  : lang === 'nl'
                  ? 'Video uploaden naar Google Drive...'
                  : 'Uploading video to Google Drive...'}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-blue-200 dark:bg-blue-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Save Error Display */}
        {saveError && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Form Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
          >
            {lang === 'ar' ? 'إلغاء' : lang === 'nl' ? 'Annuleren' : 'Cancel'}
          </button>

          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading && <RefreshCw className="h-4 w-4 animate-spin" />}
            <span>
              {lang === 'ar' ? 'حفظ الفيديو' : lang === 'nl' ? 'Video Opslaan' : 'Save Video'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
