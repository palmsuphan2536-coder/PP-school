import React, { useState } from 'react';
import { 
  Calendar, Plus, CheckCircle2, AlertCircle, Clock, 
  Archive, ArrowRight, ShieldCheck, Sparkles, Check, Lock, Unlock
} from 'lucide-react';
import { AcademicYear, Term } from '../types';

interface AcademicYearManagerProps {
  academicYears: AcademicYear[];
  terms: Term[];
  selectedYearId: string;
  selectedTermId: string;
  onAddAcademicYear: (year: number, makeCurrent: boolean) => void;
  onSetCurrentAcademicYear: (yearId: string) => void;
  onSelectYear: (yearId: string) => void;
  onSelectTerm: (termId: string) => void;
  onToggleTermClosed?: (termId: string) => void;
}

export const AcademicYearManager: React.FC<AcademicYearManagerProps> = ({
  academicYears,
  terms,
  selectedYearId,
  selectedTermId,
  onAddAcademicYear,
  onSetCurrentAcademicYear,
  onSelectYear,
  onSelectTerm,
  onToggleTermClosed,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Calculate default next year (highest existing year + 1)
  const highestYear = Math.max(...academicYears.map(y => y.year), 2569);
  const [newYearInput, setNewYearInput] = useState<number>(highestYear + 1);
  const [makeCurrentAfterAdd, setMakeCurrentAfterAdd] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const yearNum = Number(newYearInput);
    if (!yearNum || isNaN(yearNum) || yearNum < 2500 || yearNum > 2650) {
      setErrorMsg('กรุณาระบุปีการศึกษาเป็นตัวเลข พ.ศ. ที่ถูกต้อง (เช่น 2570, 2571)');
      return;
    }

    if (academicYears.some(y => y.year === yearNum)) {
      setErrorMsg(`ปีการศึกษา ${yearNum} มีอยู่ในระบบแล้ว กรุณาเลือกปีการศึกษาอื่น`);
      return;
    }

    onAddAcademicYear(yearNum, makeCurrentAfterAdd);
    setSuccessMsg(`เพิ่มปีการศึกษา ${yearNum} สำเร็จ พร้อมสร้างภาคเรียนที่ 1 และ 2 เรียบร้อยแล้ว (ข้อมูลปีการศึกษาเดิมยังคงอยู่ครบถ้วน)`);
    setShowAddModal(false);
    setNewYearInput(yearNum + 1);
  };

  // Sort academic years descending (newest first)
  const sortedYears = [...academicYears].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-5 text-xs">
      {/* Header Info Banner */}
      <div className="bg-linear-to-r from-indigo-50 via-sky-50 to-emerald-50 p-5 rounded-2xl border border-indigo-100/80 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                จัดการปีการศึกษาและภาคเรียน (Academic Years & Terms)
              </h3>
              <p className="text-slate-600 text-[11px] mt-0.5">
                สามารถเพิ่มปีการศึกษาใหม่ได้เรื่อยๆ โดยที่ข้อมูลคะแนน เวลาเรียน ปพ.5 และนักเรียนของปีเดิมยังคงอยู่ครบถ้วนในระบบ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewYearInput(highestYear + 1);
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มปีการศึกษาใหม่</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Academic Years List Cards */}
      <div className="space-y-3">
        {sortedYears.map((ay) => {
          const yearTerms = terms.filter(t => t.academicYearId === ay.id);
          const isSelected = selectedYearId === ay.id;

          return (
            <div
              key={ay.id}
              className={`bg-white rounded-2xl border p-5 transition shadow-2xs ${
                ay.isCurrent
                  ? 'border-indigo-300 ring-2 ring-indigo-500/10'
                  : isSelected
                  ? 'border-sky-300 bg-sky-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Year Badge & Info */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 ${
                    ay.isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <span className="text-[10px] uppercase font-normal opacity-80">ปี พ.ศ.</span>
                    <span className="text-base leading-none">{ay.year}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">
                        ปีการศึกษา {ay.year}
                      </h4>
                      {ay.isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>ปีการศึกษาปัจจุบัน (Active)</span>
                        </span>
                      )}
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          กำลังแสดงผลอยู่ในขณะนี้
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {yearTerms.length > 0 
                        ? `ประกอบด้วย ${yearTerms.length} ภาคเรียน (${yearTerms.map(t => `ภาคเรียนที่ ${t.termNumber}`).join(', ')})`
                        : 'ยังไม่มีการสร้างภาคเรียน'}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {!ay.isCurrent && (
                    <button
                      type="button"
                      onClick={() => onSetCurrentAcademicYear(ay.id)}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                    >
                      ตั้งเป็นปีการศึกษาปัจจุบัน
                    </button>
                  )}

                  {!isSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectYear(ay.id);
                        const firstTerm = yearTerms[0];
                        if (firstTerm) onSelectTerm(firstTerm.id);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                    >
                      สลับไปดูข้อมูลปีนี้
                    </button>
                  )}
                </div>
              </div>

              {/* Terms Sub-list */}
              {yearTerms.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {yearTerms.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        t.isClosed 
                          ? 'bg-slate-50 border-slate-200 text-slate-500' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>ภาคเรียนที่ {t.termNumber}/{ay.year}</span>
                            {t.isClosed ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> ปิดภาคเรียนแล้ว
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                                <Unlock className="w-2.5 h-2.5" /> เปิดทำการสอน
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ช่วงเวลา: {t.startDate} ถึง {t.endDate}
                          </div>
                        </div>
                      </div>

                      {onToggleTermClosed && (
                        <button
                          type="button"
                          onClick={() => onToggleTermClosed(t.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                            t.isClosed 
                              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' 
                              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {t.isClosed ? 'เปิดใช้งาน' : 'ปิดภาคเรียน'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Year Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">เพิ่มปีการศึกษาใหม่</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ปีการศึกษา พ.ศ. (เช่น 2570, 2571)
                </label>
                <input
                  type="number"
                  min="2500"
                  max="2650"
                  required
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ระบบจะสร้างภาคเรียนที่ 1 และ ภาคเรียนที่ 2 ให้โดยอัตโนมัติ
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600 text-[11px]">
                <div className="font-semibold text-slate-800">ภาคเรียนที่จะถูกสร้างอัตโนมัติ:</div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span>ภาคเรียนที่ 1 (16 พ.ค. - 10 ต.ค.)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span>ภาคเรียนที่ 2 (1 พ.ย. - 31 มี.ค.)</span>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={makeCurrentAfterAdd}
                    onChange={(e) => setMakeCurrentAfterAdd(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">
                    ตั้งเป็นปีการศึกษาปัจจุบันทันทีหลังจากสร้าง
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  ยืนยันการเพิ่มปีการศึกษา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
