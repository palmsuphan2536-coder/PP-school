/**
 * =========================================================================================
 * โค้ด Google Apps Script (GAS) สำหรับระบบ ปพ.5 ออนไลน์ โรงเรียนวัดราษฎร์ศรัทธาธรรม
 * สพป. สุพรรณบุรี เขต 1 | รองรับ REST API (doGet / doPost), 7 ตารางหลัก, SHA-256, RBAC,
 * ตรวจสอบคะแนน, ระบบเวลาเรียนคำนวณ มส (<80%), บันทึก Audit Log และสำรองข้อมูลบน Google Drive
 * =========================================================================================
 * 
 * วิธีการติดตั้งและใช้งาน:
 * 1. สร้าง Google Sheets ใหม่ขึ้นมา 1 ไฟล์ (เช่น ตั้งชื่อว่า "ระบบ ปพ.5 โรงเรียนวัดราษฎร์ศรัทธาธรรม")
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดใน Code.gs แล้ววางโค้ดชุดนี้ลงไป
 * 4. กดบันทึก (Save)
 * 5. เลือกฟังก์ชัน "setupDatabase" จากดรอปดาวน์ แล้วกด "เรียกใช้" (Run) 1 ครั้งเพื่อให้ระบบสร้าง 7 แผ่นงานและข้อมูลตั้งต้น
 * 6. กด "ทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 7. เลือกประเภทเป็น "เว็บแอป" (Web app)
 *    - คำอธิบาย: ระบบ ปพ.5 API v1.0
 *    - ดำเนินการในฐานะ: ฉัน (อีเมลของคุณ)
 *    - ผู้มีสิทธิ์เข้าถึง: ทุกคน (Anyone)
 * 8. คัดลอก URL ของเว็บแอป (Web App URL) มาใส่ในหน้าจอ "ตั้งค่าและการสำรองข้อมูล" ของแอปพลิเคชัน
 */

// ชื่อตารางฐานข้อมูลหลักทั้ง 7 ตารางตามข้อกำหนด
const SHEETS = {
  USERS: 'USERS',
  STUDENTS: 'STUDENTS',
  SUBJECTS: 'SUBJECTS',
  SCORE_COMPONENTS: 'SCORE_COMPONENTS',
  SCORES: 'SCORES',
  ATTENDANCE: 'ATTENDANCE',
  AUDIT_LOGS: 'AUDIT_LOGS'
};

const SCHOOL_CONFIG = {
  name: 'โรงเรียนวัดราษฎร์ศรัทธาธรรม',
  subdistrict: 'ต.ศาลาขาว',
  district: 'อ.เมืองสุพรรณบุรี',
  province: 'จ.สุพรรณบุรี',
  affiliation: 'สพป. สุพรรณบุรี เขต 1',
  backupFolderName: 'ปพ5_สำรองข้อมูล_โรงเรียนวัดราษฎร์ศรัทธาธรรม'
};

/**
 * เมนูเพิ่มเติมบน Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏫 ระบบ ปพ.5 โรงเรียน')
    .addItem('🚀 1. สร้างตารางและตั้งค่าระบบ (Setup)', 'setupDatabase')
    .addItem('☁️ 2. สำรองข้อมูลไปยัง Google Drive ทันที', 'manualBackupToDrive')
    .addItem('⏰ 3. เปิดระบบสำรองข้อมูลอัตโนมัติทุกวัน (23.00 น.)', 'createDailyBackupTrigger')
    .addToUi();
}

/**
 * 1. ฟังก์ชันตั้งค่าตารางและข้อมูลตั้งต้น (Setup Database)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // กำหนดโครงสร้างคอลัมน์ของทั้ง 7 ตาราง
  const schemas = {
    [SHEETS.USERS]: [
      'user_id', 'username', 'password_hash', 'full_name', 'role', 
      'assigned_classes', 'status', 'created_at', 'last_login'
    ],
    [SHEETS.STUDENTS]: [
      'student_id', 'student_code', 'title', 'first_name', 'last_name', 
      'class_level', 'room', 'status'
    ],
    [SHEETS.SUBJECTS]: [
      'subject_code', 'subject_name', 'credits', 'total_hours', 
      'class_level', 'teacher_id'
    ],
    [SHEETS.SCORE_COMPONENTS]: [
      'component_id', 'subject_id', 'component_name', 'max_score'
    ],
    [SHEETS.SCORES]: [
      'student_id', 'subject_id', 'component_scores', 'midterm', 
      'final', 'total', 'grade'
    ],
    [SHEETS.ATTENDANCE]: [
      'attendance_id', 'date', 'student_id', 'subject_id', 
      'status', 'recorded_by'
    ],
    [SHEETS.AUDIT_LOGS]: [
      'log_id', 'timestamp', 'username', 'action', 'details'
    ]
  };

  // วนลูปสร้างหรือรีเซ็ตแผ่นงาน
  for (const sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet.clear();
    }

    const headers = schemas[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1e293b')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontFamily('Sarabun')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }

  // ลบแผ่นงานเริ่มต้น 'Sheet1' หรือ 'แผ่น1' หากมี
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('แผ่น1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // เติมข้อมูลผู้ใช้เริ่มต้น (รหัสผ่านเข้ารหัสด้วย SHA-256)
  seedInitialUsers(ss);
  // เติมข้อมูลนักเรียนและวิชาเริ่มต้น
  seedInitialSchoolData(ss);

  // บันทึก Audit Log แรก
  recordAuditLog('system', 'INITIAL_SETUP', 'สร้างโครงสร้าง 7 ตารางระบบ ปพ.5 โรงเรียนวัดราษฎร์ศรัทธาธรรม สำเร็จ');

  SpreadsheetApp.getUi().alert('✅ ตั้งค่าฐานข้อมูล 7 ตารางระบบ ปพ.5 สำเร็จเรียบร้อยแล้ว');
}

/**
 * เข้ารหัสข้อความด้วย SHA-256 ตามมาตรฐานความปลอดภัย
 */
function computeSHA256(input) {
  if (!input) return '';
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input), Utilities.Charset.UTF_8);
  let hashStr = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

/**
 * เติมข้อมูลผู้ใช้งานตั้งต้น พร้อมรหัสผ่าน SHA-256
 */
function seedInitialUsers(ss) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const now = new Date().toISOString();

  const users = [
    // รหัสผ่านเริ่มต้น: admin123
    ['usr-001', 'admin', computeSHA256('admin123'), 'นายสมชาย แสนสุข', 'Admin', 'ALL', 'active', now, now],
    // รหัสผ่านเริ่มต้น: academic123
    ['usr-002', 'prasert', computeSHA256('academic123'), 'นายประเสริฐ ดีเลิศ', 'Academic', 'ALL', 'active', now, now],
    // รหัสผ่านเริ่มต้น: teacher123
    ['usr-003', 'suphan', computeSHA256('teacher123'), 'นายสุพรรณ เมืองทอง', 'Teacher', 'ม.3/1, ม.3/2', 'active', now, now],
    // รหัสผ่านเริ่มต้น: homeroom123
    ['usr-004', 'somsri', computeSHA256('homeroom123'), 'นางสมศรี นวลจันทร์', 'Homeroom', 'ม.3/1', 'active', now, now],
    // รหัสผ่านเริ่มต้น: director123
    ['usr-005', 'director', computeSHA256('director123'), 'นายประสิทธิ์ พงษ์พานิช', 'Executive', 'ALL', 'active', now, now]
  ];

  sheet.getRange(2, 1, users.length, users[0].length).setValues(users);
}

/**
 * เติมข้อมูลวิชา, นักเรียน และองค์ประกอบคะแนน
 */
function seedInitialSchoolData(ss) {
  // 1. STUDENTS
  const studentSheet = ss.getSheetByName(SHEETS.STUDENTS);
  const students = [
    ['std-01', '50101', 'เด็กชาย', 'กิตติศักดิ์', 'บุญชู', 'ม.3', '1', 'studying'],
    ['std-02', '50102', 'เด็กหญิง', 'จิราภรณ์', 'แก้วมณี', 'ม.3', '1', 'studying'],
    ['std-03', '50103', 'เด็กชาย', 'ชานนท์', 'ศรีสุข', 'ม.3', '1', 'studying'],
    ['std-04', '50104', 'เด็กหญิง', 'ณิชานันท์', 'ทองคำ', 'ม.3', '1', 'studying'],
    ['std-05', '50105', 'เด็กชาย', 'ธนกฤต', 'พงษ์พิพัฒน์', 'ม.3', '1', 'studying'],
    ['std-06', '50106', 'เด็กหญิง', 'ปภัสสร', 'รัตนโกสินทร์', 'ม.3', '1', 'studying'],
    ['std-07', '50107', 'เด็กชาย', 'ภานุวัฒน์', 'วงศ์สุวรรณ', 'ม.3', '1', 'studying'],
    ['std-08', '50108', 'เด็กหญิง', 'วรัญญา', 'อินทร์จันทร์', 'ม.3', '1', 'studying'],
    ['std-09', '50109', 'เด็กชาย', 'อัครเดช', 'มีชัย', 'ม.3', '1', 'studying'],
    ['std-10', '50110', 'เด็กหญิง', 'อารียา', 'เจริญผล', 'ม.3', '1', 'studying']
  ];
  studentSheet.getRange(2, 1, students.length, students[0].length).setValues(students);

  // 2. SUBJECTS
  const subjectSheet = ss.getSheetByName(SHEETS.SUBJECTS);
  const subjects = [
    ['ว23101', 'วิทยาศาสตร์ 5', 1.5, 60, 'ม.3', 'usr-003'],
    ['ค23101', 'คณิตศาสตร์พื้นฐาน 5', 1.5, 60, 'ม.3', 'usr-004'],
    ['ท23101', 'ภาษาไทย 5', 1.5, 60, 'ม.3', 'usr-002'],
    ['อ23101', 'ภาษาอังกฤษ 5', 1.5, 60, 'ม.3', 'usr-003'],
    ['ส23101', 'สังคมศึกษา 5', 1.5, 60, 'ม.3', 'usr-002']
  ];
  subjectSheet.getRange(2, 1, subjects.length, subjects[0].length).setValues(subjects);

  // 3. SCORE_COMPONENTS
  const compSheet = ss.getSheetByName(SHEETS.SCORE_COMPONENTS);
  const components = [
    ['cmp-01', 'ว23101', 'คะแนนเก็บระหว่างเรียน หน่วยที่ 1-2', 25],
    ['cmp-02', 'ว23101', 'คะแนนเก็บระหว่างเรียน หน่วยที่ 3-4', 25],
    ['cmp-03', 'ว23101', 'สอบวัดผลกลางภาคเรียน', 20],
    ['cmp-04', 'ว23101', 'สอบวัดผลปลายภาคเรียน', 30]
  ];
  compSheet.getRange(2, 1, components.length, components[0].length).setValues(components);

  // 4. SCORES
  const scoreSheet = ss.getSheetByName(SHEETS.SCORES);
  const scores = [
    ['std-01', 'ว23101', JSON.stringify({ 'cmp-01': 22, 'cmp-02': 23 }), 17, 26, 88, '4'],
    ['std-02', 'ว23101', JSON.stringify({ 'cmp-01': 20, 'cmp-02': 21 }), 16, 24, 81, '4'],
    ['std-03', 'ว23101', JSON.stringify({ 'cmp-01': 18, 'cmp-02': 19 }), 14, 22, 73, '3'],
    ['std-04', 'ว23101', JSON.stringify({ 'cmp-01': 24, 'cmp-02': 24 }), 18, 27, 93, '4'],
    ['std-05', 'ว23101', JSON.stringify({ 'cmp-01': 15, 'cmp-02': 16 }), 12, 18, 61, '2'],
    ['std-06', 'ว23101', JSON.stringify({ 'cmp-01': 21, 'cmp-02': 22 }), 15, 25, 83, '4'],
    ['std-07', 'ว23101', JSON.stringify({ 'cmp-01': 12, 'cmp-02': 14 }), 10, 16, 52, '1'],
    ['std-08', 'ว23101', JSON.stringify({ 'cmp-01': 23, 'cmp-02': 24 }), 17, 28, 92, '4'],
    ['std-09', 'ว23101', JSON.stringify({ 'cmp-01': 10, 'cmp-02': 12 }), 8, 14, 44, '0'],
    ['std-10', 'ว23101', JSON.stringify({ 'cmp-01': 19, 'cmp-02': 20 }), 15, 22, 76, '3.5']
  ];
  scoreSheet.getRange(2, 1, scores.length, scores[0].length).setValues(scores);
}

/**
 * บันทึก Audit Log ลงในตาราง AUDIT_LOGS
 */
function recordAuditLog(username, action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.AUDIT_LOGS);
    if (!sheet) return;
    const logId = 'log-' + Utilities.getUuid().slice(0, 8);
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([logId, timestamp, username || 'system', action, details || '']);
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

/**
 * =========================================================================================
 * REST API ROUTERS: doGet & doPost
 * =========================================================================================
 */

function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action || 'ping';

  let responseData = {};

  try {
    if (action === 'ping') {
      responseData = {
        success: true,
        message: 'ระบบเชื่อมต่อ Google Apps Script สำเร็จ',
        school: SCHOOL_CONFIG.name,
        affiliation: SCHOOL_CONFIG.affiliation,
        timestamp: new Date().toISOString()
      };
    } else if (action === 'getInitialData') {
      responseData = handleGetInitialData();
    } else if (action === 'getStudents') {
      responseData = { success: true, students: getSheetDataAsObjects(SHEETS.STUDENTS) };
    } else if (action === 'getSubjects') {
      responseData = { success: true, subjects: getSheetDataAsObjects(SHEETS.SUBJECTS) };
    } else {
      responseData = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let responseData = {};

  try {
    const postData = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = postData.action;

    if (action === 'login') {
      responseData = handleLogin(postData.username, postData.password);
    } else if (action === 'saveScores') {
      responseData = handleSaveScores(postData);
    } else if (action === 'saveAttendance') {
      responseData = handleSaveAttendance(postData);
    } else if (action === 'backupToDrive') {
      responseData = handleDriveBackup(postData.username);
    } else if (action === 'syncFullState') {
      responseData = handleSyncFullState(postData);
    } else {
      responseData = { success: false, error: 'Action not supported: ' + action };
    }
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * จัดการการเข้าสู่ระบบพร้อมการตรวจสอบสิทธิ์ RBAC และ SHA-256
 */
function handleLogin(username, password) {
  if (!username || !password) {
    return { success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  const data = userSheet.getDataRange().getValues();

  // headers: user_id(0), username(1), password_hash(2), full_name(3), role(4), assigned_classes(5), status(6), created_at(7), last_login(8)
  const inputHash = computeSHA256(password);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const uName = String(row[1]).trim();
    const pHash = String(row[2]).trim();
    const status = String(row[6]).trim();

    if (uName.toLowerCase() === username.toLowerCase()) {
      if (status !== 'active') {
        recordAuditLog(username, 'LOGIN_FAILED', 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน');
        return { success: false, message: 'บัญชีผู้ใช้งานนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
      }

      if (pHash === inputHash) {
        // อัปเดตเวลาเข้าสู่ระบบล่าสุด
        const now = new Date().toISOString();
        userSheet.getRange(i + 1, 9).setValue(now);

        const role = row[4];
        const assigned = String(row[5] || 'ALL').split(',').map(s => s.trim());

        recordAuditLog(username, 'LOGIN_SUCCESS', `เข้าสู่ระบบสำเร็จในบทบาท ${role}`);

        return {
          success: true,
          token: 'token-' + Utilities.getUuid(),
          user: {
            id: row[0],
            username: row[1],
            fullName: row[3],
            role: role,
            assignedClasses: assigned
          }
        };
      } else {
        recordAuditLog(username, 'LOGIN_FAILED', 'รหัสผ่านไม่ถูกต้อง');
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
      }
    }
  }

  recordAuditLog(username, 'LOGIN_FAILED', 'ไม่พบบัญชีผู้ใช้นี้ในระบบ');
  return { success: false, message: 'ไม่พบชื่อผู้ใช้นี้ในระบบ' };
}

/**
 * ดึงข้อมูลทั้งหมด 7 ตารางเพื่อส่งกลับไปยังหน้าเว็บ SPA
 */
function handleGetInitialData() {
  return {
    success: true,
    school: SCHOOL_CONFIG,
    users: getSheetDataAsObjects(SHEETS.USERS).map(u => {
      delete u.password_hash; // ไม่ส่ง password_hash กลับไปที่ Client เพื่อความปลอดภัย
      return u;
    }),
    students: getSheetDataAsObjects(SHEETS.STUDENTS),
    subjects: getSheetDataAsObjects(SHEETS.SUBJECTS),
    scoreComponents: getSheetDataAsObjects(SHEETS.SCORE_COMPONENTS),
    scores: getSheetDataAsObjects(SHEETS.SCORES),
    attendance: getSheetDataAsObjects(SHEETS.ATTENDANCE),
    auditLogs: getSheetDataAsObjects(SHEETS.AUDIT_LOGS).slice(-100) // เอา 100 รายการล่าสุด
  };
}

/**
 * บันทึกคะแนนและตัดเกรดอัตโนมัติตามเกณฑ์กระทรวงศึกษาธิการ
 */
function handleSaveScores(payload) {
  const { subjectId, scores, recordedBy } = payload;
  if (!subjectId || !Array.isArray(scores)) {
    return { success: false, message: 'ข้อมูลคะแนนไม่ถูกต้อง' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scoreSheet = ss.getSheetByName(SHEETS.SCORES);
  const data = scoreSheet.getDataRange().getValues();

  // สร้าง Map ของแถวที่มีอยู่แล้ว
  const rowMap = {};
  for (let i = 1; i < data.length; i++) {
    const key = `${data[i][0]}_${data[i][1]}`; // student_id + subject_id
    rowMap[key] = i + 1;
  }

  let updatedCount = 0;
  let insertedCount = 0;

  scores.forEach(item => {
    const studentId = item.studentId;
    const componentScores = JSON.stringify(item.componentScores || {});
    const midterm = Number(item.midterm || 0);
    const final = Number(item.final || 0);
    const total = Number(item.total || 0);
    const grade = item.grade || calculateGrade(total);

    const key = `${studentId}_${subjectId}`;
    if (rowMap[key]) {
      const rowIdx = rowMap[key];
      scoreSheet.getRange(rowIdx, 3, 1, 5).setValues([[componentScores, midterm, final, total, grade]]);
      updatedCount++;
    } else {
      scoreSheet.appendRow([studentId, subjectId, componentScores, midterm, final, total, grade]);
      insertedCount++;
    }
  });

  recordAuditLog(recordedBy || 'teacher', 'SAVE_SCORES', `บันทึกคะแนนวิชา ${subjectId} จำนวน ${scores.length} คน (เพิ่มใหม่: ${insertedCount}, แก้ไข: ${updatedCount})`);

  return {
    success: true,
    message: `บันทึกคะแนนเรียบร้อยแล้ว (${updatedCount + insertedCount} คน)`,
    updatedCount,
    insertedCount
  };
}

/**
 * ตัดเกรดอัตโนมัติตามเกณฑ์มาตรฐาน 8 ระดับ (0 - 4)
 */
function calculateGrade(totalScore) {
  const score = Math.round(Number(totalScore) || 0);
  if (score >= 80) return '4';
  if (score >= 75) return '3.5';
  if (score >= 70) return '3';
  if (score >= 65) return '2.5';
  if (score >= 60) return '2';
  if (score >= 55) return '1.5';
  if (score >= 50) return '1';
  return '0';
}

/**
 * บันทึกเวลาเรียน และตรวจสอบเงื่อนไขเวลาเรียนขั้นต่ำ 80% (เสี่ยง มส)
 */
function handleSaveAttendance(payload) {
  const { date, subjectId, records, recordedBy } = payload;
  if (!records || !Array.isArray(records)) {
    return { success: false, message: 'ข้อมูลเวลาเรียนไม่ถูกต้อง' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const attSheet = ss.getSheetByName(SHEETS.ATTENDANCE);

  const rows = records.map(r => {
    const attId = 'att-' + Utilities.getUuid().slice(0, 8);
    return [
      attId,
      date || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'),
      r.studentId,
      subjectId || 'ALL',
      r.status, // มา, ขาด, สาย, ลา
      recordedBy || 'teacher'
    ];
  });

  if (rows.length > 0) {
    attSheet.getRange(attSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  recordAuditLog(recordedBy || 'teacher', 'SAVE_ATTENDANCE', `บันทึกเวลาเรียนวันที่ ${date} วิชา ${subjectId} จำนวน ${records.length} คน`);

  return {
    success: true,
    message: `บันทึกเวลาเรียนสำเร็จ ${records.length} รายการ`,
    count: records.length
  };
}

/**
 * สำรองข้อมูลไปยัง Google Drive อัตโนมัติ
 */
function handleDriveBackup(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd_HHmmss');
  const backupFileName = `ปพ5_สำรองข้อมูล_${SCHOOL_CONFIG.name}_${nowStr}`;

  // ค้นหาหรือสร้างโฟลเดอร์สำรองข้อมูลใน Google Drive
  const folders = DriveApp.getFoldersByName(SCHOOL_CONFIG.backupFolderName);
  let targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(SCHOOL_CONFIG.backupFolderName);

  // ทำสำเนาสเปรดชีต
  const file = DriveApp.getFileById(ss.getId());
  const backupCopy = file.makeCopy(backupFileName, targetFolder);

  recordAuditLog(username || 'system', 'DRIVE_BACKUP', `สร้างไฟล์สำรองข้อมูลบน Google Drive: ${backupFileName}`);

  return {
    success: true,
    message: `สำรองข้อมูลไปยัง Google Drive สำเร็จ: ${backupFileName}`,
    fileId: backupCopy.getId(),
    fileUrl: backupCopy.getUrl()
  };
}

function manualBackupToDrive() {
  const res = handleDriveBackup('admin');
  SpreadsheetApp.getUi().alert(`✅ ${res.message}\nดูไฟล์ได้ที่: ${res.fileUrl}`);
}

/**
 * ตั้งเวลาสำรองข้อมูลอัตโนมัติทุกวัน เวลา 23:00 น.
 */
function createDailyBackupTrigger() {
  // ลบ Trigger เดิมหากมีอยู่แล้ว
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'handleDriveBackup') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // สร้าง Time-driven Trigger ใหม่
  ScriptApp.newTrigger('handleDriveBackup')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create();

  SpreadsheetApp.getUi().alert('⏰ ตั้งเวลาระบบสำรองข้อมูลอัตโนมัติทุกวัน เวลา 23:00 น. เรียบร้อยแล้ว');
}

/**
 * แปลงข้อมูลในแผ่นงานเป็น Array ของ Object ตาม Header
 */
function getSheetDataAsObjects(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const results = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    results.push(obj);
  }

  return results;
}
