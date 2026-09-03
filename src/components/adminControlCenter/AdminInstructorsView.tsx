import React, { useState } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Car,
  Euro,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2
} from 'lucide-react';
import { SchoolSettings } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';

interface AdminInstructorsViewProps {
  lang: AdminLang;
  schoolSettings: Partial<SchoolSettings> | null;
  setSchoolSettings: React.Dispatch<React.SetStateAction<Partial<SchoolSettings> | null>>;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminInstructorsView({
  lang,
  schoolSettings,
  setSchoolSettings,
  onShowMessage
}: AdminInstructorsViewProps) {
  const [instructorName, setInstructorName] = useState(schoolSettings?.instructorName || 'Samir El-Filali');
  const [instructorPhone, setInstructorPhone] = useState(schoolSettings?.phone || '+31 6 12345678');
  const [instructorEmail, setInstructorEmail] = useState(schoolSettings?.email || 'samir@alandalos.nl');
  const [primaryVehicle, setPrimaryVehicle] = useState(schoolSettings?.primaryVehicle || 'Volkswagen Golf VIII 2.0 TDI');
  const [hourlyRate, setHourlyRate] = useState(schoolSettings?.lessonPricePerHour || 65);
  const [workingDays, setWorkingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]);
  const [workStartTime, setWorkStartTime] = useState('08:30');
  const [workEndTime, setWorkEndTime] = useState('18:30');
  const [maxStudents, setMaxStudents] = useState(25);
  const [isActive, setIsActive] = useState(true);

  const t = ADMIN_I18N[lang];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveInstructorSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: Partial<SchoolSettings> = {
      ...(schoolSettings || {}),
      instructorName,
      phone: instructorPhone,
      email: instructorEmail,
      primaryVehicle,
      lessonPricePerHour: hourlyRate
    };

    setSchoolSettings(updatedSettings);
    try {
      localStorage.setItem('drivingschool_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.error('Storage error:', e);
    }

    await recordAdminAuditLog({
      action: 'Instructor Profile Updated',
      targetRecord: `Instructor: ${instructorName}`,
      previousValue: `Vehicle: ${schoolSettings?.primaryVehicle || 'None'}, Rate: €${schoolSettings?.lessonPricePerHour || 65}`,
      newValue: `Vehicle: ${primaryVehicle}, Rate: €${hourlyRate}/h, Days: ${workingDays.join(', ')}`,
      changedBy: 'Admin Control Center',
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? `تم حفظ بيانات وإعدادات المدرب ${instructorName} بنجاح`
        : `Instructor ${instructorName} profile and schedule saved successfully.`
    );
  };

  return (
    <div className="space-y-4">
      {/* Overview Header */}
      <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck size={16} className="text-cyan-600" />
            <span>{lang === 'ar' ? 'إدارة المدربين وأوقات العمل والأسطول' : 'Instructor Profiles & Availability'}</span>
          </h5>
          <p className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? 'تحديد أوقات عمل المدرب، السيارة المخصصة، الحد الأقصى للمتدربين، وسعر الساعة'
              : 'Configure instructor working days, assigned vehicles, hourly rates & capacity limits'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveInstructorSettings} className="space-y-4">
        {/* Main Instructor Card */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white font-black text-base flex items-center justify-center shadow-md">
                SE
              </div>
              <div>
                <h6 className="font-bold text-sm text-slate-900 dark:text-white">{instructorName}</h6>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'ar' ? 'المدرب المعتمد ورئيس التدريب' : 'Head Instructor & Authorized CBR Trainer'}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 font-bold text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="accent-cyan-600 rounded"
              />
              <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                {isActive ? 'Active Duty' : 'On Leave'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={instructorName}
                onChange={e => setInstructorName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Contact Phone</label>
              <input
                type="text"
                value={instructorPhone}
                onChange={e => setInstructorPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                value={instructorEmail}
                onChange={e => setInstructorEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Assigned Vehicle</label>
              <div className="relative">
                <Car className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  value={primaryVehicle}
                  onChange={e => setPrimaryVehicle(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Hourly Lesson Rate (€)</label>
              <div className="relative">
                <Euro className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Max Concurrent Students</label>
              <input
                type="number"
                value={maxStudents}
                onChange={e => setMaxStudents(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
              />
            </div>
          </div>

          {/* Working Days & Schedule */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-3">
            <h6 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar size={14} className="text-cyan-600" />
              <span>{lang === 'ar' ? 'أيام وساعات العمل المعتمدة' : 'Weekly Availability & Schedule'}</span>
            </h6>

            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => {
                const isSelected = workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm text-xs pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Daily Start Time</label>
                <input
                  type="time"
                  value={workStartTime}
                  onChange={e => setWorkStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Daily End Time</label>
                <input
                  type="time"
                  value={workEndTime}
                  onChange={e => setWorkEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save size={14} />
            <span>{t.actions.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
