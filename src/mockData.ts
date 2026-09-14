/**
 * mockData.ts - ข้อมูลตั้งต้นสำหรับระบบ ปพ.5 โรงเรียน (Thai School Management System Seed Data)
 * ข้อมูลอ้างอิงตามโรงเรียนวัดราษฎร์ศรัทธาธรรม จ.สุพรรณบุรี
 */

import { 
  SchoolInfo, AcademicYear, Term, Classroom, Student, Teacher, 
  Subject, TeachingAssignment, TimetableSlot, CalendarEvent, 
  ScoreComponent, ScoreRecord, SubjectGradingSummary, AttendanceRecord,
  GradingRule, AuditLog, SystemNotification, UserAccount
} from './types';

export const initialUserAccounts: UserAccount[] = [
  {
    id: 'usr-01',
    username: 'admin',
    password: '1234',
    name: 'ผู้ดูแลระบบระบบ (Admin)',
    role: 'super_admin',
    email: 'rst72010045@gmail.com',
    position: 'ผู้ดูแลระบบสารสนเทศ ปพ.5',
    department: 'งานเทคโนโลยีสารสนเทศ',
    status: 'active',
    description: 'ผู้ดูแลระบบ (Admin): สิทธิ์สูงสุด เข้าถึงและจัดการทุกส่วนของระบบ'
  },
  {
    id: 'usr-02',
    username: 'director',
    password: '123456',
    name: 'นายประสิทธิ์ พงษ์พานิช (ผู้อำนวยการ)',
    role: 'executive',
    email: 'director@watrat.ac.th',
    position: 'ผู้อำนวยการสถานศึกษา',
    department: 'ฝ่ายบริหาร',
    status: 'active',
    description: 'ผู้อำนวยการ: ตรวจสอบและอนุมัติผลการเรียน ปพ.5'
  },
  {
    id: 'usr-03',
    username: 'prasert',
    password: '123456',
    name: 'นายประเสริฐ ดีเลิศ (หัวหน้าวิชาการ)',
    role: 'academic',
    email: 'prasert@watrat.ac.th',
    position: 'หัวหน้างานวิชาการและทะเบียนวัดผล',
    department: 'กลุ่มสาระการเรียนรู้ภาษาไทย',
    status: 'active',
    description: 'งานวิชาการ: จัดการแผนการเรียน ปิดภาคเรียน และกำกับติดตามผลการเรียน'
  },
  {
    id: 'usr-04',
    username: 'somsri',
    password: '123456',
    name: 'นางสมศรี นวลจันทร์ (ครูประจำชั้น ม.3/2)',
    role: 'homeroom',
    email: 'somsri@watrat.ac.th',
    position: 'ครูชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    status: 'active',
    description: 'ครูประจำชั้น: เช็กชื่อประจำวัน ดูแลนักเรียนในที่ปรึกษา'
  },
  {
    id: 'usr-05',
    username: 'suphan',
    password: '123456',
    name: 'นายสุพรรณ เมืองทอง (ครูผู้สอน)',
    role: 'teacher',
    email: 'suphan@watrat.ac.th',
    position: 'ครูชำนาญการพิเศษ',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    status: 'active',
    description: 'ครูผู้สอน: บันทึกคะแนน เช็กชื่อรายวิชา และส่งผลการเรียน'
  }
];

export const initialSchoolInfo: SchoolInfo = {
  id: 'sch-01',
  name: 'โรงเรียนวัดราษฎร์ศรัทธาธรรม',
  address: 'หมู่ที่ 3',
  subdistrict: 'ต.ศาลาขาว',
  district: 'อ.เมืองสุพรรณบุรี',
  province: 'จ.สุพรรณบุรี',
  postalCode: '72000',
  affiliation: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุพรรณบุรี เขต 1',
  educationalArea: 'สพป. สุพรรณบุรี เขต 1',
  phone: '035-512345',
  email: 'watratsatthatham@spb1.go.th',
  website: 'https://watrat.spb1.go.th',
  directorName: 'นายประสิทธิ์ พงษ์พานิช',
  academicHeadName: 'นางกาญจนา สุวรรณสิทธิ์',
  registrarName: 'นายวิเชียร สมใจนึก'
};

export const initialAcademicYears: AcademicYear[] = [
  { id: 'ay-2569', year: 2569, isCurrent: true, status: 'active' },
  { id: 'ay-2568', year: 2568, isCurrent: false, status: 'closed' },
  { id: 'ay-2570', year: 2570, isCurrent: false, status: 'active' },
];

export const initialTerms: Term[] = [
  { id: 'term-2569-1', academicYearId: 'ay-2569', termNumber: 1, startDate: '2026-05-16', endDate: '2026-10-10', isCurrent: true, isClosed: false },
  { id: 'term-2569-2', academicYearId: 'ay-2569', termNumber: 2, startDate: '2026-11-01', endDate: '2027-03-31', isCurrent: false, isClosed: false },
  { id: 'term-2568-1', academicYearId: 'ay-2568', termNumber: 1, startDate: '2025-05-16', endDate: '2025-10-10', isCurrent: false, isClosed: true },
  { id: 'term-2568-2', academicYearId: 'ay-2568', termNumber: 2, startDate: '2025-11-01', endDate: '2026-03-31', isCurrent: false, isClosed: true },
];

export const initialClassrooms: Classroom[] = [
  { id: 'cls-m3-1', level: 'ม.3', roomNumber: '1', name: 'ม.3/1', academicYearId: 'ay-2569', advisorTeacherId: 'tch-01', advisorTeacherName: 'ครูสุพรรณ เมืองทอง', studentCount: 20 },
  { id: 'cls-m3-2', level: 'ม.3', roomNumber: '2', name: 'ม.3/2', academicYearId: 'ay-2569', advisorTeacherId: 'tch-02', advisorTeacherName: 'ครูสมศรี นวลจันทร์', studentCount: 18 },
  { id: 'cls-p6-1', level: 'ป.6', roomNumber: '1', name: 'ป.6/1', academicYearId: 'ay-2569', advisorTeacherId: 'tch-03', advisorTeacherName: 'ครูประเสริฐ ดีเลิศ', studentCount: 22 },
];

export const initialTeachers: Teacher[] = [
  { id: 'tch-01', teacherCode: 'T101', title: 'นาย', firstName: 'สุพรรณ', lastName: 'เมืองทอง', position: 'ครูชำนาญการพิเศษ', department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', username: 'suphan', role: 'teacher', phone: '081-234-5678', email: 'suphan@watrat.ac.th', status: 'active' },
  { id: 'tch-02', teacherCode: 'T102', title: 'นาง', firstName: 'สมศรี', lastName: 'นวลจันทร์', position: 'ครูชำนาญการ', department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์', username: 'somsri', role: 'homeroom', phone: '082-345-6789', email: 'somsri@watrat.ac.th', status: 'active' },
  { id: 'tch-03', teacherCode: 'T103', title: 'นาย', firstName: 'ประเสริฐ', lastName: 'ดีเลิศ', position: 'ครูชำนาญการพิเศษ', department: 'กลุ่มสาระการเรียนรู้ภาษาไทย', username: 'prasert', role: 'academic', phone: '083-456-7890', email: 'prasert@watrat.ac.th', status: 'active' },
  { id: 'tch-04', teacherCode: 'T104', title: 'นาย', firstName: 'สมชาย', lastName: 'แสนสุข', position: 'นักวิชาการคอมพิวเตอร์', department: 'งานเทคโนโลยีสารสนเทศ', username: 'admin', role: 'super_admin', phone: '084-567-8901', email: 'admin@watrat.ac.th', status: 'active' },
  { id: 'tch-05', teacherCode: 'T105', title: 'นาย', firstName: 'ประสิทธิ์', lastName: 'พงษ์พานิช', position: 'ผู้อำนวยการสถานศึกษา', department: 'ฝ่ายบริหาร', username: 'director', role: 'executive', phone: '085-678-9012', email: 'director@watrat.ac.th', status: 'active' },
];

export const initialSubjects: Subject[] = [
  { id: 'sbj-sci31', code: 'ว23101', name: 'วิทยาศาสตร์ 5', department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', level: 'ม.3', credits: 1.5, totalHours: 60, termNumber: 1, academicYearId: 'ay-2569', type: 'basic', teacherId: 'tch-01', teacherName: 'ครูสุพรรณ เมืองทอง' },
  { id: 'sbj-math31', code: 'ค23101', name: 'คณิตศาสตร์พื้นฐาน 5', department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์', level: 'ม.3', credits: 1.5, totalHours: 60, termNumber: 1, academicYearId: 'ay-2569', type: 'basic', teacherId: 'tch-02', teacherName: 'ครูสมศรี นวลจันทร์' },
  { id: 'sbj-tha31', code: 'ท23101', name: 'ภาษาไทย 5', department: 'กลุ่มสาระการเรียนรู้ภาษาไทย', level: 'ม.3', credits: 1.5, totalHours: 60, termNumber: 1, academicYearId: 'ay-2569', type: 'basic', teacherId: 'tch-03', teacherName: 'ครูประเสริฐ ดีเลิศ' },
  { id: 'sbj-eng31', code: 'อ23101', name: 'ภาษาอังกฤษ 5', department: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', level: 'ม.3', credits: 1.5, totalHours: 60, termNumber: 1, academicYearId: 'ay-2569', type: 'basic', teacherId: 'tch-01', teacherName: 'ครูสุพรรณ เมืองทอง' },
  { id: 'sbj-soc31', code: 'ส23101', name: 'สังคมศึกษา 5', department: 'กลุ่มสาระการเรียนรู้สังคมศึกษาฯ', level: 'ม.3', credits: 1.5, totalHours: 60, termNumber: 1, academicYearId: 'ay-2569', type: 'basic', teacherId: 'tch-02', teacherName: 'ครูสมศรี นวลจันทร์' },
];

export const initialTeachingAssignments: TeachingAssignment[] = [
  { id: 'ta-01', teacherId: 'tch-01', teacherName: 'ครูสุพรรณ เมืองทอง', subjectId: 'sbj-sci31', subjectCode: 'ว23101', subjectName: 'วิทยาศาสตร์ 5', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', termId: 'term-2569-1' },
  { id: 'ta-02', teacherId: 'tch-02', teacherName: 'ครูสมศรี นวลจันทร์', subjectId: 'sbj-math31', subjectCode: 'ค23101', subjectName: 'คณิตศาสตร์พื้นฐาน 5', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', termId: 'term-2569-1' },
  { id: 'ta-03', teacherId: 'tch-03', teacherName: 'ครูประเสริฐ ดีเลิศ', subjectId: 'sbj-tha31', subjectCode: 'ท23101', subjectName: 'ภาษาไทย 5', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', termId: 'term-2569-1' },
];

export const initialStudents: Student[] = [
  { id: 'std-01', studentCode: '05401', nationalId: '1729900123451', studentNumber: 1, title: 'เด็กชาย', firstName: 'กิตติศักดิ์', lastName: 'ศิริผล', nickName: 'กันต์', gender: 'M', birthDate: '2011-03-15', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นายศักดา ศิริผล', parentPhone: '081-111-2233' },
  { id: 'std-02', studentCode: '05402', nationalId: '1729900123452', studentNumber: 2, title: 'เด็กชาย', firstName: 'ชานนท์', lastName: 'เจริญสุข', nickName: 'นนท์', gender: 'M', birthDate: '2011-04-20', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นางชลธิชา เจริญสุข', parentPhone: '082-222-3344' },
  { id: 'std-03', studentCode: '05403', nationalId: '1729900123453', studentNumber: 3, title: 'เด็กชาย', firstName: 'ณัฐพงษ์', lastName: 'แก้วมณี', nickName: 'นัท', gender: 'M', birthDate: '2011-01-10', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นายสมเกียรติ แก้วมณี', parentPhone: '083-333-4455' },
  { id: 'std-04', studentCode: '05404', nationalId: '1729900123454', studentNumber: 4, title: 'เด็กหญิง', firstName: 'ธิดารัตน์', lastName: 'บุญมี', nickName: 'พลอย', gender: 'F', birthDate: '2011-07-25', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นายบุญชู บุญมี', parentPhone: '084-444-5566' },
  { id: 'std-05', studentCode: '05405', nationalId: '1729900123455', studentNumber: 5, title: 'เด็กหญิง', firstName: 'นภัสสร', lastName: 'วงศ์สุวรรณ', nickName: 'พิม', gender: 'F', birthDate: '2011-09-12', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นางพรรณี วงศ์สุวรรณ', parentPhone: '085-555-6677' },
  { id: 'std-06', studentCode: '05406', nationalId: '1729900123456', studentNumber: 6, title: 'เด็กหญิง', firstName: 'ปพิชญา', lastName: 'มิ่งขวัญ', nickName: 'ข้าวหอม', gender: 'F', birthDate: '2011-11-03', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นายประสิทธิ์ มิ่งขวัญ', parentPhone: '086-666-7788' },
  { id: 'std-07', studentCode: '05407', nationalId: '1729900123457', studentNumber: 7, title: 'เด็กชาย', firstName: 'พีรวิชญ์', lastName: 'ทองหล่อ', nickName: 'พีช', gender: 'M', birthDate: '2011-02-18', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นายวิชัย ทองหล่อ', parentPhone: '087-777-8899' },
  { id: 'std-08', studentCode: '05408', nationalId: '1729900123458', studentNumber: 8, title: 'เด็กหญิง', firstName: 'วริศรา', lastName: 'คงเกษม', nickName: 'ฟ้า', gender: 'F', birthDate: '2011-08-30', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นางรัตนา คงเกษม', parentPhone: '088-888-9900' },
  { id: 'std-09', studentCode: '05409', nationalId: '1729900123459', studentNumber: 9, title: 'เด็กชาย', firstName: 'ศุภโชค', lastName: 'สารบรรณ', nickName: 'โชค', gender: 'M', birthDate: '2011-05-05', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นายสมพร สารบรรณ', parentPhone: '089-999-0011' },
  { id: 'std-10', studentCode: '05410', nationalId: '1729900123460', studentNumber: 10, title: 'เด็กหญิง', firstName: 'อารียา', lastName: 'สุขเกษม', nickName: 'เอิร์น', gender: 'F', birthDate: '2011-12-14', level: 'ม.3', classroomId: 'cls-m3-1', classroomName: 'ม.3/1', academicYearId: 'ay-2569', status: 'studying', parentName: 'นางวันดี สุขเกษม', parentPhone: '081-345-6780' },
];

export const initialScoreComponents: ScoreComponent[] = [
  { id: 'sc-01', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', name: 'ใบงานและการทดลอง', maxScore: 25, sequence: 1 },
  { id: 'sc-02', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', name: 'ชิ้นงาน/โครงงานย่อย', maxScore: 15, sequence: 2 },
  { id: 'sc-03', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', name: 'สอบเก็บคะแนนหน่วย', maxScore: 10, sequence: 3 },
  { id: 'sc-04', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', name: 'สอบวัดผลกลางภาค', maxScore: 20, sequence: 4 },
  { id: 'sc-05', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', name: 'สอบวัดผลปลายภาค', maxScore: 30, sequence: 5 },
];

export const initialScoreRecords: ScoreRecord[] = [
  // กิตติศักดิ์ (เกรด 4)
  { id: 'sr-01-1', studentId: 'std-01', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 24, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-01-2', studentId: 'std-01', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 14, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-01-3', studentId: 'std-01', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 9, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-01-4', studentId: 'std-01', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 18, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-01-5', studentId: 'std-01', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 26, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // ชานนท์ (เกรด 3.5)
  { id: 'sr-02-1', studentId: 'std-02', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 21, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-02-2', studentId: 'std-02', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 13, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-02-3', studentId: 'std-02', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 8, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-02-4', studentId: 'std-02', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 15, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-02-5', studentId: 'std-02', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 21, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // ณัฐพงษ์ (ขาดส่งงาน ติด ร)
  { id: 'sr-03-1', studentId: 'std-03', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 10, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-03-2', studentId: 'std-03', subjectId: 'sbj-sci31', componentId: 'sc-02', score: null, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-03-3', studentId: 'std-03', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 5, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-03-4', studentId: 'std-03', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 10, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-03-5', studentId: 'std-03', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 12, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // ธิดารัตน์ (เกรด 4)
  { id: 'sr-04-1', studentId: 'std-04', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 25, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-04-2', studentId: 'std-04', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 15, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-04-3', studentId: 'std-04', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 10, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-04-4', studentId: 'std-04', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 19, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-04-5', studentId: 'std-04', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 28, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // นภัสสร (เกรด 3)
  { id: 'sr-05-1', studentId: 'std-05', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 19, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-05-2', studentId: 'std-05', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 11, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-05-3', studentId: 'std-05', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 8, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-05-4', studentId: 'std-05', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 15, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-05-5', studentId: 'std-05', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 20, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // ปพิชญา (เกรด 3)
  { id: 'sr-06-1', studentId: 'std-06', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 20, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-06-2', studentId: 'std-06', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 12, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-06-3', studentId: 'std-06', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 7, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-06-4', studentId: 'std-06', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 14, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-06-5', studentId: 'std-06', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 19, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // พีรวิชญ์ (เวลาเรียนต่ำกว่า 80% ติด มส)
  { id: 'sr-07-1', studentId: 'std-07', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 12, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-07-2', studentId: 'std-07', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 8, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-07-3', studentId: 'std-07', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 4, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-07-4', studentId: 'std-07', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 11, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-07-5', studentId: 'std-07', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 15, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // วริศรา (เกรด 3.5)
  { id: 'sr-08-1', studentId: 'std-08', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 22, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-08-2', studentId: 'std-08', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 13, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-08-3', studentId: 'std-08', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 8, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-08-4', studentId: 'std-08', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 16, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-08-5', studentId: 'std-08', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 20, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // ศุภโชค (เกรด 2.5)
  { id: 'sr-09-1', studentId: 'std-09', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 17, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-09-2', studentId: 'std-09', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 10, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-09-3', studentId: 'std-09', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 6, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-09-4', studentId: 'std-09', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 14, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-09-5', studentId: 'std-09', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 18, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },

  // อารียา (เกรด 4)
  { id: 'sr-10-1', studentId: 'std-10', subjectId: 'sbj-sci31', componentId: 'sc-01', score: 23, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-10-2', studentId: 'std-10', subjectId: 'sbj-sci31', componentId: 'sc-02', score: 14, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-10-3', studentId: 'std-10', subjectId: 'sbj-sci31', componentId: 'sc-03', score: 9, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-10-4', studentId: 'std-10', subjectId: 'sbj-sci31', componentId: 'sc-04', score: 17, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
  { id: 'sr-10-5', studentId: 'std-10', subjectId: 'sbj-sci31', componentId: 'sc-05', score: 25, academicYearId: 'ay-2569', termId: 'term-2569-1', lastUpdated: '2026-09-10 10:00', updatedBy: 'ครูสุพรรณ' },
];

export const initialGradingRules: GradingRule[] = [
  { minScore: 80, grade: '4' },
  { minScore: 75, grade: '3.5' },
  { minScore: 70, grade: '3' },
  { minScore: 65, grade: '2.5' },
  { minScore: 60, grade: '2' },
  { minScore: 55, grade: '1.5' },
  { minScore: 50, grade: '1' },
  { minScore: 0,  grade: '0' },
];

export const initialSubjectGradings: SubjectGradingSummary[] = [
  { id: 'grd-01', studentId: 'std-01', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 91, grade: '4', isSpecialGrade: false, approvalStatus: 'submitted' },
  { id: 'grd-02', studentId: 'std-02', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 78, grade: '3.5', isSpecialGrade: false, approvalStatus: 'submitted' },
  { id: 'grd-03', studentId: 'std-03', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 37, grade: 'ร', isSpecialGrade: true, approvalStatus: 'submitted', remarks: 'ค้างส่งชิ้นงานโครงงานย่อย' },
  { id: 'grd-04', studentId: 'std-04', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 97, grade: '4', isSpecialGrade: false, approvalStatus: 'submitted' },
  { id: 'grd-05', studentId: 'std-05', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 73, grade: '3', isSpecialGrade: false, approvalStatus: 'submitted' },
  { id: 'grd-06', studentId: 'std-06', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 72, grade: '3', isSpecialGrade: false, approvalStatus: 'submitted' },
  { id: 'grd-07', studentId: 'std-07', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 50, grade: 'มส', isSpecialGrade: true, approvalStatus: 'submitted', remarks: 'เวลาเรียน 73.3% ไม่ถึงเกณฑ์ 80%' },
  { id: 'grd-08', studentId: 'std-08', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 79, grade: '3.5', isSpecialGrade: false, approvalStatus: 'submitted' },
  { id: 'grd-09', studentId: 'std-09', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 65, grade: '2.5', isSpecialGrade: false, approvalStatus: 'submitted' },
  { id: 'grd-10', studentId: 'std-10', subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', academicYearId: 'ay-2569', termId: 'term-2569-1', totalScore: 88, grade: '4', isSpecialGrade: false, approvalStatus: 'submitted' },
];

export const initialCalendarEvents: CalendarEvent[] = [
  { id: 'cal-01', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-05-18', title: 'เปิดภาคเรียนที่ 1/2569', type: 'school_day', isSchoolDay: true },
  { id: 'cal-02', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-06-03', title: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี', type: 'public_holiday', isSchoolDay: false },
  { id: 'cal-03', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-06-26', title: 'วันสุนทรภู่ / กิจกรรมส่งเสริมภาษาไทย', type: 'activity_day', isSchoolDay: true },
  { id: 'cal-04', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-07-28', title: 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว', type: 'public_holiday', isSchoolDay: false },
  { id: 'cal-05', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-07-30', title: 'สอบวัดผลกลางภาคเรียนที่ 1', type: 'exam_day', isSchoolDay: true },
  { id: 'cal-06', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-08-12', title: 'วันแม่แห่งชาติ', type: 'public_holiday', isSchoolDay: false },
  { id: 'cal-07', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-09-13', title: 'วันจัดการเรียนการสอนปกติ', type: 'school_day', isSchoolDay: true },
  { id: 'cal-08', academicYearId: 'ay-2569', termId: 'term-2569-1', date: '2026-10-05', title: 'สอบวัดผลปลายภาคเรียนที่ 1', type: 'exam_day', isSchoolDay: true },
];

export const initialTimetableSlots: TimetableSlot[] = [
  { id: 'tt-01', classroomId: 'cls-m3-1', subjectId: 'sbj-sci31', teacherId: 'tch-01', dayOfWeek: 1, period: 1, startTime: '08:30', endTime: '09:30', room: 'ห้องวิทย์ 1' },
  { id: 'tt-02', classroomId: 'cls-m3-1', subjectId: 'sbj-sci31', teacherId: 'tch-01', dayOfWeek: 3, period: 3, startTime: '10:30', endTime: '11:30', room: 'ห้องวิทย์ 1' },
  { id: 'tt-03', classroomId: 'cls-m3-1', subjectId: 'sbj-sci31', teacherId: 'tch-01', dayOfWeek: 5, period: 2, startTime: '09:30', endTime: '10:30', room: 'ห้องวิทย์ 1' },
  { id: 'tt-04', classroomId: 'cls-m3-1', subjectId: 'sbj-math31', teacherId: 'tch-02', dayOfWeek: 1, period: 2, startTime: '09:30', endTime: '10:30', room: 'ห้อง 301' },
  { id: 'tt-05', classroomId: 'cls-m3-1', subjectId: 'sbj-tha31', teacherId: 'tch-03', dayOfWeek: 2, period: 1, startTime: '08:30', endTime: '09:30', room: 'ห้อง 301' },
];

// Helper to seed attendance records for today (2026-09-13)
export const initialAttendanceRecords: AttendanceRecord[] = [
  // เช็กชื่อประจำวัน ม.3/1 วันที่ 2026-09-13
  { id: 'att-d-01', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-01', status: 'present', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-02', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-02', status: 'present', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-03', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-03', status: 'late', note: 'รถติด มาถึง 08:40', recordedAt: '2026-09-13 08:40', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-04', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-04', status: 'present', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-05', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-05', status: 'sick', note: 'เป็นไข้หวัด มีใบรับรองแพทย์', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-06', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-06', status: 'present', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-07', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-07', status: 'absent', note: 'ขาดเรียน ติดต่อไม่ได้', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-08', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-08', status: 'present', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-09', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-09', status: 'leave', note: 'ลากิจไปธุระครอบครัว', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-d-10', type: 'daily', date: '2026-09-13', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-10', status: 'present', recordedAt: '2026-09-13 08:15', recordedBy: 'ครูสุพรรณ' },

  // เช็กชื่อรายวิชาวิทยาศาสตร์ (ว23101) คาบ 1
  { id: 'att-s-01', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-01', status: 'present', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-02', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-02', status: 'present', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-03', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-03', status: 'late', note: 'เข้าห้องเรียน 08:45', recordedAt: '2026-09-13 08:45', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-04', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-04', status: 'present', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-05', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-05', status: 'sick', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-06', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-06', status: 'present', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-07', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-07', status: 'absent', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-08', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-08', status: 'present', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-09', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-09', status: 'leave', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
  { id: 'att-s-10', type: 'subject', date: '2026-09-13', period: 1, subjectId: 'sbj-sci31', classroomId: 'cls-m3-1', teacherId: 'tch-01', studentId: 'std-10', status: 'present', recordedAt: '2026-09-13 08:35', recordedBy: 'ครูสุพรรณ' },
];

export const initialAuditLogs: AuditLog[] = [
  { id: 'log-01', timestamp: '2026-09-13 08:15:20', userId: 'tch-01', userName: 'ครูสุพรรณ เมืองทอง', userRole: 'teacher', action: 'check_attendance', entityType: 'attendance', entityId: 'cls-m3-1', details: 'บันทึกการเช็กชื่อประจำวัน ม.3/1 (มา 7, ขาด 1, ลา 1, ป่วย 1, สาย 1)' },
  { id: 'log-02', timestamp: '2026-09-13 08:45:00', userId: 'tch-01', userName: 'ครูสุพรรณ เมืองทอง', userRole: 'teacher', action: 'check_attendance', entityType: 'attendance', entityId: 'sbj-sci31', details: 'บันทึกการเข้าเรียนวิชาวิทยาศาสตร์ 5 (ว23101) คาบ 1' },
  { id: 'log-03', timestamp: '2026-09-12 16:30:15', userId: 'tch-01', userName: 'ครูสุพรรณ เมืองทอง', userRole: 'teacher', action: 'update_score', entityType: 'score', entityId: 'std-01', details: 'บันทึกคะแนนสอบปลายภาค วิชา ว23101 นักเรียน กิตติศักดิ์ ศิริผล', previousValue: '25', newValue: '26' },
  { id: 'log-04', timestamp: '2026-09-12 17:00:10', userId: 'tch-01', userName: 'ครูสุพรรณ เมืองทอง', userRole: 'teacher', action: 'submit_grade', entityType: 'grade', entityId: 'sbj-sci31', details: 'ส่งผลการเรียนวิชาวิทยาศาสตร์ 5 ม.3/1 ให้งานวิชาการตรวจสอบ' },
];

export const initialNotifications: SystemNotification[] = [
  { id: 'notif-01', timestamp: '2026-09-13 08:50', title: 'แจ้งเตือนเวลาเรียนต่ำกว่าเกณฑ์', message: 'เด็กชายพีรวิชญ์ ทองหล่อ (ม.3/1) มีเวลาเรียนวิชาวิทยาศาสตร์ต่ำกว่า 80% (73.3%) เสี่ยงติด มส', type: 'danger', isRead: false },
  { id: 'notif-02', timestamp: '2026-09-12 17:05', title: 'มีผลการเรียนรอการตรวจสอบ', message: 'ครูสุพรรณ เมืองทอง ส่งผลการเรียน ว23101 ม.3/1 รอฝ่ายวิชาการตรวจสอบและอนุมัติ', type: 'info', isRead: false },
  { id: 'notif-03', timestamp: '2026-09-12 14:20', title: 'แจ้งเตือนคะแนนยังไม่ครบ', message: 'เด็กชายณัฐพงษ์ แก้วมณี ขาดคะแนนชิ้นงาน/โครงงานย่อย วิชาวิทยาศาสตร์', type: 'warning', isRead: true },
  { id: 'notif-04', timestamp: '2026-09-11 09:00', title: 'สำรองข้อมูลอัตโนมัติสำเร็จ', message: 'ระบบได้สำรองข้อมูลรายวันขึ้น Cloud Storage เรียบร้อยแล้ว (Snapshot 2569-09-11)', type: 'success', isRead: true },
];
