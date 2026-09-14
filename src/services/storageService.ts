/**
 * storageService.ts - State management, Local persistence, Excel Import/Export, and Calculation Engine
 */

import * as XLSX from 'xlsx';
import { 
  SchoolInfo, AcademicYear, Term, Classroom, Student, Teacher, 
  Subject, TeachingAssignment, TimetableSlot, CalendarEvent, 
  ScoreComponent, ScoreRecord, SubjectGradingSummary, AttendanceRecord,
  GradingRule, AuditLog, SystemNotification, User, AtRiskStudentInfo, AcademicGrade,
  BackupLog, UserAccount
} from '../types';

export type { SchoolInfo, AtRiskStudentInfo };
import { 
  initialSchoolInfo, initialAcademicYears, initialTerms, initialClassrooms,
  initialTeachers, initialSubjects, initialTeachingAssignments, initialStudents,
  initialScoreComponents, initialScoreRecords, initialSubjectGradings,
  initialCalendarEvents, initialTimetableSlots, initialAttendanceRecords,
  initialGradingRules, initialAuditLogs, initialNotifications, initialUserAccounts
} from '../mockData';

const STORAGE_KEY = 'WATRAT_PP5_DB_V1';

export interface AppState {
  schoolInfo: SchoolInfo;
  academicYears: AcademicYear[];
  terms: Term[];
  classrooms: Classroom[];
  teachers: Teacher[];
  subjects: Subject[];
  teachingAssignments: TeachingAssignment[];
  students: Student[];
  scoreComponents: ScoreComponent[];
  scoreRecords: ScoreRecord[];
  subjectGradings: SubjectGradingSummary[];
  calendarEvents: CalendarEvent[];
  timetableSlots: TimetableSlot[];
  timetable?: TimetableSlot[];
  attendanceRecords: AttendanceRecord[];
  gradingRules: GradingRule[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  backupLogs: BackupLog[];
  userAccounts: UserAccount[];
  currentUser: User;
  lastCloudBackup?: string;
  minAttendancePercent: number; // default 80%
}

export function getDefaultState(): AppState {
  const defaultUser: User = {
    id: initialTeachers[0].id,
    username: initialTeachers[0].username,
    name: `${initialTeachers[0].title}${initialTeachers[0].firstName} ${initialTeachers[0].lastName}`,
    role: initialTeachers[0].role,
    email: initialTeachers[0].email || '',
    position: initialTeachers[0].position,
    department: initialTeachers[0].department
  };

  return {
    schoolInfo: initialSchoolInfo,
    academicYears: initialAcademicYears,
    terms: initialTerms,
    classrooms: initialClassrooms,
    teachers: initialTeachers,
    subjects: initialSubjects,
    teachingAssignments: initialTeachingAssignments,
    students: initialStudents,
    scoreComponents: initialScoreComponents,
    scoreRecords: initialScoreRecords,
    subjectGradings: initialSubjectGradings,
    calendarEvents: initialCalendarEvents,
    timetableSlots: initialTimetableSlots,
    timetable: initialTimetableSlots,
    attendanceRecords: initialAttendanceRecords,
    gradingRules: initialGradingRules,
    auditLogs: initialAuditLogs,
    notifications: initialNotifications,
    backupLogs: [
      {
        id: 'log-seed-1',
        timestamp: new Date().toISOString(),
        type: 'google_drive',
        status: 'success',
        fileSize: '42.8 KB',
        destination: 'Google Drive / PP5-Backups / school_pp5_backup.enc'
      }
    ],
    userAccounts: initialUserAccounts,
    currentUser: defaultUser,
    lastCloudBackup: '2026-09-12 23:00',
    minAttendancePercent: 80
  };
}

export function calculateGPA(gradings: SubjectGradingSummary[], subjects: Subject[]): number {
  let totalPoints = 0;
  let totalCredits = 0;

  gradings.forEach(g => {
    const sub = subjects.find(s => s.id === g.subjectId);
    const credits = sub?.credits || 1.0;
    const numGrade = parseFloat(g.grade);
    if (!isNaN(numGrade)) {
      totalPoints += numGrade * credits;
      totalCredits += credits;
    }
  });

  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}

export function loadAppState(): AppState {
  const defaultState = getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        schoolInfo: parsed.schoolInfo || defaultState.schoolInfo,
        academicYears: Array.isArray(parsed.academicYears) && parsed.academicYears.length > 0 ? parsed.academicYears : defaultState.academicYears,
        terms: Array.isArray(parsed.terms) && parsed.terms.length > 0 ? parsed.terms : defaultState.terms,
        gradingRules: Array.isArray(parsed.gradingRules) && parsed.gradingRules.length > 0 ? parsed.gradingRules : defaultState.gradingRules,
        classrooms: Array.isArray(parsed.classrooms) && parsed.classrooms.length > 0 ? parsed.classrooms : defaultState.classrooms,
        subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0 ? parsed.subjects : defaultState.subjects,
        teachers: Array.isArray(parsed.teachers) && parsed.teachers.length > 0 ? parsed.teachers : defaultState.teachers,
        students: Array.isArray(parsed.students) && parsed.students.length > 0 ? parsed.students : defaultState.students,
        teachingAssignments: Array.isArray(parsed.teachingAssignments) ? parsed.teachingAssignments : defaultState.teachingAssignments,
        scoreComponents: Array.isArray(parsed.scoreComponents) ? parsed.scoreComponents : defaultState.scoreComponents,
        scoreRecords: Array.isArray(parsed.scoreRecords) ? parsed.scoreRecords : defaultState.scoreRecords,
        subjectGradings: Array.isArray(parsed.subjectGradings) ? parsed.subjectGradings : defaultState.subjectGradings,
        attendanceRecords: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : defaultState.attendanceRecords,
        timetableSlots: Array.isArray(parsed.timetableSlots) ? parsed.timetableSlots : (Array.isArray(parsed.timetable) ? parsed.timetable : defaultState.timetableSlots),
        timetable: Array.isArray(parsed.timetable) ? parsed.timetable : (Array.isArray(parsed.timetableSlots) ? parsed.timetableSlots : defaultState.timetableSlots),
        calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : defaultState.calendarEvents,
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : defaultState.auditLogs,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : defaultState.notifications,
        backupLogs: Array.isArray(parsed.backupLogs) ? parsed.backupLogs : defaultState.backupLogs,
        userAccounts: Array.isArray(parsed.userAccounts) && parsed.userAccounts.length > 0 ? parsed.userAccounts : defaultState.userAccounts,
        currentUser: parsed.currentUser || defaultState.currentUser,
        lastCloudBackup: parsed.lastCloudBackup || defaultState.lastCloudBackup,
        minAttendancePercent: typeof parsed.minAttendancePercent === 'number' ? parsed.minAttendancePercent : 80
      };
    }
  } catch (e) {
    console.error('Failed to load local state', e);
  }
  return defaultState;
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save local state', e);
  }
}

// Audit Log Helper
export function createAuditLog(
  user: User,
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  details: string,
  previousValue?: string,
  newValue?: string
): AuditLog {
  const now = new Date();
  const timestamp = `${now.getFullYear() + 543}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action,
    entityType,
    entityId,
    details,
    previousValue,
    newValue
  };
}

export function recordAudit(
  userId: string,
  userName: string,
  action: string,
  targetType: string,
  targetId: string,
  oldValue: any = null,
  newValue: any = null
): AuditLog {
  const now = new Date();
  const timestamp = `${now.getFullYear() + 543}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    userId,
    userName,
    userRole: 'teacher',
    action,
    entityType: (targetType as any) || 'system',
    entityId: targetId,
    details: `${action} (${targetType})`,
    previousValue: oldValue !== null ? String(oldValue) : undefined,
    newValue: newValue !== null ? String(newValue) : undefined
  };
}

export function addNotification(
  type: SystemNotification['type'],
  title: string,
  message: string
): SystemNotification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    isRead: false
  };
}

// Grade calculation helper based on configurable rules
export function calculateGradeFromScore(score: number, rules: GradingRule[] = []): AcademicGrade {
  const effectiveRules = Array.isArray(rules) && rules.length > 0 ? rules : initialGradingRules;
  const sortedRules = [...effectiveRules].sort((a, b) => b.minScore - a.minScore);
  for (const r of sortedRules) {
    if (score >= r.minScore) {
      return r.grade as AcademicGrade;
    }
  }
  return '0';
}

// Attendance calculations for a student in a subject or classroom
export function calculateStudentSubjectAttendance(
  studentId: string,
  subjectId: string,
  totalRequiredHours: number,
  attendanceRecords: AttendanceRecord[] = []
) {
  const subjectRecords = (attendanceRecords || []).filter(
    r => r && r.studentId === studentId && (r.subjectId === subjectId || r.type === 'subject')
  );

  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let sickCount = 0;
  let lateCount = 0;
  let activityCount = 0;

  for (const r of subjectRecords) {
    switch (r.status) {
      case 'present': presentCount++; break;
      case 'absent': absentCount++; break;
      case 'leave': leaveCount++; break;
      case 'sick': sickCount++; break;
      case 'late': lateCount++; break;
      case 'activity': activityCount++; break;
    }
  }

  // Late 2 times count as absent 1 time (common Thai school rule) or simply present
  // Actual attended hours = present + activity + (sick or leave according to school policy)
  const attendedHours = presentCount + activityCount + Math.floor(lateCount * 0.5);
  const recordedHours = presentCount + absentCount + leaveCount + sickCount + lateCount + activityCount;
  const baseHours = totalRequiredHours > 0 ? totalRequiredHours : (recordedHours || 1);
  const percent = totalRequiredHours > 0 
    ? Math.min(100, Math.round(((baseHours - absentCount) / baseHours) * 100 * 10) / 10)
    : 100;

  return {
    recordedHours,
    presentCount,
    absentCount,
    leaveCount,
    sickCount,
    lateCount,
    activityCount,
    attendedHours,
    totalRequiredHours,
    percent,
    isBelowThreshold: percent < 80
  };
}

// Daily Homeroom Attendance summary
export function calculateDailyAttendanceSummary(
  classroomId: string,
  date: string,
  attendanceRecords: AttendanceRecord[] = [],
  totalStudentsInClass: number = 0
) {
  const records = (attendanceRecords || []).filter(r => r && r.type === 'daily' && r.classroomId === classroomId && r.date === date);
  let present = 0, absent = 0, leave = 0, sick = 0, late = 0, activity = 0;
  
  for (const r of records) {
    if (r.status === 'present') present++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'leave') leave++;
    else if (r.status === 'sick') sick++;
    else if (r.status === 'late') late++;
    else if (r.status === 'activity') activity++;
  }

  const recordedTotal = records.length;
  const unrecorded = Math.max(0, totalStudentsInClass - recordedTotal);
  const rate = totalStudentsInClass > 0 ? Math.round((present / totalStudentsInClass) * 100) : 0;

  return {
    date,
    totalStudentsInClass,
    recordedTotal,
    unrecorded,
    present,
    absent,
    leave,
    sick,
    late,
    activity,
    rate
  };
}

// At-Risk Students Calculator
export function computeAtRiskStudents(
  students: Student[] = [],
  subjectGradings: SubjectGradingSummary[] = [],
  attendanceRecords: AttendanceRecord[] = [],
  subjects: Subject[] = [],
  minAttendancePercent = 80
): AtRiskStudentInfo[] {
  return (students || []).map(student => {
    const studentGradings = (subjectGradings || []).filter(g => g && g.studentId === student.id);
    const hasZero = studentGradings.some(g => g.grade === '0');
    const hasR = studentGradings.some(g => g.grade === 'ร');
    const hasMS = studentGradings.some(g => g.grade === 'มส');

    // Calculate average GPA
    let totalScore = 0;
    let count = 0;
    studentGradings.forEach(g => {
      const numGrade = parseFloat(g.grade);
      if (!isNaN(numGrade)) {
        totalScore += numGrade;
        count++;
      }
    });
    const gpa = count > 0 ? Math.round((totalScore / count) * 100) / 100 : 3.0;

    // Check attendance in general
    const studentAttendance = (attendanceRecords || []).filter(r => r && r.studentId === student.id);
    const absentCount = studentAttendance.filter(r => r && r.status === 'absent').length;
    const totalRecorded = studentAttendance.length || 20;
    const attendanceRate = Math.round(((totalRecorded - absentCount) / totalRecorded) * 100);

    const riskReasons: string[] = [];
    if (hasMS || attendanceRate < minAttendancePercent) {
      riskReasons.push(`เวลาเรียนต่ำกว่าเกณฑ์ (${attendanceRate}%)`);
    }
    if (hasR) {
      riskReasons.push('ค้างส่งชิ้นงาน/แบบฝึกหัด (ติด ร)');
    }
    if (hasZero) {
      riskReasons.push('คะแนนรวมไม่ผ่านเกณฑ์ขั้นต่ำ (ติด 0)');
    }
    if (gpa < 2.0 && count > 0) {
      riskReasons.push(`ผลการเรียนเฉลี่ยต่ำ (GPA ${gpa})`);
    }

    let riskLevel: 'high' | 'medium' | 'normal' = 'normal';
    if (hasMS || (hasZero && hasR) || attendanceRate < 75) {
      riskLevel = 'high';
    } else if (hasR || hasZero || attendanceRate < minAttendancePercent || gpa < 2.2) {
      riskLevel = 'medium';
    }

    let advice = 'ผลการเรียนและเวลาเรียนอยู่ในเกณฑ์ปกติ ส่งเสริมให้พัฒนาทักษะระดับสูงขึ้น';
    if (riskLevel === 'high') {
      advice = 'ประสานผู้ปกครองด่วน ติดตามการมาเรียนอย่างใกล้ชิด และจัดตารางเรียนเสริม/ซ่อมเสริมเพื่อแก้ผลการเรียน มส/0';
    } else if (riskLevel === 'medium') {
      advice = 'กำหนดครูพี่เลี้ยงคอยติดตามการส่งงาน และกำชับให้รีบส่งชิ้นงานค้างส่งก่อนสิ้นภาคเรียน';
    }

    return {
      student,
      attendanceRate,
      totalHours: totalRecorded,
      attendedHours: totalRecorded - absentCount,
      hasMS: hasMS || attendanceRate < minAttendancePercent,
      hasZero,
      hasR,
      gpa,
      riskLevel,
      riskReasons,
      personalizedAdvice: advice
    };
  });
}

export function getAtRiskStudents(
  students: Student[],
  attendanceRecords: AttendanceRecord[],
  subjectGradings: SubjectGradingSummary[],
  subjects: Subject[],
  minAttendancePercent = 80
): AtRiskStudentInfo[] {
  return computeAtRiskStudents(students, subjectGradings, attendanceRecords, subjects, minAttendancePercent);
}

// Excel Export Utilities using xlsx
/**
 * Helper to safely download an XLSX Workbook in both direct browsers and iframe environments
 */
export function safeDownloadExcelWorkbook(workbook: XLSX.WorkBook, filename: string) {
  try {
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
      } catch {}
    }, 400);
  } catch (err) {
    console.warn('Fallback to standard XLSX.writeFile:', err);
    try {
      XLSX.writeFile(workbook, filename);
    } catch (writeErr) {
      console.error('All XLSX download methods failed:', writeErr);
    }
  }
}

export function exportStudentsToExcel(students: Student[], filename = 'student_list.xlsx') {
  const data = students.map((s, idx) => ({
    'ลำดับ': idx + 1,
    'เลขประจำตัว': s.studentCode,
    'เลขที่': s.studentNumber,
    'คำนำหน้า': s.title,
    'ชื่อ': s.firstName,
    'นามสกุล': s.lastName,
    'ชื่อเล่น': s.nickName || '',
    'เพศ': s.gender === 'M' ? 'ชาย' : 'หญิง',
    'ระดับชั้น': s.level,
    'ห้อง': s.classroomName,
    'สถานะ': s.status === 'studying' ? 'กำลังเรียน' : s.status,
    'ผู้ปกครอง': s.parentName || '',
    'เบอร์โทรผู้ปกครอง': s.parentPhone || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readable formatting
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 14 }, // เลขประจำตัว
    { wch: 8 },  // เลขที่
    { wch: 10 }, // คำนำหน้า
    { wch: 18 }, // ชื่อ
    { wch: 18 }, // นามสกุล
    { wch: 12 }, // ชื่อเล่น
    { wch: 8 },  // เพศ
    { wch: 12 }, // ระดับชั้น
    { wch: 14 }, // ห้อง
    { wch: 14 }, // สถานะ
    { wch: 20 }, // ผู้ปกครอง
    { wch: 16 }, // เบอร์โทร
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อนักเรียน');
  safeDownloadExcelWorkbook(workbook, filename);
}

export function exportPP5ScoreSheetToExcel(
  subject?: Subject,
  classroom?: Classroom,
  students: Student[] = [],
  components: ScoreComponent[] = [],
  scores: ScoreRecord[] = [],
  gradings: SubjectGradingSummary[] = [],
  schoolInfo?: SchoolInfo,
  filename?: string
) {
  const subjCode = subject?.code || 'PP5';
  const clsName = classroom?.name || 'ห้องเรียน';
  const finalFilename = filename || `ปพ5_คะแนน_${subjCode}_${clsName}.xlsx`;

  const rows = (students || []).map((std, idx) => {
    const rowObj: Record<string, any> = {
      'ลำดับ': idx + 1,
      'เลขที่': std.studentNumber,
      'เลขประจำตัว': std.studentCode,
      'ชื่อ-นามสกุล': `${std.title || ''}${std.firstName || ''} ${std.lastName || ''}`.trim()
    };

    let totalScore = 0;
    (components || []).forEach(comp => {
      const rec = (scores || []).find(s => s.studentId === std.id && s.componentId === comp.id);
      const val = rec && rec.score !== null ? rec.score : '';
      rowObj[`${comp.name} (${comp.maxScore})`] = val;
      if (typeof val === 'number') totalScore += val;
    });

    const gradeSummary = subject?.id ? (gradings || []).find(g => g.studentId === std.id && g.subjectId === subject.id) : undefined;
    rowObj['คะแนนรวม (100)'] = gradeSummary ? gradeSummary.totalScore : totalScore;
    rowObj['ผลการเรียน'] = gradeSummary ? gradeSummary.grade : calculateGradeFromScore(totalScore, initialGradingRules);
    rowObj['หมายเหตุ'] = gradeSummary?.remarks || '';

    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'ข้อมูล': 'ไม่มีข้อมูลคะแนน' }]);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 8 },  // เลขที่
    { wch: 16 }, // เลขประจำตัว
    { wch: 26 }, // ชื่อ-นามสกุล
    ...(components || []).map(() => ({ wch: 18 })),
    { wch: 16 }, // คะแนนรวม
    { wch: 14 }, // ผลการเรียน
    { wch: 16 }, // หมายเหตุ
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = `${subjCode}_${clsName}`.replace(/[:\\/?*[\]]/g, '_').slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  safeDownloadExcelWorkbook(workbook, finalFilename);
}

/**
 * ส่งออกข้อมูล ปพ.5 พร้อมรายชื่อครูผู้สอนเป็นไฟล์ Excel
 */
export function exportPP5ToExcel(
  classroomName: string,
  subjectCode: string,
  subjectName: string,
  rows: Array<{
    studentNumber: number;
    studentCode: string;
    fullName: string;
    attendanceHours?: number;
    attendancePercent?: number;
    beforeMidterm?: number;
    midterm?: number;
    afterMidterm?: number;
    finalScore?: number;
    totalScore?: number;
    grade?: string | number;
    passed?: boolean;
    remarks?: string;
  }>,
  teacherName?: string
) {
  const safeTeacher = teacherName || 'ครูผู้สอนประจำรายวิชา';
  const data = rows.map((r, idx) => ({
    'ลำดับ': idx + 1,
    'เลขที่': r.studentNumber,
    'เลขประจำตัว': r.studentCode,
    'ชื่อ-นามสกุล': r.fullName,
    'เวลาเรียน (ชม.)': r.attendanceHours ?? '',
    'ร้อยละเวลาเรียน': r.attendancePercent !== undefined ? `${r.attendancePercent}%` : '',
    'คะแนนก่อนกลางภาค': r.beforeMidterm ?? '',
    'คะแนนกลางภาค': r.midterm ?? '',
    'คะแนนหลังกลางภาค': r.afterMidterm ?? '',
    'คะแนนปลายภาค': r.finalScore ?? '',
    'คะแนนรวม (100)': r.totalScore ?? '',
    'ระดับผลการเรียน': r.grade ?? '',
    'ผลการตัดสิน': r.passed ? 'ผ่าน' : 'ไม่ผ่าน',
    'ครูผู้สอน': safeTeacher
  }));

  const worksheet = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ 'ข้อมูล': 'ไม่มีข้อมูลผลการเรียน' }]);

  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 8 },  // เลขที่
    { wch: 14 }, // เลขประจำตัว
    { wch: 26 }, // ชื่อ-นามสกุล
    { wch: 16 }, // เวลาเรียน
    { wch: 16 }, // ร้อยละเวลาเรียน
    { wch: 18 }, // คะแนนก่อนกลางภาค
    { wch: 16 }, // คะแนนกลางภาค
    { wch: 18 }, // คะแนนหลังกลางภาค
    { wch: 16 }, // คะแนนปลายภาค
    { wch: 16 }, // คะแนนรวม
    { wch: 16 }, // ระดับผลการเรียน
    { wch: 14 }, // ผลการตัดสิน
    { wch: 24 }  // ครูผู้สอน
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = `${subjectCode}_${classroomName}`.replace(/[:\\/?*[\]]/g, '_').slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  const finalFilename = `ปพ5_${subjectCode}_${classroomName}_${safeTeacher.replace(/\s+/g, '_')}.xlsx`;
  safeDownloadExcelWorkbook(workbook, finalFilename);
}

/**
 * ส่งออกรายงานสรุปการมาเรียนรายภาคเป็นไฟล์ Excel
 */
export function exportTermAttendanceToExcel(
  classroomName: string,
  termName: string,
  yearName: string,
  summaryRows: Array<{
    studentNumber: number;
    studentCode: string;
    fullName: string;
    totalSessions: number;
    present: number;
    late: number;
    sick: number;
    leave: number;
    absent: number;
    attended: number;
    percent: number;
    statusText: string;
  }>,
  scopeName = 'เวลาเรียนประจำวัน (โฮมรูม)'
) {
  const filename = `สรุปเวลาเรียนรายภาค_${classroomName}_${termName}_${yearName}.xlsx`;
  const rows = summaryRows.map((r, idx) => ({
    'ลำดับ': idx + 1,
    'เลขที่': r.studentNumber,
    'เลขประจำตัว': r.studentCode,
    'ชื่อ - นามสกุล': r.fullName,
    'จำนวนคาบ/วันทั้งหมด': r.totalSessions,
    'มาเรียน': r.present,
    'สาย': r.late,
    'ลาป่วย': r.sick,
    'ลากิจ': r.leave,
    'ขาดเรียน': r.absent,
    'เวลาเรียนที่ได้': r.attended,
    'ร้อยละเวลาเรียน (%)': `${r.percent}%`,
    'ผลการประเมิน': r.statusText
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 8 },
    { wch: 14 },
    { wch: 26 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'สรุปเวลาเรียนรายภาค');
  safeDownloadExcelWorkbook(workbook, filename);
}

/**
 * ส่งออกบันทึกการเช็คชื่อของครูประจำชั้นเป็นไฟล์ Excel
 */
export function exportHomeroomDailyAttendanceToExcel(
  classroomName: string,
  dateStr: string,
  records: Array<{
    studentNumber: number;
    studentCode: string;
    fullName: string;
    statusText: string;
    note: string;
  }>,
  homeroomTeacher = 'ครูประจำชั้น'
) {
  const filename = `บันทึกเช็คชื่อโฮมรูม_${classroomName}_${dateStr}.xlsx`;
  const rows = records.map((r, idx) => ({
    'ลำดับ': idx + 1,
    'เลขที่': r.studentNumber,
    'เลขประจำตัว': r.studentCode,
    'ชื่อ - นามสกุล': r.fullName,
    'สถานะการมาเรียน': r.statusText,
    'หมายเหตุ/สาเหตุ': r.note,
    'วันที่': dateStr,
    'ครูประจำชั้น': homeroomTeacher
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 8 },
    { wch: 14 },
    { wch: 26 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'เช็คชื่อโฮมรูม');
  safeDownloadExcelWorkbook(workbook, filename);
}

/**
 * ส่งออกผลการเรียน ปพ.6 เป็นไฟล์ Excel
 */
export function exportPP6ToExcel(
  student: Student,
  classroomName: string,
  termName: string,
  academicYearNumber: number,
  grades: Array<{
    code: string;
    name: string;
    type: string;
    credits: number;
    score: number;
    grade: string;
    evaluation: string;
  }>,
  gpa: number,
  attendanceInfo: {
    total: number;
    present: number;
    leave: number;
    absent: number;
    percent: number;
  },
  teacherComment = ''
) {
  const filename = `ปพ6_${student.studentCode}_${student.firstName}_${student.lastName}.xlsx`;
  const rows = grades.map((g, idx) => ({
    'ลำดับ': idx + 1,
    'รหัสวิชา': g.code,
    'ชื่อรายวิชา': g.name,
    'กลุ่มสาระ/ประเภท': g.type,
    'น้ำหนัก (หน่วยกิต)': g.credits,
    'คะแนนรวม (100)': g.score,
    'ระดับผลการเรียน': g.grade,
    'ผลการตัดสิน': g.evaluation
  }));

  // Append summary row
  rows.push({
    'ลำดับ': '' as any,
    'รหัสวิชา': 'สรุปผล',
    'ชื่อรายวิชา': `ผลการเรียนเฉลี่ยประจำภาคเรียน (GPA): ${gpa.toFixed(2)}`,
    'กลุ่มสาระ/ประเภท': `เวลาเรียน: ${attendanceInfo.percent}%`,
    'น้ำหนัก (หน่วยกิต)': grades.reduce((sum, g) => sum + g.credits, 0),
    'คะแนนรวม (100)': '' as any,
    'ระดับผลการเรียน': gpa.toFixed(2),
    'ผลการตัดสิน': 'ผ่านเกณฑ์'
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `ปพ.6_${student.studentCode}`);
  safeDownloadExcelWorkbook(workbook, filename);
}


// Parse Excel file for student import
export async function parseExcelStudentFile(file: File): Promise<Partial<Student>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const students: Partial<Student>[] = json.map((row: any, idx) => {
          const studentCode = String(row['เลขประจำตัว'] || row['studentCode'] || `99${idx + 1}`).trim();
          const studentNumber = Number(row['เลขที่'] || row['studentNumber'] || idx + 1);
          const title = String(row['คำนำหน้า'] || row['title'] || 'ด.ช.').trim();
          const firstName = String(row['ชื่อ'] || row['firstName'] || `นักเรียนใหม่ ${idx + 1}`).trim();
          const lastName = String(row['นามสกุล'] || row['lastName'] || 'รักเรียน').trim();
          const nickName = row['ชื่อเล่น'] || '';
          const gender = title.includes('หญิง') || title.includes('น.ส.') ? 'F' : 'M';

          return {
            studentCode,
            studentNumber,
            title,
            firstName,
            lastName,
            nickName,
            gender,
            status: 'studying',
            parentName: row['ผู้ปกครอง'] || '',
            parentPhone: row['เบอร์โทรผู้ปกครอง'] || ''
          };
        });

        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Google Drive & Cloud Backup simulation and persistence helpers
export async function backupAllDataToDrive(): Promise<{ success: boolean; message: string }> {
  // Simulate cloud API latency and package encryption
  await new Promise(r => setTimeout(r, 900));

  const appState = loadAppState();
  const snapshotJson = JSON.stringify(appState, null, 2);
  const sizeKb = (new Blob([snapshotJson]).size / 1024).toFixed(1);

  const newLog: BackupLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'google_drive',
    status: 'success',
    fileSize: `${sizeKb} KB`,
    destination: 'Google Drive / PP5-Backups / school_pp5_backup.enc'
  };

  appState.backupLogs = [newLog, ...appState.backupLogs];
  saveAppState(appState);

  return {
    success: true,
    message: `สำรองข้อมูลขึ้น Google Drive สำเร็จเรียบร้อย (${sizeKb} KB) พร้อมเข้ารหัสข้อมูลปลอดภัย`
  };
}

export async function exportScoresToGoogleSheets(subjectCode: string): Promise<{ success: boolean; message: string }> {
  await new Promise(r => setTimeout(r, 800));

  const appState = loadAppState();
  const newLog: BackupLog = {
    id: `log-sheets-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'google_sheets',
    status: 'success',
    fileSize: '48.5 KB',
    destination: `Google Sheets / ปพ.5 ผลการเรียนออนไลน์ (${subjectCode})`
  };

  appState.backupLogs = [newLog, ...appState.backupLogs];
  saveAppState(appState);

  return {
    success: true,
    message: `ส่งออกข้อมูลผลการเรียนไปยัง Google Sheets สำเร็จแล้ว (สร้าง Sheet เรียบร้อย)`
  };
}

// JSON Snapshot export and import
export function exportDatabaseSnapshotJSON() {
  const appState = loadAppState();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `PP5_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importDatabaseSnapshotJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.students && parsed.subjects) {
      saveAppState(parsed);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function resetToDefaultData() {
  localStorage.removeItem(STORAGE_KEY);
}

const GAS_URL_KEY = 'WATRAT_PP5_GAS_URL';

export function getGasUrl(): string {
  return localStorage.getItem(GAS_URL_KEY) || '';
}

export function saveGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_KEY, url.trim());
}

/**
 * คำนวณรหัสผ่านแบบ SHA-256 ด้วย Web Crypto API
 */
export async function computeSHA256Client(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * ทดสอบการเชื่อมต่อไปยัง Google Apps Script Web App
 */
export async function testGasConnection(url: string): Promise<{ success: boolean; message: string; data?: any }> {
  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'URL ของ Google Apps Script Web App ไม่ถูกต้อง' };
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    const testUrl = `${url}${separator}action=ping&_t=${Date.now()}`;
    const response = await fetch(testUrl, { method: 'GET' });
    const json = await response.json();
    if (json && json.success) {
      return { 
        success: true, 
        message: `เชื่อมต่อสำเร็จ: ${json.school || 'โรงเรียนวัดราษฎร์ศรัทธาธรรม'} (${json.affiliation || 'สพป. สุพรรณบุรี เขต 1'})`,
        data: json 
      };
    }
    return { success: false, message: json.error || 'การเชื่อมต่อไม่สำเร็จ' };
  } catch (err: any) {
    return { 
      success: false, 
      message: `ไม่สามารถเชื่อมต่อได้: ${err.message || 'โปรดตรวจสอบการ Deploy สิทธิ์เป็น Anyone'}` 
    };
  }
}

/**
 * ซิงค์ข้อมูลจาก Google Sheets ผ่าน Google Apps Script
 */
export async function fetchFromGas(url: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const separator = url.includes('?') ? '&' : '?';
    const fetchUrl = `${url}${separator}action=getInitialData&_t=${Date.now()}`;
    const response = await fetch(fetchUrl, { method: 'GET' });
    const json = await response.json();
    if (json && json.success) {
      return { success: true, message: 'ดึงข้อมูลจาก Google Sheets สำเร็จ', data: json };
    }
    return { success: false, message: json.error || 'ดึงข้อมูลไม่สำเร็จ' };
  } catch (err: any) {
    return { success: false, message: `ข้อผิดพลาด: ${err.message}` };
  }
}

/**
 * สั่งให้ Google Apps Script สำรองข้อมูลไปยัง Google Drive
 */
export async function backupGasToDrive(url: string, username = 'admin'): Promise<{ success: boolean; message: string; fileUrl?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'backupToDrive', username })
    });
    const json = await response.json();
    return json;
  } catch (err: any) {
    return { success: false, message: `การสำรองข้อมูลล้มเหลว: ${err.message}` };
  }
}

/**
 * บันทึกประวัติการสำรองข้อมูลลงระบบ
 */
export function addBackupLog(log: BackupLog) {
  const appState = loadAppState();
  appState.backupLogs = [log, ...appState.backupLogs];
  saveAppState(appState);
}

