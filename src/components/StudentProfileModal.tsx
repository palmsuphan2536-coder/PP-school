import React from 'react';
import { 
  X, User, BookOpen, Clock, AlertTriangle, CheckCircle2, 
  Printer, ShieldCheck, Sparkles, Phone, Award 
} from 'lucide-react';
import { Student, Subject, SubjectGradingSummary, AttendanceRecord, SchoolInfo } from '../types';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
  subjects?: Subject[];
  gradings?: SubjectGradingSummary[];
  attendanceRecords?: AttendanceRecord[];
  schoolInfo?: SchoolInfo;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  subjects = [],
  gradings = [],
  attendanceRecords = [],
  schoolInfo,
}) => {
  if (!student) return null;

  const studentGradings = (gradings || []).filter(g => g && g.studentId === student.id);
  const studentAttendance = (attendanceRecords || []).filter(r => r && r.studentId === student.id);

  let present = 0, absent = 0, leave = 0, sick = 0, late = 0;
  studentAttendance.forEach(r => {
    if (r.status === 'present') present++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'leave') leave++;
    else if (r.status === 'sick') sick++;
    else if (r.status === 'late') late++;
  });

  const totalRecorded = studentAttendance.length || 20;
  const attendanceRate = Math.round(((totalRecorded - absent) / totalRecorded) * 100);

  // Compute GPA
  let sumGrade = 0;
  let countGrade = 0;
  studentGradings.forEach(g => {
    const val = parseFloat(g.grade);
    if (!isNaN(val)) {
      sumGrade += val;
      countGrade++;
    }
  });
  const gpa = countGrade > 0 ? (sumGrade / countGrade).toFixed(2) : '-';

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-slate-800">
        
        {/* Header with photo avatar & close */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
              {student.firstName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {student.title}{student.firstName} {student.lastName}
                </h3>
                {student.nickName && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    น้อง{student.nickName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                เลขประจำตัว: <b className="font-mono text-slate-700">{student.studentCode}</b> • เลขที่ {student.studentNumber} • ชั้น {student.classroomName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="พิมพ์รายงานผลการเรียนรายบุคคล"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Highlights Summary Cards */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <div className="text-xs text-indigo-700 font-medium">ผลการเรียนเฉลี่ย (GPA)</div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{gpa}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-xs text-emerald-700 font-medium">ร้อยละการมาเรียน</div>
            <div className={`text-2xl font-black mt-1 ${attendanceRate < 80 ? 'text-rose-600' : 'text-emerald-900'}`}>
              {attendanceRate}%
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-600 font-medium">สถานะในระบบ</div>
            <div className="text-sm font-bold text-slate-800 mt-2">กำลังเรียนปกติ</div>
          </div>
        </div>

        {/* Academic Subject Grades Table */}
        <div className="space-y-2.5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>ผลการเรียนรายวิชา (ภาคเรียนที่ 1/2569)</span>
          </h4>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">รหัสวิชา</th>
                  <th className="py-2.5 px-3">ชื่อรายวิชา</th>
                  <th className="py-2.5 px-2 text-center">หน่วยกิต</th>
                  <th className="py-2.5 px-2 text-center">คะแนนรวม</th>
                  <th className="py-2.5 px-2 text-center">ระดับผลการเรียน</th>
                  <th className="py-2.5 px-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map(sbj => {
                  const g = studentGradings.find(item => item.subjectId === sbj.id);
                  const isLow = g && (g.grade === '0' || g.grade === 'ร' || g.grade === 'มส');

                  return (
                    <tr key={sbj.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium text-slate-700">{sbj.code}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{sbj.name}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{sbj.credits}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">{g ? g.totalScore : '-'}</td>
                      <td className="py-2 px-2 text-center font-bold">
                        {g ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            isLow ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {g.grade}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{g?.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>สถิติเวลาเรียนและการมาเรียน</span>
          </h4>

          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
              <div className="text-lg font-bold text-emerald-600">{present}</div>
              <div>มาเรียน</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 font-medium">
              <div className="text-lg font-bold text-rose-600">{absent}</div>
              <div>ขาดเรียน</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 font-medium">
              <div className="text-lg font-bold text-amber-600">{leave}</div>
              <div>ลากิจ</div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 font-medium">
              <div className="text-lg font-bold text-blue-600">{sick}</div>
              <div>ลาป่วย</div>
            </div>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-800 border border-orange-100 font-medium">
              <div className="text-lg font-bold text-orange-600">{late}</div>
              <div>มาสาย</div>
            </div>
          </div>
        </div>

        {/* Guardian Contact Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>ข้อมูลการติดต่อผู้ปกครอง</span>
          </span>
          <div className="grid grid-cols-2 gap-4 text-slate-600">
            <div>ผู้ปกครอง: <b>{student.parentName || 'ไม่ได้ระบุ'}</b></div>
            <div>เบอร์โทรศัพท์: <b>{student.parentPhone || 'ไม่ได้ระบุ'}</b></div>
            <div>ที่อยู่: {schoolInfo.subdistrict} {schoolInfo.district} {schoolInfo.province}</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
