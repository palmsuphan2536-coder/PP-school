import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Sliders, CheckCircle2, AlertTriangle, Lock, 
  Unlock, Send, Save, Download, Upload, ShieldCheck, Sparkles, 
  Info, Plus, Trash2, ArrowUpDown 
} from 'lucide-react';
import { 
  Classroom, Subject, Student, ScoreComponent, ScoreRecord, 
  SubjectGradingSummary, User, GradingRule, AcademicGrade, ApprovalStatus 
} from '../types';
import { calculateGradeFromScore, exportPP5ScoreSheetToExcel, SchoolInfo } from '../services/storageService';

interface ScoreEntryViewProps {
  classrooms: Classroom[];
  subjects: Subject[];
  students: Student[];
  scoreComponents: ScoreComponent[];
  scoreRecords: ScoreRecord[];
  subjectGradings: SubjectGradingSummary[];
  gradingRules: GradingRule[];
  schoolInfo: SchoolInfo;
  currentUser: User;
  onUpdateScore: (studentId: string, componentId: string, score: number | null) => void;
  onUpdateGradingSummary: (summary: SubjectGradingSummary) => void;
  onUpdateComponents: (components: ScoreComponent[]) => void;
  onBatchUpdateGrading: (summaries: SubjectGradingSummary[]) => void;
}

export const ScoreEntryView: React.FC<ScoreEntryViewProps> = ({
  classrooms,
  subjects,
  students,
  scoreComponents,
  scoreRecords,
  subjectGradings,
  gradingRules,
  schoolInfo,
  currentUser,
  onUpdateScore,
  onUpdateGradingSummary,
  onUpdateComponents,
  onBatchUpdateGrading,
}) => {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [showComponentModal, setShowComponentModal] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [editingCell, setEditingCell] = useState<{ studentId: string; componentId: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const classStudents = students.filter(s => s.classroomId === selectedClassroomId);

  // Filter components for current subject & classroom
  const activeComponents = scoreComponents.filter(
    c => c.subjectId === selectedSubjectId && c.classroomId === selectedClassroomId
  );

  const totalMaxScore = activeComponents.reduce((sum, c) => sum + c.maxScore, 0);

  // Find general approval status for this subject & classroom
  const existingGradings = subjectGradings.filter(
    g => g.subjectId === selectedSubjectId && g.classroomId === selectedClassroomId
  );
  const currentStatus: ApprovalStatus = existingGradings[0]?.approvalStatus || 'draft';
  const isLocked = currentStatus === 'locked';

  // Permission checks
  const canApprove = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'academic';
  const canEdit = !isLocked && (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'academic' || currentUser.role === 'teacher');

  // Handle individual score change
  const handleScoreInput = (studentId: string, component: ScoreComponent, valueStr: string) => {
    setSaveStatus('saving');
    setErrorMessage(null);

    if (valueStr.trim() === '') {
      onUpdateScore(studentId, component.id, null);
      updateStudentGrade(studentId, component.id, null);
      setTimeout(() => setSaveStatus('saved'), 200);
      return;
    }

    const num = parseFloat(valueStr);
    if (isNaN(num)) {
      setErrorMessage('กรุณากรอกเฉพาะตัวเลข');
      return;
    }

    if (num < 0) {
      setErrorMessage('คะแนนต้องไม่น้อยกว่า 0');
      return;
    }

    if (num > component.maxScore) {
      setErrorMessage(`คะแนนเกินคะแนนเต็ม! ช่อง "${component.name}" ได้สูงสุด ${component.maxScore} คะแนน`);
      return;
    }

    onUpdateScore(studentId, component.id, num);
    updateStudentGrade(studentId, component.id, num);
    setTimeout(() => setSaveStatus('saved'), 200);
  };

  // Helper to re-calculate grade when a score changes
  const updateStudentGrade = (studentId: string, changedComponentId: string, newScore: number | null) => {
    let total = 0;
    let hasMissing = false;

    activeComponents.forEach(comp => {
      if (comp.id === changedComponentId) {
        if (newScore !== null) total += newScore;
        else hasMissing = true;
      } else {
        const rec = scoreRecords.find(r => r.studentId === studentId && r.componentId === comp.id);
        if (rec && rec.score !== null) total += rec.score;
        else hasMissing = true;
      }
    });

    const calculatedGrade = calculateGradeFromScore(total, gradingRules);
    const existing = existingGradings.find(g => g.studentId === studentId);

    const summary: SubjectGradingSummary = {
      id: existing?.id || `grd-${studentId}-${selectedSubjectId}`,
      studentId,
      subjectId: selectedSubjectId,
      classroomId: selectedClassroomId,
      academicYearId: selectedSubject.academicYearId,
      termId: `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}`,
      totalScore: total,
      grade: existing?.isSpecialGrade ? existing.grade : (hasMissing ? 'ร' : calculatedGrade),
      isSpecialGrade: existing?.isSpecialGrade || hasMissing,
      approvalStatus: currentStatus,
      remarks: existing?.remarks || (hasMissing ? 'รอส่งงานให้ครบ' : '')
    };

    onUpdateGradingSummary(summary);
  };

  // Special grade selection (ร, มส, 0, ผ, มผ)
  const handleSpecialGradeChange = (studentId: string, grade: AcademicGrade) => {
    const existing = existingGradings.find(g => g.studentId === studentId);
    let total = existing?.totalScore || 0;

    const isSpecial = ['ร', 'มส', 'มผ', 'ผ'].includes(grade);

    const summary: SubjectGradingSummary = {
      id: existing?.id || `grd-${studentId}-${selectedSubjectId}`,
      studentId,
      subjectId: selectedSubjectId,
      classroomId: selectedClassroomId,
      academicYearId: selectedSubject.academicYearId,
      termId: `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}`,
      totalScore: total,
      grade,
      isSpecialGrade: isSpecial,
      approvalStatus: currentStatus,
      remarks: grade === 'มส' ? 'เวลาเรียนไม่ถึง 80%' : grade === 'ร' ? 'ค้างส่งชิ้นงาน' : existing?.remarks
    };

    onUpdateGradingSummary(summary);
  };

  // Workflow Actions
  const handleWorkflowTransition = (nextStatus: ApprovalStatus) => {
    const now = new Date().toISOString();
    const updated = classStudents.map(std => {
      const existing = existingGradings.find(g => g.studentId === std.id);
      return {
        id: existing?.id || `grd-${std.id}-${selectedSubjectId}`,
        studentId: std.id,
        subjectId: selectedSubjectId,
        classroomId: selectedClassroomId,
        academicYearId: selectedSubject.academicYearId,
        termId: `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}`,
        totalScore: existing?.totalScore || 0,
        grade: existing?.grade || '0',
        isSpecialGrade: existing?.isSpecialGrade || false,
        approvalStatus: nextStatus,
        submittedAt: nextStatus === 'submitted' ? now : existing?.submittedAt,
        approvedAt: nextStatus === 'approved' ? now : existing?.approvedAt,
        approvedBy: nextStatus === 'approved' ? currentUser.name : existing?.approvedBy,
        lockedAt: nextStatus === 'locked' ? now : existing?.lockedAt,
        lockedBy: nextStatus === 'locked' ? currentUser.name : existing?.lockedBy,
        remarks: existing?.remarks
      };
    });

    onBatchUpdateGrading(updated);
  };

  // Component Setup Form State
  const [modalComponents, setModalComponents] = useState<ScoreComponent[]>(activeComponents);
  useEffect(() => {
    setModalComponents(activeComponents);
  }, [selectedSubjectId, selectedClassroomId, scoreComponents]);

  const handleSaveComponents = () => {
    const sum = modalComponents.reduce((acc, c) => acc + c.maxScore, 0);
    if (sum !== 100) {
      alert(`คะแนนเต็มรวมต้องเท่ากับ 100 คะแนนพอดี (ปัจจุบันรวมได้ ${sum} คะแนน)`);
      return;
    }
    onUpdateComponents(modalComponents);
    setShowComponentModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Status Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                บันทึกคะแนนและประเมินผลการเรียน (ปพ.5)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              รองรับการกรอกคะแนนแบบ Excel คำนวณเกรดอัตโนมัติ พร้อมระบบตรวจสอบคะแนนเกินและส่งงานวิชาการอนุมัติ
            </p>
          </div>

          {/* Workflow Status Badge & Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 text-slate-700">
              <span>สถานะ:</span>
              {currentStatus === 'draft' && <span className="text-slate-600">📝 ร่าง (ครูกำลังกรอก)</span>}
              {currentStatus === 'submitted' && <span className="text-blue-600">📤 ส่งงานวิชาการแล้ว</span>}
              {currentStatus === 'approved' && <span className="text-emerald-600">✅ งานวิชาการอนุมัติแล้ว</span>}
              {currentStatus === 'locked' && <span className="text-rose-600 flex items-center gap-1"><Lock className="w-3 h-3" /> ล็อกข้อมูลเรียบร้อย</span>}
            </div>

            {/* Teacher Submit Button */}
            {canEdit && currentStatus === 'draft' && (
              <button
                onClick={() => handleWorkflowTransition('submitted')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งงานวิชาการตรวจสอบ</span>
              </button>
            )}

            {/* Academic Approval / Reject / Lock Buttons */}
            {canApprove && currentStatus === 'submitted' && (
              <>
                <button
                  onClick={() => handleWorkflowTransition('approved')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>อนุมัติผลการเรียน</span>
                </button>
                <button
                  onClick={() => handleWorkflowTransition('draft')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>ตีกลับให้ครูแก้ไข</span>
                </button>
              </>
            )}

            {canApprove && currentStatus === 'approved' && (
              <button
                onClick={() => handleWorkflowTransition('locked')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ล็อกคะแนนสิ้นภาคเรียน</span>
              </button>
            )}

            {canApprove && isLocked && (
              <button
                onClick={() => handleWorkflowTransition('approved')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>ปลดล็อกคะแนน</span>
              </button>
            )}
          </div>
        </div>

        {/* Selection filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">ห้องเรียน</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">รายวิชา</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} {s.name} ({s.credits} นก.)</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 justify-end">
            <button
              onClick={() => setShowComponentModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 text-xs transition"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>กำหนดองค์ประกอบคะแนน (เต็ม {totalMaxScore}/100)</span>
            </button>

            <button
              onClick={() => exportPP5ScoreSheetToExcel(selectedSubject, selectedClassroom, classStudents, activeComponents, scoreRecords, existingGradings, schoolInfo)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1.5 text-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning/Error Bar */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Total Score Check Notification */}
      {totalMaxScore !== 100 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>คะแนนเต็มรวมขององค์ประกอบปัจจุบันคือ <b>{totalMaxScore} คะแนน</b> (ต้องปรับให้ครบ 100 คะแนนก่อนตัดเกรดเป็นทางการ)</span>
          </div>
          <button
            onClick={() => setShowComponentModal(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold text-[11px]"
          >
            แก้ไขสัดส่วน
          </button>
        </div>
      )}

      {/* Spreadsheet Score Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {selectedSubject.code} {selectedSubject.name} — ห้อง {selectedClassroom.name}
            </span>
            <span>({classStudents.length} คน)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{saveStatus === 'saving' ? 'กำลังบันทึก...' : 'บันทึกอัตโนมัติแล้ว'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">ที่</th>
                <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">รหัส</th>
                <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-200">ชื่อ-นามสกุล</th>
                
                {/* Dynamic Score Components Header */}
                {activeComponents.map((comp) => (
                  <th key={comp.id} className="py-2 px-3 text-center border-r border-slate-200 min-w-[110px]">
                    <div className="truncate font-medium">{comp.name}</div>
                    <div className="text-[10px] text-indigo-600 font-mono font-bold">เต็ม ({comp.maxScore})</div>
                  </th>
                ))}

                <th className="py-2 px-3 text-center w-24 border-r border-slate-200 bg-indigo-50/50">
                  <div className="font-bold text-indigo-900">รวม</div>
                  <div className="text-[10px] text-indigo-600 font-bold">(100)</div>
                </th>
                <th className="py-2 px-3 text-center w-24 border-r border-slate-200 bg-indigo-50/50">
                  <div className="font-bold text-indigo-900">ผลการเรียน</div>
                  <div className="text-[10px] text-indigo-600 font-bold">(เกรด)</div>
                </th>
                <th className="py-2 px-3 min-w-[140px]">หมายเหตุ / ผลพิเศษ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classStudents.map((std, idx) => {
                const gradeSummary = existingGradings.find(g => g.studentId === std.id);
                let totalScore = 0;
                let hasEmptyCell = false;

                return (
                  <tr 
                    key={std.id} 
                    className={`hover:bg-indigo-50/20 transition ${
                      idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-200">
                      {std.studentNumber}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                      {std.studentCode}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200 truncate">
                      {std.title}{std.firstName} {std.lastName}
                    </td>

                    {/* Component Score Inputs */}
                    {activeComponents.map((comp) => {
                      const rec = scoreRecords.find(r => r.studentId === std.id && r.componentId === comp.id);
                      const currentVal = rec && rec.score !== null ? rec.score : '';
                      if (typeof currentVal === 'number') totalScore += currentVal;
                      else hasEmptyCell = true;

                      const isCellEditing = editingCell?.studentId === std.id && editingCell?.componentId === comp.id;

                      return (
                        <td key={comp.id} className="py-1 px-1.5 text-center border-r border-slate-200">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={comp.maxScore}
                            disabled={!canEdit}
                            defaultValue={currentVal}
                            placeholder="-"
                            onFocus={() => setEditingCell({ studentId: std.id, componentId: comp.id })}
                            onBlur={(e) => {
                              setEditingCell(null);
                              handleScoreInput(std.id, comp, e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLElement).blur();
                              }
                            }}
                            className={`w-full py-1 text-center font-mono text-xs font-semibold rounded-md border transition focus:outline-none ${
                              !canEdit 
                                ? 'bg-slate-100 text-slate-500 border-transparent cursor-not-allowed'
                                : currentVal === '' 
                                  ? 'bg-amber-50/50 border-dashed border-amber-300 text-slate-400 focus:bg-white focus:border-indigo-500' 
                                  : 'bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500'
                            }`}
                          />
                        </td>
                      );
                    })}

                    {/* Total Score Cell */}
                    <td className="py-2 px-2 text-center font-mono font-bold text-sm text-slate-900 border-r border-slate-200 bg-indigo-50/30">
                      {gradeSummary?.totalScore ?? totalScore}
                    </td>

                    {/* Calculated Grade Badge */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50/30">
                      {(() => {
                        const grade = gradeSummary?.grade || calculateGradeFromScore(totalScore, gradingRules);
                        const isHigh = grade === '4' || grade === '3.5';
                        const isWarn = grade === '0' || grade === 'ร' || grade === 'มส';

                        return (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            isHigh ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            isWarn ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {grade}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Special Grade & Remarks selector */}
                    <td className="py-1 px-2">
                      <div className="flex items-center gap-1.5">
                        <select
                          disabled={!canEdit}
                          value={gradeSummary?.grade || ''}
                          onChange={(e) => handleSpecialGradeChange(std.id, e.target.value as AcademicGrade)}
                          className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium focus:outline-none"
                        >
                          <option value="">คำนวณตามคะแนน</option>
                          <option value="ร">ติด ร (ค้างส่งงาน)</option>
                          <option value="มส">ติด มส (เวลาเรียนไม่ถึง 80%)</option>
                          <option value="0">0 (ไม่ผ่าน)</option>
                          <option value="ผ">ผ (ผ่าน)</option>
                          <option value="มผ">มผ (ไม่ผ่าน)</option>
                        </select>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                          {gradeSummary?.remarks}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Component Setup Modal */}
      {showComponentModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">กำหนดองค์ประกอบคะแนน</h3>
                <p className="text-xs text-slate-500">
                  {selectedSubject.code} {selectedSubject.name} • คะแนนเต็มรวมต้องเท่ากับ 100
                </p>
              </div>
              <button 
                onClick={() => setShowComponentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {modalComponents.map((comp, idx) => (
                <div key={comp.id || idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => {
                      const copy = [...modalComponents];
                      copy[idx].name = e.target.value;
                      setModalComponents(copy);
                    }}
                    placeholder="ชื่อองค์ประกอบคะแนน"
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">เต็ม:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={comp.maxScore}
                      onChange={(e) => {
                        const copy = [...modalComponents];
                        copy[idx].maxScore = Number(e.target.value) || 0;
                        setModalComponents(copy);
                      }}
                      className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-white border border-slate-200 rounded-lg text-indigo-700 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (modalComponents.length <= 1) {
                        alert('ต้องมีองค์ประกอบคะแนนอย่างน้อย 1 ช่อง');
                        return;
                      }
                      setModalComponents(modalComponents.filter((_, i) => i !== idx));
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setModalComponents([
                    ...modalComponents,
                    {
                      id: `sc-custom-${Date.now()}`,
                      subjectId: selectedSubjectId,
                      classroomId: selectedClassroomId,
                      academicYearId: selectedSubject.academicYearId,
                      termId: `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}`,
                      name: 'คะแนนเก็บชิ้นงานใหม่',
                      maxScore: 10,
                      sequence: modalComponents.length + 1
                    }
                  ]);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มองค์ประกอบคะแนน</span>
              </button>

              <div className="text-xs font-bold">
                รวม: <span className={modalComponents.reduce((s, c) => s + c.maxScore, 0) === 100 ? 'text-emerald-600' : 'text-rose-600'}>
                  {modalComponents.reduce((s, c) => s + c.maxScore, 0)}
                </span> / 100 คะแนน
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowComponentModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveComponents}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                บันทึกองค์ประกอบคะแนน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
