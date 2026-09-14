import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Sliders, CheckCircle2, AlertTriangle, Lock, 
  Unlock, Send, Save, Download, Sparkles, 
  Info, Plus, Trash2, Loader2, AlertCircle, RefreshCw, ExternalLink,
  BookOpen, RotateCcw, Users
} from 'lucide-react';
import { 
  Classroom, Subject, Student, ScoreComponent, ScoreRecord, 
  SubjectGradingSummary, User, GradingRule, AcademicGrade, ApprovalStatus 
} from '../types';
import { calculateGradeFromScore, exportPP5ScoreSheetToExcel, resetToDefaultData, SchoolInfo } from '../services/storageService';

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
  onUpdateScore?: (studentId: string, componentId: string, score: number | null) => void;
  onUpdateGradingSummary?: (summary: SubjectGradingSummary) => void;
  onUpdateComponents: (components: ScoreComponent[]) => void;
  onBatchUpdateGrading: (summaries: SubjectGradingSummary[]) => void;
  onSaveScoresAndGradingsAndSyncSheets: (
    newRecords: ScoreRecord[],
    newGradings: SubjectGradingSummary[]
  ) => Promise<{ success: boolean; sheetsSuccess: boolean; message: string; spreadsheetUrl?: string }>;
}

export const ScoreEntryView: React.FC<ScoreEntryViewProps> = ({
  classrooms = [],
  subjects = [],
  students = [],
  scoreComponents = [],
  scoreRecords = [],
  subjectGradings = [],
  gradingRules = [],
  schoolInfo,
  currentUser,
  onUpdateComponents,
  onBatchUpdateGrading,
  onSaveScoresAndGradingsAndSyncSheets,
}) => {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [showComponentModal, setShowComponentModal] = useState<boolean>(false);

  // Safely synchronize selected ids when classrooms or subjects change
  useEffect(() => {
    if (classrooms.length > 0 && (!selectedClassroomId || !classrooms.some(c => c.id === selectedClassroomId))) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.some(s => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);
  
  // Save & Loading states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    spreadsheetUrl?: string;
  } | null>(null);

  // Validation errors map: studentId_componentId -> message
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalErrorMessage, setGeneralErrorMessage] = useState<string | null>(null);

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const classStudents = useMemo(() => {
    if (!selectedClassroomId) return [];
    return students
      .filter(s => s.classroomId === selectedClassroomId)
      .sort((a, b) => (a.studentNumber || 0) - (b.studentNumber || 0));
  }, [students, selectedClassroomId]);

  // Filter score components for current subject & classroom
  const activeComponents = useMemo(() => {
    if (!selectedSubjectId || !selectedClassroomId) return [];
    return scoreComponents
      .filter(c => c.subjectId === selectedSubjectId && c.classroomId === selectedClassroomId)
      .sort((a, b) => a.sequence - b.sequence);
  }, [scoreComponents, selectedSubjectId, selectedClassroomId]);

  const totalMaxScore = activeComponents.reduce((sum, c) => sum + c.maxScore, 0);

  // Approval status for this subject & classroom
  const existingGradings = useMemo(() => {
    if (!selectedSubjectId || !selectedClassroomId) return [];
    return subjectGradings.filter(
      g => g.subjectId === selectedSubjectId && g.classroomId === selectedClassroomId
    );
  }, [subjectGradings, selectedSubjectId, selectedClassroomId]);

  const currentStatus: ApprovalStatus = existingGradings[0]?.approvalStatus || 'draft';
  const isLocked = currentStatus === 'locked';

  // Permissions
  const canApprove = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'academic';
  const canEdit = !isLocked && (currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'academic' || currentUser?.role === 'teacher');

  // Local state for screen score values: studentId -> componentId -> string
  const [localScores, setLocalScores] = useState<Record<string, Record<string, string>>>({});
  
  // Local state for special grading choices: studentId -> { grade, remarks, isSpecialGrade }
  const [localGradings, setLocalGradings] = useState<Record<string, {
    grade: AcademicGrade | '';
    remarks: string;
    isSpecialGrade: boolean;
  }>>({});

  // Sync initial data into local state when classroom or subject changes
  useEffect(() => {
    const scoresMap: Record<string, Record<string, string>> = {};
    const gradingsMap: Record<string, { grade: AcademicGrade | ''; remarks: string; isSpecialGrade: boolean }> = {};

    classStudents.forEach(std => {
      scoresMap[std.id] = {};
      activeComponents.forEach(comp => {
        const rec = scoreRecords.find(r => r.studentId === std.id && r.componentId === comp.id);
        scoresMap[std.id][comp.id] = rec && rec.score !== null && rec.score !== undefined ? String(rec.score) : '';
      });

      const existingGrading = existingGradings.find(g => g.studentId === std.id);
      if (existingGrading) {
        gradingsMap[std.id] = {
          grade: existingGrading.grade || '',
          remarks: existingGrading.remarks || '',
          isSpecialGrade: Boolean(existingGrading.isSpecialGrade)
        };
      } else {
        gradingsMap[std.id] = {
          grade: '',
          remarks: '',
          isSpecialGrade: false
        };
      }
    });

    setLocalScores(scoresMap);
    setLocalGradings(gradingsMap);
    setHasUnsavedChanges(false);
    setValidationErrors({});
    setGeneralErrorMessage(null);
  }, [selectedClassroomId, selectedSubjectId, scoreComponents, scoreRecords, subjectGradings]);

  // Calculate live total score for a student
  const calculateStudentLiveTotal = (studentId: string): number => {
    const studentScoreObj = localScores[studentId] || {};
    let sum = 0;
    activeComponents.forEach(comp => {
      const valStr = studentScoreObj[comp.id];
      if (valStr !== undefined && valStr !== null && valStr.trim() !== '') {
        const num = parseFloat(valStr);
        if (!isNaN(num) && num >= 0 && num <= comp.maxScore) {
          sum += num;
        }
      }
    });
    return Math.round(sum * 100) / 100;
  };

  // Calculate live grade for a student
  const calculateStudentLiveGrade = (studentId: string, liveTotal: number): AcademicGrade => {
    const gradingInfo = localGradings[studentId];
    // If the teacher has explicitly assigned a special grade ('ร', 'มส', '0', 'ผ', 'มผ'), respect it
    if (gradingInfo?.isSpecialGrade && gradingInfo.grade) {
      return gradingInfo.grade;
    }
    // Otherwise, calculate accurately from score using Ministry of Education criteria
    return calculateGradeFromScore(liveTotal, gradingRules);
  };

  // Handle local score input change
  const handleLocalScoreChange = (
    studentId: string,
    componentId: string,
    valStr: string,
    maxScore: number
  ) => {
    setLocalScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [componentId]: valStr
      }
    }));
    setHasUnsavedChanges(true);
    setGeneralErrorMessage(null);

    // Validate cell
    const trimmed = valStr.trim();
    const errorKey = `${studentId}_${componentId}`;
    if (trimmed === '') {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    } else {
      const num = parseFloat(trimmed);
      if (isNaN(num)) {
        setValidationErrors(prev => ({ ...prev, [errorKey]: 'ต้องเป็นตัวเลข' }));
      } else if (num < 0) {
        setValidationErrors(prev => ({ ...prev, [errorKey]: 'ไม่ต่ำกว่า 0' }));
      } else if (num > maxScore) {
        setValidationErrors(prev => ({ ...prev, [errorKey]: `เกินคะแนนเต็ม (${maxScore})` }));
      } else {
        setValidationErrors(prev => {
          const copy = { ...prev };
          delete copy[errorKey];
          return copy;
        });
      }
    }
  };

  // Handle special grade selector change
  const handleSpecialGradeDropdownChange = (studentId: string, selectedVal: string) => {
    setHasUnsavedChanges(true);
    setGeneralErrorMessage(null);

    if (selectedVal === '') {
      // Calculate automatically according to score
      const liveTotal = calculateStudentLiveTotal(studentId);
      const computed = calculateGradeFromScore(liveTotal, gradingRules);
      setLocalGradings(prev => ({
        ...prev,
        [studentId]: {
          grade: computed,
          remarks: '',
          isSpecialGrade: false
        }
      }));
    } else {
      // Special grade assigned manually
      let defaultRemarks = '';
      if (selectedVal === 'ร') defaultRemarks = 'ค้างส่งชิ้นงาน';
      else if (selectedVal === 'มส') defaultRemarks = 'เวลาเรียนไม่ถึง 80%';
      else if (selectedVal === '0') defaultRemarks = 'ไม่ผ่านเกณฑ์ขั้นต่ำ';
      else if (selectedVal === 'ผ') defaultRemarks = 'ผ่านการประเมิน';
      else if (selectedVal === 'มผ') defaultRemarks = 'ไม่ผ่านการประเมิน';

      setLocalGradings(prev => ({
        ...prev,
        [studentId]: {
          grade: selectedVal as AcademicGrade,
          remarks: prev[studentId]?.remarks || defaultRemarks,
          isSpecialGrade: true
        }
      }));
    }
  };

  // Recalculate & auto cut grades for all students on screen
  const handleAutoCalculateAllGrades = () => {
    const updatedGradings: Record<string, { grade: AcademicGrade; remarks: string; isSpecialGrade: boolean }> = {};
    classStudents.forEach(std => {
      const liveTotal = calculateStudentLiveTotal(std.id);
      const computed = calculateGradeFromScore(liveTotal, gradingRules);
      updatedGradings[std.id] = {
        grade: computed,
        remarks: '',
        isSpecialGrade: false
      };
    });
    setLocalGradings(updatedGradings);
    setHasUnsavedChanges(true);
    setFeedbackNotice({
      type: 'info',
      message: `คำนวณและตัดเกรดอัตโนมัติตามเกณฑ์คะแนนให้นักเรียนทั้ง ${classStudents.length} คนเรียบร้อยแล้ว (กดปุ่ม "บันทึกข้อมูลและส่ง Google Sheets" เพื่อยืนยันการบันทึก)`
    });
  };

  // Discard changes and revert to loaded state
  const handleRevertChanges = () => {
    if (!window.confirm('ท่านต้องการยกเลิกการเปลี่ยนแปลงคะแนนที่ยังไม่ได้บันทึกหรือไม่?')) {
      return;
    }
    const scoresMap: Record<string, Record<string, string>> = {};
    const gradingsMap: Record<string, { grade: AcademicGrade | ''; remarks: string; isSpecialGrade: boolean }> = {};

    classStudents.forEach(std => {
      scoresMap[std.id] = {};
      activeComponents.forEach(comp => {
        const rec = scoreRecords.find(r => r.studentId === std.id && r.componentId === comp.id);
        scoresMap[std.id][comp.id] = rec && rec.score !== null && rec.score !== undefined ? String(rec.score) : '';
      });

      const existingGrading = existingGradings.find(g => g.studentId === std.id);
      if (existingGrading) {
        gradingsMap[std.id] = {
          grade: existingGrading.grade || '',
          remarks: existingGrading.remarks || '',
          isSpecialGrade: Boolean(existingGrading.isSpecialGrade)
        };
      } else {
        gradingsMap[std.id] = {
          grade: '',
          remarks: '',
          isSpecialGrade: false
        };
      }
    });

    setLocalScores(scoresMap);
    setLocalGradings(gradingsMap);
    setHasUnsavedChanges(false);
    setValidationErrors({});
    setGeneralErrorMessage(null);
    setFeedbackNotice({
      type: 'info',
      message: 'ยกเลิกการแก้ไขแล้ว ข้อมูลกลับสู่สถานะเดิมที่บันทึกไว้'
    });
  };

  // Primary Manual Save Button Handler:
  // Aggregates all scores on screen, calculates grades, saves to app state, and sends to Google Sheets
  const handleSaveAllScoresAndSync = async () => {
    setGeneralErrorMessage(null);
    setFeedbackNotice(null);

    // 1. Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      setGeneralErrorMessage('พบข้อผิดพลาดในตารางคะแนน (มีคะแนนที่เกินคะแนนเต็มหรือกรอกไม่ถูกต้อง) กรุณาตรวจสอบช่องที่มีข้อความเตือนก่อนบันทึก');
      return;
    }

    // 2. Additional verification across all cells
    for (const std of classStudents) {
      for (const comp of activeComponents) {
        const valStr = localScores[std.id]?.[comp.id];
        if (valStr !== undefined && valStr.trim() !== '') {
          const num = parseFloat(valStr);
          if (isNaN(num)) {
            setGeneralErrorMessage(`คะแนนของ ${std.title}${std.firstName} ในช่อง "${comp.name}" ไม่ใช่ตัวเลขที่ถูกต้อง`);
            return;
          }
          if (num < 0) {
            setGeneralErrorMessage(`คะแนนของ ${std.title}${std.firstName} ต้องไม่น้อยกว่า 0`);
            return;
          }
          if (num > comp.maxScore) {
            setGeneralErrorMessage(`คะแนนของ ${std.title}${std.firstName} ในช่อง "${comp.name}" (${num} คะแนน) เกินคะแนนเต็ม (${comp.maxScore} คะแนน)`);
            return;
          }
        }
      }
    }

    // 3. Start Loading State
    setIsSaving(true);

    try {
      // 4. Construct all ScoreRecord items for this classroom & subject
      const nowIso = new Date().toISOString();
      const recordsToSave: ScoreRecord[] = [];

      classStudents.forEach(std => {
        activeComponents.forEach(comp => {
          const valStr = localScores[std.id]?.[comp.id];
          const parsedScore = (valStr !== undefined && valStr.trim() !== '') ? parseFloat(valStr) : null;
          const existingRec = scoreRecords.find(r => r.studentId === std.id && r.componentId === comp.id);

          recordsToSave.push({
            id: existingRec?.id || `scr-${Date.now()}-${std.id}-${comp.id}`,
            studentId: std.id,
            subjectId: selectedSubjectId,
            componentId: comp.id,
            score: parsedScore,
            academicYearId: selectedSubject?.academicYearId || 'ay-2569',
            termId: selectedSubject ? `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}` : 'term-ay-2569-1',
            lastUpdated: nowIso,
            updatedBy: currentUser?.name || 'ผู้ดูแลระบบ'
          });
        });
      });

      // 5. Construct all SubjectGradingSummary items
      const gradingsToSave: SubjectGradingSummary[] = classStudents.map(std => {
        const liveTotal = calculateStudentLiveTotal(std.id);
        const liveGrade = calculateStudentLiveGrade(std.id, liveTotal);
        const gradingInfo = localGradings[std.id];
        const existing = existingGradings.find(g => g.studentId === std.id);

        return {
          id: existing?.id || `grd-${std.id}-${selectedSubjectId}`,
          studentId: std.id,
          subjectId: selectedSubjectId,
          classroomId: selectedClassroomId,
          academicYearId: selectedSubject?.academicYearId || 'ay-2569',
          termId: selectedSubject ? `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}` : 'term-ay-2569-1',
          totalScore: liveTotal,
          grade: liveGrade,
          isSpecialGrade: gradingInfo?.isSpecialGrade || false,
          approvalStatus: currentStatus,
          remarks: gradingInfo?.remarks || (liveGrade === 'ร' ? 'ค้างส่งชิ้นงาน' : liveGrade === 'มส' ? 'เวลาเรียนไม่ถึง 80%' : ''),
          submittedAt: existing?.submittedAt,
          approvedAt: existing?.approvedAt,
          approvedBy: existing?.approvedBy,
          lockedAt: existing?.lockedAt,
          lockedBy: existing?.lockedBy
        };
      });

      // 6. Save to application state & trigger Google Sheets sync
      const result = await onSaveScoresAndGradingsAndSyncSheets(recordsToSave, gradingsToSave);

      const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeString);
      setHasUnsavedChanges(false);

      if (result.sheetsSuccess) {
        setFeedbackNotice({
          type: 'success',
          message: `บันทึกคะแนนและตัดเกรดลงระบบ พร้อมส่งไปยัง Google Sheets สำเร็จเรียบร้อยแล้ว (${timeString} น.)`,
          spreadsheetUrl: result.spreadsheetUrl
        });
      } else {
        setFeedbackNotice({
          type: 'info',
          message: `${result.message} (${timeString} น.)`
        });
      }
    } catch (err: any) {
      console.error('Error during save and sync:', err);
      setGeneralErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  // Workflow Actions (ส่งงานวิชาการ / อนุมัติ / ล็อก)
  const handleWorkflowTransition = (nextStatus: ApprovalStatus) => {
    const now = new Date().toISOString();
    const updated = classStudents.map(std => {
      const existing = existingGradings.find(g => g.studentId === std.id);
      const liveTotal = calculateStudentLiveTotal(std.id);
      const liveGrade = calculateStudentLiveGrade(std.id, liveTotal);
      const gradingInfo = localGradings[std.id];

      return {
        id: existing?.id || `grd-${std.id}-${selectedSubjectId}`,
        studentId: std.id,
        subjectId: selectedSubjectId,
        classroomId: selectedClassroomId,
        academicYearId: selectedSubject.academicYearId,
        termId: `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}`,
        totalScore: liveTotal,
        grade: liveGrade,
        isSpecialGrade: gradingInfo?.isSpecialGrade || false,
        approvalStatus: nextStatus,
        submittedAt: nextStatus === 'submitted' ? now : existing?.submittedAt,
        approvedAt: nextStatus === 'approved' ? now : existing?.approvedAt,
        approvedBy: nextStatus === 'approved' ? currentUser.name : existing?.approvedBy,
        lockedAt: nextStatus === 'locked' ? now : existing?.lockedAt,
        lockedBy: nextStatus === 'locked' ? currentUser.name : existing?.lockedBy,
        remarks: gradingInfo?.remarks || existing?.remarks || ''
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

  const handleCreateDefaultComponents = () => {
    if (!selectedSubject || !selectedClassroom) return;
    const defaults: ScoreComponent[] = [
      { id: `sc-${selectedSubjectId}-${selectedClassroomId}-1`, subjectId: selectedSubjectId, classroomId: selectedClassroomId, academicYearId: selectedSubject.academicYearId || 'ay-2569', termId: `term-${selectedSubject.academicYearId || 'ay-2569'}-${selectedSubject.termNumber || 1}`, name: 'คะแนนเก็บก่อนกลางภาค', maxScore: 25, sequence: 1 },
      { id: `sc-${selectedSubjectId}-${selectedClassroomId}-2`, subjectId: selectedSubjectId, classroomId: selectedClassroomId, academicYearId: selectedSubject.academicYearId || 'ay-2569', termId: `term-${selectedSubject.academicYearId || 'ay-2569'}-${selectedSubject.termNumber || 1}`, name: 'ชิ้นงาน/โครงงานย่อย', maxScore: 15, sequence: 2 },
      { id: `sc-${selectedSubjectId}-${selectedClassroomId}-3`, subjectId: selectedSubjectId, classroomId: selectedClassroomId, academicYearId: selectedSubject.academicYearId || 'ay-2569', termId: `term-${selectedSubject.academicYearId || 'ay-2569'}-${selectedSubject.termNumber || 1}`, name: 'สอบเก็บคะแนนหน่วย', maxScore: 10, sequence: 3 },
      { id: `sc-${selectedSubjectId}-${selectedClassroomId}-4`, subjectId: selectedSubjectId, classroomId: selectedClassroomId, academicYearId: selectedSubject.academicYearId || 'ay-2569', termId: `term-${selectedSubject.academicYearId || 'ay-2569'}-${selectedSubject.termNumber || 1}`, name: 'สอบวัดผลกลางภาค', maxScore: 20, sequence: 4 },
      { id: `sc-${selectedSubjectId}-${selectedClassroomId}-5`, subjectId: selectedSubjectId, classroomId: selectedClassroomId, academicYearId: selectedSubject.academicYearId || 'ay-2569', termId: `term-${selectedSubject.academicYearId || 'ay-2569'}-${selectedSubject.termNumber || 1}`, name: 'สอบวัดผลปลายภาค', maxScore: 30, sequence: 5 },
    ];
    onUpdateComponents(defaults);
    setFeedbackNotice({
      type: 'success',
      message: 'สร้างโครงสร้างคะแนนมาตรฐาน ปพ.5 (เต็ม 100 คะแนน) เรียบร้อยแล้ว'
    });
  };

  // Summary statistics for class
  const classStats = useMemo(() => {
    let totalAllScores = 0;
    let countedStudents = 0;
    const gradeCounts: Record<string, number> = {
      '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0, 'ร': 0, 'มส': 0, 'ผ': 0, 'มผ': 0
    };

    classStudents.forEach(std => {
      const liveTotal = calculateStudentLiveTotal(std.id);
      const liveGrade = calculateStudentLiveGrade(std.id, liveTotal);
      totalAllScores += liveTotal;
      countedStudents += 1;
      if (gradeCounts[liveGrade] !== undefined) {
        gradeCounts[liveGrade] += 1;
      }
    });

    const avg = countedStudents > 0 ? (totalAllScores / countedStudents).toFixed(1) : '0';
    return { avg, gradeCounts, count: countedStudents };
  }, [classStudents, localScores, localGradings, activeComponents]);

  return (
    <div className="space-y-5">
      {/* Top Filter & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                บันทึกคะแนนและตัดเกรด (ปพ.5)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              กรอกคะแนนตามช่ององค์ประกอบ คำนวณคะแนนรวมและตัดเกรดแบบเรียลไทม์ พร้อมปุ่มบันทึกและส่งข้อมูลไปยัง Google Sheets
            </p>
          </div>

          {/* Workflow Status & Save Control */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Save Status Indicator */}
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>มีข้อมูลที่ยังไม่ได้บันทึก</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{lastSavedTime ? `บันทึกล่าสุด ${lastSavedTime} น.` : 'บันทึกเรียบร้อย'}</span>
              </span>
            )}

            {/* Approval Workflow Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 text-slate-700">
              <span className="text-slate-400">สถานะ:</span>
              {currentStatus === 'draft' && <span className="text-slate-700">📝 ฉบับร่าง (กำลังกรอก)</span>}
              {currentStatus === 'submitted' && <span className="text-blue-600 font-bold">📤 ส่งงานวิชาการแล้ว</span>}
              {currentStatus === 'approved' && <span className="text-emerald-600 font-bold">✅ วิชาการอนุมัติแล้ว</span>}
              {currentStatus === 'locked' && <span className="text-rose-600 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> ปิดผล/ล็อก</span>}
            </div>

            {/* Revert button if unsaved */}
            {hasUnsavedChanges && !isSaving && (
              <button
                type="button"
                onClick={handleRevertChanges}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium transition flex items-center gap-1.5"
                title="ยกเลิกการเปลี่ยนแปลงคะแนนที่ยังไม่ได้บันทึก"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>ยกเลิก</span>
              </button>
            )}

            {/* Primary Save Button with Loading State */}
            <button
              type="button"
              onClick={handleSaveAllScoresAndSync}
              disabled={isSaving || !canEdit}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                isSaving
                  ? 'bg-indigo-400 text-white cursor-wait opacity-90'
                  : hasUnsavedChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 ring-2 ring-indigo-400 ring-offset-1'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>กำลังรวบรวมข้อมูลและส่งไป Google Sheets...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>
                    {hasUnsavedChanges 
                      ? 'บันทึกคะแนนและส่งไปยัง Google Sheets' 
                      : 'บันทึกคะแนนและส่ง Google Sheets (บันทึกแล้ว)'}
                  </span>
                </>
              )}
            </button>

            {/* Workflow submit/approve buttons */}
            {canEdit && currentStatus === 'draft' && (
              <button
                type="button"
                onClick={() => handleWorkflowTransition('submitted')}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งตรวจ</span>
              </button>
            )}

            {canApprove && currentStatus === 'submitted' && (
              <>
                <button
                  type="button"
                  onClick={() => handleWorkflowTransition('approved')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>อนุมัติเกรด</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWorkflowTransition('draft')}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>ส่งกลับแก้ไข</span>
                </button>
              </>
            )}

            {canApprove && currentStatus === 'approved' && (
              <button
                type="button"
                onClick={() => handleWorkflowTransition('locked')}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ล็อกเกรด</span>
              </button>
            )}

            {canApprove && isLocked && (
              <button
                type="button"
                onClick={() => handleWorkflowTransition('approved')}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>ปลดล็อก</span>
              </button>
            )}
          </div>
        </div>

        {/* Selection filters & Quick Actions */}
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

          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 justify-end">
            <button
              type="button"
              onClick={handleAutoCalculateAllGrades}
              disabled={!canEdit}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 font-medium flex items-center gap-1.5 text-xs transition"
              title="คำนวณคะแนนรวมและตัดเกรดให้นักเรียนทุกคนในห้องอัตโนมัติ"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>ตัดเกรดอัตโนมัติทุกคน</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComponentModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 text-xs transition"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>องค์ประกอบคะแนน ({totalMaxScore}/100)</span>
            </button>

            <button
              type="button"
              onClick={() => exportPP5ScoreSheetToExcel(selectedSubject, selectedClassroom, classStudents, activeComponents, scoreRecords, existingGradings, schoolInfo)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1.5 text-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* General Error Message Banner */}
      {generalErrorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-rose-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{generalErrorMessage}</span>
          </div>
          <button 
            onClick={() => setGeneralErrorMessage(null)} 
            className="text-rose-500 hover:text-rose-700 text-sm font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Feedback Notice Banner (Success / Google Sheets Link) */}
      {feedbackNotice && (
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          feedbackNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : feedbackNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedbackNotice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackNotice.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {feedbackNotice.spreadsheetUrl && (
              <a
                href={feedbackNotice.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition shadow-2xs"
              >
                <span>เปิดดูใน Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-slate-400 hover:text-slate-600 text-sm px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Warning if no score components */}
      {activeComponents.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">ยังไม่มีโครงสร้างองค์ประกอบคะแนนสำหรับวิชานี้ในห้อง {selectedClassroom?.name || ''}</p>
              <p className="text-amber-700">สามารถสร้างชุดคะแนนมาตรฐาน ปพ.5 (เต็ม 100 คะแนน) ได้ทันที หรือกำหนดด้วยตนเอง</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCreateDefaultComponents}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition shadow-xs"
            >
              สร้างองค์ประกอบมาตรฐาน (เต็ม 100)
            </button>
            <button
              type="button"
              onClick={() => setShowComponentModal(true)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 font-medium transition"
            >
              กำหนดเอง
            </button>
          </div>
        </div>
      )}

      {/* Warning if totalMaxScore != 100 */}
      {activeComponents.length > 0 && totalMaxScore !== 100 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              คะแนนเต็มรวมขององค์ประกอบปัจจุบันคือ <b>{totalMaxScore} คะแนน</b> (ต้องปรับให้ครบ 100 คะแนนพอดี ตามเกณฑ์มาตรฐาน ปพ.5)
            </span>
          </div>
          <button
            onClick={() => setShowComponentModal(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px]"
          >
            แก้ไขสัดส่วนให้ครบ 100
          </button>
        </div>
      )}

      {/* Spreadsheet Score Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              {selectedSubject?.code || '-'} {selectedSubject?.name || 'ไม่พบรายวิชา'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">
              ห้อง {selectedClassroom?.name || '-'}
            </span>
            <span className="text-slate-500 font-medium">({classStudents.length} คน)</span>
            {selectedSubject?.teacherName && (
              <span className="text-slate-500 font-medium">• ครูผู้สอน: {selectedSubject.teacherName}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Live Mode Indicator */}
            <span className="text-[11px] text-slate-500">
              โหมด: <span className="font-semibold text-slate-700">บันทึกด้วยปุ่ม (Manual Save)</span>
            </span>
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                ยังไม่ได้บันทึก
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                บันทึกแล้ว
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-2.5 w-12 text-center border-r border-slate-200">เลขที่</th>
                <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">รหัส</th>
                <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-200">ชื่อ-นามสกุล</th>
                
                {/* Dynamic Score Components Header */}
                {activeComponents.map((comp) => (
                  <th key={comp.id} className="py-2 px-2.5 text-center border-r border-slate-200 min-w-[105px]">
                    <div className="truncate font-medium">{comp.name}</div>
                    <div className="text-[10px] text-indigo-600 font-mono font-bold">เต็ม ({comp.maxScore})</div>
                  </th>
                ))}

                <th className="py-2 px-3 text-center w-20 border-r border-slate-200 bg-indigo-50/60">
                  <div className="font-bold text-indigo-900">รวม</div>
                  <div className="text-[10px] text-indigo-600 font-bold">(100)</div>
                </th>
                <th className="py-2 px-3 text-center w-24 border-r border-slate-200 bg-indigo-50/60">
                  <div className="font-bold text-indigo-900">ระดับผลการเรียน</div>
                  <div className="text-[10px] text-indigo-600 font-bold">(เกรด)</div>
                </th>
                <th className="py-2 px-3 min-w-[160px]">หมายเหตุ / ผลการเรียนพิเศษ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={6 + (activeComponents.length || 1)} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-sm text-slate-600">ไม่พบรายชื่อนักเรียนในห้องเรียนนี้</p>
                    <p className="text-xs text-slate-400 mt-1">กรุณาเลือกห้องเรียนอื่น หรือเพิ่มข้อมูลนักเรียนในระบบ</p>
                  </td>
                </tr>
              ) : (
                classStudents.map((std, idx) => {
                const liveTotal = calculateStudentLiveTotal(std.id);
                const liveGrade = calculateStudentLiveGrade(std.id, liveTotal);
                const gradingInfo = localGradings[std.id];

                return (
                  <tr 
                    key={std.id} 
                    className={`hover:bg-indigo-50/20 transition ${
                      idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-200">
                      {std.studentNumber ?? (idx + 1)}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                      {std.studentCode}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200 truncate">
                      {std.title}{std.firstName} {std.lastName}
                    </td>

                    {/* Component Score Inputs */}
                    {activeComponents.map((comp) => {
                      const currentVal = localScores[std.id]?.[comp.id] ?? '';
                      const cellErrorKey = `${std.id}_${comp.id}`;
                      const cellError = validationErrors[cellErrorKey];

                      return (
                        <td key={comp.id} className="py-1 px-1.5 text-center border-r border-slate-200 relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={comp.maxScore}
                            disabled={!canEdit || isSaving}
                            value={currentVal}
                            placeholder="-"
                            onChange={(e) => handleLocalScoreChange(std.id, comp.id, e.target.value, comp.maxScore)}
                            className={`w-full py-1 text-center font-mono text-xs font-semibold rounded-md border transition focus:outline-none ${
                              !canEdit || isSaving
                                ? 'bg-slate-100 text-slate-500 border-transparent cursor-not-allowed'
                                : cellError
                                  ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-300'
                                  : currentVal === '' 
                                    ? 'bg-amber-50/40 border-dashed border-amber-300 text-slate-400 focus:bg-white focus:border-indigo-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500'
                            }`}
                          />
                          {cellError && (
                            <span className="block text-[9px] text-rose-600 font-bold truncate mt-0.5">
                              {cellError}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Live Total Score Cell */}
                    <td className="py-2 px-2 text-center font-mono font-bold text-sm text-slate-900 border-r border-slate-200 bg-indigo-50/30">
                      {liveTotal}
                    </td>

                    {/* Live Grade Badge */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50/30">
                      {(() => {
                        const isHigh = liveGrade === '4' || liveGrade === '3.5';
                        const isWarn = liveGrade === '0' || liveGrade === 'ร' || liveGrade === 'มส' || liveGrade === 'มผ';

                        return (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            isHigh ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            isWarn ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {liveGrade}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Special Grade & Remarks selector */}
                    <td className="py-1 px-2">
                      <div className="flex items-center gap-1.5">
                        <select
                          disabled={!canEdit || isSaving}
                          value={gradingInfo?.isSpecialGrade ? gradingInfo.grade : ''}
                          onChange={(e) => handleSpecialGradeDropdownChange(std.id, e.target.value)}
                          className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">คำนวณตามคะแนน</option>
                          <option value="ร">ติด ร (ค้างส่งงาน)</option>
                          <option value="มส">ติด มส (เวลาเรียนไม่ถึง 80%)</option>
                          <option value="0">0 (ไม่ผ่านเกณฑ์)</option>
                          <option value="ผ">ผ (ผ่าน)</option>
                          <option value="มผ">มผ (ไม่ผ่าน)</option>
                        </select>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                          {gradingInfo?.remarks}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Bottom Class Statistics & Duplicate Save Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">สรุปภาพรวมชั้นเรียน:</span>
            <span>นักเรียนทั้งหมด <b>{classStats.count}</b> คน</span>
            <span>• คะแนนเฉลี่ย: <b className="text-indigo-600">{classStats.avg}</b> / 100</span>
            <span>• เกรด 4: <b>{classStats.gradeCounts['4']}</b> คน</span>
            <span>• เกรด 3.5: <b>{classStats.gradeCounts['3.5']}</b> คน</span>
            <span>• เกรด 3: <b>{classStats.gradeCounts['3']}</b> คน</span>
            {(classStats.gradeCounts['ร'] > 0 || classStats.gradeCounts['มส'] > 0) && (
              <span className="text-rose-600 font-semibold">
                • ค้างส่ง/มส: <b>{(classStats.gradeCounts['ร'] || 0) + (classStats.gradeCounts['มส'] || 0)}</b> คน
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasUnsavedChanges && !isSaving && (
              <button
                type="button"
                onClick={handleRevertChanges}
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition"
              >
                ยกเลิกการแก้ไข
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAllScoresAndSync}
              disabled={isSaving || !canEdit}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                isSaving
                  ? 'bg-indigo-400 text-white cursor-wait opacity-90'
                  : hasUnsavedChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 ring-2 ring-indigo-400 ring-offset-1'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>กำลังรวบรวมข้อมูลและส่งไป Google Sheets...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>
                    {hasUnsavedChanges 
                      ? 'บันทึกคะแนนและส่งไปยัง Google Sheets' 
                      : 'บันทึกคะแนนและส่ง Google Sheets (บันทึกแล้ว)'}
                  </span>
                </>
              )}
            </button>
          </div>
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
                  {selectedSubject?.code || ''} {selectedSubject?.name || ''} • คะแนนเต็มรวมต้องเท่ากับ 100 คะแนน
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
                      academicYearId: selectedSubject?.academicYearId || 'ay-2569',
                      termId: selectedSubject ? `term-${selectedSubject.academicYearId}-${selectedSubject.termNumber}` : 'term-ay-2569-1',
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
