import React, { useState } from 'react';
import { BarChart3, Download, Printer, Filter, BookOpen, School, Users, CheckCircle2, FileDown, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Classroom, Subject, Student, SubjectGradingSummary, AttendanceRecord, SchoolInfo } from '../types';
import { safeDownloadExcelWorkbook } from '../services/storageService';

interface ReportsViewProps {
  schoolInfo: SchoolInfo;
  classrooms: Classroom[];
  subjects: Subject[];
  students: Student[];
  gradings: SubjectGradingSummary[];
  attendanceRecords: AttendanceRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  schoolInfo,
  classrooms,
  subjects,
  students,
  gradings,
  attendanceRecords,
}) => {
  const [reportType, setReportType] = useState<'grades' | 'classroom' | 'attendance'>('grades');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Grade breakdown
  const gradeDistribution: Record<string, number> = {
    '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0, 'ร': 0, 'มส': 0
  };

  gradings.forEach(g => {
    if (gradeDistribution[g.grade] !== undefined) {
      gradeDistribution[g.grade]++;
    }
  });

  const gradeChartData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    grade,
    count,
  }));

  const totalGrades = gradings.length;

  // Classroom comparative data
  const classroomData = classrooms.map(cls => {
    const clsStudents = students.filter(s => s.classroomId === cls.id);
    const clsGradings = gradings.filter(g => g.classroomId === cls.id);

    let sum = 0;
    let count = 0;
    clsGradings.forEach(g => {
      const val = parseFloat(g.grade);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    });

    const avgGpa = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    return {
      name: cls.name,
      studentsCount: clsStudents.length,
      avgGpa,
    };
  });

  const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316', '#ef4444', '#94a3b8', '#64748b'];

  const handleExportExcel = () => {
    const rows = reportType === 'grades'
      ? gradeChartData.map(g => ({
          'ระดับผลการเรียน': g.grade,
          'จำนวนนักเรียน (คน)': g.count,
          'ร้อยละ (%)': totalGrades > 0 ? ((g.count / totalGrades) * 100).toFixed(2) : '0.00'
        }))
      : classroomData.map(c => ({
          'ห้องเรียน': c.name,
          'จำนวนนักเรียน (คน)': c.studentsCount,
          'เกรดเฉลี่ย (GPA)': c.avgGpa
        }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานสรุปสารสนเทศ');
    safeDownloadExcelWorkbook(workbook, `รายงานสรุปสารสนเทศ_${schoolInfo.name || 'โรงเรียน'}.xlsx`);
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const elem = document.getElementById('report-printable-area');
      if (!elem) throw new Error('Not found');

      const canvas = await html2canvas(elem, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
      pdf.save(`รายงานสารสนเทศ_${schoolInfo.name || 'โรงเรียน'}.pdf`);
    } catch (e) {
      console.warn('PDF export fallback:', e);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">รายงานสรุปสารสนเทศทางการศึกษา</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              สถิติภาพรวมระดับสถานศึกษา ผลสัมฤทธิ์ทางการเรียน และการวิเคราะห์เปรียบเทียบตามเกณฑ์ สพฐ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-60 cursor-pointer"
            >
              {isExportingPDF ? (
                <RefreshCw className="w-4 h-4 text-rose-600 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-rose-600" />
              )}
              <span>{isExportingPDF ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (.pdf)'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน (A4)</span>
            </button>
          </div>
        </div>

        {/* Report Category Switcher */}
        <div className="flex gap-2 border-t border-slate-100 pt-3 text-xs">
          <button
            onClick={() => setReportType('grades')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              reportType === 'grades' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            การกระจายตัวของระดับผลการเรียน
          </button>
          <button
            onClick={() => setReportType('classroom')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              reportType === 'classroom' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            เปรียบเทียบผลการเรียนเฉลี่ยตามห้องเรียน
          </button>
        </div>
      </div>

      {/* Visual Charts & Data Section */}
      <div id="report-printable-area" className="space-y-6">
        {reportType === 'grades' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">การแจกแจงระดับผลการเรียนทั้งสถานศึกษา</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="grade" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" name="จำนวน (คน)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">สัดส่วนผลการเรียน (ร้อยละ)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeChartData}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportType === 'classroom' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">เกรดเฉลี่ย (GPA) เปรียบเทียบรายห้องเรียน</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classroomData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 4]} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="avgGpa" name="เกรดเฉลี่ยห้อง" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
