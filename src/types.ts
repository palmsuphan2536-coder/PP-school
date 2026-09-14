/**
 * types.ts - ระบบ ปพ.5 ออนไลน์ โรงเรียน (School Academic & PP.5 Management System)
 */

export type UserRole = 
  | 'super_admin'   // ผู้ดูแลระบบสูงสุด
  | 'admin'         // เจ้าหน้าที่บริหารระบบ
  | 'academic'      // งานวิชาการ/ทะเบียนวัดผล
  | 'teacher'       // ครูผู้สอน
  | 'homeroom'      // ครูประจำชั้น
  | 'executive'     // ผู้บริหารสถานศึกษา
  | 'viewer';       // ผู้ดูข้อมูลทั่วไป

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  position: string;
  department?: string;
  avatarUrl?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email: string;
  position: string;
  department: string;
  status: 'active' | 'suspended' | 'inactive';
  description?: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  affiliation: string;          // สังกัด เช่น สพป. สุพรรณบุรี เขต 1
  educationalArea: string;       // เขตพื้นที่การศึกษา
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  directorName: string;          // ผู้อำนวยการสถานศึกษา
  academicHeadName: string;      // หัวหน้างานวิชาการ
  registrarName: string;         // นายทะเบียน/วัดผล
}

export interface AcademicYear {
  id: string;
  year: number;                 // เช่น 2569, 2570
  isCurrent: boolean;
  status: 'active' | 'closed';
}

export interface Term {
  id: string;
  academicYearId: string;
  termNumber: 1 | 2;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isClosed: boolean;
  name?: string;
}

export interface Classroom {
  id: string;
  level: string;                // เช่น 'ป.6', 'ม.3'
  roomNumber: string;           // เช่น '1', '2'
  name: string;                 // เช่น 'ม.3/1'
  academicYearId: string;
  advisorTeacherId?: string;
  advisorTeacherName?: string;
  homeroomTeacherName?: string;
  studentCount?: number;
}

export type StudentStatus = 
  | 'studying'        // กำลังเรียน
  | 'active'          // กำลังเรียน
  | 'transferred_in'  // ย้ายเข้า
  | 'transferred_out' // ย้ายออก
  | 'graduated'       // จบการศึกษา
  | 'suspended';      // พักการเรียน

export interface Student {
  id: string;
  studentCode: string;          // รหัสประจำตัวนักเรียน 5 หลัก เช่น '05432'
  nationalId?: string;          // เลขบัตรประชาชน 13 หลัก
  studentNumber: number;        // เลขที่ เช่น 1, 2, 3
  title: string;                // ด.ช., ด.ญ., นาย, น.ส.
  firstName: string;
  lastName: string;
  nickName?: string;
  gender: 'M' | 'F';
  birthDate?: string;
  level: string;                // เช่น 'ม.3'
  classroomId: string;
  classroomName: string;        // เช่น 'ม.3/1'
  academicYearId: string;
  status: StudentStatus;
  parentName?: string;
  parentPhone?: string;
}

export interface Teacher {
  id: string;
  teacherCode: string;
  title: string;
  firstName: string;
  lastName: string;
  position: string;             // ครูชำนาญการพิเศษ, ครู คศ.2, etc.
  department: string;           // กลุ่มสาระการเรียนรู้
  username: string;
  role: UserRole;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  homeroomClassroomId?: string; // ห้องประจำชั้น ID
  homeroomClassroomName?: string; // ชื่อห้องประจำชั้น (เช่น ม.3/1)
}

export type SubjectType = 'basic' | 'additional' | 'activity' | 'core' | 'other';

export interface Subject {
  id: string;
  code: string;                 // เช่น 'ว23101'
  name: string;                 // เช่น 'วิทยาศาสตร์ 5'
  department: string;           // กลุ่มสาระฯ
  level: string;                // เช่น 'ม.3'
  credits: number;              // เช่น 1.5
  totalHours: number;           // เช่น 60
  termNumber: 1 | 2;
  academicYearId: string;
  type: SubjectType;
  teacherId?: string;           // รหัสครูผู้สอน
  teacherName?: string;         // ชื่อ-สกุล ครูผู้สอน เช่น 'ครูสุพรรณ เมืองทอง'
  periodsPerWeek?: number;
  classroomId?: string;
}

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  classroomId: string;
  classroomName: string;
  academicYearId: string;
  termId: string;
}

export type CalendarEventType = 
  | 'school_day'      // วันเรียน
  | 'public_holiday'  // วันหยุดราชการ
  | 'school_holiday'  // วันหยุดโรงเรียน
  | 'activity_day'    // วันกิจกรรม
  | 'exam_day'        // วันสอบ
  | 'meeting_day'     // วันประชุม
  | 'term_break'      // ปิดภาคเรียน
  | 'holiday'
  | 'activity'
  | 'exam'
  | 'other';

export interface CalendarEvent {
  id: string;
  academicYearId: string;
  termId: string;
  date?: string;                 // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  title: string;
  type: CalendarEventType;
  isSchoolDay: boolean;
  description?: string;
}

export interface TimetableSlot {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5; // 1=จันทร์ .. 5=ศุกร์
  period: number;               // 1..8
  periodNumber?: number;
  startTime: string;            // '08:30'
  endTime: string;              // '09:30'
  room?: string;
}

export type AttendanceStatus = 
  | 'present'   // มา (🟢)
  | 'absent'    // ขาด (🔴)
  | 'leave'     // ลากิจ (🟡)
  | 'sick'      // ลาป่วย (🔵)
  | 'late'      // สาย (🟠)
  | 'activity'; // กิจกรรมโรงเรียน (🟣)

export interface AttendanceRecord {
  id: string;
  type: 'daily' | 'subject';
  date: string;                 // YYYY-MM-DD
  period?: number;
  subjectId?: string;
  classroomId: string;
  teacherId: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface ScoreComponent {
  id: string;
  subjectId: string;
  classroomId: string;
  academicYearId: string;
  termId: string;
  name: string;                 // e.g. 'ใบงาน/ชิ้นงาน', 'ทดสอบย่อย', 'สอบกลางภาค', 'สอบปลายภาค'
  maxScore: number;             // e.g. 20, 20, 10, 20, 30
  sequence: number;
  type?: string;
}

export interface ScoreRecord {
  id: string;
  studentId: string;
  subjectId: string;
  componentId: string;
  score: number | null;
  academicYearId: string;
  termId: string;
  lastUpdated: string;
  updatedBy: string;
  updatedAt?: string;
}

export type SpecialGrade = 'ร' | 'มส' | 'มผ' | 'ผ' | '0';
export type AcademicGrade = '4' | '3.5' | '3' | '2.5' | '2' | '1.5' | '1' | '0' | SpecialGrade;

export interface GradingRule {
  minScore: number;
  grade: string;
  maxScore?: number;
  meaning?: string;
}

export type ApprovalStatus = 'draft' | 'submitted' | 'approved' | 'locked';

export interface SubjectGradingSummary {
  id: string;
  studentId: string;
  subjectId: string;
  classroomId: string;
  academicYearId: string;
  termId: string;
  totalScore: number;
  grade: AcademicGrade;
  isSpecialGrade: boolean;
  approvalStatus: ApprovalStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lockedAt?: string;
  lockedBy?: string;
  remarks?: string;
}

export interface PP5TemplateConfig {
  id: string;
  name: string;
  schoolHeader: boolean;
  showAttendanceTable: boolean;
  showReadingAnalysis: boolean;
  showDesirableCharacteristics: boolean;
  showGradeStatistics: boolean;
  orientation: 'landscape' | 'portrait';
}

export interface PP6SubjectGrade {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: SubjectType;
  credits: number;
  totalHours: number;
  totalScore: number;
  grade: AcademicGrade;
  isSpecialGrade: boolean;
  characteristicsScore?: number; // 0-3
  readingScore?: number; // 0-3
}

export interface PP6StudentReport {
  student: Student;
  classroom: Classroom;
  academicYear: AcademicYear;
  term: Term;
  grades: PP6SubjectGrade[];
  totalCredits: number;
  gpa: number;
  attendance: {
    totalDays: number;
    presentDays: number;
    sickDays: number;
    leaveDays: number;
    absentDays: number;
    percent: number;
  };
  activities: {
    name: string;
    passed: boolean;
  }[];
  characteristics: {
    id: number;
    name: string;
    score: number; // 1-3
  }[];
  readingScore: number; // 1-3
  teacherComment: string;
  homeroomTeacherName?: string;
}


export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;               // 'update_score', 'check_attendance', 'approve_grade', 'lock_term', etc.
  entityType: 'score' | 'attendance' | 'grade' | 'student' | 'system' | 'lock' | 'subject' | string;
  entityId: string;
  details: string;
  targetType?: string;
  oldValue?: string;
  previousValue?: string;
  newValue?: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'danger' | 'alert' | 'score_edited' | 'workflow' | 'system' | string;
  isRead: boolean;
  read?: boolean;
  link?: string;
}

export interface BackupLog {
  id: string;
  timestamp: string;
  type: string;
  status: string;
  fileSize: string;
  destination: string;
}

export type TimetablePeriod = TimetableSlot & {
  periodNumber?: number;
  subjectCode?: string;
  subjectName?: string;
};

export type SchoolCalendarEvent = CalendarEvent & {
  startDate?: string;
  endDate?: string;
  description?: string;
};

export interface AtRiskStudentInfo {
  student: Student;
  attendanceRate: number;
  totalHours: number;
  attendedHours: number;
  hasMS: boolean;               // มส = เวลาเรียนไม่ถึง 80%
  hasZero: boolean;             // มี 0
  hasR: boolean;                // มี ร
  gpa: number;
  riskLevel: 'high' | 'medium' | 'normal';
  riskReasons: string[];
  personalizedAdvice: string;
}
