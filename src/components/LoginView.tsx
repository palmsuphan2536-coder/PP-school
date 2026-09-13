import React, { useState } from 'react';
import { 
  School, Lock, User, Eye, EyeOff, LogIn, 
  ShieldCheck, CheckCircle2, AlertCircle, GraduationCap,
  Sparkles, Check
} from 'lucide-react';
import { SchoolInfo, User as UserType, Teacher } from '../types';

interface LoginViewProps {
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  onLogin: (user: UserType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  schoolInfo,
  teachers = [],
  onLogin,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Preset quick-login demo accounts with super admin 'admin' / 'admin' first
  const demoAccounts: {
    username: string;
    label: string;
    roleName: string;
    roleDesc: string;
    badgeColor: string;
    icon: string;
  }[] = [
    {
      username: 'admin',
      label: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
      roleName: 'ผู้ดูแลระบบสูงสุด (Super Administrator)',
      roleDesc: 'ชื่อผู้ใช้: admin | รหัสผ่าน: admin (จัดการระบบ ตารางเรียน ปีการศึกษา และ Google Sheets)',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      icon: '👑'
    },
    {
      username: 'director',
      label: schoolInfo.directorName || 'นายประสิทธิ์ พงษ์พานิช',
      roleName: 'ผู้อำนวยการสถานศึกษา (Executive)',
      roleDesc: 'อนุมัติผลการเรียน ปพ.5 และดูรายงานภาพรวมทั้งโรงเรียน',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: '🏛️'
    },
    {
      username: 'prasert',
      label: 'นายประเสริฐ ดีเลิศ',
      roleName: 'หัวหน้างานวิชาการ/ทะเบียน (Academic)',
      roleDesc: 'จัดการหลักสูตร ตรวจสอบผลการเรียน และปิดภาคเรียน',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '📚'
    },
    {
      username: 'suphan',
      label: 'นายสุพรรณ เมืองทอง',
      roleName: 'ครูผู้สอน / ครูประจำชั้น (Teacher)',
      roleDesc: 'เช็คชื่อเวลาเรียน บันทึกคะแนนเก็บ และประเมินผล ปพ.5',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '👨‍🏫'
    }
  ];

  const handleQuickLogin = (uname: string) => {
    setErrorMsg(null);
    setUsername(uname);
    const pass = uname === 'admin' ? '1234' : '123456';
    setPassword(pass);

    setIsLoading(true);
    setTimeout(() => {
      executeLogin(uname, pass);
      setIsLoading(false);
    }, 350);
  };

  const executeLogin = (userToLogin: string, passEntered?: string) => {
    const trimmed = userToLogin.trim().toLowerCase();
    const enteredPass = passEntered !== undefined ? passEntered : password;

    // 1. Super Admin default account: admin / 1234
    if (trimmed === 'admin') {
      if (enteredPass && enteredPass !== '1234' && enteredPass !== 'admin') {
        setErrorMsg('รหัสผ่านไม่ถูกต้อง สำหรับชื่อผู้ใช้ admin รหัสผ่านเริ่มต้นคือ 1234');
        return;
      }

      const superAdminUser: UserType = {
        id: 'user-superadmin-01',
        username: 'admin',
        name: 'ผู้ดูแลระบบสูงสุด (Super Administrator)',
        role: 'super_admin',
        email: 'rst72010045@gmail.com',
        position: 'ผู้ดูแลระบบสารสนเทศ ปพ.5',
        department: 'กลุ่มงานเทคโนโลยีสารสนเทศ'
      };

      if (rememberMe) {
        try {
          localStorage.setItem('WATRAT_AUTH_USER', JSON.stringify(superAdminUser));
        } catch {}
      } else {
        try {
          sessionStorage.setItem('WATRAT_AUTH_USER', JSON.stringify(superAdminUser));
        } catch {}
      }

      onLogin(superAdminUser);
      return;
    }

    const safeTeachers = Array.isArray(teachers) ? teachers : [];
    const matchedTeacher = safeTeachers.find(
      t => t?.username?.toLowerCase() === trimmed || t?.teacherCode?.toLowerCase() === trimmed
    );

    if (matchedTeacher) {
      const authUser: UserType = {
        id: matchedTeacher.id,
        username: matchedTeacher.username,
        name: `${matchedTeacher.title}${matchedTeacher.firstName} ${matchedTeacher.lastName}`,
        role: matchedTeacher.role,
        email: matchedTeacher.email || '',
        position: matchedTeacher.position,
        department: matchedTeacher.department
      };

      if (rememberMe) {
        try {
          localStorage.setItem('WATRAT_AUTH_USER', JSON.stringify(authUser));
        } catch {}
      } else {
        try {
          sessionStorage.setItem('WATRAT_AUTH_USER', JSON.stringify(authUser));
        } catch {}
      }

      onLogin(authUser);
    } else {
      // Fallback user if typing a custom name
      const fallbackUser: UserType = {
        id: 'user-' + Date.now(),
        username: trimmed || 'teacher',
        name: trimmed === 'director' ? (schoolInfo.directorName || 'ผู้อำนวยการสถานศึกษา') : 'ครูผู้ใช้งานระบบ',
        role: trimmed === 'director' ? 'executive' : 'teacher',
        email: `${trimmed}@watrat.ac.th`,
        position: 'ครูผู้สอน',
        department: 'งานวิชาการ'
      };

      if (rememberMe) {
        try {
          localStorage.setItem('WATRAT_AUTH_USER', JSON.stringify(fallbackUser));
        } catch {}
      }

      onLogin(fallbackUser);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้งาน หรือเลือกลงชื่อเข้าใช้ด่วน');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      executeLogin(username, password);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 font-prompt">
      {/* Top School Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ระบบสารสนเทศความปลอดภัยสูง มาตรฐาน สพฐ. กระทรวงศึกษาธิการ</span>
        </div>
        <div className="hidden sm:block">
          <span>ปีการศึกษา 2569</span>
        </div>
      </div>

      {/* Main Login Center Card */}
      <div className="w-full max-w-4xl mx-auto my-auto py-8">
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Hero Brand Panel (5 Cols) */}
          <div className="lg:col-span-5 bg-linear-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

            {/* School Emblem & Name */}
            <div className="space-y-4 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-2 shadow-inner flex items-center justify-center">
                {schoolInfo.logoUrl ? (
                  <img 
                    src={schoolInfo.logoUrl} 
                    alt="School Logo" 
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <School className="w-10 h-10 text-white" />
                )}
              </div>

              <div>
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 text-indigo-200 border border-white/10 mb-2">
                  ระบบ ปพ.5 ออนไลน์ ทางการ
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
                  {schoolInfo.name || 'โรงเรียนวัดราษฎร์ศรัทธาธรรม'}
                </h2>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  {schoolInfo.affiliation || 'สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษา'}
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 my-8 relative z-10 text-xs">
              <div className="flex items-center gap-2.5 text-indigo-100">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span>บันทึกคะแนนเก็บ กลางภาค และปลายภาค อัตโนมัติ</span>
              </div>
              <div className="flex items-center gap-2.5 text-indigo-100">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span>เช็คชื่อเวลาเรียน คำนวณเกณฑ์ มส. 80% ทันที</span>
              </div>
              <div className="flex items-center gap-2.5 text-indigo-100">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span>พิมพ์เอกสาร ปพ.5 สมบูรณ์พร้อมระบบลงนามอิเล็กทรอนิกส์</span>
              </div>
            </div>

            {/* School Contact Footer in Hero */}
            <div className="text-[11px] text-indigo-300 border-t border-white/15 pt-4 relative z-10">
              <p>{schoolInfo.subdistrict} {schoolInfo.district} {schoolInfo.province} {schoolInfo.postalCode}</p>
              <p className="mt-0.5 opacity-80">เบอร์โทรศัพท์: {schoolInfo.phone || '035-512345'}</p>
            </div>
          </div>

          {/* Right Form Panel (7 Cols) */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">ลงชื่อเข้าสู่ระบบ</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    เข้าสู่ระบบเพื่อจัดการเวลาเรียน คะแนน และเอกสาร ปพ.5
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ระบบพร้อมใช้งาน</span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    ชื่อผู้ใช้งาน (Username / รหัสประจำตัวครู)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="เช่น suphan, prasert, director, admin"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-semibold">
                      รหัสผ่าน (Password)
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Super Admin: admin / admin
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 text-xs">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>จดจำการเข้าสู่ระบบบนอุปกรณ์นี้</span>
                  </label>

                  <span className="text-slate-400 text-[11px]">
                    ระบบจัดเก็บข้อมูลในตัวเครื่อง
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}</span>
                </button>
              </form>
            </div>

            {/* Quick Login Persona Selector */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เลือกลงชื่อเข้าใช้ด่วนตามบทบาท (Quick Access Demo)</span>
                </span>
                <span className="text-[10px] text-slate-400">คลิกเพื่อเข้าใช้งานทันที</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => handleQuickLogin(account.username)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left flex items-start gap-2.5 group"
                  >
                    <span className="text-xl shrink-0 p-1 bg-slate-50 rounded-lg group-hover:scale-110 transition">
                      {account.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-700">
                        {account.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {account.roleName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-5xl mx-auto text-center text-xs text-slate-500">
        <p>© 2569 {schoolInfo.name || 'โรงเรียนวัดราษฎร์ศรัทธาธรรม'} • ระบบเอกสารหลักฐานทางการศึกษา ปพ.5 ออนไลน์</p>
      </div>
    </div>
  );
};
