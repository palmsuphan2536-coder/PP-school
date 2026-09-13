import React, { useState } from 'react';
import { 
  Users, Plus, Search, Download, Upload, Edit, Trash2, 
  Eye, CheckCircle2, AlertTriangle, X, Phone, User, Calendar 
} from 'lucide-react';
import { Student, Classroom, StudentStatus } from '../types';
import { exportStudentsToExcel, parseExcelStudentFile } from '../services/storageService';

interface StudentsViewProps {
  students: Student[];
  classrooms: Classroom[];
  selectedYearId: string;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onBatchAddStudents: (students: Student[]) => void;
  onViewProfile: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classrooms,
  selectedYearId,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBatchAddStudents,
  onViewProfile,
}) => {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importPreview, setImportPreview] = useState<Partial<Student>[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Student>>({
    title: 'เด็กชาย',
    firstName: '',
    lastName: '',
    nickName: '',
    studentCode: '',
    studentNumber: 1,
    gender: 'M',
    classroomId: classrooms[0]?.id || '',
    status: 'studying',
    parentName: '',
    parentPhone: ''
  });

  const filteredStudents = students.filter(s => {
    if (selectedClassroomId !== 'all' && s.classroomId !== selectedClassroomId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${s.title}${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
      const matchCode = s.studentCode.includes(q);
      const matchNick = s.nickName?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchNick) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      title: 'เด็กชาย',
      firstName: '',
      lastName: '',
      nickName: '',
      studentCode: `054${students.length + 11}`,
      studentNumber: students.length + 1,
      gender: 'M',
      classroomId: classrooms[0]?.id || '',
      status: 'studying',
      parentName: '',
      parentPhone: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setShowAddModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.studentCode) {
      alert('กรุณากรอกชื่อ นามสกุล และเลขประจำตัวนักเรียน');
      return;
    }

    const cls = classrooms.find(c => c.id === formData.classroomId) || classrooms[0];

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...formData,
        classroomName: cls.name,
        level: cls.level,
      } as Student);
    } else {
      const newStd: Student = {
        id: `std-${Date.now()}`,
        studentCode: formData.studentCode!,
        studentNumber: Number(formData.studentNumber) || 1,
        title: formData.title || 'เด็กชาย',
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        nickName: formData.nickName,
        gender: formData.gender || 'M',
        level: cls.level,
        classroomId: cls.id,
        classroomName: cls.name,
        academicYearId: selectedYearId,
        status: (formData.status as StudentStatus) || 'studying',
        parentName: formData.parentName,
        parentPhone: formData.parentPhone
      };
      onAddStudent(newStd);
    }
    setShowAddModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportFileName(file.name);
      const parsed = await parseExcelStudentFile(file);
      setImportPreview(parsed);
      setShowImportModal(true);
    } catch (err) {
      alert('ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    }
  };

  const handleConfirmImport = () => {
    const cls = classrooms.find(c => c.id === (selectedClassroomId !== 'all' ? selectedClassroomId : classrooms[0]?.id)) || classrooms[0];

    const newStudents: Student[] = importPreview.map((item, idx) => ({
      id: `std-imp-${Date.now()}-${idx}`,
      studentCode: item.studentCode || `055${idx + 1}`,
      studentNumber: item.studentNumber || (idx + 1),
      title: item.title || 'เด็กชาย',
      firstName: item.firstName || 'นักเรียนใหม่',
      lastName: item.lastName || 'รักเรียน',
      nickName: item.nickName || '',
      gender: item.gender || 'M',
      level: cls.level,
      classroomId: cls.id,
      classroomName: cls.name,
      academicYearId: selectedYearId,
      status: 'studying',
      parentName: item.parentName || '',
      parentPhone: item.parentPhone || ''
    }));

    onBatchAddStudents(newStudents);
    setShowImportModal(false);
    setImportPreview([]);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">ทะเบียนข้อมูลนักเรียน</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              จัดการรายชื่อนักเรียน เลขที่ เลขประจำตัว และประวัติข้อมูลผู้ปกครอง รองรับการนำเข้า/ส่งออก Excel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Import Excel input */}
            <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>นำเข้า Excel</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => exportStudentsToExcel(filteredStudents)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มนักเรียนใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">ค้นหานักเรียน</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, นามสกุล, หรือเลขประจำตัว..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">ห้องเรียน</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกห้องเรียน ({students.length} คน)</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end text-slate-500 text-xs pb-2">
            พบข้อมูลทั้งหมด <b className="text-indigo-600 mx-1">{filteredStudents.length}</b> รายการ
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">เลขที่</th>
                <th className="py-3 px-3 text-center w-24">เลขประจำตัว</th>
                <th className="py-3 px-3">ชื่อ - นามสกุล</th>
                <th className="py-3 px-3 text-center w-20">เพศ</th>
                <th className="py-3 px-3 text-center w-24">ชั้น/ห้อง</th>
                <th className="py-3 px-3">ข้อมูลผู้ปกครอง</th>
                <th className="py-3 px-3 text-center w-24">สถานะ</th>
                <th className="py-3 px-3 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((std, idx) => (
                <tr key={std.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                    {std.studentNumber}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                    {std.studentCode}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{std.title}{std.firstName} {std.lastName}</span>
                      {std.nickName && (
                        <span className="text-slate-400 font-normal">({std.nickName})</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      std.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                    }`}>
                      {std.gender === 'M' ? 'ชาย' : 'หญิง'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                    {std.classroomName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div>{std.parentName || '-'}</div>
                    <div className="text-[11px] text-slate-400">{std.parentPhone}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      กำลังเรียน
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewProfile(std)}
                        title="ดูแฟ้มประวัติและผลการเรียน"
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(std)}
                        title="แก้ไขข้อมูล"
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingStudent(std)}
                        title="ลบข้อมูล"
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">คำนำหน้า</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                    <option value="นาย">นาย</option>
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">เลขประจำตัว (5 หลัก)</label>
                  <input
                    type="text"
                    required
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">เลขที่</label>
                  <input
                    type="number"
                    value={formData.studentNumber}
                    onChange={(e) => setFormData({ ...formData, studentNumber: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ชื่อเล่น</label>
                  <input
                    type="text"
                    value={formData.nickName}
                    onChange={(e) => setFormData({ ...formData, nickName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ห้องเรียน</label>
                  <select
                    value={formData.classroomId}
                    onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">เพศ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="M">ชาย</option>
                    <option value="F">หญิง</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ชื่อผู้ปกครอง</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">เบอร์โทรติดต่อ</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  {editingStudent ? 'บันทึกการแก้ไข' : 'เพิ่มนักเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">ตัวอย่างข้อมูลนำเข้าจาก Excel</h3>
                <p className="text-xs text-slate-500">ไฟล์: {importFileName} (พบ {importPreview.length} รายการ)</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2 px-2 text-center">ที่</th>
                    <th className="py-2 px-2">เลขประจำตัว</th>
                    <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                    <th className="py-2 px-2 text-center">เพศ</th>
                    <th className="py-2 px-3">ผู้ปกครอง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importPreview.map((item, i) => (
                    <tr key={i}>
                      <td className="py-1.5 px-2 text-center text-slate-500">{item.studentNumber || i + 1}</td>
                      <td className="py-1.5 px-2 font-mono text-slate-700">{item.studentCode}</td>
                      <td className="py-1.5 px-3 font-medium text-slate-900">{item.title}{item.firstName} {item.lastName}</td>
                      <td className="py-1.5 px-2 text-center">{item.gender === 'M' ? 'ชาย' : 'หญิง'}</td>
                      <td className="py-1.5 px-3 text-slate-500">{item.parentName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> ตรวจสอบโครงสร้างข้อมูลถูกต้อง
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                >
                  ยืนยันนำเข้าข้อมูล {importPreview.length} รายการ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ยืนยันการลบข้อมูลนักเรียน</h3>
            <p className="text-slate-600">
              คุณต้องการลบข้อมูลของ <span className="font-semibold text-slate-900">{deletingStudent.title}{deletingStudent.firstName} {deletingStudent.lastName}</span> ใช่หรือไม่?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deletingStudent.id);
                  setDeletingStudent(null);
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
