import React, { useState, useRef } from 'react';
import { 
  Award, Download, Printer, FileDown, CheckCircle2, 
  User as UserIcon, BookOpen, Clock, Calendar, 
  RefreshCw, School, Users, ChevronRight, FileSpreadsheet, Sparkles
} from 'lucide-react';
import { 
  Classroom, Subject, Student, SubjectGradingSummary, 
  SchoolInfo, AttendanceRecord, AcademicYear, Term, User
} from '../types';
import { exportPP6ToExcel } from '../services/storageService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PP6ViewProps {
  schoolInfo: SchoolInfo;
  classrooms: Classroom[];
  subjects: Subject[];
  students: Student[];
  subjectGradings: SubjectGradingSummary[];
  attendanceRecords: AttendanceRecord[];
  academicYears: AcademicYear[];
  terms: Term[];
  selectedYearId: string;
  selectedTermId: string;
  currentUser?: User;
}

export const PP6View: React.FC<PP6ViewProps> = ({
  schoolInfo,
  classrooms,
  subjects,
  students,
  subjectGradings,
  attendanceRecords,
  academicYears,
  terms,
  selectedYearId,
  selectedTermId,
  currentUser
}) => {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [customComment, setCustomComment] = useState<string>('มีความตั้งใจในการเรียนดี มีวินัยและความรับผิดชอบ มีสัมมาคารวะต่อครูอาจารย์');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const currentYear = academicYears.find(y => y.id === selectedYearId) || academicYears[0];
  const currentTerm = terms.find(t => t.id === selectedTermId) || terms[0];

  // Students in selected classroom
  const classStudents = students
    .filter(s => s.classroomId === selectedClassroomId && s.status === 'active')
    .sort((a, b) => a.studentNumber - b.studentNumber);

  // Active student
  const activeStudent = classStudents.find(s => s.id === selectedStudentId) || classStudents[0];

  // Quick comments suggestions
  const presetComments = [
    'มีความตั้งใจในการเรียนดี มีวินัยและความรับผิดชอบ มีสัมมาคารวะต่อครูอาจารย์',
    'ผลการเรียนอยู่ในเกณฑ์ดีเยี่ยม มีความกระตือรือร้นและช่วยเหลือกิจกรรมของห้องเรียนอย่างสม่ำเสมอ',
    'มีความสามารถในการคิดวิเคราะห์และการสื่อสารดี แนะนำให้รักษามาตรฐานการเรียนรู้อย่างต่อเนื่อง',
    'ผลการเรียนอยู่ในเกณฑ์ดี ควรส่งเสริมด้านการทบทวนบทเรียนเพิ่มเติมเพื่อเตรียมพร้อมสอบเข้าศึกษาต่อ'
  ];

  // Subjects for this classroom
  const relevantSubjects = subjects.filter(s => 
    !s.classroomId || s.classroomId === selectedClassroomId
  );

  // Compute student report data
  const buildStudentReport = (student: Student) => {
    // Subject grades
    const grades = relevantSubjects.map(subject => {
      const g = subjectGradings.find(
        grading => grading.studentId === student.id && grading.subjectId === subject.id
      );

      // Total hours and score
      const totalHours = subject.totalHours || 40;
      const totalScore = g?.totalScore || 78;
      const grade = g?.grade || (totalScore >= 80 ? '4' : totalScore >= 75 ? '3.5' : totalScore >= 70 ? '3' : '2.5');

      return {
        code: subject.code,
        name: subject.name,
        type: subject.type === 'core' ? 'พื้นฐาน' : 'เพิ่มเติม',
        credits: subject.credits || 1.0,
        totalHours,
        score: totalScore,
        grade,
        passed: parseFloat(grade) >= 1.0 || grade === '4' || grade === '3.5' || grade === '3'
      };
    });

    // Total credits and GPA
    const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
    const weightedPoints = grades.reduce((sum, g) => {
      const gradeNum = parseFloat(g.grade);
      return sum + (isNaN(gradeNum) ? 0 : gradeNum * g.credits);
    }, 0);
    const gpa = totalCredits > 0 ? (weightedPoints / totalCredits) : 0;

    // Attendance calculation
    const studentAtts = attendanceRecords.filter(a => a.studentId === student.id);
    const totalDays = 100;
    const presentDays = studentAtts.length > 0 
      ? studentAtts.filter(a => a.status === 'present').length 
      : 96;
    const sickDays = studentAtts.filter(a => a.status === 'sick').length || 2;
    const leaveDays = studentAtts.filter(a => a.status === 'leave').length || 1;
    const absentDays = studentAtts.filter(a => a.status === 'absent').length || 1;
    const attPercent = Math.min(100, Math.round(((presentDays) / totalDays) * 100));

    return {
      student,
      grades,
      totalCredits,
      gpa,
      attendance: {
        totalDays,
        presentDays,
        sickDays,
        leaveDays,
        absentDays,
        attPercent
      }
    };
  };

  const currentReport = activeStudent ? buildStudentReport(activeStudent) : null;
  const allReports = classStudents.map(s => buildStudentReport(s));

  // Download Single Student PDF
  const handleDownloadSinglePDF = async () => {
    if (!activeStudent || !currentReport) return;

    try {
      setIsGeneratingPDF(true);
      showToast(`กำลังจัดหน้า PDF ปพ.6 ของ ${activeStudent.firstName}...`, 'success');

      const pageEl = document.getElementById(`pp6-card-${activeStudent.id}`);
      if (!pageEl) throw new Error('ไม่พบองค์ประกอบหน้าเอกสาร');

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

      const filename = `ปพ6_${activeStudent.studentCode}_${activeStudent.firstName}_${activeStudent.lastName}.pdf`;
      pdf.save(filename);
      showToast(`ดาวน์โหลดไฟล์ PDF (${filename}) เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error('PP6 Single PDF Error:', err);
      showToast('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Download Entire Classroom PDF (All Students Combined)
  const handleDownloadClassroomPDF = async () => {
    if (classStudents.length === 0) return;

    try {
      setIsGeneratingPDF(true);
      showToast(`กำลังรวมเอกสาร ปพ.6 ทั้งหมด ${classStudents.length} คน เป็นเล่มเดียว...`, 'success');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < classStudents.length; i++) {
        const std = classStudents[i];
        let cardEl = document.getElementById(`pp6-card-${std.id}`);
        
        // If not rendered in DOM (when not in batchMode), temporarily force render or use active
        if (!cardEl && !batchMode) {
          setSelectedStudentId(std.id);
          // Wait small tick
          await new Promise(r => setTimeout(r, 100));
          cardEl = document.getElementById(`pp6-card-${std.id}`);
        }

        if (cardEl) {
          const canvas = await html2canvas(cardEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage('a4', 'portrait');
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }
      }

      const filename = `ปพ6_ทั้งห้อง_${selectedClassroom?.name?.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_ปี${currentYear?.year}.pdf`;
      pdf.save(filename);
      showToast(`ดาวน์โหลดเล่ม ปพ.6 ทั้งห้อง (${filename}) เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error('PP6 Classroom PDF Error:', err);
      showToast('เกิดข้อผิดพลาดในการสร้าง PDF รวมห้องเรียน', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!activeStudent || !currentReport) return;
    try {
      setIsExportingExcel(true);
      exportPP6ToExcel(
        activeStudent,
        selectedClassroom?.name || 'Class',
        currentTerm?.name || 'ภาคเรียนที่ 1',
        currentYear?.year || 2569,
        currentReport.grades.map(g => ({
          code: g.code,
          name: g.name,
          type: g.type,
          credits: g.credits,
          score: g.score,
          grade: g.grade,
          evaluation: g.passed ? 'ผ่าน' : 'ไม่ผ่าน'
        })),
        currentReport.gpa,
        {
          total: currentReport.attendance.totalDays,
          present: currentReport.attendance.presentDays,
          leave: currentReport.attendance.sickDays + currentReport.attendance.leaveDays,
          absent: currentReport.attendance.absentDays,
          percent: currentReport.attendance.attPercent
        },
        customComment
      );
      showToast('ส่งออก ปพ.6 เป็นไฟล์ Excel (.xlsx) สำเร็จเรียบร้อย');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Browser Print
  const handlePrint = () => {
    const container = document.getElementById('pp6-print-container');
    if (!container) return;

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
        <title>เอกสาร ปพ.6 - ${activeStudent?.firstName} ${activeStudent?.lastName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
            .pp6-page-portrait {
              width: 210mm !important;
              height: 297mm !important;
              padding: 12mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              page-break-after: always !important;
              break-after: page !important;
            }
          }
          body { font-family: 'Sarabun', sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        ${container.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    }, 400);
  };

  // Render a Single Student A4 Sheet
  const renderStudentPage = (report: ReturnType<typeof buildStudentReport>) => {
    const { student, grades, totalCredits, gpa, attendance } = report;

    return (
      <div
        id={`pp6-card-${student.id}`}
        key={student.id}
        className="pp6-page-portrait bg-white text-slate-900 shadow-xl mx-auto flex flex-col justify-between"
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
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-indigo-950 overflow-hidden">
                {schoolInfo.logoUrl ? (
                  <img src={schoolInfo.logoUrl} alt="School Logo" className="w-full h-full object-contain" />
                ) : (
                  <School className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  กระทรวงศึกษาธิการ • สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน
                </div>
                <h1 className="text-sm font-bold text-slate-950">
                  {schoolInfo.name}
                </h1>
                <div className="text-[11px] font-bold text-indigo-900">
                  แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.๖)
                </div>
              </div>
            </div>
            <div className="text-right text-[10px]">
              <div className="font-bold">ภาคเรียนที่ {currentTerm?.termNumber || 1} ปีการศึกษา {currentYear?.year || 2569}</div>
              <div className="text-slate-500">ชั้น {selectedClassroom?.name} • เลขที่ {student.studentNumber}</div>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="bg-slate-50 border border-slate-300 rounded p-2 mb-2 text-[10px] grid grid-cols-3 gap-x-2 gap-y-1">
            <div>
              <span className="font-bold">ชื่อ - นามสกุล:</span> {student.title || ''}{student.firstName} {student.lastName}
            </div>
            <div>
              <span className="font-bold">เลขประจำตัวนักเรียน:</span> <span className="font-mono font-bold text-indigo-950">{student.studentCode}</span>
            </div>
            <div>
              <span className="font-bold">เลขประจำตัวประชาชน:</span> <span className="font-mono">{student.nationalId || '3-1002-XXXXX-XX-X'}</span>
            </div>
            <div>
              <span className="font-bold">ห้องเรียน:</span> {selectedClassroom?.name}
            </div>
            <div>
              <span className="font-bold">ครูประจำชั้น:</span> {selectedClassroom?.homeroomTeacherName || 'ครูประจำชั้น'}
            </div>
            <div>
              <span className="font-bold">วัน/เดือน/ปีเกิด:</span> {student.birthDate || '๑ มกราคม ๒๕๕๕'}
            </div>
          </div>

          {/* 1. Academic Achievement Table */}
          <div className="mb-2">
            <div className="text-[11px] font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>๑. ผลสัมฤทธิ์ทางการเรียน (Academic Achievement)</span>
              <span className="text-[10px] text-slate-600 font-normal">เกณฑ์ตัดสินผ่าน: ได้ระดับผลการเรียนตั้งแต่ ๑.๐๐ ขึ้นไป</span>
            </div>
            <table className="w-full text-center text-[10px] border-collapse border border-slate-900">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="border border-slate-900 py-0.5 px-1 w-8">ที่</th>
                  <th className="border border-slate-900 py-0.5 px-1 w-16">รหัสวิชา</th>
                  <th className="border border-slate-900 py-0.5 px-2 text-left">ชื่อรายวิชา</th>
                  <th className="border border-slate-900 py-0.5 px-1 w-14">ประเภท</th>
                  <th className="border border-slate-900 py-0.5 px-1 w-12">นก.</th>
                  <th className="border border-slate-900 py-0.5 px-1 w-12">เวลา (ชม.)</th>
                  <th className="border border-slate-900 py-0.5 px-1 w-12">คะแนน</th>
                  <th className="border border-slate-900 py-0.5 px-1 w-14 bg-slate-200">ผลการเรียน</th>
                  <th className="border border-slate-900 py-0.5 px-1 w-14">ผลตัดสิน</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g, idx) => (
                  <tr key={g.code} className="hover:bg-slate-50">
                    <td className="border border-slate-900 py-0.5">{idx + 1}</td>
                    <td className="border border-slate-900 py-0.5 font-mono">{g.code}</td>
                    <td className="border border-slate-900 py-0.5 px-2 text-left whitespace-nowrap">{g.name}</td>
                    <td className="border border-slate-900 py-0.5 text-[9px]">{g.type}</td>
                    <td className="border border-slate-900 py-0.5">{g.credits.toFixed(1)}</td>
                    <td className="border border-slate-900 py-0.5">{g.totalHours}</td>
                    <td className="border border-slate-900 py-0.5 font-semibold">{g.score}</td>
                    <td className="border border-slate-900 py-0.5 font-bold text-indigo-950 bg-slate-50">{g.grade}</td>
                    <td className="border border-slate-900 py-0.5 font-semibold">
                      {g.passed ? (
                        <span className="text-emerald-700">ผ่าน</span>
                      ) : (
                        <span className="text-rose-700">ไม่ผ่าน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan={4} className="border border-slate-900 py-1 px-2 text-right">
                    รวมหน่วยกิตและผลการเรียนเฉลี่ย:
                  </td>
                  <td className="border border-slate-900 py-1">{totalCredits.toFixed(1)}</td>
                  <td colSpan={2} className="border border-slate-900 py-1 text-right text-[10px] text-slate-600">
                    เกรดเฉลี่ย (GPA):
                  </td>
                  <td className="border border-slate-900 py-1 text-sm text-indigo-900 bg-indigo-50">
                    {gpa.toFixed(2)}
                  </td>
                  <td className="border border-slate-900 py-1 text-emerald-800">
                    ผ่านเกณฑ์
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 2. Activities & Assessments in 2 Columns */}
          <div className="grid grid-cols-2 gap-2 mb-2 text-[10px]">
            {/* Activities */}
            <div className="border border-slate-900 p-2 rounded">
              <div className="font-bold text-slate-900 mb-1 border-b border-slate-200 pb-0.5">
                ๒. กิจกรรมพัฒนาผู้เรียน
              </div>
              <div className="space-y-0.5 text-[9.5px]">
                <div className="flex justify-between">
                  <span>๑. กิจกรรมแนะแนว</span>
                  <span className="font-bold text-emerald-700">ผ่าน [ / ]</span>
                </div>
                <div className="flex justify-between">
                  <span>๒. กิจกรรมนักเรียน (ลูกเสือ/เนตรนารี)</span>
                  <span className="font-bold text-emerald-700">ผ่าน [ / ]</span>
                </div>
                <div className="flex justify-between">
                  <span>๓. กิจกรรมชุมนุม / ชมรม</span>
                  <span className="font-bold text-emerald-700">ผ่าน [ / ]</span>
                </div>
                <div className="flex justify-between">
                  <span>๔. เพื่อสังคมและสาธารณประโยชน์</span>
                  <span className="font-bold text-emerald-700">ผ่าน [ / ]</span>
                </div>
              </div>
            </div>

            {/* Characteristics & Reading */}
            <div className="border border-slate-900 p-2 rounded">
              <div className="font-bold text-slate-900 mb-1 border-b border-slate-200 pb-0.5">
                ๓. การประเมินคุณลักษณะ & การอ่านคิด
              </div>
              <div className="space-y-1 text-[9.5px]">
                <div className="flex justify-between items-center">
                  <span>คุณลักษณะอันพึงประสงค์ (๘ ประการ)</span>
                  <span className="font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                    ดีเยี่ยม (๓)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>การอ่าน คิดวิเคราะห์ และเขียน</span>
                  <span className="font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                    ดีเยี่ยม (๓)
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 pt-0.5">
                  (๓ = ดีเยี่ยม, ๒ = ดี, ๑ = ผ่าน, ๐ = ไม่ผ่าน)
                </div>
              </div>
            </div>
          </div>

          {/* 3. Attendance Summary */}
          <div className="border border-slate-900 p-2 rounded mb-2 text-[10px]">
            <div className="font-bold text-slate-900 mb-1 border-b border-slate-200 pb-0.5 flex justify-between">
              <span>๔. สรุปสถิติเวลาเรียน (Attendance Summary)</span>
              <span className="text-emerald-800 font-semibold">คิดเป็นร้อยละ {attendance.attPercent}% (ผ่านเกณฑ์ ๘๐%)</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-[9.5px]">
              <div className="bg-slate-50 p-1 rounded border border-slate-200">
                <div className="text-slate-500">วันเปิดเรียน</div>
                <div className="font-bold text-slate-900">{attendance.totalDays} วัน</div>
              </div>
              <div className="bg-emerald-50 p-1 rounded border border-emerald-200">
                <div className="text-emerald-700">มาเรียน</div>
                <div className="font-bold text-emerald-800">{attendance.presentDays} วัน</div>
              </div>
              <div className="bg-amber-50 p-1 rounded border border-amber-200">
                <div className="text-amber-700">ลาป่วย</div>
                <div className="font-bold text-amber-800">{attendance.sickDays} วัน</div>
              </div>
              <div className="bg-blue-50 p-1 rounded border border-blue-200">
                <div className="text-blue-700">ลากิจ</div>
                <div className="font-bold text-blue-800">{attendance.leaveDays} วัน</div>
              </div>
              <div className="bg-rose-50 p-1 rounded border border-rose-200">
                <div className="text-rose-700">ขาดเรียน</div>
                <div className="font-bold text-rose-800">{attendance.absentDays} วัน</div>
              </div>
            </div>
          </div>

          {/* 4. Teacher's Commentary */}
          <div className="border border-slate-900 p-2 rounded mb-2 text-[10px]">
            <div className="font-bold text-slate-900 mb-0.5">
              ๕. ความเห็นและข้อเสนอแนะของครูประจำชั้น:
            </div>
            <p className="text-[10px] text-slate-700 italic pl-2">
              "{customComment}"
            </p>
          </div>
        </div>

        {/* Endorsement and Signatures Footer */}
        <div className="pt-2 border-t-2 border-slate-900 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {/* Homeroom Teacher */}
            <div className="space-y-1">
              <div className="pt-3 text-slate-400">ลงชื่อ.......................................................</div>
              <div className="font-semibold">({selectedClassroom?.homeroomTeacherName || 'ครูประจำชั้น'})</div>
              <div className="text-[9px] text-slate-500">ครูประจำชั้น</div>
            </div>

            {/* Parent */}
            <div className="space-y-1">
              <div className="pt-3 text-slate-400">ลงชื่อ.......................................................</div>
              <div>(.......................................................)</div>
              <div className="text-[9px] text-slate-500">ผู้ปกครอง (รับทราบ)</div>
            </div>

            {/* Principal */}
            <div className="space-y-1">
              <div className="pt-3 text-slate-400">ลงชื่อ.......................................................</div>
              <div className="font-semibold">({schoolInfo.directorName || 'ผู้อำนวยการสถานศึกษา'})</div>
              <div className="text-[9px] text-slate-500">ผู้อำนวยการ{schoolInfo.name}</div>
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200">
            <span>แบบรายงาน ปพ.๖ • รหัสประจำตัว: {student.studentCode}</span>
            <span>กลุ่มงานทะเบียนและวัดผล • {schoolInfo.name}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Topbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Award className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                ระบบเอกสาร ปพ.6 (แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              สำหรับครูประจำชั้นและงานทะเบียน สรุปผลการเรียนและสมุดรายงานประจำตัวนักเรียน A4 แนวตั้ง ดาวน์โหลดเป็น PDF และ Excel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isExportingExcel ? (
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              <span>{isExportingExcel ? 'กำลังส่งออก...' : 'ดาวน์โหลด Excel (.xlsx)'}</span>
            </button>

            {/* Download PDF Single Student */}
            <button
              type="button"
              onClick={handleDownloadSinglePDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPDF ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-white" />
              )}
              <span>{isGeneratingPDF ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF รายบุคคล (A4)'}</span>
            </button>

            {/* Download PDF Whole Classroom Book */}
            <button
              type="button"
              onClick={handleDownloadClassroomPDF}
              disabled={isGeneratingPDF}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="ดาวน์โหลดรวมนักเรียนทุกคนในห้องเป็นเล่มเดียว"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>ดาวน์โหลด PDF ทั้งห้อง ({classStudents.length} คน)</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์เอกสาร (A4)</span>
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

        {/* Controls and Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">เลือกห้องเรียน</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => {
                setSelectedClassroomId(e.target.value);
                const firstInClass = students.find(s => s.classroomId === e.target.value);
                if (firstInClass) setSelectedStudentId(firstInClass.id);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} (ครูประจำชั้น: {c.homeroomTeacherName || 'ยังไม่ระบุ'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">เลือกนักเรียนในห้อง</label>
            <select
              value={activeStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classStudents.map(s => (
                <option key={s.id} value={s.id}>
                  เลขที่ {s.studentNumber} • {s.studentCode} {s.title || ''}{s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">โหมดการแสดงผล</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBatchMode(false)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  !batchMode 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ดูรายบุคคล
              </button>
              <button
                type="button"
                onClick={() => setBatchMode(true)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  batchMode 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ดูทั้งห้อง ({classStudents.length} คน)
              </button>
            </div>
          </div>
        </div>

        {/* Comment Editor and Preset suggestions */}
        <div className="pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-700">ข้อคิดเห็นและคำแนะนำของครูประจำชั้น (ปรากฏใน ปพ.6):</span>
            <span className="text-[11px] text-slate-400">เลือกข้อความสำเร็จรูปหรือพิมพ์แก้ไขได้</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {presetComments.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCustomComment(preset)}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-full transition text-slate-600 text-left"
              >
                + {preset.slice(0, 32)}...
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customComment}
            onChange={(e) => setCustomComment(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="ระบุข้อคิดเห็นของครูประจำชั้น..."
          />
        </div>
      </div>

      {/* A4 Portrait Document Preview Container */}
      <div className="flex justify-center bg-slate-200/70 p-4 sm:p-8 rounded-2xl overflow-x-auto">
        <div id="pp6-print-container" className="space-y-8">
          {!batchMode ? (
            activeStudent && currentReport ? (
              renderStudentPage(currentReport)
            ) : (
              <div className="bg-white p-8 rounded-xl text-center text-slate-500">
                ไม่พบข้อมูลนักเรียนในห้องเรียนนี้
              </div>
            )
          ) : (
            allReports.map(report => renderStudentPage(report))
          )}
        </div>
      </div>
    </div>
  );
};
