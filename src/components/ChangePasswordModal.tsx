import React, { useState } from 'react';
import { 
  KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, 
  X, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdatePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdatePassword
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'ระดับง่าย (แนะนำให้ยาวกว่า 6 ตัวอักษร)', color: 'bg-amber-500' };
    if (score <= 3) return { score: 2, label: 'ระดับปานกลาง (ปลอดภัย)', color: 'bg-blue-500' };
    return { score: 3, label: 'ระดับสูง (ปลอดภัยมาก)', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่านปัจจุบันของคุณ');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg('กรุณาระบุรหัสผ่านใหม่');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('การยืนยันรหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = onUpdatePassword(currentPassword, newPassword);
      if (result.success) {
        setSuccessMsg(result.message || 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setErrorMsg(result.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ระบบขัดข้อง ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabelMap: Record<string, string> = {
    super_admin: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
    admin: 'ผู้ดูแลระบบ (Admin)',
    academic: 'งานวิชาการและทะเบียนวัดผล',
    teacher: 'ครูผู้สอน',
    homeroom: 'ครูประจำชั้น',
    executive: 'ผู้บริหารสถานศึกษา',
    viewer: 'ผู้ดูข้อมูล'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transition-all duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <KeyRound className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">เปลี่ยนรหัสผ่านของฉัน</h3>
              <p className="text-xs text-indigo-100 mt-0.5">Change Your Password</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-200">
            {currentUser.name ? currentUser.name.charAt(0) : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
              <span>@{currentUser.username}</span>
              <span>•</span>
              <span className="text-indigo-600 font-medium">{roleLabelMap[currentUser.role] || currentUser.role}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900">สำเร็จ!</div>
                <div className="mt-0.5">{successMsg}</div>
                <div className="text-[10px] text-emerald-600 mt-1">หน้าต่างจะปิดโดยอัตโนมัติ...</div>
              </div>
            </div>
          )}

          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รหัสผ่านปัจจุบัน (Current Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านปัจจุบันที่ใช้อยู่"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-900 placeholder:text-slate-400"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รหัสผ่านใหม่ (New Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="ระบุรหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-900 placeholder:text-slate-400"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1.5 w-full">
                  <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`}></div>
                  <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`}></div>
                  <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>ความปลอดภัยของรหัสผ่าน:</span>
                  <span className="font-semibold text-slate-700">{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ยืนยันรหัสผ่านใหม่ (Confirm New Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
                className={`w-full pl-9 pr-10 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 transition text-slate-900 placeholder:text-slate-400 ${
                  confirmPassword && confirmPassword !== newPassword 
                    ? 'border-rose-300 focus:border-rose-500' 
                    : confirmPassword && confirmPassword === newPassword
                    ? 'border-emerald-400 focus:border-emerald-500'
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-[10px] mt-1 font-medium ${
                confirmPassword === newPassword ? 'text-emerald-600 flex items-center gap-1' : 'text-rose-600'
              }`}>
                {confirmPassword === newPassword ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>รหัสผ่านตรงกันเรียบร้อย</span>
                  </>
                ) : (
                  'รหัสผ่านไม่ตรงกัน'
                )}
              </p>
            )}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700">คำแนะนำ:</span> สำหรับครูผู้ใช้งานทั่วไป รหัสผ่านใหม่จะถูกบันทึกเพื่อใช้ในการเข้าสู่ระบบครั้งถัดไป และจะถูกซิงค์ข้อมูลกับคลาวด์โดยอัตโนมัติ
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMsg}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกรหัสผ่านใหม่</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
