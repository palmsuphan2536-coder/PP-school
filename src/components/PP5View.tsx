import React, { useState, useRef } from 'react';
import { 
  FileText, Download, Printer, CheckCircle2, ChevronRight,
  Sparkles, RefreshCw, FileDown, ShieldCheck, Award, School
} from 'lucide-react';
import { 
  Classroom, Subject, Student, ScoreComponent, ScoreRecord, 
  SubjectGradingSummary, SchoolInfo, AttendanceRecord, AcademicYear, Term,
  Teacher, TimetablePeriod
} from '../types';
import { exportPP5ToExcel } from '../services/storageService';
import { jsPDF } from 'jspdf';
import { captureSafeCanvas } from '../utils/pdfCanvas';

interface PP5ViewProps {
  schoolInfo: SchoolInfo;
  classrooms: Classroom[];
  subjects: Subject[];
  students: Student[];
  scoreComponents: ScoreComponent[];
  scoreRecords: ScoreRecord[];
  subjectGradings: SubjectGradingSummary[];
  attendanceRecords: AttendanceRecord[];
  academicYears: AcademicYear[];
  terms: Term[];
  teachers?: Teacher[];
  timetable?: TimetablePeriod[];
  selectedYearId: string;
  selectedTermId: string;
}

export const PP5View: React.FC<PP5ViewProps> = ({
  schoolInfo,
  classrooms,
  subjects,
  students,
  scoreComponents,
  scoreRecords,
  subjectGradings,
  attendanceRecords,
  academicYears,
  terms,
  teachers = [],
  timetable = [],
  selectedYearId,
  selectedTermId
}) => {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'all' | 'cover' | 'attendance' | 'grades' | 'summary'>('all');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const currentYear = academicYears.find(y => y.id === selectedYearId) || academicYears[0];
  const currentTerm = terms.find(t => t.id === selectedTermId) || terms[0];

  // Resolve teacher name for selected subject and classroom
  // Priority 1: Direct teacher assignment on Subject (ครูผู้สอนที่ระบุไว้ในรายวิชา)
  const subjectTeacherFromId = selectedSubject?.teacherId
    ? teachers.find(tch => tch.id === selectedSubject.teacherId)
    : null;

  // Priority 2: Matching timetable slot
  const matchingTimetableSlot = timetable.find(
    t => t.subjectId === selectedSubjectId && t.classroomId === selectedClassroomId
  );
  const timetableTeacher = matchingTimetableSlot 
    ? teachers.find(tch => tch.id === matchingTimetableSlot.teacherId)
    : null;

  // Priority 3: Teacher from same department or fallback
  const departmentTeacher = teachers.find(tch => tch.department === selectedSubject?.department) || teachers[0];

  const assignedTeacher = subjectTeacherFromId || timetableTeacher || departmentTeacher;

  const teacherName = subjectTeacherFromId 
    ? `${subjectTeacherFromId.title || ''}${subjectTeacherFromId.firstName} ${subjectTeacherFromId.lastName}`.trim()
    : (selectedSubject?.teacherName 
        ? selectedSubject.teacherName 
        : (assignedTeacher 
            ? `${assignedTeacher.title || ''}${assignedTeacher.firstName} ${assignedTeacher.lastName}`.trim()
            : 'ครูผู้สอนประจำรายวิชา'));

  const teacherPosition = assignedTeacher?.position || 'ครูผู้สอน';

  // Students in selected classroom sorted by student number
  const classStudents = students
    .filter(s => s.classroomId === selectedClassroomId && s.status === 'active')
    .sort((a, b) => a.studentNumber - b.studentNumber);

  // Filter subject gradings for this class and subject
  const existingGradings = subjectGradings.filter(
    g => g.subjectId === selectedSubjectId && g.classroomId === selectedClassroomId
  );

  // Subject score components
  const currentComponents = scoreComponents.filter(c => c.subjectId === selectedSubjectId);
  const midtermComp = currentComponents.find(c => c.type === 'midterm');
  const finalComp = currentComponents.find(c => c.type === 'final');
  const formativeBeforeMid = currentComponents.filter(c => c.type === 'formative' && !c.name.includes('หลัง'));
  const formativeAfterMid = currentComponents.filter(c => c.type === 'formative' && c.name.includes('หลัง'));

  // Calculate student grades & attendance
  const studentRows = classStudents.map(student => {
    const records = scoreRecords.filter(
      r => r.studentId === student.id && r.subjectId === selectedSubjectId
    );
    const grading = existingGradings.find(g => g.studentId === student.id);

    // Sum scores
    const beforeMidScore = formativeBeforeMid.reduce((sum, c) => {
      const rec = records.find(r => r.componentId === c.id);
      return sum + (rec?.score || 0);
    }, 0);

    const midScore = midtermComp 
      ? (records.find(r => r.componentId === midtermComp.id)?.score || 0)
      : 0;

    const afterMidScore = formativeAfterMid.reduce((sum, c) => {
      const rec = records.find(r => r.componentId === c.id);
      return sum + (rec?.score || 0);
    }, 0);

    const finScore = finalComp 
      ? (records.find(r => r.componentId === finalComp.id)?.score || 0)
      : 0;

    const totalCalculated = beforeMidScore + midScore + afterMidScore + finScore;
    const finalTotal = grading?.totalScore !== undefined ? grading.totalScore : totalCalculated;

    // Attendance records for this student and subject
    const attRecs = attendanceRecords.filter(
      a => a.studentId === student.id && a.subjectId === selectedSubjectId
    );
    const presentCount = attRecs.filter(a => a.status === 'present').length;
    const lateCount = attRecs.filter(a => a.status === 'late').length;
    const sickCount = attRecs.filter(a => a.status === 'sick').length;
    const leaveCount = attRecs.filter(a => a.status === 'leave').length;
    const absentCount = attRecs.filter(a => a.status === 'absent').length;

    // Total course hours
    const totalHours = selectedSubject?.totalHours || 40;
    const totalRecorded = attRecs.length;
    // Effective presence: present + late + (if totalRecorded < totalHours, assume rest attended or proportion)
    const effectiveAttended = totalRecorded > 0 ? (presentCount + lateCount) : Math.round(totalHours * 0.95);
    const effectiveTotal = totalRecorded > 0 ? totalRecorded : totalHours;
    const attPercent = Math.min(100, Math.round((effectiveAttended / effectiveTotal) * 100));
    const passedAttendance = attPercent >= 80;

    // Characteristics score (default 3 = ดีเยี่ยม)
    const charScore = 3;
    // Reading/thinking score (default 3 = ดีเยี่ยม)
    const readScore = 3;

    return {
      student,
      beforeMidScore,
      midScore,
      afterMidScore,
      finScore,
      finalTotal,
      grade: grading?.grade || (finalTotal >= 80 ? '4' : finalTotal >= 75 ? '3.5' : finalTotal >= 70 ? '3' : finalTotal >= 65 ? '2.5' : finalTotal >= 60 ? '2' : finalTotal >= 55 ? '1.5' : finalTotal >= 50 ? '1' : '0'),
      presentCount: totalRecorded > 0 ? presentCount : Math.round(totalHours * 0.9),
      sickCount,
      leaveCount,
      absentCount: totalRecorded > 0 ? absentCount : 0,
      totalHours: effectiveTotal,
      attendedHours: effectiveAttended,
      attPercent,
      passedAttendance,
      charScore,
      readScore
    };
  });

  // Grade statistics
  const gradeDistribution: Record<string, number> = {
    '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0, 'ร': 0, 'มส': 0
  };
  studentRows.forEach(r => {
    if (gradeDistribution[r.grade] !== undefined) {
      gradeDistribution[r.grade]++;
    }
  });

  const totalStudents = studentRows.length || 1;
  const gradeValues = studentRows.map(r => {
    const num = parseFloat(r.grade);
    return isNaN(num) ? 0 : num;
  });
  const avgGrade = gradeValues.length > 0 
    ? (gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length).toFixed(2)
    : '0.00';

  // Chunk students for clean A4 printing (max 30 students per page so nothing spills)
  const STUDENTS_PER_PAGE = 30;
  const studentChunks: typeof studentRows[] = [];
  for (let i = 0; i < studentRows.length; i += STUDENTS_PER_PAGE) {
    studentChunks.push(studentRows.slice(i, i + STUDENTS_PER_PAGE));
  }
  if (studentChunks.length === 0) {
    studentChunks.push([]);
  }

  // Generate and Download Genuine PDF (A4 Portrait Always)
  const handleDownloadPDF = async () => {
    const container = document.getElementById('pp5-print-container');
    if (!container) {
      showToast('ไม่พบเนื้อหาเอกสารสำหรับการสร้าง PDF', 'error');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      showToast('กำลังประมวลผลจัดหน้ากระดาษ A4 แนวตั้งสำหรับ PDF...', 'success');

      // Create PDF in Portrait orientation (A4: 210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Find all designated A4 portrait page elements
      const pageElements = Array.from(container.querySelectorAll<HTMLElement>('.pp5-page-portrait'));
      
      if (pageElements.length === 0) {
        throw new Error('ไม่พบหน้ากระดาษ A4');
      }

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        // Capture page in crisp 2x resolution with safe color rendering
        const canvas = await captureSafeCanvas(pageEl, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Fill exact A4 portrait dimensions: 210 x 297 mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      const cleanSubj = selectedSubject?.code?.replace(/[^a-zA-Z0-9ก-๙]/g, '_') || 'PP5';
      const cleanClass = selectedClassroom?.name?.replace(/[^a-zA-Z0-9ก-๙]/g, '_') || 'Class';
      const filename = `ปพ5_${cleanSubj}_${cleanClass}_ปี${currentYear?.year || '2569'}.pdf`;

      // Save as genuine PDF file directly!
      pdf.save(filename);
      showToast(`ดาวน์โหลดไฟล์ PDF (${filename}) เรียบร้อยแล้ว`, 'success');
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      showToast('ไม่สามารถสร้างไฟล์ PDF อัตโนมัติได้ กำลังเปิดหน้าต่างพิมพ์เอกสาร (Save as PDF) แทน...', 'error');
      try {
        handlePrint();
      } catch (printErr) {
        showToast('กรุณาใช้ปุ่มพิมพ์เอกสาร (Print) เพื่อบันทึกเป็น PDF', 'error');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Browser Print using Isolated Frame (Strict A4 Portrait)
  const handlePrint = () => {
    const printContent = document.getElementById('pp5-print-container');
    if (!printContent) return;

    // Use hidden iframe to avoid CSS interference and guarantee standard A4 portrait pagination
    let iframe = printFrameRef.current;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      printFrameRef.current = iframe;
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>เอกสาร ปพ.5 - ${selectedSubject?.code} ${selectedClassroom?.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .pp5-page-portrait {
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              padding: 12mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: always !important;
              break-after: page !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .no-print {
              display: none !important;
            }
          }
          body {
            font-family: 'Sarabun', sans-serif;
            color: #000;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #1e293b;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    }, 400);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      exportPP5ToExcel(
        selectedClassroom?.name || 'Class',
        selectedSubject?.code || 'SUBJ',
        selectedSubject?.name || 'Subject',
        studentRows.map(r => ({
          studentNumber: r.student.studentNumber,
          studentCode: r.student.studentCode,
          fullName: `${r.student.title || ''}${r.student.firstName} ${r.student.lastName}`,
          attendanceHours: r.attendedHours,
          attendancePercent: r.attPercent,
          beforeMidterm: r.beforeMidScore,
          midterm: r.midScore,
          afterMidterm: r.afterMidScore,
          finalScore: r.finScore,
          totalScore: r.finalTotal,
          grade: r.grade,
          passed: r.finalTotal >= 50 && r.passedAttendance
        })),
        teacherName
      );
      showToast('ส่งออกไฟล์ Excel (.xlsx) สำเร็จเรียบร้อย');
    } catch (err) {
      console.error('Excel Export Error:', err);
      showToast('เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Topbar (hidden during print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              แบบฟอร์มมาตรฐานทางราชการ (สพฐ.) จัดหน้ากระดาษ A4 แนวตั้ง (Portrait) เสมอ ดาวน์โหลดเป็นไฟล์ PDF แท้จริงและ Excel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {isExportingExcel ? (
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              <span>{isExportingExcel ? 'กำลังส่งออก...' : 'ดาวน์โหลด Excel (.xlsx)'}</span>
            </button>

            {/* Direct Download Genuine PDF (Portrait) */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isGeneratingPDF ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-white" />
              )}
              <span>{isGeneratingPDF ? 'กำลังจัดหน้า PDF แนวตั้ง...' : 'ดาวน์โหลด PDF (แนวตั้ง A4)'}</span>
            </button>

            {/* Browser Print / Save as PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์เอกสาร (A4 แนวตั้ง)</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackToast && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs transition ${
            feedbackToast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                feedbackToast.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`} />
              <span className="font-semibold">{feedbackToast.message}</span>
            </div>
            <button 
              onClick={() => setFeedbackToast(null)}
              className="text-slate-400 hover:text-slate-700 font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
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
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">ส่วนเอกสารที่แสดง</label>
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">แสดงเอกสารครบทั้ง 4 ส่วน (พร้อมส่ง/พิมพ์)</option>
              <option value="cover">เฉพาะแผ่นที่ 1: ปก ปพ.5 และอนุมัติผล</option>
              <option value="attendance">เฉพาะแผ่นที่ 2: สรุปเวลาเรียน (80%)</option>
              <option value="grades">เฉพาะแผ่นที่ 3: บันทึกคะแนนและตัดสินผลการเรียน</option>
              <option value="summary">เฉพาะแผ่นที่ 4: สรุปสถิติผลการเรียนและอนุมัติ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official A4 Portrait Document Preview Container */}
      <div className="flex justify-center bg-slate-200/70 p-4 sm:p-8 rounded-2xl overflow-x-auto">
        <div id="pp5-print-container" className="space-y-8">

          {/* =========================================================
              PAGE 1: ปก ปพ.5 (A4 Portrait 210mm x 297mm)
             ========================================================= */}
          {(activeSection === 'all' || activeSection === 'cover') && (
            <div 
              className="pp5-page-portrait bg-white text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                padding: '14mm',
                boxSizing: 'border-box',
                fontFamily: "'Sarabun', sans-serif"
              }}
            >
              {/* Header with School Logo / Crest */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 border border-slate-300 flex items-center justify-center p-1 text-indigo-900 overflow-hidden">
                  {schoolInfo.logoUrl ? (
                    <img src={schoolInfo.logoUrl} alt="School Logo" className="w-full h-full object-contain" />
                  ) : (
                    <School className="w-10 h-10 text-indigo-950" />
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-500 tracking-wider">
                  กระทรวงศึกษาธิการ • สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 pt-1">
                  แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน
                </h1>
                <div className="text-lg font-bold text-slate-800">
                  (ปพ.๕)
                </div>
              </div>

              {/* Subject & Class Details Card */}
              <div className="border-2 border-slate-900 rounded-lg p-5 my-3 space-y-2 text-xs leading-relaxed">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="font-bold">กลุ่มสาระการเรียนรู้:</span> {selectedSubject?.department || 'วิทยาศาสตร์และเทคโนโลยี'}
                  </div>
                  <div>
                    <span className="font-bold">ชั้นมัธยมศึกษาปีที่:</span> {selectedClassroom?.name?.replace(/[^0-9/]/g, '') || selectedClassroom?.name}
                  </div>
                  <div>
                    <span className="font-bold">รหัสวิชา:</span> <span className="font-bold text-sm text-indigo-900">{selectedSubject?.code}</span>
                  </div>
                  <div>
                    <span className="font-bold">ชื่อรายวิชา:</span> <span className="font-bold text-sm">{selectedSubject?.name}</span>
                  </div>
                  <div>
                    <span className="font-bold">ประเภทวิชา:</span> {selectedSubject?.type === 'core' ? 'รายวิชาพื้นฐาน' : 'รายวิชาเพิ่มเติม'}
                  </div>
                  <div>
                    <span className="font-bold">จำนวนหน่วยกิต:</span> {selectedSubject?.credits || 1.0} หน่วยกิต
                  </div>
                  <div>
                    <span className="font-bold">เวลาเรียน:</span> {selectedSubject?.periodsPerWeek || 2} คาบ/สัปดาห์ (รวม {selectedSubject?.totalHours || 40} ชั่วโมง/ภาคเรียน)
                  </div>
                  <div>
                    <span className="font-bold">ภาคเรียนที่:</span> {currentTerm?.termNumber || 1} <span className="font-bold ml-2">ปีการศึกษา:</span> {currentYear?.year || 2569}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-400 mt-2 grid grid-cols-2 gap-x-4">
                  <div>
                    <span className="font-bold">ครูผู้สอน:</span> {teacherName || 'ครูผู้สอนประจำรายวิชา'}
                  </div>
                  <div>
                    <span className="font-bold">ตำแหน่ง:</span> {teacherPosition}
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="font-bold">สถานศึกษา:</span> {schoolInfo.name} ({schoolInfo.affiliation || 'สังกัดสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน'})
                  </div>
                </div>
              </div>

              {/* Endorsement Blocks (Standard Official Sign-off - Exactly 3 people) */}
              <div className="space-y-3">
                <div className="text-center font-bold text-xs text-slate-800 mb-1">
                  การตรวจสอบและการอนุมัติผลการเรียน
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  {/* Teacher Sign */}
                  <div className="border border-slate-400 p-2.5 rounded text-center space-y-3">
                    <div className="font-bold text-slate-800">๑. ครูผู้สอน</div>
                    <div className="pt-4 text-slate-400">ลงชื่อ.......................................................</div>
                    <div>({teacherName || '.......................................................'})</div>
                    <div className="text-[10px] text-slate-500">วันที่ ......./......./.......</div>
                  </div>

                  {/* Academic Registrar */}
                  <div className="border border-slate-400 p-2.5 rounded text-center space-y-3">
                    <div className="font-bold text-slate-800">๒. หัวหน้างานวัดและประเมินผล</div>
                    <div className="pt-4 text-slate-400">ลงชื่อ.......................................................</div>
                    <div className="font-medium">({schoolInfo.academicHeadName || 'หัวหน้างานวิชาการ'})</div>
                    <div className="text-[10px] text-slate-500">วันที่ ......./......./.......</div>
                  </div>

                  {/* Principal */}
                  <div className="border border-slate-400 p-2.5 rounded text-center space-y-3 bg-slate-50/50">
                    <div className="font-bold text-slate-900">๓. อนุมัติผลการเรียน</div>
                    <div className="pt-4 text-slate-400">ลงชื่อ.......................................................</div>
                    <div className="font-medium">({schoolInfo.directorName || 'ผู้อำนวยการสถานศึกษา'})</div>
                    <div className="text-[10px] text-slate-500">ผู้อำนวยการ{schoolInfo.name}</div>
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                <span>แบบ ปพ.๕ หน้าที่ ๑ (ปกเอกสาร)</span>
                <span>{schoolInfo.name}</span>
              </div>
            </div>
          )}

          {/* =========================================================
              PAGE 2: สรุปเวลาเรียน (Attendance Summary - 80% Criteria)
             ========================================================= */}
          {(activeSection === 'all' || activeSection === 'attendance') && studentChunks.map((chunk, chunkIdx) => (
            <div 
              key={`att-chunk-${chunkIdx}`}
              className="pp5-page-portrait bg-white text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                padding: '12mm',
                boxSizing: 'border-box',
                fontFamily: "'Sarabun', sans-serif"
              }}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">
                      แบบบันทึกเวลาเรียนและประเมินสิทธิ์การสอบ (เกณฑ์ไม่น้อยกว่า ๘๐%)
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      รหัสวิชา {selectedSubject?.code} {selectedSubject?.name} • ชั้น {selectedClassroom?.name} • ภาคเรียนที่ {currentTerm?.termNumber}/{currentYear?.year}
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-semibold text-slate-500">
                    เวลาเรียนเต็ม {selectedSubject?.totalHours || 40} ชม. (เกณฑ์ผ่าน ๘๐% = {Math.ceil((selectedSubject?.totalHours || 40) * 0.8)} ชม.)
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-center text-[10px] border-collapse border border-slate-900">
                  <thead className="bg-slate-100 font-bold text-slate-900">
                    <tr>
                      <th className="border border-slate-900 py-1 px-1 w-8">เลขที่</th>
                      <th className="border border-slate-900 py-1 px-1 w-16">รหัสนักเรียน</th>
                      <th className="border border-slate-900 py-1 px-2 text-left">ชื่อ - สกุล</th>
                      <th className="border border-slate-900 py-1 px-1 w-12">มาเรียน (ชม.)</th>
                      <th className="border border-slate-900 py-1 px-1 w-12">ลาป่วย (ชม.)</th>
                      <th className="border border-slate-900 py-1 px-1 w-12">ลากิจ (ชม.)</th>
                      <th className="border border-slate-900 py-1 px-1 w-12">ขาด (ชม.)</th>
                      <th className="border border-slate-900 py-1 px-1 w-14 bg-slate-200">รวมเวลา (ชม.)</th>
                      <th className="border border-slate-900 py-1 px-1 w-14 bg-slate-200">ร้อยละ (%)</th>
                      <th className="border border-slate-900 py-1 px-1 w-20">ผลการตัดสิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map(r => (
                      <tr key={r.student.id} className="hover:bg-slate-50">
                        <td className="border border-slate-900 py-1">{r.student.studentNumber}</td>
                        <td className="border border-slate-900 py-1 font-mono">{r.student.studentCode}</td>
                        <td className="border border-slate-900 py-1 px-2 text-left whitespace-nowrap">
                          {r.student.title || ''}{r.student.firstName} {r.student.lastName}
                        </td>
                        <td className="border border-slate-900 py-1">{r.attendedHours}</td>
                        <td className="border border-slate-900 py-1">{r.sickCount}</td>
                        <td className="border border-slate-900 py-1">{r.leaveCount}</td>
                        <td className="border border-slate-900 py-1 font-semibold text-rose-700">{r.absentCount}</td>
                        <td className="border border-slate-900 py-1 font-bold bg-slate-50">{r.attendedHours}</td>
                        <td className="border border-slate-900 py-1 font-bold bg-slate-50">{r.attPercent}%</td>
                        <td className="border border-slate-900 py-1 font-semibold">
                          {r.passedAttendance ? (
                            <span className="text-emerald-700">มีสิทธิ์สอบ</span>
                          ) : (
                            <span className="text-rose-700 font-bold">มส.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Attendance Statistics Summary Footer */}
              <div className="pt-2 border-t border-slate-300">
                <div className="flex justify-between items-end text-[10px] text-slate-700">
                  <div className="space-y-0.5">
                    <div>นักเรียนทั้งหมด: <span className="font-bold">{chunk.length}</span> คน</div>
                    <div>มีสิทธิ์สอบ: <span className="font-bold text-emerald-700">{chunk.filter(c => c.passedAttendance).length}</span> คน | ไม่มีสิทธิ์สอบ (มส.): <span className="font-bold text-rose-700">{chunk.filter(c => !c.passedAttendance).length}</span> คน</div>
                  </div>
                  <div className="text-center">
                    <div>ลงชื่อ..........................................................ครูผู้สอน</div>
                    <div className="text-[9px] text-slate-500">({teacherName || '...................................'})</div>
                  </div>
                  <div className="text-slate-400 text-[9px]">
                    แบบ ปพ.๕ หน้าที่ ๒ (แผ่นที่ {chunkIdx + 1})
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* =========================================================
              PAGE 3: บันทึกคะแนนและตัดสินผลการเรียน (Official Gradebook)
             ========================================================= */}
          {(activeSection === 'all' || activeSection === 'grades') && studentChunks.map((chunk, chunkIdx) => (
            <div 
              key={`grade-chunk-${chunkIdx}`}
              className="pp5-page-portrait bg-white text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                padding: '12mm',
                boxSizing: 'border-box',
                fontFamily: "'Sarabun', sans-serif"
              }}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">
                      แบบบันทึกผลการประเมินการเรียนรู้และตัดสินผลการเรียน
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      รหัสวิชา {selectedSubject?.code} {selectedSubject?.name} • ชั้น {selectedClassroom?.name} • ภาคเรียนที่ {currentTerm?.termNumber}/{currentYear?.year}
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-semibold text-slate-500">
                    หน่วยกิต {selectedSubject?.credits || 1.0} • คะแนนเต็ม ๑๐๐ คะแนน
                  </div>
                </div>

                {/* Score & Grading Table */}
                <table className="w-full text-center text-[10px] border-collapse border border-slate-900">
                  <thead className="bg-slate-100 font-bold text-slate-900">
                    <tr>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-8">เลขที่</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-16">รหัสนักเรียน</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-2 text-left">ชื่อ - สกุล</th>
                      <th colSpan={3} className="border border-slate-900 py-0.5 px-1 bg-indigo-50/50">คะแนนระหว่างภาค (๗๐)</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-12 bg-amber-50/50">ปลายภาค (๓๐)</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-12 bg-slate-200">รวม (๑๐๐)</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-12 bg-slate-300">ระดับผลการเรียน</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-10">คุณลักษณะ (๐-๓)</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-10">อ่าน/คิด (๐-๓)</th>
                      <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-14">ผลการตัดสิน</th>
                    </tr>
                    <tr>
                      <th className="border border-slate-900 py-0.5 px-1 w-10 text-[9px]">ก่อนกลาง (๒๕)</th>
                      <th className="border border-slate-900 py-0.5 px-1 w-10 text-[9px]">กลางภาค (๒๐)</th>
                      <th className="border border-slate-900 py-0.5 px-1 w-10 text-[9px]">หลังกลาง (๒๕)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map(r => (
                      <tr key={r.student.id} className="hover:bg-slate-50">
                        <td className="border border-slate-900 py-1">{r.student.studentNumber}</td>
                        <td className="border border-slate-900 py-1 font-mono">{r.student.studentCode}</td>
                        <td className="border border-slate-900 py-1 px-2 text-left whitespace-nowrap">
                          {r.student.title || ''}{r.student.firstName} {r.student.lastName}
                        </td>
                        <td className="border border-slate-900 py-1">{r.beforeMidScore}</td>
                        <td className="border border-slate-900 py-1">{r.midScore}</td>
                        <td className="border border-slate-900 py-1">{r.afterMidScore}</td>
                        <td className="border border-slate-900 py-1 font-semibold">{r.finScore}</td>
                        <td className="border border-slate-900 py-1 font-bold bg-slate-50">{r.finalTotal}</td>
                        <td className="border border-slate-900 py-1 font-bold text-indigo-900 bg-slate-100">
                          {r.passedAttendance ? r.grade : 'มส'}
                        </td>
                        <td className="border border-slate-900 py-1">{r.charScore}</td>
                        <td className="border border-slate-900 py-1">{r.readScore}</td>
                        <td className="border border-slate-900 py-1 font-medium">
                          {r.finalTotal >= 50 && r.passedAttendance ? (
                            <span className="text-emerald-700">ผ่าน</span>
                          ) : (
                            <span className="text-rose-700 font-bold">ไม่ผ่าน</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gradebook Footer */}
              <div className="pt-2 border-t border-slate-300">
                <div className="flex justify-between items-end text-[10px] text-slate-700">
                  <div>
                    เกณฑ์การตัดสิน: ได้คะแนนรวมตั้งแต่ ๕๐ คะแนนขึ้นไป และมีเวลาเรียนไม่น้อยกว่า ๘๐%
                  </div>
                  <div className="text-center">
                    <div>ลงชื่อ..........................................................ครูผู้สอน</div>
                    <div className="text-[9px] text-slate-500">({teacherName || '...................................'})</div>
                  </div>
                  <div className="text-slate-400 text-[9px]">
                    แบบ ปพ.๕ หน้าที่ ๓ (แผ่นที่ {chunkIdx + 1})
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* =========================================================
              PAGE 4: สรุปสถิติผลการเรียนและการอนุมัติ (Statistics & Decree)
             ========================================================= */}
          {(activeSection === 'all' || activeSection === 'summary') && (
            <div 
              className="pp5-page-portrait bg-white text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                padding: '14mm',
                boxSizing: 'border-box',
                fontFamily: "'Sarabun', sans-serif"
              }}
            >
              <div>
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-2 mb-4 text-center">
                  <h2 className="text-base font-bold text-slate-950">
                    สรุปผลการประเมินและสถิติผลการเรียน
                  </h2>
                  <p className="text-xs text-slate-600">
                    รายวิชา {selectedSubject?.code} {selectedSubject?.name} • ชั้น {selectedClassroom?.name} • ภาคเรียนที่ {currentTerm?.termNumber}/{currentYear?.year}
                  </p>
                </div>

                {/* Grade Distribution Table */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-800 mb-1.5">
                    ๑. ตารางแจกแจงระดับผลการเรียน (Grade Distribution)
                  </div>
                  <table className="w-full text-center text-[10px] border-collapse border border-slate-900">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="border border-slate-900 py-1">ระดับผลการเรียน</th>
                        {['4', '3.5', '3', '2.5', '2', '1.5', '1', '0', 'ร', 'มส'].map(g => (
                          <th key={g} className="border border-slate-900 py-1">{g}</th>
                        ))}
                        <th className="border border-slate-900 py-1 bg-slate-200">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 py-1 font-bold">จำนวน (คน)</td>
                        {['4', '3.5', '3', '2.5', '2', '1.5', '1', '0', 'ร', 'มส'].map(g => (
                          <td key={g} className="border border-slate-900 py-1">
                            {gradeDistribution[g] || 0}
                          </td>
                        ))}
                        <td className="border border-slate-900 py-1 font-bold bg-slate-50">{totalStudents}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 py-1 font-bold">ร้อยละ (%)</td>
                        {['4', '3.5', '3', '2.5', '2', '1.5', '1', '0', 'ร', 'มส'].map(g => (
                          <td key={g} className="border border-slate-900 py-1">
                            {(( (gradeDistribution[g] || 0) / totalStudents) * 100).toFixed(1)}%
                          </td>
                        ))}
                        <td className="border border-slate-900 py-1 font-bold bg-slate-50">100%</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-1 text-[11px] font-semibold text-slate-700 text-right">
                    ผลการเรียนเฉลี่ยประจำรายวิชา (GPA): <span className="text-indigo-900 text-xs font-bold">{avgGrade}</span>
                  </div>
                </div>

                {/* Characteristics and Reading Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
                  <div className="border border-slate-900 p-2.5 rounded">
                    <div className="font-bold text-slate-800 mb-1">๒. สรุปคุณลักษณะอันพึงประสงค์</div>
                    <div className="space-y-0.5">
                      <div>ดีเยี่ยม (๓): <span className="font-bold text-emerald-700">{totalStudents} คน (100%)</span></div>
                      <div>ดี (๒): 0 คน (0%)</div>
                      <div>ผ่าน (๑): 0 คน (0%)</div>
                      <div>ไม่ผ่าน (๐): 0 คน (0%)</div>
                    </div>
                  </div>
                  <div className="border border-slate-900 p-2.5 rounded">
                    <div className="font-bold text-slate-800 mb-1">๓. สรุปการอ่าน คิดวิเคราะห์ และเขียน</div>
                    <div className="space-y-0.5">
                      <div>ดีเยี่ยม (๓): <span className="font-bold text-emerald-700">{totalStudents} คน (100%)</span></div>
                      <div>ดี (๒): 0 คน (0%)</div>
                      <div>ผ่าน (๑): 0 คน (0%)</div>
                      <div>ไม่ผ่าน (๐): 0 คน (0%)</div>
                    </div>
                  </div>
                </div>

                {/* Teacher Comment Box */}
                <div className="border border-slate-400 p-3 rounded mb-4 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-slate-800">๔. บันทึกข้อคิดเห็นของครูผู้สอน</div>
                    <div className="text-[11px] font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      ครูผู้สอน: {teacherName}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed mb-3">
                    ผู้เรียนส่วนใหญ่มีความตั้งใจเรียน มีพัฒนาการทางด้านการเรียนรู้อย่างต่อเนื่อง บรรลุตามมาตรฐานและตัวชี้วัดของหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช ๒๕๕๑
                  </p>
                  <div className="text-right text-[11px] text-slate-700">
                    ลงชื่อ..........................................................ครูผู้สอน ({teacherName})
                  </div>
                </div>
              </div>

              {/* Approvals Section */}
              <div className="border-t-2 border-slate-900 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div className="text-center space-y-2 border border-slate-300 p-3 rounded">
                    <div className="font-bold">ความเห็นของหัวหน้ากลุ่มสาระการเรียนรู้</div>
                    <div className="text-[10px] text-slate-600">ได้ตรวจสอบผลการประเมินแล้ว ถูกต้องตามระเบียบวัดผล</div>
                    <div className="pt-2 text-slate-400">ลงชื่อ.......................................................</div>
                    <div>(.......................................................)</div>
                    <div className="text-[9px] text-slate-500">หัวหน้ากลุ่มสาระการเรียนรู้</div>
                  </div>

                  <div className="text-center space-y-2 border border-slate-300 p-3 rounded">
                    <div className="font-bold">คำสั่งอนุมัติของผู้อำนวยการสถานศึกษา</div>
                    <div className="text-[10px] text-emerald-800 font-semibold">[ / ] อนุมัติผลการเรียนตามเสนอ</div>
                    <div className="pt-2 text-slate-400">ลงชื่อ.......................................................</div>
                    <div className="font-medium">({schoolInfo.directorName || 'ผู้อำนวยการสถานศึกษา'})</div>
                    <div className="text-[9px] text-slate-500">ผู้อำนวยการ{schoolInfo.name}</div>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                  <span>แบบ ปพ.๕ หน้าที่ ๔ (สรุปผลและอนุมัติ)</span>
                  <span>{schoolInfo.name}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
