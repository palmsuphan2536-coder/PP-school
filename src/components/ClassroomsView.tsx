import React, { useState } from 'react';
import { School, Plus, Users, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Classroom, Teacher, Student } from '../types';

interface ClassroomsViewProps {
  classrooms: Classroom[];
  teachers: Teacher[];
  students: Student[];
  onAddClassroom: (classroom: Classroom) => void;
  onUpdateClassroom: (classroom: Classroom) => void;
  onDeleteClassroom: (classroomId: string) => void;
}

export const ClassroomsView: React.FC<ClassroomsViewProps> = ({
  classrooms,
  teachers,
  students,
  onAddClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);

  const [name, setName] = useState('');
  const [level, setLevel] = useState('ม.3');
  const [roomNumber, setRoomNumber] = useState('1');
  const [advisorId, setAdvisorId] = useState(teachers[0]?.id || '');

  const handleOpenAdd = () => {
    setEditingClassroom(null);
    setName('ม.3/2');
    setLevel('ม.3');
    setRoomNumber('2');
    setAdvisorId(teachers[0]?.id || '');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Classroom) => {
    setEditingClassroom(c);
    setName(c.name);
    setLevel(c.level);
    setRoomNumber(String(c.roomNumber || '1'));
    setAdvisorId(c.advisorTeacherId || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const advisor = teachers.find(t => t.id === advisorId);

    if (editingClassroom) {
      onUpdateClassroom({
        ...editingClassroom,
        name,
        level,
        roomNumber: String(roomNumber),
        advisorTeacherId: advisorId,
        advisorTeacherName: advisor ? `${advisor.title}${advisor.firstName} ${advisor.lastName}` : undefined
      });
    } else {
      const newCls: Classroom = {
        id: `cls-${Date.now()}`,
        academicYearId: 'year-2569',
        name,
        level,
        roomNumber: String(roomNumber),
        advisorTeacherId: advisorId,
        advisorTeacherName: advisor ? `${advisor.title}${advisor.firstName} ${advisor.lastName}` : undefined
      };
      onAddClassroom(newCls);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <School className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">การจัดการห้องเรียนและครูที่ปรึกษา</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดระดับชั้น ห้องเรียน และแต่งตั้งครูที่ปรึกษาประจำชั้น
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มห้องเรียนใหม่</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((cls) => {
          const classStudentsCount = students.filter(s => s.classroomId === cls.id).length;

          return (
            <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {cls.name}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                    <span className="text-xs text-slate-500">ระดับชั้น {cls.level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cls)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    title="แก้ไขห้องเรียน"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingClassroom(cls)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="ลบห้องเรียน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>ครูที่ปรึกษา:</span>
                  <span className="font-semibold text-slate-800">{cls.advisorTeacherName || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>จำนวนนักเรียน:</span>
                  <span className="font-bold text-indigo-700">{classStudentsCount} คน</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingClassroom ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-500 font-medium mb-1">ชื่อห้องเรียน</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ม.3/1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ระดับชั้น</label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="ม.3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ห้องที่</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">ครูที่ปรึกษาประจำชั้น</label>
                <select
                  value={advisorId}
                  onChange={(e) => setAdvisorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  <option value="">-- ไม่ระบุครูที่ปรึกษา --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.title}{t.firstName} {t.lastName} ({t.department})</option>
                  ))}
                </select>
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
                  บันทึกห้องเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClassroom && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ยืนยันการลบห้องเรียน</h3>
            <p className="text-slate-600">
              คุณต้องการลบห้องเรียน <span className="font-semibold text-slate-900">{deletingClassroom.name}</span> ใช่หรือไม่?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingClassroom(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteClassroom(deletingClassroom.id);
                  setDeletingClassroom(null);
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
