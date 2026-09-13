import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, Phone, Sparkles, Filter, 
  ChevronRight, ArrowRight, UserCheck, ShieldAlert, Award, 
  HelpCircle, MessageSquare, Clock 
} from 'lucide-react';
import { Student, Classroom } from '../types';
import { AtRiskStudentInfo } from '../services/storageService';

interface AtRiskStudentsViewProps {
  atRiskList?: AtRiskStudentInfo[];
  classrooms?: Classroom[];
  onSelectStudentProfile?: (student: Student) => void;
}

export const AtRiskStudentsView: React.FC<AtRiskStudentsViewProps> = ({
  atRiskList = [],
  classrooms = [],
  onSelectStudentProfile = (_student: Student) => {},
}) => {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'all' | 'high' | 'medium' | 'normal'>('all');

  const safeList = atRiskList || [];

  const filteredList = safeList.filter(item => {
    if (!item || !item.student) return false;
    if (selectedClassroomId !== 'all' && item.student.classroomId !== selectedClassroomId) return false;
    if (selectedRiskLevel !== 'all' && item.riskLevel !== selectedRiskLevel) return false;
    return true;
  });

  const highCount = safeList.filter(s => s && s.riskLevel === 'high').length;
  const medCount = safeList.filter(s => s && s.riskLevel === 'medium').length;
  const normalCount = safeList.filter(s => s && s.riskLevel === 'normal').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                ระบบติดตามนักเรียนกลุ่มเสี่ยง (At-Risk Early Warning)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              วิเคราะห์ข้อมูลเวลาเรียนต่ำกว่าเกณฑ์ 80%, ติด ร, ติด มส, หรือผลการเรียนไม่ผ่าน พร้อมคำแนะนำปรับแต่งเฉพาะบุคคล
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200">
              🔴 เร่งด่วนสูง: {highCount} คน
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200">
              🟠 ปานกลาง: {medCount} คน
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">กรองตามห้องเรียน</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกห้องเรียน ({atRiskList.length} คน)</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">ระดับความเร่งด่วน</label>
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกระดับความเสี่ยง</option>
              <option value="high">🔴 เร่งด่วนสูง (เสี่ยง มส / ติด 0 / เวลาเรียนต่ำมาก)</option>
              <option value="medium">🟠 ปานกลาง (ติด ร / ขาดส่งชิ้นงาน)</option>
              <option value="normal">🟢 ปกติ (ผ่านเกณฑ์มาตรฐาน)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Cards */}
      <div className="space-y-3">
        {filteredList.map((item) => {
          const { student, attendanceRate, hasMS, hasZero, hasR, gpa, riskLevel, riskReasons, personalizedAdvice } = item;

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${
                riskLevel === 'high' ? 'border-rose-300 bg-rose-50/10' :
                riskLevel === 'medium' ? 'border-amber-300 bg-amber-50/10' :
                'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Student header info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl font-bold flex items-center justify-center text-sm shrink-0 shadow-xs ${
                    riskLevel === 'high' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    riskLevel === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {student.studentNumber}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {student.title}{student.firstName} {student.lastName}
                      </span>
                      <span className="text-xs font-mono text-slate-400">({student.studentCode})</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {student.classroomName}
                      </span>

                      {/* Risk Level Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        riskLevel === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        riskLevel === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {riskLevel === 'high' ? '🔴 เร่งด่วนระดับสูง' :
                         riskLevel === 'medium' ? '🟠 ปานกลาง' : '🟢 ปกติ'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>เวลาเรียนเฉลี่ย: <b className={attendanceRate < 80 ? 'text-rose-600' : 'text-slate-800'}>{attendanceRate}%</b></span>
                      <span>•</span>
                      <span>GPA รวม: <b className="text-slate-800">{gpa.toFixed(2)}</b></span>
                      <span>•</span>
                      <span>ผู้ปกครอง: {student.parentName || '-'} ({student.parentPhone || '-'})</span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => onSelectStudentProfile(student)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <span>ดูประวัติรายบุคคล</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Issue tags & Personalized Learning Guidance */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Detected Issues */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>ปัญหาที่ระบบตรวจพบ:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {riskReasons.length > 0 ? (
                      riskReasons.map((reason, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                          {reason}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">ไม่มีประเด็นข้อกังวล</span>
                    )}
                  </div>
                </div>

                {/* Personalized Advice */}
                <div className="space-y-1.5 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                  <span className="font-semibold text-indigo-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ข้อเสนอแนะและแนวทางช่วยเหลือนักเรียน:</span>
                  </span>
                  <p className="text-indigo-950 font-normal leading-relaxed text-[11px]">
                    {personalizedAdvice}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
