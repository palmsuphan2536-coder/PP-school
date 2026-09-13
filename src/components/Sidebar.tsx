import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, GraduationCap, DoorClosed, BookOpen, 
  CalendarDays, Clock, CheckSquare, FileSpreadsheet, FileText, 
  BarChart3, AlertTriangle, Database, Settings, Shield,
  ChevronRight, ChevronLeft, Sparkles, PanelLeftClose, PanelLeftOpen,
  ChevronDown, Award, KeyRound
} from 'lucide-react';
import { UserRole } from '../types';

export type ActiveTab = 
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'classrooms'
  | 'subjects'
  | 'calendar'
  | 'timetable'
  | 'attendance'
  | 'scores'
  | 'pp5'
  | 'pp6'
  | 'reports'
  | 'at_risk'
  | 'users'
  | 'backup'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole?: UserRole;
  isMobileOpen?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile: () => void;
  atRiskCount?: number;
  unrecordedAttendanceCount?: number;
  unreadCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenChangePassword?: () => void;
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  requiredRoles?: UserRole[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  isMobileOpen = false,
  isOpenMobile = false,
  onCloseMobile,
  atRiskCount = 0,
  unrecordedAttendanceCount = 0,
  isCollapsed = false,
  onToggleCollapse = () => {},
  onOpenChangePassword,
}) => {
  const mobileOpen = isMobileOpen || isOpenMobile;
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const allSections: MenuSection[] = [
    {
      title: 'ภารกิจหลัก ปพ.5 & วัดผล',
      items: [
        { id: 'dashboard', label: 'หน้าหลัก (ภาพรวม)', shortLabel: 'หน้าหลัก', icon: LayoutDashboard },
        { 
          id: 'attendance', 
          label: 'การมาเรียน / เวลาเรียน', 
          shortLabel: 'เวลาเรียน', 
          icon: CheckSquare, 
          badge: unrecordedAttendanceCount > 0 ? unrecordedAttendanceCount : undefined, 
          badgeColor: 'bg-amber-500' 
        },
        { id: 'scores', label: 'บันทึกคะแนนและตัดเกรด', shortLabel: 'คะแนน/เกรด', icon: FileSpreadsheet },
        { 
          id: 'pp5', 
          label: 'เอกสาร ปพ.5 ทางการ', 
          shortLabel: 'ปพ.5', 
          icon: FileText, 
          badge: 'ศธ./สพฐ.', 
          badgeColor: 'bg-indigo-600' 
        },
        { 
          id: 'pp6', 
          label: 'เอกสาร ปพ.6 (รายบุคคล)', 
          shortLabel: 'ปพ.6', 
          icon: Award, 
          badge: 'ครูประจำชั้น', 
          badgeColor: 'bg-emerald-600' 
        },
        { 
          id: 'at_risk', 
          label: 'นักเรียนที่ต้องติดตาม', 
          shortLabel: 'กลุ่มเสี่ยง', 
          icon: AlertTriangle, 
          badge: atRiskCount > 0 ? atRiskCount : undefined, 
          badgeColor: 'bg-rose-500' 
        },
        { id: 'reports', label: 'รายงานและสถิติวิเคราะห์', shortLabel: 'สถิติ/รายงาน', icon: BarChart3 },
      ]
    },
    {
      title: 'ข้อมูลสถานศึกษา',
      items: [
        { id: 'students', label: 'ข้อมูลนักเรียน', shortLabel: 'นักเรียน', icon: Users },
        { id: 'teachers', label: 'ครูและบุคลากร', shortLabel: 'ครู/บุคลากร', icon: GraduationCap },
        { id: 'classrooms', label: 'ห้องเรียน', shortLabel: 'ห้องเรียน', icon: DoorClosed },
        { id: 'subjects', label: 'รายวิชา / ผู้สอน', shortLabel: 'รายวิชา', icon: BookOpen },
        { id: 'timetable', label: 'ตารางเรียนตารางสอน', shortLabel: 'ตารางสอน', icon: Clock },
        { id: 'calendar', label: 'ปฏิทินการศึกษา', shortLabel: 'ปฏิทิน', icon: CalendarDays },
      ]
    },
    {
      title: 'ระบบ & คลาวด์',
      items: [
        { 
          id: 'users', 
          label: 'จัดการผู้ใช้ & รหัสผ่าน', 
          shortLabel: 'ผู้ใช้/รหัส', 
          icon: Shield,
          badge: 'Super Admin',
          badgeColor: 'bg-purple-600'
        },
        { id: 'backup', label: 'สำรองข้อมูล / Cloud Sync', shortLabel: 'Cloud/Backup', icon: Database },
        { id: 'settings', label: 'ตั้งค่าระบบและโรงเรียน', shortLabel: 'ตั้งค่าระบบ', icon: Settings },
      ]
    }
  ];

  // Restrict access: Non-super admins CANNOT access "ระบบ & คลาวด์" (User management, Cloud sync, System settings)
  // Teachers/homeroom get focused access to grading, attendance, at-risk, pp5, pp6, and dashboard.
  const menuSections: MenuSection[] = allSections
    .filter(section => {
      if (section.title === 'ระบบ & คลาวด์') {
        return userRole === 'super_admin' || userRole === 'admin';
      }
      if (section.title === 'ข้อมูลสถานศึกษา') {
        return userRole === 'super_admin' || userRole === 'academic' || userRole === 'admin';
      }
      return true;
    })
    .map(section => {
      if (userRole !== 'super_admin' && userRole !== 'academic' && userRole !== 'admin') {
        // Filter items in primary section for regular teachers
        return {
          ...section,
          items: section.items.filter(item => 
            ['scores', 'attendance', 'at_risk', 'pp5', 'pp6', 'dashboard'].includes(item.id)
          )
        };
      }
      return section;
    });

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Aside */}
      <aside 
        className={`
          fixed top-16 bottom-0 left-0 z-40 bg-slate-900 text-slate-200 border-r border-slate-800
          flex flex-col transition-all duration-300 ease-in-out no-print shadow-xl
          ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Header Bar with Toggle Button */}
        <div className="h-13 px-3 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/40">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2 min-w-0 pl-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-300 tracking-wide truncate">
                  เมนูหลักสำหรับจัดการ ปพ.5
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="ย่อแถบเมนู (Collapse Sidebar)"
                aria-label="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition bg-slate-800/50"
                title="ขยายแถบเมนู (Expand Sidebar)"
                aria-label="Expand Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          )}

          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
          {menuSections.map((section, secIdx) => {
            const isSectionCollapsed = collapsedSections[section.title] && !isCollapsed;

            return (
              <div key={secIdx} className="space-y-1">
                {/* Section Header */}
                {!isCollapsed ? (
                  <div 
                    onClick={() => toggleSection(section.title)}
                    className="px-2.5 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 select-none transition"
                  >
                    <span>{section.title}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSectionCollapsed ? '-rotate-90 text-slate-500' : 'text-slate-400'}`} />
                  </div>
                ) : (
                  <div className="w-full h-px bg-slate-800/80 my-2" />
                )}

                {/* Section Items */}
                {!isSectionCollapsed && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <div key={item.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => handleSelect(item.id)}
                            className={`
                              w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150
                              ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'}
                              ${isActive 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                              }
                            `}
                          >
                            <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                              <div className="relative">
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                {/* Mini badge dot on icon when collapsed */}
                                {isCollapsed && item.badge !== undefined && (
                                  <span className={`absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${item.badgeColor || 'bg-rose-500'}`}>
                                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                )}
                              </div>
                              {!isCollapsed && (
                                <span className="truncate text-left text-xs sm:text-sm">{item.label}</span>
                              )}
                            </div>

                            {/* Badges in expanded mode */}
                            {!isCollapsed && item.badge !== undefined && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 ml-2 ${item.badgeColor || 'bg-slate-700'}`}>
                                {item.badge}
                              </span>
                            )}
                          </button>

                          {/* Tooltip in Collapsed Mode */}
                          {isCollapsed && (
                            <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 border border-slate-700 items-center gap-2">
                              <span>{item.label}</span>
                              {item.badge !== undefined && (
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white ${item.badgeColor || 'bg-slate-700'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom System Banner & Quick Toggle */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 shrink-0 space-y-2">
          {!isCollapsed ? (
            <>
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 transition border border-slate-800 hover:border-slate-700 group shadow-2xs"
                  title="เปลี่ยนรหัสผ่านของฉัน"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition shrink-0" />
                  <span className="truncate">เปลี่ยนรหัสผ่านของฉัน</span>
                </button>
              )}

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">มาตรฐาน ศธ./สพฐ.</div>
                  <div className="text-[10px] text-emerald-400 font-medium truncate">รองรับระเบียบวัดผล 2551</div>
                </div>
              </div>

              {/* Bottom Expand/Collapse button */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex w-full items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ย่อแถบเมนู</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  className="hidden lg:flex p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="เปลี่ยนรหัสผ่านของฉัน (Change Password)"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </button>
              )}

              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="ขยายแถบเมนู (Expand Sidebar)"
              >
                <ChevronRight className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
