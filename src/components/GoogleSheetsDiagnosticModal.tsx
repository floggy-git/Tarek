import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, X, Shield, ExternalLink, Database, Layers } from 'lucide-react';
import { googleSignIn, getAccessToken } from '../services/googleAuthService';
import {
  runStrictDiagnosticConnectionTest,
  StrictDiagnosticReport,
  initializeSpreadsheetTabsAndHeaders,
  SpreadsheetVerificationReport
} from '../services/googleSheetsService';
import { getSheetsConfig } from '../utils/googleSheets';

interface GoogleSheetsDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export default function GoogleSheetsDiagnosticModal({
  isOpen,
  onClose,
  lang
}: GoogleSheetsDiagnosticModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [report, setReport] = useState<StrictDiagnosticReport | null>(null);
  const [initReport, setInitReport] = useState<SpreadsheetVerificationReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const config = getSheetsConfig();
  const targetSpreadsheetId = config.spreadsheetId || '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';

  const obtainToken = async () => {
    let token = await getAccessToken();
    if (!token) {
      const authRes = await googleSignIn();
      if (!authRes || !authRes.accessToken) {
        throw new Error('Google Sign-In was cancelled or failed to produce an OAuth token.');
      }
      token = authRes.accessToken;
      setIsAuthenticated(true);
      setAuthEmail(authRes.user.email);
    }
    return token;
  };

  const handleConnectAndDiagnose = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setReport(null);

    try {
      const token = await obtainToken();
      const res = await runStrictDiagnosticConnectionTest(targetSpreadsheetId, token);
      setReport(res);
    } catch (err: any) {
      console.error('Diagnostic error:', err);
      setErrorMsg(err.message || 'Unknown error during Google Sheets connection test.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleInitializeSchema = async () => {
    setIsInitializing(true);
    setErrorMsg(null);
    setInitReport(null);

    try {
      const token = await obtainToken();
      const res = await initializeSpreadsheetTabsAndHeaders(targetSpreadsheetId, token);
      setInitReport(res);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setErrorMsg(err.message || 'Failed to initialize spreadsheet schema.');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              GS
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Sheets Control Center & Production Schema
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Direct OAuth 2.0 Real Connection • 8 Operational Tabs • Verified Schemas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Target Spreadsheet Info Box */}
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-zinc-400 font-medium">Target Spreadsheet ID:</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 font-mono hover:underline flex items-center gap-1 text-[11px]"
              >
                {targetSpreadsheetId}
                <ExternalLink size={12} />
              </a>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-zinc-400">Calendar Scope Status:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">DISABLED (Zero Calendar Access)</span>
            </div>
            {authEmail && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span className="text-slate-500 dark:text-zinc-400">Authenticated Google Account:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{authEmail}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleInitializeSchema}
              disabled={isInitializing || isRunning}
              className="py-2.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isInitializing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Creating Tabs & Initializing...
                </>
              ) : (
                <>
                  <Database size={15} />
                  Initialize 8 Tabs & Official Packages
                </>
              )}
            </button>

            <button
              onClick={handleConnectAndDiagnose}
              disabled={isRunning || isInitializing}
              className="py-2.5 px-4 rounded-xl font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-zinc-700 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Running Diagnostic...
                </>
              ) : (
                <>
                  <Shield size={15} />
                  Re-Run Controlled Write Test
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-[11px]">Execution Failed:</div>
                <div className="text-[11px] font-mono leading-relaxed break-all">{errorMsg}</div>
              </div>
            </div>
          )}

          {/* Initialization Report Results */}
          {initReport && (
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                  <CheckCircle2 size={16} />
                  <span>Production Schema Initialized & Live Verified</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  LIVE API READ-BACK: PASS
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-emerald-200/40 dark:border-emerald-800/40">
                  <span className="text-slate-500 dark:text-zinc-400">Spreadsheet Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{initReport.spreadsheetTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-200/40 dark:border-emerald-800/40">
                  <span className="text-slate-500 dark:text-zinc-400">Tabs in Target Spreadsheet:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{initReport.allTabsAfter.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-200/40 dark:border-emerald-800/40">
                  <span className="text-slate-500 dark:text-zinc-400">Official Packages Verified:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {initReport.packagesVerifiedCount} packages verified in Packages tab
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-200/40 dark:border-emerald-800/40">
                  <span className="text-slate-500 dark:text-zinc-400">Demo/Student Data Written:</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">0 rows (Strictly preserved clean state)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-200/40 dark:border-emerald-800/40">
                  <span className="text-slate-500 dark:text-zinc-400">Google Calendar:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">DISABLED</span>
                </div>
              </div>

              {/* Verified Packages List */}
              {initReport.packagesRowsVerified && initReport.packagesRowsVerified.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Layers size={13} />
                    Verified Official Packages in Google Sheets:
                  </div>
                  <div className="space-y-1">
                    {initReport.packagesRowsVerified.map((pkg, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-emerald-900/60 text-[11px]"
                      >
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{pkg.id}</span>
                        <span className="font-medium text-slate-800 dark:text-zinc-200">{pkg.name}</span>
                        <span className="text-slate-500 dark:text-zinc-400">{pkg.hours}h</span>
                        <span className="font-bold text-slate-900 dark:text-white">€{pkg.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Headers Summary */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Verified Operational Tab Schemas ({Object.keys(initReport.headersVerified).length}/8 tabs):
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {Object.entries(initReport.headersVerified).map(([sheet, headers]) => (
                    <div key={sheet} className="p-1.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{sheet}:</span>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-zinc-400">
                        {Array.isArray(headers) ? (headers as string[]).join(' | ') : String(headers)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Report Results */}
          {report && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={16} />
                <span>Diagnostic Test Completed</span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-slate-500 dark:text-zinc-400">Spreadsheet ID:</span>
                  <span className="text-slate-800 dark:text-zinc-200">{report.spreadsheetId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-slate-500 dark:text-zinc-400">Spreadsheet Title:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100">{report.spreadsheetTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-slate-500 dark:text-zinc-400">Packages Tab Exists:</span>
                  <span className={`font-bold ${report.packagesTabExists ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {report.packagesTabExists ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-slate-500 dark:text-zinc-400">Write Test:</span>
                  <span className={`font-bold ${report.writeTest === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {report.writeTest}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-slate-500 dark:text-zinc-400">Read-Back Test:</span>
                  <span className={`font-bold ${report.readBackTest === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {report.readBackTest}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-slate-500 dark:text-zinc-400">Test Row Cleaned Up:</span>
                  <span className={`font-bold ${report.testRowRemoved ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {report.testRowRemoved ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              {/* Tabs list */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Active Tabs Returned from Google Sheets API ({report.tabsReturned.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.tabsReturned.map((tab, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono text-slate-700 dark:text-zinc-300"
                    >
                      {tab.title} (id: {tab.sheetId})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/30 flex items-center justify-between">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openAdminControlCenter'));
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Launch Admin Control Center</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
