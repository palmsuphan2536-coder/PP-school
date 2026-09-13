import React from 'react';
import { 
  Users, GraduationCap, BookOpen, DoorClosed, CheckCircle2, 
  XCircle, Clock, AlertTriangle, FileSpreadsheet, FileText, 
  TrendingUp, ArrowRight, ShieldCheck, Sparkles, UserCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { AppState, AtRiskStudentInfo } from '../services/storageService';
import { ActiveTab } from './Sidebar';
import { 
  SchoolInfo, Classroom, Subject, Student, Teacher, 
  SubjectGradingSummary, AttendanceRecord, ScoreRecord, User 
} from '../types';

interface DashboardViewProps {
  state?: AppState;
  schoolInfo?: SchoolInfo;
  classrooms?: Classroom[];
  subjects?: Subject[];
  students?: Student[];
  teachers?: Teacher[];
  subjectGradings?: SubjectGradingSummary[];
  attendanceRecords?: AttendanceRecord[];
  scoreRecords?: ScoreRecord[];
  currentUser?: User;
  onNavigate?: (tab: ActiveTab) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  atRiskStudents?: AtRiskStudentInfo[];
  atRiskList?: AtRiskStudentInfo[];
  todayAttendanceSummary?: {
    present: number;
    absent: number;
    leave: number;
    sick: number;
    late: number;
    activity?: number;
    rate?: number;
  };
  onSelectStudentProfile?: (student: Student) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  schoolInfo,
  classrooms,
  subjects,
  students,
  teachers,
  subjectGradings,
  attendanceRecords,
  scoreRecords,
  currentUser,
  onNavigate,
  onNavigateTab,
  atRiskStudents,
  atRiskList,
  todayAttendanceSummary,
  onSelectStudentProfile,
}) => {
  const school = schoolInfo || state?.schoolInfo || { name: 'โรงเรียน' };
  const studentList = students || state?.students || [];
  const teacherList = teachers || state?.teachers || [];
  const subjectList = subjects || state?.subjects || [];
  const classroomList = classrooms || state?.classrooms || [];
  const gradingList = subjectGradings || state?.subjectGradings || [];
  const user = currentUser || state?.currentUser || { name: 'ครูผู้สอน', role: 'teacher' as const };
  const riskList = atRiskList || atRiskStudents || [];

  const handleNav = (tab: ActiveTab) => {
    if (onNavigate) onNavigate(tab);
    if (onNavigateTab) onNavigateTab(tab);
  };

  // Grade breakdown distribution for chart
  const gradeCounts: Record<string, number> = {
    '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0, 'ร': 0, 'มส': 0
  };

  (gradingList || []).forEach(g => {
    if (g && gradeCounts[g.grade] !== undefined) {
      gradeCounts[g.grade]++;
    }
  });

  const gradeChartData = Object.entries(gradeCounts).map(([grade, count]) => ({
    grade: `เกรด ${grade}`,
    count,
    fill: grade === '0' || grade === 'ร' || grade === 'มส' ? '#f43f5e' : '#4f46e5'
  }));

  const attendanceSummary = todayAttendanceSummary || {
    present: 7,
    absent: 1,
    leave: 1,
    sick: 1,
    late: 1,
    rate: 70
  };

  // Attendance pie data
  const attendancePieData = [
    { name: 'มาเรียน', value: attendanceSummary.present || 7, color: '#10b981' },
    { name: 'ขาดเรียน', value: attendanceSummary.absent || 1, color: '#ef4444' },
    { name: 'ลากิจ', value: attendanceSummary.leave || 1, color: '#f59e0b' },
    { name: 'ลาป่วย', value: attendanceSummary.sick || 1, color: '#3b82f6' },
    { name: 'มาสาย', value: attendanceSummary.late || 1, color: '#f97316' },
  ].filter(d => d.value > 0);

  // Counts of at-risk
  const countMS = (riskList || []).filter(s => s && s.hasMS).length;
  const countR = (riskList || []).filter(s => s && s.hasR).length;
  const countZero = (riskList || []).filter(s => s && s.hasZero).length;
  const highRiskCount = (riskList || []).filter(s => s && s.riskLevel === 'high').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur border border-white/20 text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ปีการศึกษา 2569 • ภาคเรียนที่ 1 • ระบบ ปพ.5 ออนไลน์</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              ยินดีต้อนรับ, {user.name}
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-2xl">
              {school.name} — บันทึกผลการเรียน ตรวจสอบเวลาเรียนแบบเรียลไทม์ และออกเอกสาร ปพ.5 ตามระเบียบกระทรวงศึกษาธิการ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleNav('attendance')}
              className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-semibold text-xs sm:text-sm hover:bg-indigo-50 shadow-sm transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>เช็กชื่อวันนี้</span>
            </button>
            <button
              onClick={() => handleNav('scores')}
              className="px-4 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm border border-indigo-500/50 shadow-sm transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>กรอกคะแนน ปพ.5</span>
            </button>
            <button
              onClick={() => handleNav('pp5')}
              className="px-4 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm border border-indigo-500/50 shadow-sm transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>พิมพ์ ปพ.5</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">นักเรียนทั้งหมด</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{studentList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-medium">100%</span> สถานะกำลังเรียน
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ครูและบุคลากร</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{teacherList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">ประจำการครบทุกสาระ</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ห้องเรียน</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DoorClosed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{classroomList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">ม.3/1, ม.3/2, ป.6/1</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">รายวิชาในหลักสูตร</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{subjectList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">วิชาพื้นฐานและเพิ่มเติม</div>
        </div>
      </div>

      {/* Attendance & At-Risk Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today Attendance Snapshot */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>การมาเรียนประจำวัน (วันนี้)</span>
              </h3>
              <p className="text-xs text-slate-500">ห้อง ม.3/1 • บันทึกแล้ว 100%</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              มาเรียน 70%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
              <div className="text-lg font-bold text-emerald-600">7</div>
              <div>มาเรียน (ปกติ)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
              <div className="text-lg font-bold text-rose-600">1</div>
              <div>ขาดเรียน</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
              <div className="text-lg font-bold text-amber-600">1</div>
              <div>มาสาย</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
              <div className="text-base font-bold text-blue-600">1</div>
              <div>ลาป่วย (มีใบรับรอง)</div>
            </div>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-100">
              <div className="text-base font-bold text-purple-600">1</div>
              <div>ลากิจธุระ</div>
            </div>
          </div>

          <button
            onClick={() => handleNav('attendance')}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <span>เปิดหน้าเช็กชื่อรายชั่วโมง/รายวัน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* At-Risk Intervention Alert Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>นักเรียนที่ต้องติดตาม (At-Risk)</span>
              </h3>
              <p className="text-xs text-slate-500">ผลการเรียนและเวลาเรียนต่ำกว่าเกณฑ์</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              ต้องดูแล {highRiskCount} คน
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
              <span className="font-medium text-rose-900">เวลาเรียนต่ำกว่า 80% (เสี่ยง มส)</span>
              <span className="px-2 py-0.5 rounded font-bold bg-rose-200 text-rose-800">{countMS} คน</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
              <span className="font-medium text-amber-900">ค้างส่งงาน/ชิ้นงาน (ติด ร)</span>
              <span className="px-2 py-0.5 rounded font-bold bg-amber-200 text-amber-800">{countR} คน</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">คะแนนรวมต่ำกว่า 50 (ติด 0)</span>
              <span className="px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-800">{countZero} คน</span>
            </div>
          </div>

          <button
            onClick={() => handleNav('at_risk')}
            className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>ดูรายชื่อและคำแนะนำช่วยเหลือเฉพาะบุคคล</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Approval & PP.5 Document Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>สถานะการอนุมัติและออก ปพ.5</span>
              </h3>
              <p className="text-xs text-slate-500">ขั้นตอนงานวิชาการและทะเบียน</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
              รอวิชาการอนุมัติ
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">ว23101 วิทยาศาสตร์ 5 (ม.3/1)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                ส่งงานวิชาการแล้ว
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">ค23101 คณิตศาสตร์ 5 (ม.3/1)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                กำลังบันทึกคะแนน
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-600">ท23101 ภาษาไทย 5 (ม.3/1)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                ร่าง (ยังไม่ส่ง)
              </span>
            </div>
          </div>

          <button
            onClick={() => handleNav('pp5')}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>เปิดหน้าระบบออกเอกสาร ปพ.5 ทางการ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Charts: Grade Distribution & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">การกระจายตัวของระดับผลการเรียน (ว23101)</h3>
              <p className="text-xs text-slate-500">จำนวนนักเรียนที่ได้เกรด 4, 3.5, 3, 2.5, 2, 1.5, 1, 0, ร, มส</p>
            </div>
            <span className="text-xs font-bold text-indigo-600">GPA เฉลี่ย: 3.10</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-30} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: number) => [`${val} คน`, 'จำนวนนักเรียน']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Breakdown Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">สัดส่วนการมาเรียนประจำวัน (ภาพรวม)</h3>
              <p className="text-xs text-slate-500">สถิติวันจัดการเรียนการสอนล่าสุด</p>
            </div>
            <span className="text-xs font-bold text-emerald-600">ร้อยละ 70%</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => [`${val} คน`, 'จำนวน']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend 
                  formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
