import React, { useState } from 'react';
import { 
  School, Bell, Shield, CloudCheck, UserCheck, Menu, X, 
  Search, History, RefreshCw, ChevronDown, CheckCircle2, AlertTriangle,
  LogOut, KeyRound
} from 'lucide-react';
import { SchoolInfo, AcademicYear, Term, User, SystemNotification } from '../types';

interface NavbarProps {
  schoolInfo: SchoolInfo;
  academicYears?: AcademicYear[];
  terms?: Term[];
  selectedYearId: string;
  selectedTermId: string;
  onSelectYear: (yearId: string) => void;
  onSelectTerm: (termId: string) => void;
  currentUser: User;
  onSwitchUserRole?: (role: User['role']) => void;
  onSwitchUser?: (user: User) => void;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
  notifications?: SystemNotification[];
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
  onOpenAuditLog?: () => void;
  onOpenAuditLogs?: () => void;
  onManualSyncCloud?: () => void;
  isSyncing?: boolean;
  isOnline?: boolean;
  onToggleMobileSidebar?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  globalSearch?: string;
  onGlobalSearchChange?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  schoolInfo,
  academicYears = [],
  terms = [],
  selectedYearId,
  selectedTermId,
  onSelectYear,
  onSelectTerm,
  currentUser,
  onSwitchUserRole,
  onSwitchUser,
  onLogout,
  onOpenChangePassword,
  notifications = [],
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenAuditLog,
  onOpenAuditLogs,
  onManualSyncCloud,
  isSyncing = false,
  isOnline = true,
  onToggleMobileSidebar,
  onToggleSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  globalSearch = '',
  onGlobalSearchChange,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const unreadCount = typeof unreadNotificationsCount === 'number'
    ? unreadNotificationsCount
    : (Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0);

  const toggleSidebar = onToggleMobileSidebar || onToggleSidebar || (() => {});
  const openAudit = onOpenAuditLog || onOpenAuditLogs || (() => {});

  const currentYearObj = (academicYears || []).find(y => y.id === selectedYearId) || academicYears[0];
  const currentTermObj = (terms || []).find(t => t.id === selectedTermId) || terms[0];

  const handleRoleChange = (r: User['role']) => {
    if (onSwitchUserRole) {
      onSwitchUserRole(r);
    } else if (onSwitchUser && currentUser) {
      onSwitchUser({ ...currentUser, role: r });
    }
  };

  const roleLabels: Record<User['role'], string> = {
    super_admin: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
    admin: 'ผู้ดูแลระบบ (Admin)',
    academic: 'งานวิชาการ/วัดผล (Academic)',
    teacher: 'ครูผู้สอน (Teacher)',
    homeroom: 'ครูประจำชั้น (Homeroom)',
    executive: 'ผู้บริหารสถานศึกษา (Executive)',
    viewer: 'ผู้ดูข้อมูลทั่วไป (Viewer)'
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 shadow-xs no-print">
      <div className="px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
        {/* Left: Mobile menu toggle + School Branding */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger menu */}
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shrink-0 font-bold">
              {schoolInfo.logoUrl ? (
                <img src={schoolInfo.logoUrl} alt="School Logo" className="w-8 h-8 object-contain rounded-lg" />
              ) : (
                <School className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-900 truncate text-base sm:text-lg leading-tight">
                  {schoolInfo.name || 'ระบบจัดการ ปพ.5 โรงเรียน'}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ระบบ ปพ.5 ออนไลน์
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                {schoolInfo.subdistrict} {schoolInfo.district} {schoolInfo.province} • {schoolInfo.affiliation}
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Global Search Bar */}
        <div className="hidden xl:flex items-center flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อ, เลขประจำตัว, วิชา..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition"
          />
          {globalSearch && (
            <button 
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Controls: Year/Term selector, Sync, Audit, Notif, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Year & Term Selectors */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <select
              value={selectedYearId}
              onChange={(e) => onSelectYear(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold px-2 py-1 rounded focus:outline-none cursor-pointer"
            >
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>ปี {y.year} {y.isCurrent ? '(ปัจจุบัน)' : ''}</option>
              ))}
            </select>
            <span className="text-slate-300">|</span>
            <select
              value={selectedTermId}
              onChange={(e) => onSelectTerm(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold px-2 py-1 rounded focus:outline-none cursor-pointer"
            >
              {(terms || []).filter(t => t.academicYearId === selectedYearId).map(t => (
                <option key={t.id} value={t.id}>ภาคเรียนที่ {t.termNumber}</option>
              ))}
            </select>
          </div>

          {/* Cloud Auto-Backup Indicator / Trigger */}
          <button
            onClick={onManualSyncCloud || (() => {})}
            disabled={isSyncing}
            title="สำรองข้อมูลบนคลาวด์อัตโนมัติ"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'กำลังสำรอง...' : 'คลาวด์ปลอดภัย'}</span>
          </button>

          {/* Audit Log button */}
          <button
            onClick={openAudit}
            title="ประวัติการบันทึกและแก้ไขข้อมูล (Audit Log)"
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Notification center */}
          <button
            onClick={onOpenNotifications}
            title="การแจ้งเตือนระบบ"
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-indigo-600 font-medium">
                  {currentUser.role === 'super_admin' ? 'Super Admin' :
                   currentUser.role === 'academic' ? 'งานวิชาการ' :
                   currentUser.role === 'teacher' ? 'ครูผู้สอน' :
                   currentUser.role === 'homeroom' ? 'ครูประจำชั้น' :
                   currentUser.role === 'executive' ? 'ผู้บริหาร' : 'Admin'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-slate-500 text-[11px]">{currentUser.position} • {currentUser.department}</p>
                    <p className="text-indigo-600 text-[11px] font-medium mt-0.5">
                      สิทธิ์ปัจจุบัน: {roleLabels[currentUser.role]}
                    </p>
                  </div>

                  {/* Change Password for teachers and general users */}
                  <div className="py-1 border-b border-slate-100 mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        if (onOpenChangePassword) {
                          onOpenChangePassword();
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/90 transition group font-medium"
                    >
                      <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-xs">เปลี่ยนรหัสผ่านของฉัน</div>
                        <div className="text-[10px] text-slate-500 truncate">จัดการความปลอดภัยบัญชีส่วนตัว</div>
                      </div>
                    </button>
                  </div>

                  {onLogout && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition font-semibold"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>ลงชื่อออกจากระบบ (Log Out)</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
