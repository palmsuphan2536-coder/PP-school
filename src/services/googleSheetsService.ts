// Google Sheets & Google Drive Direct Backup Service
// Connects directly to Google Sheets API and Drive API via client-side OAuth (Google Identity Services)
// User does NOT need to configure Google Apps Script or deploy backend code manually.

import { 
  SchoolInfo, Student, Subject, SubjectGradingSummary, AttendanceRecord, 
  Teacher, Classroom, AcademicYear, Term, UserAccount, ScoreRecord, ScoreComponent 
} from '../types';

export const OAUTH_CLIENT_ID = '55073752947-m08s937t71f63m3q1som90mhs370as66.apps.googleusercontent.com';
export const DEFAULT_LINKED_EMAIL = 'rst72010045@gmail.com';
export const REQUIRED_SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export interface GoogleBackupInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  linkedEmail: string;
  lastBackupAt: string;
  lastBackupTime?: string;
  itemCount: number;
}

const STORAGE_TOKEN_KEY = 'WATRAT_GOOGLE_ACCESS_TOKEN';
const STORAGE_BACKUP_KEY = 'WATRAT_GOOGLE_BACKUP_INFO';
const STORAGE_EMAIL_KEY = 'WATRAT_GOOGLE_LINKED_EMAIL';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (err: any) => void;
            hint?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

// Check if token exists in session
export const getStoredAccessToken = (): string | null => {
  try {
    return sessionStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredAccessToken = (token: string) => {
  try {
    sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
  } catch {}
};

export const clearStoredAccessToken = () => {
  try {
    sessionStorage.removeItem(STORAGE_TOKEN_KEY);
  } catch {}
};

export const DEFAULT_SPREADSHEET_ID = '17sEeYBKSsmJl0xqGQ7ngxBWINefHhThK9DsLedaJXr4';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`;

export const getStoredBackupInfo = (): GoogleBackupInfo | null => {
  try {
    const raw = localStorage.getItem(STORAGE_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.spreadsheetId) {
        return parsed;
      }
    }
    // Return default backup info pointing to the requested spreadsheet ID if none stored
    return {
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
      title: 'ระบบสารสนเทศและสำรองข้อมูล ปพ.5 ออนไลน์ (โรงเรียนวัดราษฎร์ศรัทธาธรรม)',
      linkedEmail: DEFAULT_LINKED_EMAIL,
      lastBackupAt: new Date().toISOString(),
      itemCount: 100
    };
  } catch {
    return {
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
      title: 'ระบบสารสนเทศและสำรองข้อมูล ปพ.5 ออนไลน์ (โรงเรียนวัดราษฎร์ศรัทธาธรรม)',
      linkedEmail: DEFAULT_LINKED_EMAIL,
      lastBackupAt: new Date().toISOString(),
      itemCount: 100
    };
  }
};

export const saveStoredBackupInfo = (info: GoogleBackupInfo) => {
  try {
    localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(info));
    localStorage.setItem(STORAGE_EMAIL_KEY, info.linkedEmail);
  } catch {}
};

export const getLinkedEmail = (): string => {
  try {
    return localStorage.getItem(STORAGE_EMAIL_KEY) || DEFAULT_LINKED_EMAIL;
  } catch {
    return DEFAULT_LINKED_EMAIL;
  }
};

// Request OAuth Access Token using Google Identity Services (GSI)
export const requestGoogleAccessToken = (emailHint: string = DEFAULT_LINKED_EMAIL): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if GIS script loaded
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('ระบบ Google Identity Services กำลังโหลด โปรดรอสักครู่แล้วลองใหม่อีกครั้ง'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: REQUIRED_SCOPES,
        hint: emailHint,
        callback: (response) => {
          if (response.error) {
            reject(new Error(`การเชื่อมต่อบัญชี Google ไม่สำเร็จ: ${response.error}`));
            return;
          }
          if (response.access_token) {
            setStoredAccessToken(response.access_token);
            resolve(response.access_token);
          } else {
            reject(new Error('ไม่ได้รับ Access Token จาก Google'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'เกิดข้อผิดพลาดในการเปิดหน้าต่างลงชื่อเข้าใช้ Google'));
        }
      });

      client.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(new Error(err?.message || 'ไม่สามารถเปิดหน้าต่างเชื่อมต่อ Google ได้'));
    }
  });
};

export interface BackupDataPayload {
  schoolInfo: SchoolInfo;
  students: Student[];
  subjects: Subject[];
  subjectGradings: SubjectGradingSummary[];
  attendanceRecords: AttendanceRecord[];
  teachers: Teacher[];
  classrooms: Classroom[];
  academicYears: AcademicYear[];
  terms: Term[];
  userAccounts?: UserAccount[];
  scoreRecords?: ScoreRecord[];
  scoreComponents?: ScoreComponent[];
}

// Convert school data into Google Sheets grid values
function buildSheetData(payload: BackupDataPayload) {
  const { schoolInfo, students, subjects, subjectGradings, attendanceRecords, teachers, classrooms } = payload;

  // 1. Overview Sheet
  const overviewData = [
    ['ระบบสารสนเทศและสำรองข้อมูล ปพ.5 ออนไลน์', 'โรงเรียนวัดราษฎร์ศรัทธาธรรม'],
    ['วันที่และเวลาสำรองข้อมูล', new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' })],
    ['สถานศึกษา', schoolInfo.name || 'โรงเรียนวัดราษฎร์ศรัทธาธรรม'],
    ['สังกัด', schoolInfo.affiliation || 'สพป.สุพรรณบุรี เขต 1'],
    ['เขตพื้นที่การศึกษา', schoolInfo.educationalArea || '-'],
    ['ผู้อำนวยการโรงเรียน', schoolInfo.directorName || 'นายประสิทธิ์ พงษ์พานิช'],
    ['หัวหน้างานวิชาการ', schoolInfo.academicHeadName || 'นายประเสริฐ ดีเลิศ'],
    ['เบอร์โทรศัพท์', schoolInfo.phone || '035-512345'],
    ['อีเมลติดต่อ', schoolInfo.email || DEFAULT_LINKED_EMAIL],
    [''],
    ['สรุปยอดข้อมูลทั้งหมดในระบบ'],
    ['รายการ', 'จำนวน (รายการ)'],
    ['จำนวนนักเรียนทั้งหมด', students.length],
    ['จำนวนรายวิชาที่เปิดสอน', subjects.length],
    ['รายการบันทึกผลการเรียน/เกรด', subjectGradings.length],
    ['รายการบันทึกเวลาเรียน', attendanceRecords.length],
    ['จำนวนครูและบุคลากร', teachers.length],
    ['จำนวนห้องเรียน', classrooms.length],
    ['จำนวนบัญชีผู้ใช้และรหัสผ่าน', payload.userAccounts ? payload.userAccounts.length : (teachers.length + 3)],
  ];

  // 2. Students Sheet
  const studentsHeader = [
    'รหัสในระบบ', 'เลขประจำตัวนักเรียน', 'เลขที่', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 
    'ระดับชั้น', 'ห้องเรียน', 'สถานะ', 'เพศ', 'เบอร์ผู้ปกครอง'
  ];
  const studentsRows = students.map(s => [
    s.id,
    s.studentCode,
    s.studentNumber || '-',
    s.title,
    s.firstName,
    s.lastName,
    s.level,
    s.classroomName || '-',
    s.status === 'studying' ? 'กำลังเรียน' : s.status,
    s.gender === 'M' ? 'ชาย' : 'หญิง',
    s.parentPhone || '-'
  ]);
  const studentsData = [studentsHeader, ...studentsRows];

  // 3. Subjects Sheet
  const subjectsHeader = ['รหัสวิชา', 'ชื่อวิชา', 'กลุ่มสาระการเรียนรู้', 'ระดับชั้น', 'หน่วยกิต', 'ชั่วโมงรวม', 'ประเภทวิชา', 'ครูผู้สอน'];
  const subjectsRows = (subjects || []).map(s => {
    const tch = s?.teacherId ? teachers.find(t => t.id === s.teacherId) : null;
    const tchName = s?.teacherName || (tch ? `${tch.title || ''}${tch.firstName || ''} ${tch.lastName || ''}`.trim() : '-');
    return [
      s?.code || '-',
      s?.name || '-',
      s?.department || '-',
      s?.level || '-',
      s?.credits ?? 1,
      s?.totalHours ?? 40,
      s?.type === 'basic' ? 'วิชาพื้นฐาน' : 'วิชาเพิ่มเติม',
      tchName || '-'
    ];
  });
  const subjectsData = [subjectsHeader, ...subjectsRows];

  // 4. Grades & Scores Sheet
  const gradesHeader = [
    'รหัสวิชา', 'ชื่อวิชา', 'ห้องเรียน', 'เลขที่', 'เลขประจำตัว', 'ชื่อ-นามสกุล', 'คะแนนรวม (100)', 'เกรด (0-4)', 'สถานะการอนุมัติ', 'ผลการตัดสิน', 'ครูผู้สอน', 'หมายเหตุ'
  ];
  const gradesRows = subjectGradings.map(g => {
    const sbj = subjects.find(s => s.id === g.subjectId);
    const std = students.find(s => s.id === g.studentId);
    const cls = classrooms.find(c => c.id === (g.classroomId || std?.classroomId));
    const tch = sbj?.teacherId ? teachers.find(t => t.id === sbj.teacherId) : null;
    const tchName = sbj?.teacherName || (tch ? `${tch.title}${tch.firstName} ${tch.lastName}` : '-');
    const studentName = std ? `${std.title}${std.firstName} ${std.lastName}` : g.studentId;
    const isPass = (Number(g.grade) >= 1 || g.grade === 'ผ');
    return [
      sbj?.code || '-',
      sbj?.name || '-',
      cls?.name || '-',
      std?.studentNumber ?? '-',
      std?.studentCode || g.studentId,
      studentName,
      g.totalScore ?? '-',
      g.grade ?? '-',
      g.approvalStatus === 'approved' ? 'อนุมัติแล้ว' : (g.approvalStatus === 'locked' ? 'ปิดผลแล้ว' : (g.approvalStatus === 'submitted' ? 'ส่งตรวจ' : 'ฉบับร่าง')),
      isPass ? 'ผ่าน' : 'ไม่ผ่าน',
      tchName,
      g.remarks || '-'
    ];
  });
  const gradesData = [gradesHeader, ...gradesRows];

  // 5. Attendance Sheet
  const attendanceHeader = ['วันที่', 'รหัสวิชา', 'ห้องเรียน', 'รหัสนักเรียน', 'ชื่อ-สกุล', 'สถานะการเข้าเรียน', 'หมายเหตุ'];
  const attendanceRows = attendanceRecords.map(rec => {
    const sbj = subjects.find(s => s.id === rec.subjectId);
    const std = students.find(s => s.id === rec.studentId);
    const cls = classrooms.find(c => c.id === rec.classroomId);
    const studentName = std ? `${std.title}${std.firstName} ${std.lastName}` : rec.studentId;
    const statusMap: Record<string, string> = {
      present: 'มาเรียน (/ )',
      late: 'มาสาย (ส)',
      sick: 'ลาป่วย (ป)',
      leave: 'ลากิจ (ก)',
      absent: 'ขาดเรียน (ข)',
      activity: 'กิจกรรม (กจ)'
    };
    return [
      rec.date,
      sbj?.code || rec.subjectId || '-',
      cls?.name || rec.classroomId,
      std?.studentCode || rec.studentId,
      studentName,
      statusMap[rec.status] || rec.status,
      rec.note || '-'
    ];
  });
  const attendanceData = [attendanceHeader, ...attendanceRows];

  // 6. Teachers Sheet
  const teachersHeader = ['รหัสครู', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'กลุ่มสาระการเรียนรู้', 'ตำแหน่ง', 'สิทธิ์ในระบบ', 'อีเมล', 'เบอร์โทร'];
  const teachersRows = teachers.map(t => [
    t.teacherCode,
    t.title,
    t.firstName,
    t.lastName,
    t.department,
    t.position,
    t.role,
    t.email || '-',
    t.phone || '-'
  ]);
  const teachersData = [teachersHeader, ...teachersRows];

  // 7. User Accounts and Passwords Sheet (บัญชีผู้ใช้และรหัสผ่าน)
  const userAccountsHeader = [
    'ลำดับ', 'ชื่อผู้ใช้ (Username)', 'รหัสผ่าน (Password)', 'ชื่อ-นามสกุล', 'ระดับสิทธิ์ (Role)', 
    'ตำแหน่ง', 'อีเมล', 'กลุ่มสาระ/ฝ่ายงาน', 'สถานะบัญชี', 'สิทธิ์และความรับผิดชอบในระบบ'
  ];

  let userAccountsRows: any[][] = [];
  if (payload.userAccounts && payload.userAccounts.length > 0) {
    userAccountsRows = payload.userAccounts.map((u, idx) => [
      idx + 1,
      u.username,
      u.password,
      u.name,
      u.role === 'super_admin' ? 'ผู้ดูแลระบบสูงสุด (Super Admin)' :
      u.role === 'academic' ? 'งานวิชาการและทะเบียน (Academic)' :
      u.role === 'homeroom' ? 'ครูประจำชั้น (Homeroom)' :
      u.role === 'executive' ? 'ผู้บริหารสถานศึกษา (Executive)' : 'ครูผู้สอน (Teacher)',
      u.position || '-',
      u.email || '-',
      u.department || '-',
      u.status === 'active' ? 'เปิดใช้งาน (Active)' : 'ระงับการใช้งาน (Suspended)',
      u.description || (u.role === 'super_admin' ? 'Super Admin: สิทธิ์สูงสุด จัดการผู้ใช้ รหัสผ่าน และการสำรองข้อมูล' : 'สิทธิ์ใช้งานระบบ ปพ.5')
    ]);
  } else {
    const defaultAdminRows = [
      [
        1, 
        'admin', 
        '1234', 
        'ผู้ดูแลระบบ (Admin)', 
        'super_admin', 
        'ผู้ดูแลระบบสารสนเทศ ปพ.5', 
        'rst72010045@gmail.com', 
        'กลุ่มงานเทคโนโลยีสารสนเทศ', 
        'เปิดใช้งาน (Active)', 
        'ผู้ดูแลระบบ (Admin): สิทธิ์สูงสุด เข้าถึงและจัดการทุกส่วนของระบบ'
      ],
      [
        2, 
        'director', 
        '123456', 
        schoolInfo.directorName || 'นายประสิทธิ์ พงษ์พานิช', 
        'executive', 
        'ผู้อำนวยการสถานศึกษา', 
        schoolInfo.email || 'director@watrat.ac.th', 
        'ฝ่ายบริหารสถานศึกษา', 
        'เปิดใช้งาน (Active)', 
        'ผู้อำนวยการ: ตรวจสอบและอนุมัติผลการเรียน ปพ.5 รวมถึงภาพรวมสถิติทั้งสถานศึกษา'
      ],
      [
        3, 
        'prasert', 
        '123456', 
        schoolInfo.academicHeadName || 'นายประเสริฐ ดีเลิศ', 
        'academic', 
        'หัวหน้างานวิชาการและทะเบียนวัดผล', 
        'academic@watrat.ac.th', 
        'กลุ่มงานบริหารวิชาการ', 
        'เปิดใช้งาน (Active)', 
        'งานวิชาการ: จัดการแผนการเรียน ปิดภาคเรียน และกำกับติดตามผลสัมฤทธิ์ทางการศึกษา'
      ]
    ];

    const teacherAccountRows = teachers.map((t, idx) => [
      idx + 4,
      t.username || t.teacherCode,
      '123456',
      `${t.title}${t.firstName} ${t.lastName}`,
      t.role || 'teacher',
      t.position || 'ครูผู้สอน',
      t.email || '-',
      t.department || 'กลุ่มสาระการเรียนรู้',
      'เปิดใช้งาน (Active)',
      'ครูผู้สอน/ประจำชั้น: เช็คชื่อเวลาเรียน บันทึกคะแนนเก็บ และประเมินผลการเรียน ปพ.5 ประจำวิชา'
    ]);

    userAccountsRows = [...defaultAdminRows, ...teacherAccountRows];
  }

  const userAccountsData = [userAccountsHeader, ...userAccountsRows];

  return {
    overviewData,
    studentsData,
    subjectsData,
    gradesData,
    attendanceData,
    teachersData,
    userAccountsData
  };
}

// Perform direct backup to Google Sheets
export const backupToGoogleSheets = async (
  payload: BackupDataPayload,
  linkedEmail: string = DEFAULT_LINKED_EMAIL,
  existingSpreadsheetId?: string
): Promise<GoogleBackupInfo> => {
  // Step 1: Ensure active token
  let token = getStoredAccessToken();
  if (!token) {
    token = await requestGoogleAccessToken(linkedEmail);
  }

  const sheetData = buildSheetData(payload);
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  const spreadsheetTitle = `ปพ.5 โรงเรียนวัดราษฎร์ศรัทธาธรรม [ปีการศึกษา 2569] (${dateStr})`;

  let spreadsheetId = existingSpreadsheetId;
  let spreadsheetUrl = '';

  // Step 2: Create Spreadsheet if doesn't exist
  if (!spreadsheetId) {
    const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: spreadsheetTitle,
          locale: 'th_TH'
        },
        sheets: [
          { properties: { title: '1_ข้อมูลสถานศึกษา_ภาพรวม', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: '2_ทะเบียนนักเรียน', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: '3_รายวิชา', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: '4_คะแนนและผลการเรียน', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: '5_เวลาเรียน', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: '6_ครูและบุคลากร', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: '7_บัญชีผู้ใช้และรหัสผ่าน', gridProperties: { frozenRowCount: 1 } } }
        ]
      })
    });

    if (createResp.status === 401) {
      // Token expired, re-authenticate once
      clearStoredAccessToken();
      token = await requestGoogleAccessToken(linkedEmail);
      return backupToGoogleSheets(payload, linkedEmail, existingSpreadsheetId);
    }

    if (!createResp.ok) {
      const err = await createResp.json().catch(() => ({}));
      throw new Error(`ไม่สามารถสร้าง Google Sheet ได้: ${err.error?.message || createResp.statusText}`);
    }

    const created = await createResp.json();
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // Step 2.5: Clear existing rows so deleted items (e.g. deleted users in Sheet 7 or deleted records) are wiped clean
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ranges: [
            "'1_ข้อมูลสถานศึกษา_ภาพรวม'!A1:Z500",
            "'2_ทะเบียนนักเรียน'!A1:Z1000",
            "'3_รายวิชา'!A1:Z500",
            "'4_คะแนนและผลการเรียน'!A1:Z2000",
            "'5_เวลาเรียน'!A1:Z5000",
            "'6_ครูและบุคลากร'!A1:Z500",
            "'7_บัญชีผู้ใช้และรหัสผ่าน'!A1:Z500"
          ]
        })
      }
    );
  } catch (clearErr) {
    console.warn('Google Sheets batchClear warning:', clearErr);
  }

  // Step 3: Populate data to sheets using batchUpdate values
  const dataBatches = [
    {
      range: "'1_ข้อมูลสถานศึกษา_ภาพรวม'!A1",
      values: sheetData.overviewData
    },
    {
      range: "'2_ทะเบียนนักเรียน'!A1",
      values: sheetData.studentsData
    },
    {
      range: "'3_รายวิชา'!A1",
      values: sheetData.subjectsData
    },
    {
      range: "'4_คะแนนและผลการเรียน'!A1",
      values: sheetData.gradesData
    },
    {
      range: "'5_เวลาเรียน'!A1",
      values: sheetData.attendanceData
    },
    {
      range: "'6_ครูและบุคลากร'!A1",
      values: sheetData.teachersData
    },
    {
      range: "'7_บัญชีผู้ใช้และรหัสผ่าน'!A1",
      values: sheetData.userAccountsData
    }
  ];

  const updateValuesResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataBatches
      })
    }
  );

  if (!updateValuesResp.ok) {
    const err = await updateValuesResp.json().catch(() => ({}));
    throw new Error(`ไม่สามารถบันทึกข้อมูลลง Google Sheet ได้: ${err.error?.message || updateValuesResp.statusText}`);
  }

  // Save backup metadata
  const backupInfo: GoogleBackupInfo = {
    spreadsheetId,
    spreadsheetUrl,
    title: spreadsheetTitle,
    linkedEmail,
    lastBackupAt: new Date().toISOString(),
    itemCount: payload.students.length + payload.subjectGradings.length + payload.attendanceRecords.length
  };

  saveStoredBackupInfo(backupInfo);
  return backupInfo;
};

// Fetch user accounts directly from Sheet 7 (แผ่นงานที่ 7)
export const fetchUserAccountsFromGoogleSheets = async (
  spreadsheetId?: string,
  linkedEmail: string = DEFAULT_LINKED_EMAIL
): Promise<UserAccount[] | null> => {
  try {
    const sId = spreadsheetId || getStoredBackupInfo()?.spreadsheetId;
    if (!sId) return null;

    const token = getStoredAccessToken();
    if (!token) return null;

    const resp = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sId}/values/'7_บัญชีผู้ใช้และรหัสผ่าน'!A2:J500`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!resp.ok) return null;

    const data = await resp.json();
    const rows = data.values as string[][] | undefined;
    if (!rows || rows.length === 0) return [];

    const roleMap: Record<string, string> = {
      'ผู้ดูแลระบบสูงสุด (Super Admin)': 'super_admin',
      'งานวิชาการและทะเบียน (Academic)': 'academic',
      'ครูประจำชั้น (Homeroom)': 'homeroom',
      'ครูผู้สอน (Teacher)': 'teacher',
      'ฝ่ายบริหาร (Executive)': 'executive'
    };

    const accounts: UserAccount[] = rows
      .filter(r => r && r[1] && r[1].trim()) // Must have username
      .map((r, idx) => {
        const username = (r[1] || '').trim();
        const password = (r[2] || '').trim();
        const name = (r[3] || '').trim();
        const rawRole = (r[4] || '').trim();
        const position = (r[5] || '').trim();
        const email = (r[6] || '').trim();
        const department = (r[7] || '').trim();
        const rawStatus = (r[8] || '').trim();
        const description = (r[9] || '').trim();

        const role = (roleMap[rawRole] || (rawRole.toLowerCase().includes('admin') ? 'super_admin' : 'teacher')) as any;
        const status = rawStatus.includes('ระงับ') || rawStatus === 'inactive' ? 'inactive' : 'active';

        return {
          id: `usr-sheet-${username}-${idx + 1}`,
          username,
          password: password || '123456',
          name: name || username,
          role,
          position: position || 'บุคลากรทางการศึกษา',
          email: email === '-' ? '' : email,
          department: department === '-' ? '' : department,
          status,
          description: description === '-' ? '' : description
        };
      });

    return accounts;
  } catch (err) {
    console.warn('Error fetching users from Sheet 7:', err);
    return null;
  }
};

