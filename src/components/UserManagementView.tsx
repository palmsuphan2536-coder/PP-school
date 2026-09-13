import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, Key, Eye, EyeOff, Edit2, Trash2, 
  CheckCircle2, AlertTriangle, Search, Filter, RefreshCw, 
  ExternalLink, FileSpreadsheet, Lock, Unlock, Mail, Briefcase, Building,
  ShieldCheck, UserCheck
} from 'lucide-react';
import { UserAccount, UserRole, SchoolInfo } from '../types';
import { GoogleBackupInfo } from '../services/googleSheetsService';

interface UserManagementViewProps {
  userAccounts: UserAccount[];
  currentUserRole?: string;
  schoolInfo: SchoolInfo;
  backupInfo?: GoogleBackupInfo | null;
  onAddUser: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string, newPassword: string) => void;
  onTriggerSheetsBackup?: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  userAccounts,
  currentUserRole = 'super_admin',
  schoolInfo,
  backupInfo,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
  onTriggerSheetsBackup
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'teacher' as UserRole,
    position: 'ครูผู้สอน',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    email: '',
    status: 'active' as 'active' | 'inactive',
    description: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleOpenAdd = () => {
    setNewUserForm({
      username: '',
      password: '',
      name: '',
      role: 'teacher',
      position: 'ครูผู้สอน',
      department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
      email: '',
      status: 'active',
      description: 'ครูผู้สอน: บันทึกคะแนน เช็กชื่อรายวิชา และส่งผลการเรียน'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.password.trim() || !newUserForm.name.trim()) {
      setFormError('กรุณากรอกชื่อผู้ใช้, รหัสผ่าน และชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }

    // Check duplicate username
    if (userAccounts.some(u => u.username.toLowerCase() === newUserForm.username.trim().toLowerCase())) {
      setFormError(`ชื่อผู้ใช้ "${newUserForm.username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
      return;
    }

    onAddUser({
      username: newUserForm.username.trim(),
      password: newUserForm.password.trim(),
      name: newUserForm.name.trim(),
      role: newUserForm.role,
      position: newUserForm.position.trim(),
      department: newUserForm.department.trim(),
      email: newUserForm.email.trim(),
      status: newUserForm.status,
      description: newUserForm.description.trim()
    });

    setIsAddModalOpen(false);
    showToast(`เพิ่มผู้ใช้ "${newUserForm.name}" (Username: ${newUserForm.username}) สำเร็จ`);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser({ ...user });
    setFormError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.username.trim() || !editingUser.password.trim() || !editingUser.name.trim()) {
      setFormError('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }

    // Check duplicate username if changed
    const duplicate = userAccounts.some(
      u => u.id !== editingUser.id && u.username.toLowerCase() === editingUser.username.trim().toLowerCase()
    );
    if (duplicate) {
      setFormError(`ชื่อผู้ใช้ "${editingUser.username}" มีผู้อื่นใช้งานแล้ว`);
      return;
    }

    onUpdateUser({
      ...editingUser,
      username: editingUser.username.trim(),
      password: editingUser.password.trim(),
      name: editingUser.name.trim(),
      position: editingUser.position?.trim(),
      department: editingUser.department?.trim(),
      email: editingUser.email?.trim()
    });

    setEditingUser(null);
    showToast(`อัปเดตข้อมูลบัญชี "${editingUser.name}" สำเร็จ`);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    if (deletingUser.username === 'admin') {
      alert('ไม่สามารถลบบัญชี Super Admin หลัก (admin) ได้');
      setDeletingUser(null);
      return;
    }

    onDeleteUser(deletingUser.id);
    showToast(`ลบบัญชีผู้ใช้ "${deletingUser.name}" ออกจากระบบแล้ว`);
    setDeletingUser(null);
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordInput.trim()) return;

    onResetPassword(resetPasswordUser.id, newPasswordInput.trim());
    showToast(`เปลี่ยนรหัสผ่านของ "${resetPasswordUser.name}" เป็นรหัสใหม่สำเร็จ`);
    setResetPasswordUser(null);
    setNewPasswordInput('');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          thLabel: 'ผู้ดูแลระบบสูงสุด',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
        };
      case 'executive':
        return {
          label: 'Executive',
          thLabel: 'ผู้อำนวยการ/ผู้บริหาร',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Briefcase className="w-3.5 h-3.5 text-amber-600" />
        };
      case 'academic':
        return {
          label: 'Academic',
          thLabel: 'งานวิชาการและวัดผล',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Building className="w-3.5 h-3.5 text-blue-600" />
        };
      case 'homeroom':
        return {
          label: 'Homeroom',
          thLabel: 'ครูประจำชั้น',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
        };
      default:
        return {
          label: 'Teacher',
          thLabel: 'ครูผู้สอน',
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: <Users className="w-3.5 h-3.5 text-slate-600" />
        };
    }
  };

  // Filtered Users
  const filteredUsers = userAccounts.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.position && u.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const superAdminCount = userAccounts.filter(u => u.role === 'super_admin').length;
  const activeCount = userAccounts.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6 font-prompt">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{successToast}</span>
          </div>
          <span className="text-xs text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full font-medium">
            บันทึกแล้ว
          </span>
        </div>
      )}

      {/* Header & Quick Sync Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">ระบบจัดการผู้ใช้และรหัสผ่าน</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Super Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                กำหนดชื่อผู้ใช้ รหัสผ่าน เพิ่ม/ลบ สิทธิ์ผู้ใช้งาน และสำรองบัญชีลง Google Sheet แผ่นที่ 7 (7_บัญชีผู้ใช้และรหัสผ่าน)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onTriggerSheetsBackup && (
              <button
                type="button"
                onClick={onTriggerSheetsBackup}
                className="px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-2 transition shadow-2xs"
                title="สำรองบัญชีผู้ใช้และรหัสผ่านลงชีตที่ 7 ทันที"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>สำรองรหัสผ่านลง Google Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้ใหม่</span>
            </button>
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-600" />
            <span>
              บัญชีเริ่มต้นของระบบ: <strong>admin</strong> (รหัสผ่าน: <strong>admin</strong>) ระดับสิทธิ์ Super Admin
            </span>
          </div>
          {backupInfo && backupInfo.spreadsheetUrl && (
            <a
              href={backupInfo.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 shrink-0"
            >
              <span>เปิดไฟล์ Google Sheet ที่สำรองไว้</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">ผู้ใช้ทั้งหมด</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold text-slate-800">{userAccounts.length}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">บัญชีในระบบ ปพ.5</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-purple-600 font-medium">Super Admin</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold text-purple-700">{superAdminCount}</span>
            <ShieldCheck className="w-5 h-5 text-purple-500" />
          </div>
          <span className="text-[11px] text-purple-500 mt-1 block">สิทธิ์จัดการระบบสูงสุด</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-emerald-600 font-medium">สถานะเปิดใช้งาน</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-700">{activeCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">พร้อมเข้าสู่ระบบ</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-blue-600 font-medium">บันทึกใน Sheet</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold text-blue-700">แผ่นที่ 7</span>
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[11px] text-blue-600 mt-1 block">7_บัญชีผู้ใช้และรหัสผ่าน</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-นามสกุล, หรือตำแหน่ง..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" /> ระดับสิทธิ์:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">ทุกระดับสิทธิ์ ({userAccounts.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="executive">ผู้อำนวยการ (Executive)</option>
            <option value="academic">งานวิชาการ (Academic)</option>
            <option value="homeroom">ครูประจำชั้น (Homeroom)</option>
            <option value="teacher">ครูผู้สอน (Teacher)</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3.5 px-4 min-w-[180px]">ชื่อผู้ใช้ (Username)</th>
                <th className="py-3.5 px-4 min-w-[160px]">รหัสผ่าน (Password)</th>
                <th className="py-3.5 px-4 min-w-[220px]">ชื่อ-นามสกุล</th>
                <th className="py-3.5 px-4 min-w-[140px]">ระดับสิทธิ์ (Role)</th>
                <th className="py-3.5 px-4 min-w-[160px]">ตำแหน่ง / กลุ่มสาระ</th>
                <th className="py-3.5 px-4 w-28 text-center">สถานะ</th>
                <th className="py-3.5 px-4 w-32 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    ไม่พบบัญชีผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const roleBadge = getRoleBadge(user.role);
                  const isPwVisible = !!showPasswordMap[user.id];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-700 text-xs">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              {user.username}
                            </span>
                            {user.email && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <div className="bg-slate-100 px-2 py-1 rounded-md text-xs font-semibold text-slate-800 border border-slate-200 select-all">
                            {isPwVisible ? user.password : '••••••••'}
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title={isPwVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                          >
                            {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {user.name}
                        </span>
                        {user.description && (
                          <span className="text-[11px] text-slate-400 truncate block max-w-[200px]">
                            {user.description}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] border ${roleBadge.bg}`}>
                          {roleBadge.icon}
                          <span>{roleBadge.label}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {roleBadge.thLabel}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800 text-xs">
                          {user.position || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {user.department || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          user.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {user.status === 'active' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="แก้ไขข้อมูลผู้ใช้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResetPasswordUser(user);
                              setNewPasswordInput('');
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="เปลี่ยนรหัสผ่าน"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {user.username !== 'admin' ? (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="ลบผู้ใช้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-slate-300 cursor-not-allowed" title="บัญชีหลัก ไม่สามารถลบได้">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <span>แสดง {filteredUsers.length} จากทั้งหมด {userAccounts.length} บัญชี</span>
          <span className="text-slate-400">
            * ข้อมูลรหัสผ่านทั้งหมดจะถูกบันทึกและซิงค์ไปยัง Google Sheet "7_บัญชีผู้ใช้และรหัสผ่าน" อัตโนมัติเมื่อกดสำรองข้อมูล
          </span>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">เพิ่มผู้ใช้งานใหม่ (Add User)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อผู้ใช้ (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    placeholder="เช่น teacher01, somchai"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รหัสผ่าน (Password) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="เช่น 123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อ-นามสกุล (พร้อมคำนำหน้า) *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="เช่น นายกิตติศักดิ์ พรหมดี"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ระดับสิทธิ์ในระบบ (Role)
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="teacher">ครูผู้สอน (Teacher)</option>
                    <option value="homeroom">ครูประจำชั้น (Homeroom)</option>
                    <option value="academic">งานวิชาการและวัดผล (Academic)</option>
                    <option value="executive">ผู้บริหาร/ผู้อำนวยการ (Executive)</option>
                    <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    สถานะการใช้งาน
                  </label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="inactive">ระงับการใช้งาน (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={newUserForm.position}
                    onChange={(e) => setNewUserForm({ ...newUserForm, position: e.target.value })}
                    placeholder="เช่น ครู ค.ศ. 1, ครูชำนาญการ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    อีเมลติดต่อ
                  </label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="user@watrat.ac.th"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  กลุ่มสาระ / ฝ่ายงาน
                </label>
                <input
                  type="text"
                  value={newUserForm.department}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  placeholder="เช่น กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition"
                >
                  บันทึกผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">แก้ไขข้อมูลผู้ใช้ (Edit User)</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อผู้ใช้ (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    disabled={editingUser.username === 'admin'}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  {editingUser.username === 'admin' && (
                    <span className="text-[10px] text-amber-600 block mt-0.5">
                      บัญชี admin หลัก ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รหัสผ่าน (Password) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ระดับสิทธิ์ (Role)
                  </label>
                  <select
                    value={editingUser.role}
                    disabled={editingUser.username === 'admin'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    <option value="teacher">ครูผู้สอน (Teacher)</option>
                    <option value="homeroom">ครูประจำชั้น (Homeroom)</option>
                    <option value="academic">งานวิชาการและวัดผล (Academic)</option>
                    <option value="executive">ผู้บริหาร/ผู้อำนวยการ (Executive)</option>
                    <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    สถานะการใช้งาน
                  </label>
                  <select
                    value={editingUser.status}
                    disabled={editingUser.username === 'admin'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="inactive">ระงับการใช้งาน (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={editingUser.position || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    อีเมลติดต่อ
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  กลุ่มสาระ / ฝ่ายงาน
                </label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Key className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">เปลี่ยนรหัสผ่านผู้ใช้</h3>
            </div>

            <p className="text-xs text-slate-600">
              กำหนดรหัสผ่านใหม่สำหรับผู้ใช้ <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.username})
            </p>

            <form onSubmit={handleConfirmResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านใหม่ *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="ป้อนรหัสผ่านใหม่..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                >
                  ยืนยันเปลี่ยนรหัส
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">ยืนยันการลบบัญชีผู้ใช้</h3>
            </div>

            <p className="text-xs text-slate-600">
              คุณต้องการลบบัญชีผู้ใช้ <strong>{deletingUser.name}</strong> (Username: <code>{deletingUser.username}</code>) ออกจากระบบหรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
