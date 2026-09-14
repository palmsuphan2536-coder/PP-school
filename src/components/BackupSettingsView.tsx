import React, { useState, useEffect } from 'react';
import { 
  Settings, School, Cloud, Database, 
  Download, Upload, RefreshCw, CheckCircle2, 
  AlertTriangle, FileSpreadsheet, ExternalLink,
  ShieldCheck, Check, ArrowUpRight, Sparkles, UserCheck, Calendar
} from 'lucide-react';
import { 
  SchoolInfo, AcademicYear, Term, GradingRule, BackupLog,
  Student, Subject, SubjectGradingSummary, AttendanceRecord, Teacher, Classroom, UserAccount
} from '../types';
import { 
  exportDatabaseSnapshotJSON, 
  importDatabaseSnapshotJSON, 
  resetToDefaultData,
  addBackupLog
} from '../services/storageService';
import {
  backupToGoogleSheets,
  getStoredBackupInfo,
  getLinkedEmail,
  DEFAULT_LINKED_EMAIL,
  GoogleBackupInfo,
  fetchAppStateFromGoogleSheets
} from '../services/googleSheetsService';
import { SchoolLogoUploader } from './SchoolLogoUploader';
import { AcademicYearManager } from './AcademicYearManager';

interface BackupSettingsViewProps {
  schoolInfo: SchoolInfo;
  students?: Student[];
  subjects?: Subject[];
  subjectGradings?: SubjectGradingSummary[];
  attendanceRecords?: AttendanceRecord[];
  teachers?: Teacher[];
  classrooms?: Classroom[];
  academicYears: AcademicYear[];
  terms: Term[];
  gradingRules: GradingRule[];
  backupLogs: BackupLog[];
  userAccounts?: UserAccount[];
  onUpdateSchoolInfo: (info: SchoolInfo) => void;
  onUpdateGradingRules: (rules: GradingRule[]) => void;
  onRefreshData: () => void;
  initialTab?: 'google-sheets' | 'academic-years' | 'school' | 'grading';
  selectedYearId?: string;
  selectedTermId?: string;
  onAddAcademicYear?: (year: number, makeCurrent: boolean) => void;
  onSetCurrentAcademicYear?: (yearId: string) => void;
  onSelectYear?: (yearId: string) => void;
  onSelectTerm?: (termId: string) => void;
  onToggleTermClosed?: (termId: string) => void;
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = ({
  schoolInfo,
  students = [],
  subjects = [],
  subjectGradings = [],
  attendanceRecords = [],
  teachers = [],
  classrooms = [],
  academicYears = [],
  terms = [],
  gradingRules = [],
  backupLogs = [],
  userAccounts = [],
  onUpdateSchoolInfo,
  onUpdateGradingRules,
  onRefreshData,
  initialTab = 'google-sheets',
  selectedYearId = '',
  selectedTermId = '',
  onAddAcademicYear,
  onSetCurrentAcademicYear,
  onSelectYear,
  onSelectTerm,
  onToggleTermClosed,
}) => {
  const [activeTab, setActiveTab] = useState<'google-sheets' | 'academic-years' | 'school' | 'grading'>(initialTab);
  const [infoForm, setInfoForm] = useState<SchoolInfo>({ ...schoolInfo });
  const [rulesForm, setRulesForm] = useState<GradingRule[]>([...gradingRules]);
  
  // Google Sheets Direct Backup States
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupInfo, setBackupInfo] = useState<GoogleBackupInfo | null>(() => getStoredBackupInfo());
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState<string | null>(null);
  const linkedEmail = getLinkedEmail();

  useEffect(() => {
    setInfoForm({ ...schoolInfo });
  }, [schoolInfo]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolInfo(infoForm);
    alert('บันทึกข้อมูลสถานศึกษาและตราโรงเรียนเรียบร้อยแล้ว');
  };

  const handleSaveGradingRules = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGradingRules(rulesForm);
    alert('บันทึกเกณฑ์การตัดเกรดเรียบร้อยแล้ว');
  };

  // 1-Click Direct Backup to Google Sheets (linked with email rst72010045@gmail.com)
  const handleDirectGoogleSheetsBackup = async (forceNewSpreadsheet: boolean = false) => {
    setIsBackingUp(true);
    setBackupSuccessMsg(null);
    setBackupErrorMsg(null);

    try {
      const targetSpreadsheetId = forceNewSpreadsheet ? undefined : backupInfo?.spreadsheetId;
      const res = await backupToGoogleSheets(
        {
          schoolInfo,
          students,
          subjects,
          subjectGradings,
          attendanceRecords,
          teachers,
          classrooms,
          academicYears,
          terms,
          userAccounts
        },
        linkedEmail,
        targetSpreadsheetId
      );

      setBackupInfo(res);
      setBackupSuccessMsg(`สำรองข้อมูลทั้งหมดลง Google Sheets สำเร็จ! บันทึกครบทั้ง 7 ชีต (รวมชีตรหัสผ่านและผู้ดูแลระบบ super admin) เรียบร้อยแล้ว`);
      
      // Add entry to backup history log
      addBackupLog({
        id: 'log-' + Date.now(),
        type: 'Google Sheets & Drive',
        destination: `Google Sheets (${linkedEmail})`,
        fileSize: `${res.itemCount} รายการ`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      onRefreshData();
    } catch (err: any) {
      console.error('Google Sheets backup error:', err);
      setBackupErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อและสำรองข้อมูล Google Sheets');
    } finally {
      setIsBackingUp(false);
    }
  };

  const [isSyncingDown, setIsSyncingDown] = useState<boolean>(false);

  // Fetch / Pull data directly from Google Sheets
  const handleSyncFromGoogleSheets = async () => {
    setIsSyncingDown(true);
    setBackupSuccessMsg(null);
    setBackupErrorMsg(null);

    try {
      const partialState = await fetchAppStateFromGoogleSheets(backupInfo?.spreadsheetId, linkedEmail);
      if (!partialState) {
        throw new Error('ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ หรือไม่พบสเปรดชีต');
      }

      // Merge into local storage or state
      const current = {
        schoolInfo,
        academicYears,
        terms,
        gradingRules,
        classrooms,
        subjects,
        teachers,
        students,
        subjectGradings,
        attendanceRecords,
        backupLogs,
        userAccounts
      };

      const merged = {
        ...current,
        ...partialState
      };

      localStorage.setItem('WATRAT_PP5_DB_V1', JSON.stringify(merged));
      setBackupSuccessMsg('ดึงข้อมูลล่าสุดจาก Google Sheets มาใช้ในระบบเรียบร้อยแล้ว!');
      onRefreshData();
    } catch (err: any) {
      console.error('Fetch from Google Sheets error:', err);
      setBackupErrorMsg(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets');
    } finally {
      setIsSyncingDown(false);
    }
  };

  // Local JSON Backup File Download
  const handleExportJSON = () => {
    exportDatabaseSnapshotJSON();
  };

  // Local JSON File Restore
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const success = importDatabaseSnapshotJSON(content);
          if (success) {
            alert('นำเข้าและกู้คืนข้อมูลสำเร็จ ระบบจะรีเฟรชข้อมูล');
            onRefreshData();
          } else {
            alert('ไฟล์ข้อมูลไม่ถูกต้องหรือรูปแบบไม่ตรงกับระบบ');
          }
        } catch (err) {
          alert('เกิดข้อผิดพลาดในการนำเข้าไฟล์');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-5 font-prompt">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Settings className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {activeTab === 'google-sheets' ? 'สำรองข้อมูลบน Google Sheets & Google Drive' : 'ตั้งค่าระบบและการจัดการข้อมูล'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ระบบจัดการ ปพ.5 ออนไลน์ โรงเรียนวัดราษฎร์ศรัทธาธรรม พร้อมการเชื่อมต่อและสำรองข้อมูล Google Sheets อัตโนมัติ
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('google-sheets')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'google-sheets' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs font-bold' 
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>สำรองข้อมูล Google Sheets & Drive (อัตโนมัติ)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('academic-years')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'academic-years' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-2xs font-bold' 
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>จัดการปีการศึกษา & ภาคเรียน (เพิ่มได้เรื่อยๆ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('school')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'school' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-2xs font-bold' 
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <School className="w-4 h-4 text-indigo-600" />
            <span>ข้อมูลสถานศึกษา & ตราโรงเรียน & ลายมือชื่อ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grading')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'grading' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-2xs font-bold' 
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>เกณฑ์การตัดเกรด (Grading Scale)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Google Sheets & Drive Direct Backup */}
      {activeTab === 'google-sheets' && (
        <div className="space-y-5">
          {/* Linked Account & Status Card */}
          <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ระบบสำรองข้อมูลอัตโนมัติ (Direct Google Sheets API)</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  เชื่อมโยงกับบัญชี Google ของคุณโดยตรง
                </h3>
                <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
                  ระบบจะจัดการสร้างและอัปเดตสเปรดชีตใน Google Sheets และ Google Drive ของคุณโดยอัตโนมัติ 
                  <b>โดยที่คุณไม่ต้องสร้างหรือจัดการโค้ดหลังบ้าน Google Apps Script เอง</b> ข้อมูลทั้งหมดจะถูกเชื่อมโยงกับอีเมลนี้
                </p>
              </div>

              {/* Email Badge */}
              <div className="bg-white/10 backdrop-blur border border-white/15 p-3.5 rounded-xl text-left shrink-0">
                <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">บัญชี Google ที่เชื่อมโยง</div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5 font-mono">
                  <span>{linkedEmail}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>สถานะ: พร้อมเชื่อมต่อและสำรองข้อมูล</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleDirectGoogleSheetsBackup(false)}
                disabled={isBackingUp}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isBackingUp ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                )}
                <span>
                  {isBackingUp ? 'กำลังสร้างและบันทึกลง Google Sheets...' : 'สำรองข้อมูลทั้งหมดลง Google Sheets ทันที (1-Click)'}
                </span>
              </button>

              {backupInfo?.spreadsheetUrl && (
                <button
                  type="button"
                  onClick={() => handleDirectGoogleSheetsBackup(true)}
                  disabled={isBackingUp}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition flex items-center gap-1.5 border border-white/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>สร้างไฟล์สเปรดชีตใหม่</span>
                </button>
              )}
            </div>

            {/* Feedback Messages */}
            {backupSuccessMsg && (
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{backupSuccessMsg}</span>
              </div>
            )}

            {backupErrorMsg && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{backupErrorMsg}</span>
              </div>
            )}
          </div>

          {/* Active Backup Spreadsheet Info Card */}
          {backupInfo?.spreadsheetUrl && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {backupInfo.title || 'สำรองข้อมูล ปพ.5 - โรงเรียนวัดราษฎร์ศรัทธาธรรม'}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      เชื่อมโยงสำเร็จ
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    อัปเดตล่าสุด: {new Date(backupInfo.lastBackupTime).toLocaleString('th-TH')} • รวมทั้งหมด {backupInfo.itemCount} รายการ
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Spreadsheet ID: {backupInfo.spreadsheetId}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={handleSyncFromGoogleSheets}
                  disabled={isSyncingDown}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 border border-emerald-700 shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDown ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDown ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุดจาก Google Sheets'}</span>
                </button>

                <a
                  href={backupInfo.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition flex items-center gap-1.5 border border-indigo-200"
                >
                  <span>เปิดดูสเปรดชีต</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* 7 Sheets Structure Info Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>โครงสร้างชีตสำรองข้อมูลใน Google Sheets (7 ชีต)</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                พร้อมระบบจัดการรหัสผ่าน
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>
                  <div className="font-bold text-slate-800">1_ข้อมูลสถานศึกษา_ภาพรวม</div>
                  <div className="text-[11px] text-slate-500">ข้อมูลพื้นฐานโรงเรียน สังกัด ที่อยู่ ผู้บริหาร และยอดสรุปรวม</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>
                  <div className="font-bold text-slate-800">2_ทะเบียนนักเรียน</div>
                  <div className="text-[11px] text-slate-500">รายชื่อนักเรียน เลขประจำตัว เลขที่ เพศ ชั้นเรียน และเบอร์ติดต่อ</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <div>
                  <div className="font-bold text-slate-800">3_รายวิชา</div>
                  <div className="text-[11px] text-slate-500">รหัสวิชา ชื่อวิชา กลุ่มสาระ หน่วยกิต และชั่วโมงเรียน</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
                <div>
                  <div className="font-bold text-slate-800">4_คะแนนและผลการเรียน</div>
                  <div className="text-[11px] text-slate-500">คะแนนเก็บ กลางภาค ปลายภาค รวม เกรด และผลการตัดสิน ปพ.5</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">5</span>
                <div>
                  <div className="font-bold text-slate-800">5_เวลาเรียน</div>
                  <div className="text-[11px] text-slate-500">สถิติการมาเรียน ขาด ลา ป่วย สาย และร้อยละเวลาเรียน</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">6</span>
                <div>
                  <div className="font-bold text-slate-800">6_ครูและบุคลากร</div>
                  <div className="text-[11px] text-slate-500">รายชื่อครู ตำแหน่ง กลุ่มสาระ และข้อมูลการติดต่อ</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 md:col-span-2 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">7</span>
                <div className="flex-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-2">
                    <span>7_บัญชีผู้ใช้และรหัสผ่าน</span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">Super Admin: admin / admin</span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    จัดเก็บชื่อผู้ใช้งาน รหัสผ่าน ระดับสิทธิ์ (Super Admin, วิชาการ, ครูประจำชั้น, ครูผู้สอน) และสถานะบัญชี
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Local JSON Backup / Restore section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>สำรองและกู้คืนไฟล์ในเครื่องคอมพิวเตอร์ (Local JSON Backup)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล (.json)</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  ดาวน์โหลดข้อมูลทั้งหมดของโรงเรียน (นักเรียน, คะแนน, เวลาเรียน, ปพ.5) ไว้ในคอมพิวเตอร์ของคุณ
                </p>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs"
                >
                  ดาวน์โหลดไฟล์สำรอง
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>กู้คืนข้อมูลจากไฟล์ (.json)</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  เลือกไฟล์สำรองข้อมูล JSON ที่เคยดาวน์โหลดไว้เพื่อนำเข้าข้อมูลกลับสู่ระบบ
                </p>
                <label className="inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer">
                  <span>เลือกไฟล์เพื่อกู้คืน</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Backup History Log Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">ประวัติการสำรองข้อมูล (Backup History)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">วัน-เวลา</th>
                    <th className="py-2.5 px-3">ประเภท</th>
                    <th className="py-2.5 px-3">ปลายทาง</th>
                    <th className="py-2.5 px-3">ขนาดข้อมูล</th>
                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backupLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-slate-700 font-medium">
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{log.type}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{log.destination}</td>
                      <td className="py-2 px-3 text-slate-600">{log.fileSize}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          สำเร็จ
                        </span>
                      </td>
                    </tr>
                  ))}
                  {backupLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        ยังไม่มีประวัติการสำรองข้อมูล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Academic Years & Terms Management (Add years continuously while keeping historical data) */}
      {activeTab === 'academic-years' && (
        <AcademicYearManager
          academicYears={academicYears}
          terms={terms}
          selectedYearId={selectedYearId}
          selectedTermId={selectedTermId}
          onAddAcademicYear={onAddAcademicYear || (() => {})}
          onSetCurrentAcademicYear={onSetCurrentAcademicYear || (() => {})}
          onSelectYear={onSelectYear || (() => {})}
          onSelectTerm={onSelectTerm || (() => {})}
          onToggleTermClosed={onToggleTermClosed}
        />
      )}

      {/* TAB 3: School Info, Logo & Signatures */}
      {activeTab === 'school' && (
        <form onSubmit={handleSaveSchoolInfo} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              ข้อมูลสถานศึกษา ตราโรงเรียน และลายมือชื่อสำหรับหัวเอกสาร ปพ.5
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              ข้อมูลนี้จะถูกนำไปพิมพ์บนหัวเอกสาร ปพ.5 หน้าปก ใบลงนาม และแถบเมนูหลักของระบบ
            </p>
          </div>

          {/* School Logo Upload Section */}
          <SchoolLogoUploader
            logoUrl={infoForm.logoUrl}
            schoolName={infoForm.name}
            onLogoChange={(url) => setInfoForm(prev => ({ ...prev, logoUrl: url }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ชื่อสถานศึกษา</label>
              <input
                type="text"
                required
                value={infoForm.name}
                onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">สังกัด</label>
              <input
                type="text"
                value={infoForm.affiliation}
                onChange={(e) => setInfoForm({ ...infoForm, affiliation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ตำบล/แขวง</label>
              <input
                type="text"
                value={infoForm.subdistrict}
                onChange={(e) => setInfoForm({ ...infoForm, subdistrict: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">อำเภอ/เขต</label>
              <input
                type="text"
                value={infoForm.district}
                onChange={(e) => setInfoForm({ ...infoForm, district: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">จังหวัด</label>
              <input
                type="text"
                value={infoForm.province}
                onChange={(e) => setInfoForm({ ...infoForm, province: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">รหัสไปรษณีย์</label>
              <input
                type="text"
                value={infoForm.postalCode}
                onChange={(e) => setInfoForm({ ...infoForm, postalCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ชื่อผู้อำนวยการสถานศึกษา (สำหรับลงนาม ปพ.5)
              </label>
              <input
                type="text"
                value={infoForm.directorName}
                onChange={(e) => setInfoForm({ ...infoForm, directorName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ชื่อหัวหน้างานวิชาการ (สำหรับลงนาม ปพ.5)
              </label>
              <input
                type="text"
                value={infoForm.academicHeadName}
                onChange={(e) => setInfoForm({ ...infoForm, academicHeadName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
            >
              บันทึกข้อมูลสถานศึกษาและตราโรงเรียน
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Grading Rules */}
      {activeTab === 'grading' && (
        <form onSubmit={handleSaveGradingRules} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            เกณฑ์ช่วงคะแนนสำหรับการตัดเกรดมาตรฐาน สพฐ. (0 - 4)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">ระดับผลการเรียน (เกรด)</th>
                  <th className="py-2.5 px-3">คะแนนขั้นต่ำ (Min)</th>
                  <th className="py-2.5 px-3">คะแนนขั้นสูง (Max)</th>
                  <th className="py-2.5 px-3">ความหมาย / คำอธิบาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rulesForm.map((rule, idx) => (
                  <tr key={rule.grade} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-indigo-700">{rule.grade}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={rule.minScore}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...rulesForm];
                          next[idx].minScore = val;
                          setRulesForm(next);
                        }}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={rule.maxScore}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...rulesForm];
                          next[idx].maxScore = val;
                          setRulesForm(next);
                        }}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={rule.meaning}
                        onChange={(e) => {
                          const next = [...rulesForm];
                          next[idx].meaning = e.target.value;
                          setRulesForm(next);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
            >
              บันทึกเกณฑ์การตัดเกรด
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
