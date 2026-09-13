import React, { useState } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, Clock, Award } from 'lucide-react';
import { Subject, Teacher } from '../types';

interface SubjectsViewProps {
  subjects: Subject[];
  teachers: Teacher[];
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  teachers,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState<Partial<Subject>>({
    code: '',
    name: '',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    level: 'ม.3',
    credits: 1.5,
    totalHours: 60,
    teacherId: teachers[0]?.id || '',
    termNumber: 1,
    academicYearId: 'year-2569'
  });

  const filteredSubjects = subjects.filter(s => {
    const q = search.toLowerCase();
    return s.code.toLowerCase().includes(q) ||
           s.name.toLowerCase().includes(q) ||
           s.department.toLowerCase().includes(q);
  });

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      code: 'ส23101',
      name: 'สังคมศึกษา 5',
      department: 'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
      level: 'ม.3',
      credits: 1.5,
      totalHours: 60,
      teacherId: teachers[0]?.id || '',
      termNumber: 1,
      academicYearId: 'year-2569'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject(s);
    setFormData({ ...s });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert('กรุณากรอกรหัสวิชาและชื่อวิชา');
      return;
    }

    if (editingSubject) {
      onUpdateSubject({ ...editingSubject, ...formData } as Subject);
    } else {
      const newSubj: Subject = {
        id: `sbj-${Date.now()}`,
        code: formData.code!,
        name: formData.name!,
        department: formData.department || 'กลุ่มสาระการเรียนรู้ทั่วไป',
        level: formData.level || 'ม.3',
        credits: Number(formData.credits) || 1.5,
        totalHours: Number(formData.totalHours) || 60,
        termNumber: (Number(formData.termNumber) === 2 ? 2 : 1) as 1 | 2,
        academicYearId: 'year-2569',
        type: (formData.type as any) || 'basic'
      };
      onAddSubject(newSubj);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">หลักสูตรและรายวิชา</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดรหัสวิชา หน่วยกิต ชั่วโมงเรียนตามหลักสูตร และครูผู้สอนประจำวิชา
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายวิชา</span>
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
              placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 w-24">รหัสวิชา</th>
                <th className="py-3 px-3">ชื่อรายวิชา</th>
                <th className="py-3 px-3">กลุ่มสาระการเรียนรู้</th>
                <th className="py-3 px-3 text-center w-20">ระดับชั้น</th>
                <th className="py-3 px-3 text-center w-20">หน่วยกิต</th>
                <th className="py-3 px-3 text-center w-24">เวลาเรียน (ชม.)</th>
                <th className="py-3 px-3 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSubjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{s.code}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.department}</td>
                  <td className="py-2.5 px-3 text-center font-medium">{s.level}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{s.credits}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">{s.totalHours} ชม.</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded"
                        title="แก้ไขวิชา"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingSubject(s)}
                        className="p-1 text-slate-500 hover:text-rose-600 rounded"
                        title="ลบวิชา"
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

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingSubject ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">รหัสวิชา</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="เช่น ว23101"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ระดับชั้น</label>
                  <input
                    type="text"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">ชื่อรายวิชา</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น วิทยาศาสตร์ 5"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">หน่วยกิต</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="5"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">จำนวนชั่วโมงเรียนต่อภาค</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalHours}
                    onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
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
                  บันทึกรายวิชา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubject && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ยืนยันการลบรายวิชา</h3>
            <p className="text-slate-600">
              คุณต้องการลบรายวิชา <span className="font-semibold text-slate-900">{deletingSubject.code} {deletingSubject.name}</span> ใช่หรือไม่?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteSubject(deletingSubject.id);
                  setDeletingSubject(null);
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
