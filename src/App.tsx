import React, { useState, useEffect } from 'react';
import { 
  Classroom, Subject, Teacher, Student, ScoreComponent, 
  ScoreRecord, SubjectGradingSummary, AttendanceRecord, 
  SchoolInfo, AcademicYear, Term, TimetablePeriod, 
  SchoolCalendarEvent, AuditLog, SystemNotification, 
  BackupLog, User, GradingRule, StudentStatus, TimetableSlot,
  UserAccount
} from './types';
import { 
  loadAppState, saveAppState, getAtRiskStudents, 
  calculateGPA, recordAudit, addNotification 
} from './services/storageService';
import { 
  backupToGoogleSheets, getStoredBackupInfo, getLinkedEmail, fetchUserAccountsFromGoogleSheets 
} from './services/googleSheetsService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AttendanceView } from './components/AttendanceView';
import { ScoreEntryView } from './components/ScoreEntryView';
import { PP5View } from './components/PP5View';
import { PP6View } from './components/PP6View';
import { AtRiskStudentsView } from './components/AtRiskStudentsView';
import { StudentsView } from './components/StudentsView';
import { TeachersView } from './components/TeachersView';
import { ClassroomsView } from './components/ClassroomsView';
import { SubjectsView } from './components/SubjectsView';
import { TimetableCalendarView } from './components/TimetableCalendarView';
import { ReportsView } from './components/ReportsView';
import { BackupSettingsView } from './components/BackupSettingsView';
import { UserManagementView } from './components/UserManagementView';
import { StudentProfileModal } from './components/StudentProfileModal';
import { AuditLogModal } from './components/AuditLogModal';
import { NotificationModal } from './components/NotificationModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LoginView } from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  // Load persisted state
  const [appState, setAppState] = useState(() => loadAppState());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('WATRAT_PP5_SIDEBAR_COLLAPSED') === 'true';
    } catch {
      return false;
    }
  });

  // Authentication State - Always start at login screen when opening web app
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('WATRAT_PP5_SIDEBAR_COLLAPSED', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [selectedYearId, setSelectedYearId] = useState<string>(appState.academicYears[0]?.id || 'ay-2569');
  const [selectedTermId, setSelectedTermId] = useState<string>(appState.terms[0]?.id || 'term-2569-1');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Modals state
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save state on changes
  const updateStateAndPersist = (updater: (prev: typeof appState) => typeof appState) => {
    setAppState(prev => {
      const next = updater(prev);
      saveAppState(next);
      return next;
    });
  };

  const {
    schoolInfo,
    academicYears,
    terms,
    gradingRules,
    classrooms,
    subjects,
    teachers,
    students,
    scoreComponents,
    scoreRecords,
    subjectGradings,
    attendanceRecords,
    timetable = [],
    calendarEvents = [],
    auditLogs,
    notifications,
    backupLogs,
    userAccounts = [],
    currentUser
  } = appState;

  // Access Restriction Guard:
  // Non-admin / non-super_admin users are strictly restricted from "System & Cloud" and administrative modules.
  useEffect(() => {
    if (currentUser && currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      const restrictedTabs = ['users', 'backup', 'settings', 'teachers', 'classrooms', 'subjects', 'timetables'];
      if (restrictedTabs.includes(activeTab)) {
        setActiveTab('scores');
      }
    }
  }, [currentUser?.role, activeTab]);

  // Refresh handler to reload state from storage
  const handleRefreshData = () => {
    setAppState(loadAppState());
  };

  // Switch User Profile / Role
  const handleSwitchUser = (user: User) => {
    updateStateAndPersist(prev => {
      const newAudit = recordAudit(
        user.id,
        user.name,
        `เปลี่ยนโปรไฟล์ผู้ใช้งานเป็น [${user.name}] (${user.role})`,
        'auth',
        user.id
      );
      return {
        ...prev,
        currentUser: user,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100)
      };
    });
  };

  // Login Handler
  const handleLogin = (user: User) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem('WATRAT_PP5_AUTH', 'true');
    } catch {}
    handleSwitchUser(user);
  };

  // Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('WATRAT_PP5_AUTH', 'false');
    } catch {}
    updateStateAndPersist(prev => {
      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        'ลงชื่อออกจากระบบ (Log out)',
        'auth',
        prev.currentUser.id
      );
      return {
        ...prev,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100)
      };
    });
  };

  // --- Handlers for Attendance ---
  const handleSaveAttendance = (records: AttendanceRecord[]) => {
    if (!records || records.length === 0) return;
    const first = records[0];

    updateStateAndPersist(prev => {
      const otherRecords = prev.attendanceRecords.filter(ar => {
        if (ar.date !== first.date || ar.type !== first.type) return true;
        if (ar.classroomId !== first.classroomId) return true;
        if (first.type === 'subject') {
          return !(ar.subjectId === first.subjectId && ar.period === first.period);
        }
        return false;
      });

      const cls = prev.classrooms.find(c => c.id === first.classroomId);
      const clsName = cls?.name || first.classroomId;
      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        `บันทึกการเช็คชื่อ [${first.type === 'daily' ? 'ประจำวัน' : 'รายวิชา'}] ห้อง ${clsName} วันที่ ${first.date} (${records.length} คน)`,
        'attendance',
        first.classroomId || ''
      );

      const notif = addNotification(
        'success',
        `บันทึกเวลาเรียน ห้อง ${clsName}`,
        `บันทึกเวลาเรียน ${records.length} คน วันที่ ${first.date} เรียบร้อยแล้ว`
      );

      return {
        ...prev,
        attendanceRecords: [...otherRecords, ...records],
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [notif, ...prev.notifications].slice(0, 50)
      };
    });
  };

  // --- Handlers for Scores ---
  const handleSaveScoresAndGradingsAndSyncSheets = async (
    newRecords: ScoreRecord[],
    newGradings: SubjectGradingSummary[]
  ): Promise<{ success: boolean; sheetsSuccess: boolean; message: string; spreadsheetUrl?: string }> => {
    let latestGradings: SubjectGradingSummary[] = [];
    let latestRecords: ScoreRecord[] = [];

    // 1. Update local storage & application state
    updateStateAndPersist(prev => {
      const recordMap = new Map<string, ScoreRecord>(prev.scoreRecords.map(r => [`${r.studentId}_${r.componentId}`, r]));
      newRecords.forEach(r => recordMap.set(`${r.studentId}_${r.componentId}`, r));
      latestRecords = Array.from(recordMap.values());

      const gradingMap = new Map<string, SubjectGradingSummary>(prev.subjectGradings.map(g => [g.id, g]));
      newGradings.forEach(g => {
        const existingIdx = prev.subjectGradings.findIndex(
          eg => eg.studentId === g.studentId && eg.subjectId === g.subjectId
        );
        if (existingIdx >= 0) {
          gradingMap.delete(prev.subjectGradings[existingIdx].id);
        }
        gradingMap.set(g.id, g);
      });
      latestGradings = Array.from(gradingMap.values());

      const subject = prev.subjects.find(s => s.id === newGradings[0]?.subjectId);
      const classroom = prev.classrooms.find(c => c.id === newGradings[0]?.classroomId);

      const newAudit = recordAudit(
        currentUser?.id || 'admin',
        currentUser?.name || 'ผู้ดูแลระบบ',
        `บันทึกคะแนนและตัดเกรด วิชา ${subject?.code || ''} ห้อง ${classroom?.name || ''} (${newGradings.length} คน)`,
        'score',
        subject?.id || '',
        null,
        'saved'
      );

      const newNotif = addNotification(
        'success',
        `บันทึกคะแนนและตัดเกรดเรียบร้อย`,
        `บันทึกผลการเรียนวิชา ${subject?.name || ''} ห้อง ${classroom?.name || ''} จำนวน ${newGradings.length} คน`
      );

      return {
        ...prev,
        scoreRecords: latestRecords,
        subjectGradings: latestGradings,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [newNotif, ...prev.notifications].slice(0, 50)
      };
    });

    // 2. Sync to Google Sheets
    try {
      const email = getLinkedEmail();
      const stored = getStoredBackupInfo();
      const backupResult = await backupToGoogleSheets(
        {
          schoolInfo: appState.schoolInfo,
          students: appState.students,
          subjects: appState.subjects,
          subjectGradings: latestGradings,
          attendanceRecords: appState.attendanceRecords,
          teachers: appState.teachers,
          classrooms: appState.classrooms,
          academicYears: appState.academicYears,
          terms: appState.terms,
          userAccounts: appState.userAccounts,
          scoreRecords: latestRecords,
          scoreComponents: appState.scoreComponents
        },
        email,
        stored?.spreadsheetId
      );

      return {
        success: true,
        sheetsSuccess: true,
        message: 'บันทึกคะแนนและตัดเกรดลงระบบ พร้อมส่งไปยัง Google Sheets สำเร็จเรียบร้อยแล้ว',
        spreadsheetUrl: backupResult.spreadsheetUrl
      };
    } catch (err: any) {
      console.warn('Sync to Google Sheets encountered issue:', err);
      return {
        success: true,
        sheetsSuccess: false,
        message: `บันทึกข้อมูลคะแนนและเกรดในระบบเรียบร้อยแล้ว (การส่งไป Google Sheets: ${err?.message || 'โปรดตรวจสอบการเชื่อมต่อ'})`
      };
    }
  };

  const handleUpdateScore = (studentId: string, componentId: string, score: number | null) => {
    updateStateAndPersist(prev => {
      const student = prev.students.find(s => s.id === studentId);
      const component = prev.scoreComponents.find(c => c.id === componentId);
      const existing = prev.scoreRecords.find(
        r => r.studentId === studentId && r.componentId === componentId
      );
      const oldScore = existing?.score ?? null;

      let newRecords = [...prev.scoreRecords];
      const nowIso = new Date().toISOString();
      if (existing) {
        const idx = newRecords.indexOf(existing);
        newRecords[idx] = {
          ...existing,
          score,
          lastUpdated: nowIso,
          updatedAt: nowIso,
          updatedBy: currentUser.name
        };
      } else {
        newRecords.push({
          id: `scr-${Date.now()}-${studentId}-${componentId}`,
          studentId,
          subjectId: component?.subjectId || '',
          componentId,
          score,
          academicYearId: component?.academicYearId || 'ay-2569',
          termId: component?.termId || 'term-ay-2569-1',
          lastUpdated: nowIso,
          updatedAt: nowIso,
          updatedBy: currentUser.name
        });
      }

      const newAudit = recordAudit(
        currentUser.id,
        currentUser.name,
        `แก้ไขคะแนน ${student?.firstName} (${component?.name})`,
        'score',
        studentId,
        oldScore,
        score
      );

      return {
        ...prev,
        scoreRecords: newRecords,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100)
      };
    });
  };

  const handleUpdateGradingSummary = (summary: SubjectGradingSummary) => {
    updateStateAndPersist(prev => {
      const idx = prev.subjectGradings.findIndex(g => g.id === summary.id || (g.studentId === summary.studentId && g.subjectId === summary.subjectId));
      let newGradings = [...prev.subjectGradings];
      if (idx >= 0) {
        newGradings[idx] = summary;
      } else {
        newGradings.push(summary);
      }
      return {
        ...prev,
        subjectGradings: newGradings
      };
    });
  };

  const handleBatchUpdateGrading = (summaries: SubjectGradingSummary[]) => {
    updateStateAndPersist(prev => {
      const map = new Map(prev.subjectGradings.map(g => [g.id, g]));
      summaries.forEach(s => map.set(s.id, s));

      const newAudit = recordAudit(
        currentUser.id,
        currentUser.name,
        `เปลี่ยนสถานะกระบวนการอนุมัติเกรดเป็น [${summaries[0]?.approvalStatus}]`,
        'workflow',
        summaries[0]?.subjectId || '',
        null,
        summaries[0]?.approvalStatus
      );

      const newNotif = addNotification(
        'success',
        `อัปเดตสถานะผลการเรียน (${summaries[0]?.approvalStatus})`,
        `วิชาถูกปรับสถานะเป็น ${summaries[0]?.approvalStatus} โดย ${currentUser.name}`
      );

      return {
        ...prev,
        subjectGradings: Array.from(map.values()),
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [newNotif, ...prev.notifications].slice(0, 50)
      };
    });
  };

  const handleUpdateComponents = (components: ScoreComponent[]) => {
    updateStateAndPersist(prev => {
      const otherComps = prev.scoreComponents.filter(
        c => !(c.subjectId === components[0]?.subjectId && c.classroomId === components[0]?.classroomId)
      );
      return {
        ...prev,
        scoreComponents: [...otherComps, ...components]
      };
    });
  };

  // --- Handlers for Students ---
  const handleAddStudent = (std: Student) => {
    updateStateAndPersist(prev => ({
      ...prev,
      students: [...prev.students, std]
    }));
  };

  const handleUpdateStudent = (std: Student) => {
    updateStateAndPersist(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === std.id ? std : s)
    }));
  };

  const handleDeleteStudent = (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id)
    }));
  };

  const handleBatchAddStudents = (newStudents: Student[]) => {
    updateStateAndPersist(prev => ({
      ...prev,
      students: [...prev.students, ...newStudents]
    }));
  };

  // --- Handlers for Teachers ---
  const handleAddTeacher = (t: Teacher) => {
    updateStateAndPersist(prev => ({
      ...prev,
      teachers: [...prev.teachers, t]
    }));
  };

  const handleUpdateTeacher = (t: Teacher) => {
    updateStateAndPersist(prev => ({
      ...prev,
      teachers: prev.teachers.map(item => item.id === t.id ? t : item)
    }));
  };

  const handleDeleteTeacher = (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => t.id !== id)
    }));
  };

  // --- Handlers for Classrooms ---
  const handleAddClassroom = (c: Classroom) => {
    updateStateAndPersist(prev => ({
      ...prev,
      classrooms: [...prev.classrooms, c]
    }));
  };

  const handleUpdateClassroom = (c: Classroom) => {
    updateStateAndPersist(prev => ({
      ...prev,
      classrooms: prev.classrooms.map(item => item.id === c.id ? c : item)
    }));
  };

  const handleDeleteClassroom = (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      classrooms: prev.classrooms.filter(c => c.id !== id)
    }));
  };

  // --- Handlers for Subjects ---
  const handleAddSubject = (s: Subject) => {
    const tch = s.teacherId ? appState.teachers.find(t => t.id === s.teacherId) : null;
    const resolvedSubject: Subject = {
      ...s,
      teacherName: s.teacherName || (tch ? `${tch.title || ''}${tch.firstName} ${tch.lastName}`.trim() : '')
    };
    updateStateAndPersist(prev => ({
      ...prev,
      subjects: [...prev.subjects, resolvedSubject]
    }));
  };

  const handleUpdateSubject = (s: Subject) => {
    const tch = s.teacherId ? appState.teachers.find(t => t.id === s.teacherId) : null;
    const resolvedSubject: Subject = {
      ...s,
      teacherName: s.teacherName || (tch ? `${tch.title || ''}${tch.firstName} ${tch.lastName}`.trim() : '')
    };
    updateStateAndPersist(prev => ({
      ...prev,
      subjects: prev.subjects.map(item => item.id === s.id ? resolvedSubject : item)
    }));
  };

  const handleDeleteSubject = (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== id)
    }));
  };

  // --- Handlers for Timetable ---
  const handleSaveTimetableSlot = (slot: TimetableSlot) => {
    updateStateAndPersist(prev => {
      const subj = prev.subjects.find(s => s.id === slot.subjectId);
      const periodItem: TimetablePeriod = {
        ...slot,
        periodNumber: slot.period,
        subjectCode: subj?.code || '',
        subjectName: subj?.name || ''
      };

      const existingIdx = prev.timetable.findIndex(t => 
        t.id === slot.id || 
        (t.classroomId === slot.classroomId && t.dayOfWeek === slot.dayOfWeek && (t.period === slot.period || t.periodNumber === slot.period))
      );

      let updated = [...prev.timetable];
      if (existingIdx >= 0) {
        updated[existingIdx] = periodItem;
      } else {
        updated.push(periodItem);
      }

      return {
        ...prev,
        timetable: updated
      };
    });
  };

  const handleDeleteTimetableSlot = (slotId: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      timetable: prev.timetable.filter(t => t.id !== slotId)
    }));
  };

  const handleBatchSaveTimetable = (slots: TimetableSlot[]) => {
    updateStateAndPersist(prev => {
      if (slots.length === 0) return prev;
      const classroomId = slots[0].classroomId;
      const remaining = prev.timetable.filter(t => t.classroomId !== classroomId);
      const newItems: TimetablePeriod[] = slots.map(slot => {
        const subj = prev.subjects.find(s => s.id === slot.subjectId);
        return {
          ...slot,
          periodNumber: slot.period,
          subjectCode: subj?.code || '',
          subjectName: subj?.name || ''
        };
      });

      return {
        ...prev,
        timetable: [...remaining, ...newItems]
      };
    });
  };

  // --- Handlers for Calendar Events ---
  const handleAddCalendarEvent = (evt: SchoolCalendarEvent) => {
    updateStateAndPersist(prev => ({
      ...prev,
      calendarEvents: [...prev.calendarEvents, evt]
    }));
  };

  const handleUpdateCalendarEvent = (evt: SchoolCalendarEvent) => {
    updateStateAndPersist(prev => ({
      ...prev,
      calendarEvents: prev.calendarEvents.map(e => e.id === evt.id ? evt : e)
    }));
  };

  // --- Handlers for Academic Years (Continuous addition while keeping historical data) ---
  const handleAddAcademicYear = (year: number, makeCurrent: boolean) => {
    updateStateAndPersist(prev => {
      const newYearId = `ay-${year}`;
      const newYear: AcademicYear = {
        id: newYearId,
        year: year,
        isCurrent: makeCurrent,
        status: 'active'
      };

      const newTerms: Term[] = [
        {
          id: `term-${year}-1`,
          academicYearId: newYearId,
          termNumber: 1,
          startDate: `${year - 543}-05-16`,
          endDate: `${year - 543}-10-10`,
          isCurrent: makeCurrent,
          isClosed: false
        },
        {
          id: `term-${year}-2`,
          academicYearId: newYearId,
          termNumber: 2,
          startDate: `${year - 543}-11-01`,
          endDate: `${year - 543 + 1}-03-31`,
          isCurrent: false,
          isClosed: false
        }
      ];

      const updatedYears = makeCurrent 
        ? prev.academicYears.map(y => ({ ...y, isCurrent: false })).concat(newYear)
        : [...prev.academicYears, newYear];

      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        `เพิ่มปีการศึกษาใหม่ ${year}`,
        'system',
        newYearId,
        null,
        String(year)
      );

      const newNotif = addNotification(
        'success',
        `เพิ่มปีการศึกษา ${year} เรียบร้อยแล้ว`,
        `ข้อมูลผลการเรียนและนักเรียนของปีเดิมยังคงอยู่ครบถ้วนในระบบ`
      );

      if (makeCurrent) {
        setSelectedYearId(newYearId);
        setSelectedTermId(newTerms[0].id);
      }

      return {
        ...prev,
        academicYears: updatedYears,
        terms: [...prev.terms, ...newTerms],
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [newNotif, ...prev.notifications].slice(0, 50)
      };
    });
  };

  const handleSetCurrentAcademicYear = (yearId: string) => {
    updateStateAndPersist(prev => {
      const updatedYears = prev.academicYears.map(y => ({
        ...y,
        isCurrent: y.id === yearId
      }));
      const currentYear = updatedYears.find(y => y.id === yearId);
      const yearTerms = prev.terms.filter(t => t.academicYearId === yearId);

      setSelectedYearId(yearId);
      if (yearTerms.length > 0) {
        setSelectedTermId(yearTerms[0].id);
      }

      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        `เปลี่ยนปีการศึกษาปัจจุบันเป็น ${currentYear?.year}`,
        'system',
        yearId
      );

      return {
        ...prev,
        academicYears: updatedYears,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100)
      };
    });
  };

  const handleToggleTermClosed = (termId: string) => {
    updateStateAndPersist(prev => {
      const updatedTerms = prev.terms.map(t => 
        t.id === termId ? { ...t, isClosed: !t.isClosed } : t
      );
      return {
        ...prev,
        terms: updatedTerms
      };
    });
  };

  // --- Handlers for School Settings & Grading Rules ---
  const handleUpdateSchoolInfo = (info: SchoolInfo) => {
    updateStateAndPersist(prev => ({
      ...prev,
      schoolInfo: info
    }));
  };

  const handleUpdateGradingRules = (rules: GradingRule[]) => {
    updateStateAndPersist(prev => ({
      ...prev,
      gradingRules: rules
    }));
  };

  // Notification Modals & Read Handlers
  const handleMarkAsRead = (id: string) => {
    updateStateAndPersist(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const handleMarkAllAsRead = () => {
    updateStateAndPersist(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  };

  // Helper to sync user accounts directly to Sheet 7 on any add/update/delete
  const syncUserAccountsToSheets = async (accountsToSync: UserAccount[]) => {
    try {
      const email = getLinkedEmail();
      const stored = getStoredBackupInfo();
      if (!stored?.spreadsheetId) return;

      await backupToGoogleSheets(
        {
          schoolInfo: appState.schoolInfo,
          students: appState.students,
          subjects: appState.subjects,
          subjectGradings: appState.subjectGradings,
          attendanceRecords: appState.attendanceRecords,
          teachers: appState.teachers,
          classrooms: appState.classrooms,
          academicYears: appState.academicYears,
          terms: appState.terms,
          userAccounts: accountsToSync
        },
        email,
        stored.spreadsheetId
      );
    } catch (err) {
      console.warn('Sync users to Sheet 7 warning:', err);
    }
  };

  // User Management Handlers (Super Admin CRUD & Sync to Sheet 7)
  const handleAddUserAccount = (newUser: Omit<UserAccount, 'id'>) => {
    updateStateAndPersist(prev => {
      const createdUser: UserAccount = {
        ...newUser,
        id: `user-${Date.now()}`
      };
      const updatedAccounts = [...(prev.userAccounts || []), createdUser];
      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        `เพิ่มบัญชีผู้ใช้งานใหม่: ${createdUser.username} (${createdUser.name}) บทบาท ${createdUser.role}`,
        'auth',
        createdUser.id
      );
      const notif = addNotification(
        'success',
        `เพิ่มผู้ใช้ ${createdUser.username} สำเร็จ`,
        `กำหนดบทบาท ${createdUser.role} และบันทึกลงแผ่นงานที่ 7 แล้ว`
      );

      // Instantly sync to Google Sheets (Sheet 7)
      setTimeout(() => {
        syncUserAccountsToSheets(updatedAccounts);
      }, 200);

      return {
        ...prev,
        userAccounts: updatedAccounts,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [notif, ...prev.notifications].slice(0, 50)
      };
    });
  };

  const handleUpdateUserAccount = (updatedUser: UserAccount) => {
    updateStateAndPersist(prev => {
      const updatedAccounts = (prev.userAccounts || []).map(u => u.id === updatedUser.id ? updatedUser : u);
      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        `แก้ไขข้อมูลบัญชีผู้ใช้งาน: ${updatedUser.username} (${updatedUser.name})`,
        'auth',
        updatedUser.id
      );

      setTimeout(() => {
        syncUserAccountsToSheets(updatedAccounts);
      }, 200);

      return {
        ...prev,
        userAccounts: updatedAccounts,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100)
      };
    });
  };

  const handleDeleteUserAccount = (userId: string) => {
    updateStateAndPersist(prev => {
      const targetUser = (prev.userAccounts || []).find(u => u.id === userId);
      const targetName = targetUser?.name || targetUser?.username || '';
      const updatedAccounts = (prev.userAccounts || []).filter(u => u.id !== userId);
      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        `ลบบัญชีผู้ใช้งาน: ${targetUser?.username || userId} (ลบออกจากชีตที่ 7 ด้วย)`,
        'auth',
        userId
      );
      const notif = addNotification(
        'warning',
        `ลบบัญชีผู้ใช้ ${targetName} (${targetUser?.username || ''}) สำเร็จ`,
        `ลบข้อมูลออกจากระบบและลบออกจากแผ่นงานที่ 7 (Google Sheet) เรียบร้อยแล้ว`
      );

      // Instantly sync to Sheet 7 (batchClear wipes old rows and writes updated list)
      setTimeout(() => {
        syncUserAccountsToSheets(updatedAccounts);
      }, 200);

      return {
        ...prev,
        userAccounts: updatedAccounts,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [notif, ...prev.notifications].slice(0, 50)
      };
    });
  };

  const handleResetPassword = (userId: string, newPassword: string) => {
    updateStateAndPersist(prev => {
      const targetUser = (prev.userAccounts || []).find(u => u.id === userId);
      const updatedAccounts = (prev.userAccounts || []).map(u => 
        u.id === userId 
          ? { ...u, password: newPassword, updatedAt: new Date().toISOString() } 
          : u
      );
      const newAudit = recordAudit(
        prev.currentUser.id,
        prev.currentUser.name,
        `รีเซ็ตรหัสผ่านสำหรับผู้ใช้: ${targetUser?.username || userId}`,
        'auth',
        userId
      );
      const notif = addNotification(
        'info',
        `รีเซ็ตรหัสผ่าน ${targetUser?.username || ''} เรียบร้อยแล้ว`,
        `รหัสผ่านใหม่ถูกบันทึกในระบบและพร้อมอัปเดตลงชีตที่ 7 ทันที`
      );

      setTimeout(() => {
        syncUserAccountsToSheets(updatedAccounts);
      }, 200);

      return {
        ...prev,
        userAccounts: updatedAccounts,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [notif, ...prev.notifications].slice(0, 50)
      };
    });
  };

  // Allow general teachers and all users to change their own password securely
  const handleChangeOwnPassword = (currentPass: string, newPass: string): { success: boolean; message: string } => {
    const currentUsername = currentUser.username;
    const currentId = currentUser.id;

    // Check existing account in userAccounts
    const existingAcc = (userAccounts || []).find(
      u => u.id === currentId || u.username.toLowerCase() === currentUsername.toLowerCase()
    );

    if (existingAcc) {
      if (existingAcc.password !== currentPass) {
        return { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
      }
    }

    // Update in userAccounts and persist
    updateStateAndPersist(prev => {
      let accounts = [...(prev.userAccounts || [])];
      const idx = accounts.findIndex(
        u => u.id === currentId || u.username.toLowerCase() === currentUsername.toLowerCase()
      );

      if (idx >= 0) {
        accounts[idx] = {
          ...accounts[idx],
          password: newPass,
        };
      } else {
        accounts.push({
          id: currentId,
          username: currentUsername,
          password: newPass,
          name: currentUser.name,
          role: currentUser.role,
          email: currentUser.email,
          position: currentUser.position,
          department: currentUser.department || '',
          status: 'active'
        });
      }

      const newAudit = recordAudit(
        currentUser.id,
        currentUser.name,
        `ผู้ใช้ [${currentUser.name}] (@${currentUser.username}) เปลี่ยนรหัสผ่านของตนเองสำเร็จ`,
        'auth',
        currentUser.id
      );

      const notif = addNotification(
        'success',
        'เปลี่ยนรหัสผ่านส่วนตัวสำเร็จ',
        `บัญชี ${currentUser.username} (${currentUser.name}) ได้รับการเปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว`
      );

      return {
        ...prev,
        userAccounts: accounts,
        auditLogs: [newAudit, ...prev.auditLogs].slice(0, 100),
        notifications: [notif, ...prev.notifications].slice(0, 50)
      };
    });

    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว' };
  };

  const handleTriggerSheetsBackup = async () => {
    try {
      const email = getLinkedEmail();
      const stored = getStoredBackupInfo();
      await backupToGoogleSheets(
        {
          schoolInfo,
          students,
          subjects,
          subjectGradings,
          attendanceRecords,
          teachers,
          classrooms,
          academicYears,
          terms,
          userAccounts
        },
        email,
        stored?.spreadsheetId
      );
      const notif = addNotification(
        'success',
        'อัปเดต Google Sheets สำเร็จ',
        'บันทึกข้อมูลและรหัสผ่านทั้งหมดลงชีตที่ 7 เรียบร้อยแล้ว'
      );
      updateStateAndPersist(prev => ({
        ...prev,
        notifications: [notif, ...prev.notifications].slice(0, 50)
      }));
    } catch (e) {
      console.warn('Auto backup sheets trigger notice:', e);
    }
  };

  // Pull latest accounts from Sheet 7
  const handleRefreshUsersFromSheet = async (): Promise<{ success: boolean; count?: number; message?: string }> => {
    try {
      const accounts = await fetchUserAccountsFromGoogleSheets();
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          message: 'ไม่พบข้อมูลบัญชีผู้ใช้ในแผ่นงานที่ 7 หรือยังไม่ได้เชื่อมต่อ Google Sheets'
        };
      }

      updateStateAndPersist(prev => ({
        ...prev,
        userAccounts: accounts
      }));

      return {
        success: true,
        count: accounts.length,
        message: `ดึงข้อมูลบัญชีผู้ใช้จากแผ่นงานที่ 7 สำเร็จ (${accounts.length} บัญชี)`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจากแผ่นงานที่ 7'
      };
    }
  };

  // Check At-Risk Students
  const atRiskList = getAtRiskStudents(students, attendanceRecords, subjectGradings, subjects);
  const unreadCount = notifications.filter(n => !n.read).length;

  // IF NOT AUTHENTICATED: Show Login Screen First
  if (!isAuthenticated) {
    return (
      <LoginView
        schoolInfo={schoolInfo}
        teachers={teachers}
        userAccounts={userAccounts}
        onLogin={handleLogin}
        onRefreshUsersFromSheet={handleRefreshUsersFromSheet}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-prompt">
      {/* Top Navbar */}
      <Navbar
        schoolInfo={schoolInfo}
        currentUser={currentUser}
        academicYears={academicYears}
        terms={terms}
        selectedYearId={selectedYearId}
        selectedTermId={selectedTermId}
        unreadNotificationsCount={unreadCount}
        isOnline={isOnline}
        onSelectYear={setSelectedYearId}
        onSelectTerm={setSelectedTermId}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onOpenAuditLogs={() => setShowAuditModal(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Container */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab as any}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          userRole={currentUser?.role}
          unreadCount={unreadCount}
          atRiskCount={atRiskList.length}
          isOpenMobile={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
        />

        {/* Dynamic Content View Area with responsive padding for sidebar */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-76'
        }`}>
          {activeTab === 'dashboard' && (
            <DashboardView
              schoolInfo={schoolInfo}
              classrooms={classrooms}
              subjects={subjects}
              students={students}
              subjectGradings={subjectGradings}
              attendanceRecords={attendanceRecords}
              atRiskList={atRiskList}
              onNavigateTab={setActiveTab}
              onSelectStudentProfile={(std) => setProfileStudent(std)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              classrooms={classrooms}
              subjects={subjects}
              students={students}
              teachers={teachers}
              attendanceRecords={attendanceRecords}
              academicYears={academicYears}
              terms={terms}
              selectedYearId={selectedYearId}
              selectedTermId={selectedTermId}
              onSaveAttendance={handleSaveAttendance}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'scores' && (
            <ErrorBoundary fallbackTitle="ระบบบันทึกคะแนนและตัดเกรด">
              <ScoreEntryView
                classrooms={classrooms}
                subjects={subjects}
                students={students}
                scoreComponents={scoreComponents}
                scoreRecords={scoreRecords}
                subjectGradings={subjectGradings}
                gradingRules={gradingRules}
                schoolInfo={schoolInfo}
                currentUser={currentUser}
                onUpdateScore={handleUpdateScore}
                onUpdateGradingSummary={handleUpdateGradingSummary}
                onUpdateComponents={handleUpdateComponents}
                onBatchUpdateGrading={handleBatchUpdateGrading}
                onSaveScoresAndGradingsAndSyncSheets={handleSaveScoresAndGradingsAndSyncSheets}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'pp5' && (
            <PP5View
              schoolInfo={schoolInfo}
              classrooms={classrooms}
              subjects={subjects}
              students={students}
              scoreComponents={scoreComponents}
              scoreRecords={scoreRecords}
              subjectGradings={subjectGradings}
              attendanceRecords={attendanceRecords}
              academicYears={academicYears}
              terms={terms}
              teachers={teachers}
              timetable={timetable}
              selectedYearId={selectedYearId}
              selectedTermId={selectedTermId}
            />
          )}

          {activeTab === 'pp6' && (
            <PP6View
              schoolInfo={schoolInfo}
              classrooms={classrooms}
              subjects={subjects}
              students={students}
              subjectGradings={subjectGradings}
              attendanceRecords={attendanceRecords}
              academicYears={academicYears}
              terms={terms}
              selectedYearId={selectedYearId}
              selectedTermId={selectedTermId}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'at_risk' && (
            <AtRiskStudentsView
              atRiskList={atRiskList}
              classrooms={classrooms}
              onSelectStudentProfile={(std) => setProfileStudent(std)}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              classrooms={classrooms}
              selectedYearId={selectedYearId}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBatchAddStudents={handleBatchAddStudents}
              onViewProfile={(std) => setProfileStudent(std)}
            />
          )}

          {activeTab === 'teachers' && (
            <TeachersView
              teachers={teachers}
              classrooms={classrooms}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {activeTab === 'classrooms' && (
            <ClassroomsView
              classrooms={classrooms}
              teachers={teachers}
              students={students}
              onAddClassroom={handleAddClassroom}
              onUpdateClassroom={handleUpdateClassroom}
              onDeleteClassroom={handleDeleteClassroom}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              teachers={teachers}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
            />
          )}

          {/* Timetable & Calendar views - fully functional and editable */}
          {(activeTab === 'calendar' || activeTab === 'timetable') && (
            <TimetableCalendarView
              classrooms={classrooms}
              subjects={subjects}
              teachers={teachers}
              timetable={timetable}
              calendarEvents={calendarEvents}
              initialSubTab={activeTab === 'calendar' ? 'calendar' : 'timetable'}
              onAddCalendarEvent={handleAddCalendarEvent}
              onUpdateCalendarEvent={handleUpdateCalendarEvent}
              onSaveTimetableSlot={handleSaveTimetableSlot}
              onDeleteTimetableSlot={handleDeleteTimetableSlot}
              onBatchSaveTimetable={handleBatchSaveTimetable}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              schoolInfo={schoolInfo}
              classrooms={classrooms}
              subjects={subjects}
              students={students}
              gradings={subjectGradings}
              attendanceRecords={attendanceRecords}
            />
          )}

          {/* User Management View for Super Admin */}
          {activeTab === 'users' && (
            <UserManagementView
              userAccounts={userAccounts}
              currentUserRole={currentUser.role}
              schoolInfo={schoolInfo}
              backupInfo={getStoredBackupInfo()}
              onAddUser={handleAddUserAccount}
              onUpdateUser={handleUpdateUserAccount}
              onDeleteUser={handleDeleteUserAccount}
              onResetPassword={handleResetPassword}
              onTriggerSheetsBackup={handleTriggerSheetsBackup}
            />
          )}

          {/* Backup & System Settings views - both 'backup' and 'settings' correctly routed! */}
          {(activeTab === 'backup' || activeTab === 'settings') && (
            <BackupSettingsView
              schoolInfo={schoolInfo}
              students={students}
              subjects={subjects}
              subjectGradings={subjectGradings}
              attendanceRecords={attendanceRecords}
              teachers={teachers}
              classrooms={classrooms}
              academicYears={academicYears}
              terms={terms}
              gradingRules={gradingRules}
              backupLogs={backupLogs}
              userAccounts={userAccounts}
              onUpdateSchoolInfo={handleUpdateSchoolInfo}
              onUpdateGradingRules={handleUpdateGradingRules}
              onRefreshData={handleRefreshData}
              initialTab={activeTab === 'backup' ? 'google-sheets' : 'school'}
              selectedYearId={selectedYearId}
              selectedTermId={selectedTermId}
              onAddAcademicYear={handleAddAcademicYear}
              onSetCurrentAcademicYear={handleSetCurrentAcademicYear}
              onSelectYear={setSelectedYearId}
              onSelectTerm={setSelectedTermId}
              onToggleTermClosed={handleToggleTermClosed}
            />
          )}
        </main>
      </div>

      {/* Student Profile Modal */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
          subjects={subjects}
          gradings={subjectGradings}
          attendanceRecords={attendanceRecords}
          schoolInfo={schoolInfo}
        />
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <AuditLogModal
          logs={auditLogs}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {/* System Notifications Modal */}
      {showNotificationModal && (
        <NotificationModal
          notifications={notifications}
          onClose={() => setShowNotificationModal(false)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}

      {/* Change Password Modal for teachers and all users */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUser={currentUser}
        onUpdatePassword={handleChangeOwnPassword}
      />
    </div>
  );
}
