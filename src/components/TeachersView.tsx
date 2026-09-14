import React, { useState } from 'react';
import { GraduationCap, Plus, Search, Edit, Trash2, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Teacher, UserRole, Classroom } from '../types';

interface TeachersViewProps {
  teachers: Teacher[];
  classrooms?: Classroom[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  classrooms = [],
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState<Partial<Teacher>>({
    title: 'นาย',
    firstName: '',
    lastName: '',
    position: 'ครู',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    username: '',
    role: 'teacher',
    phone: '',
    email: '',
    status: 'active'
  });

  const filteredTeachers = teachers.filter(t => {
    const q = search.toLowerCase();
    return `${t.title}${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
           t.department.toLowerCase().includes(q) ||
           t.position.toLowerCase().includes(q);
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      title: 'นาย',
      firstName: '',
      lastName: '',
      position: 'ครู',
      department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
      username: `teacher${teachers.length + 1}`,
      role: 'teacher',
      phone: '',
      email: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({ ...t });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      alert('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    if (editingTeacher) {
      onUpdateTeacher({ ...editingTeacher, ...formData } as Teacher);
    } else {
      const newTch: Teacher = {
        id: `tch-${Date.now()}`,
        teacherCode: `T${100 + teachers.length + 1}`,
        title: formData.title || 'นาย',
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        position: formData.position || 'ครู',
        department: formData.department || 'กลุ่มสาระการเรียนรู้ทั่วไป',
        username: formData.username || `user${Date.now()}`,
        role: (formData.role as UserRole) || 'teacher',
        phone: formData.phone,
        email: formData.email,
        status: 'active'
      };
      onAddTeacher(newTch);
    }
    setShowModal(false);
  };

  const roleLabel: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    academic: 'งานวิชาการ',
    teacher: 'ครูผู้สอน',
    homeroom: 'ครูประจำชั้น',
    executive: 'ผู้บริหาร',
    viewer: 'Viewer'
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">ครูและบุคลากรทางการศึกษา</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลครูผู้สอน กลุ่มสาระการเรียนรู้ และการกำหนดสิทธิ์การเข้าใช้งานระบบ ปพ.5
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มครู/บุคลากร</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อครู, กลุ่มสาระ, หรือตำแหน่ง..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 w-16 text-center">รหัส</th>
                <th className="py-3 px-3">ชื่อ - นามสกุล</th>
                <th className="py-3 px-3">ตำแหน่ง</th>
                <th className="py-3 px-3">กลุ่มสาระการเรียนรู้</th>
                <th className="py-3 px-3 text-center">ครูประจำชั้น</th>
                <th className="py-3 px-3 text-center">สิทธิ์ในระบบ</th>
                <th className="py-3 px-3">การติดต่อ</th>
                <th className="py-3 px-3 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTeachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">{t.teacherCode}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {t.title}{t.firstName} {t.lastName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{t.position}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.department}</td>
                  <td className="py-2.5 px-3 text-center">
                    {t.homeroomClassroomName ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ห้อง {t.homeroomClassroomName}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {roleLabel[t.role]}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    <div>{t.phone || '-'}</div>
                    <div className="text-[10px] text-slate-400">{t.email}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTeacher(t)}
                        className="p-1 text-slate-500 hover:text-rose-600 rounded"
                        title="ลบข้อมูล"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingTeacher ? 'แก้ไขข้อมูลครู/บุคลากร' : 'เพิ่มครู/บุคลากรใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">คำนำหน้า</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ชื่อ</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">สิทธิ์ในระบบ (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  >
                    <option value="teacher">ครูผู้สอน (Teacher)</option>
                    <option value="homeroom">ครูประจำชั้น (Homeroom)</option>
                    <option value="academic">งานวิชาการ/วัดผล (Academic)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                    <option value="executive">ผู้บริหารสถานศึกษา (Executive)</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">กลุ่มสาระการเรียนรู้</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">ห้องประจำชั้น (Homeroom Class)</label>
                <select
                  value={formData.homeroomClassroomId || ''}
                  onChange={(e) => {
                    const clsId = e.target.value;
                    const foundCls = classrooms.find(c => c.id === clsId);
                    setFormData({
                      ...formData,
                      homeroomClassroomId: clsId,
                      homeroomClassroomName: foundCls ? foundCls.name : ''
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="">-- ไม่ได้เป็นครูประจำชั้น --</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>ห้อง {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  บันทึกข้อมูลครู
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ยืนยันการลบข้อมูลครู/บุคลากร</h3>
            <p className="text-slate-600">
              คุณต้องการลบข้อมูลของ <span className="font-semibold text-slate-900">{deletingTeacher.title}{deletingTeacher.firstName} {deletingTeacher.lastName}</span> ใช่หรือไม่?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingTeacher(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteTeacher(deletingTeacher.id);
                  setDeletingTeacher(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
              >
                ยืนยันลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
