import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, CheckCircle2, AlertCircle, 
  BookOpen, Edit2, Trash2, Printer, Sparkles, UserCheck, X
} from 'lucide-react';
import { Classroom, Subject, TimetablePeriod, SchoolCalendarEvent, Teacher, TimetableSlot } from '../types';

interface TimetableCalendarViewProps {
  classrooms: Classroom[];
  subjects: Subject[];
  timetable?: TimetablePeriod[];
  calendarEvents: SchoolCalendarEvent[];
  teachers?: Teacher[];
  initialSubTab?: 'calendar' | 'timetable';
  onAddCalendarEvent: (event: SchoolCalendarEvent) => void;
  onUpdateCalendarEvent: (event: SchoolCalendarEvent) => void;
  onSaveTimetableSlot?: (slot: TimetableSlot) => void;
  onDeleteTimetableSlot?: (slotId: string) => void;
  onBatchSaveTimetable?: (slots: TimetableSlot[]) => void;
}

export const TimetableCalendarView: React.FC<TimetableCalendarViewProps> = ({
  classrooms,
  subjects,
  timetable = [],
  calendarEvents,
  teachers = [],
  initialSubTab = 'timetable',
  onAddCalendarEvent,
  onUpdateCalendarEvent,
  onSaveTimetableSlot,
  onDeleteTimetableSlot,
  onBatchSaveTimetable,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'timetable'>(initialSubTab);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms[0]?.id || 'cls-m3-1');
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Timetable Slot Modal State
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    id?: string;
    dayOfWeek: 1 | 2 | 3 | 4 | 5;
    period: number;
    subjectId: string;
    teacherId: string;
    room: string;
    startTime: string;
    endTime: string;
  }>({
    dayOfWeek: 1,
    period: 1,
    subjectId: subjects[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    room: 'ห้อง 301',
    startTime: '08:30',
    endTime: '09:20'
  });

  const [newEvent, setNewEvent] = useState<Partial<SchoolCalendarEvent>>({
    title: '',
    startDate: '2026-05-18',
    endDate: '2026-05-18',
    type: 'activity',
    isSchoolDay: true,
    academicYearId: 'ay-2569',
    termId: 'term-2569-1',
    description: ''
  });

  // Sync sub tab when prop changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const daysOfWeek: { day: 1 | 2 | 3 | 4 | 5; name: string; shortName: string; color: string }[] = [
    { day: 1, name: 'วันจันทร์', shortName: 'จันทร์', color: 'bg-amber-500' },
    { day: 2, name: 'วันอังคาร', shortName: 'อังคาร', color: 'bg-pink-500' },
    { day: 3, name: 'วันพุธ', shortName: 'พุธ', color: 'bg-emerald-500' },
    { day: 4, name: 'วันพฤหัสบดี', shortName: 'พฤหัสบดี', color: 'bg-orange-500' },
    { day: 5, name: 'วันศุกร์', shortName: 'ศุกร์', color: 'bg-blue-500' },
  ];

  const periods = [
    { num: 1, time: '08:30 - 09:30', start: '08:30', end: '09:30' },
    { num: 2, time: '09:30 - 10:30', start: '09:30', end: '10:30' },
    { num: 3, time: '10:30 - 11:30', start: '10:30', end: '11:30' },
    { num: 4, time: '12:30 - 13:30', start: '12:30', end: '13:30' },
    { num: 5, time: '13:30 - 14:30', start: '13:30', end: '14:30' },
    { num: 6, time: '14:30 - 15:30', start: '14:30', end: '15:30' },
  ];

  const handleOpenSlotModal = (day: 1 | 2 | 3 | 4 | 5, periodNum: number, existing?: TimetablePeriod) => {
    const periodDef = periods.find(p => p.num === periodNum);
    if (existing) {
      setEditingSlot({
        id: existing.id,
        dayOfWeek: day,
        period: periodNum,
        subjectId: existing.subjectId,
        teacherId: existing.teacherId || teachers[0]?.id || '',
        room: existing.room || 'ห้อง 301',
        startTime: existing.startTime || periodDef?.start || '08:30',
        endTime: existing.endTime || periodDef?.end || '09:30'
      });
    } else {
      setEditingSlot({
        dayOfWeek: day,
        period: periodNum,
        subjectId: subjects[0]?.id || '',
        teacherId: teachers[0]?.id || '',
        room: 'ห้อง 301',
        startTime: periodDef?.start || '08:30',
        endTime: periodDef?.end || '09:30'
      });
    }
    setShowSlotModal(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveTimetableSlot) {
      alert('ระบบบันทึกตารางเรียนพร้อมใช้งาน');
      setShowSlotModal(false);
      return;
    }

    const slotToSave: TimetableSlot = {
      id: editingSlot.id || `tt-${selectedClassroomId}-d${editingSlot.dayOfWeek}-p${editingSlot.period}-${Date.now()}`,
      classroomId: selectedClassroomId,
      subjectId: editingSlot.subjectId,
      teacherId: editingSlot.teacherId,
      dayOfWeek: editingSlot.dayOfWeek,
      period: editingSlot.period,
      startTime: editingSlot.startTime,
      endTime: editingSlot.endTime,
      room: editingSlot.room
    };

    onSaveTimetableSlot(slotToSave);
    setShowSlotModal(false);
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm('คุณต้องการลบวิชาเรียนในคาบนี้ออกจากตารางสอนหรือไม่?')) {
      if (onDeleteTimetableSlot) {
        onDeleteTimetableSlot(id);
      }
      setShowSlotModal(false);
    }
  };

  // Quick Seed / Sample Fill for current classroom
  const handleGenerateSampleTimetable = () => {
    if (!onBatchSaveTimetable || subjects.length === 0) return;
    if (confirm('ระบบจะสร้างตารางสอนมาตรฐาน (จันทร์-ศุกร์ รวม 30 คาบ) ให้ห้องเรียนนี้ คุณต้องการดำเนินการต่อหรือไม่?')) {
      const generated: TimetableSlot[] = [];
      let subjIdx = 0;

      daysOfWeek.forEach(day => {
        periods.slice(0, 6).forEach(p => {
          const s = subjects[subjIdx % subjects.length];
          const t = teachers.find(tch => tch.department === s.department) || teachers[0];
          generated.push({
            id: `tt-${selectedClassroomId}-d${day.day}-p${p.num}-${Date.now()}`,
            classroomId: selectedClassroomId,
            subjectId: s.id,
            teacherId: t ? t.id : 'tch-01',
            dayOfWeek: day.day,
            period: p.num,
            startTime: p.start,
            endTime: p.end,
            room: `ห้อง ${selectedClassroomId.includes('m3') ? '301' : '201'}`
          });
          subjIdx++;
        });
      });

      onBatchSaveTimetable(generated);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.startDate) return;

    onAddCalendarEvent({
      id: `ev-${Date.now()}`,
      title: newEvent.title!,
      startDate: newEvent.startDate!,
      endDate: newEvent.endDate || newEvent.startDate!,
      type: newEvent.type as any || 'activity',
      isSchoolDay: !!newEvent.isSchoolDay,
      academicYearId: 'ay-2569',
      termId: 'term-2569-1',
      description: newEvent.description
    });
    setShowEventModal(false);
  };

  const selectedClassroomObj = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const safeTimetable = Array.isArray(timetable) ? timetable : [];

  return (
    <div className="space-y-5 font-prompt">
      {/* Header with Sub-tab switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {activeSubTab === 'timetable' ? 'ตารางเรียนและตารางสอน (Timetable)' : 'ปฏิทินการศึกษาและวันสำคัญ (Academic Calendar)'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeSubTab === 'timetable' 
                ? 'จัดตารางเรียนประจำห้อง รายวิชา ครูผู้สอน และห้องเรียน สามารถคลิกแต่ละช่องเพื่อเพิ่มหรือแก้ไขได้ทันที'
                : 'กำหนดวันเปิด-ปิดภาคเรียน วันหยุดราชการ การนับชั่วโมงเวลาเรียน และกิจกรรมสำคัญ'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSubTab('timetable')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeSubTab === 'timetable' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ตารางเรียน/ตารางสอน</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeSubTab === 'calendar' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>ปฏิทินการศึกษา</span>
              </button>
            </div>

            {activeSubTab === 'calendar' && (
              <button
                type="button"
                onClick={() => setShowEventModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มวันสำคัญ</span>
              </button>
            )}

            {activeSubTab === 'timetable' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ตารางเรียน</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TIMETABLE VIEW */}
      {activeSubTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">เลือกห้องเรียน:</span>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      ชั้น {c.name} (ครูที่ปรึกษา: {c.advisorTeacherName || '-'})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-400 hidden sm:inline">•</span>

              <span className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-medium">
                ตารางสอนห้อง {selectedClassroomObj?.name} (7 คาบ/วัน)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onBatchSaveTimetable && (
                <button
                  type="button"
                  onClick={handleGenerateSampleTimetable}
                  title="สร้างตารางสอนตัวอย่างสำหรับห้องเรียนนี้"
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เติมตารางสอนตัวอย่าง</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Timetable Grid */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-28 text-center border-r border-slate-200">วัน / เวลา</th>
                  {periods.slice(0, 3).map(p => (
                    <th key={p.num} className="py-3 px-2 border-r border-slate-200 min-w-[125px]">
                      <div className="font-bold text-slate-800">คาบที่ {p.num}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {p.time}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-2 border-r border-slate-200 min-w-[100px] bg-amber-50/80 text-amber-900">
                    <div className="font-bold text-amber-800">🍱 พักกลางวัน</div>
                    <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                      11:30 - 12:30
                    </div>
                  </th>
                  {periods.slice(3).map(p => (
                    <th key={p.num} className="py-3 px-2 border-r border-slate-200 min-w-[125px]">
                      <div className="font-bold text-slate-800">
                        {p.num === 6 ? 'คาบที่ 6 (จบ 15:30)' : `คาบที่ ${p.num}`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {p.time}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {daysOfWeek.map(day => (
                  <tr key={day.day} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${day.color}`}></span>
                        <span>{day.name}</span>
                      </div>
                    </td>
                    {/* คาบ 1 - 3 */}
                    {periods.slice(0, 3).map(p => {
                      const item = safeTimetable.find(
                        t => t.classroomId === selectedClassroomId && 
                             t.dayOfWeek === day.day && 
                             (t.period === p.num || t.periodNumber === p.num)
                      );

                      const teacherObj = item ? teachers.find(tch => tch.id === item.teacherId) : null;

                      return (
                        <td 
                          key={p.num} 
                          className="p-1.5 border-r border-slate-200 align-top group cursor-pointer"
                          onClick={() => handleOpenSlotModal(day.day, p.num, item)}
                        >
                          {item ? (
                            <div className="p-2.5 rounded-xl bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200 text-left space-y-1 transition shadow-2xs group-hover:scale-[1.02] relative">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-indigo-950 font-mono text-xs">
                                  {item.subjectCode || 'รหัสวิชา'}
                                </span>
                                <Edit2 className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                              <div className="font-medium text-indigo-800 text-[11px] truncate leading-tight">
                                {item.subjectName || 'ชื่อวิชา'}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-indigo-100/60">
                                <span className="truncate max-w-[80px]">
                                  {teacherObj ? `${teacherObj.title}${teacherObj.firstName}` : 'ครูผู้สอน'}
                                </span>
                                <span className="font-semibold text-indigo-700 bg-white/80 px-1 rounded text-[9px]">
                                  {item.room || 'ห้องเรียน'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 flex flex-col items-center justify-center text-slate-400 text-[10px] transition gap-1 group-hover:text-indigo-600">
                              <Plus className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                              <span>+ เพิ่มคาบ</span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* คอลัมน์พักกลางวัน */}
                    <td className="p-2 border-r border-slate-200 bg-amber-50/50 text-center align-middle select-none">
                      <div className="flex flex-col items-center justify-center text-amber-800 text-[10px] font-medium py-1">
                        <span>พักรับประทานอาหาร</span>
                        <span className="text-[9px] text-amber-600 font-mono">11:30 - 12:30</span>
                      </div>
                    </td>

                    {/* คาบ 4 - 6 (จบ 15:30) */}
                    {periods.slice(3).map(p => {
                      const item = safeTimetable.find(
                        t => t.classroomId === selectedClassroomId && 
                             t.dayOfWeek === day.day && 
                             (t.period === p.num || t.periodNumber === p.num)
                      );

                      const teacherObj = item ? teachers.find(tch => tch.id === item.teacherId) : null;

                      return (
                        <td 
                          key={p.num} 
                          className="p-1.5 border-r border-slate-200 align-top group cursor-pointer"
                          onClick={() => handleOpenSlotModal(day.day, p.num, item)}
                        >
                          {item ? (
                            <div className="p-2.5 rounded-xl bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200 text-left space-y-1 transition shadow-2xs group-hover:scale-[1.02] relative">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-indigo-950 font-mono text-xs">
                                  {item.subjectCode || 'รหัสวิชา'}
                                </span>
                                <Edit2 className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                              <div className="font-medium text-indigo-800 text-[11px] truncate leading-tight">
                                {item.subjectName || 'ชื่อวิชา'}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-indigo-100/60">
                                <span className="truncate max-w-[80px]">
                                  {teacherObj ? `${teacherObj.title}${teacherObj.firstName}` : 'ครูผู้สอน'}
                                </span>
                                <span className="font-semibold text-indigo-700 bg-white/80 px-1 rounded text-[9px]">
                                  {item.room || 'ห้องเรียน'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 flex flex-col items-center justify-center text-slate-400 text-[10px] transition gap-1 group-hover:text-indigo-600">
                              <Plus className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                              <span>+ เพิ่มคาบ</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <p>💡 คำแนะนำ: คลิกที่ช่องว่างเพื่อเพิ่มวิชาเรียน หรือคลิกที่วิชาเดิมเพื่อแก้ไข/ลบคาบเรียน</p>
            <p className="font-semibold text-slate-700">
              รวม {safeTimetable.filter(t => t.classroomId === selectedClassroomId).length} คาบสอนในห้องนี้
            </p>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.type === 'holiday'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : evt.type === 'exam'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : evt.type === 'activity'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {evt.type === 'holiday'
                      ? 'วันหยุด'
                      : evt.type === 'exam'
                      ? 'ช่วงสอบ'
                      : evt.type === 'activity'
                      ? 'กิจกรรม'
                      : 'วันเรียนปกติ'}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {evt.isSchoolDay ? '✓ นับเป็นวันเรียน' : '✕ ไม่นับวันเรียน'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {evt.startDate} {evt.endDate && evt.endDate !== evt.startDate ? `ถึง ${evt.endDate}` : ''}
                  </span>
                </div>

                {evt.description && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    {evt.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Edit / Add Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingSlot.id ? 'แก้ไขคาบเรียนในตาราง' : 'จัดตารางเรียนคาบใหม่'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ห้อง {selectedClassroomObj?.name} • วัน{daysOfWeek.find(d => d.day === editingSlot.dayOfWeek)?.shortName} • คาบที่ {editingSlot.period}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  รายวิชา (Subject)
                </label>
                <select
                  required
                  value={editingSlot.subjectId}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subjectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.credits} นก.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ครูผู้สอน (Teacher)
                </label>
                <select
                  value={editingSlot.teacherId}
                  onChange={(e) => setEditingSlot({ ...editingSlot, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}{t.firstName} {t.lastName} ({t.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ห้องเรียน / สถานที่
                  </label>
                  <input
                    type="text"
                    value={editingSlot.room}
                    onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                    placeholder="เช่น ห้อง 301, ห้องวิทย์ 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ช่วงเวลาเรียน
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingSlot.startTime}
                      onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-900 font-mono text-[11px]"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="text"
                      value={editingSlot.endTime}
                      onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-900 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {editingSlot.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(editingSlot.id!)}
                    className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบคาบเรียนนี้</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSlotModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition"
                  >
                    บันทึกคาบเรียน
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">เพิ่มวันสำคัญในปฏิทิน</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-slate-500 font-medium mb-1">ชื่องาน / กิจกรรม</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="เช่น วันเฉลิมพระชนมพรรษา"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    required
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">ประเภท</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="holiday">วันหยุด</option>
                    <option value="activity">กิจกรรม</option>
                    <option value="exam">ช่วงสอบ</option>
                    <option value="normal">วันเรียนปกติ</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvent.isSchoolDay}
                      onChange={(e) => setNewEvent({ ...newEvent, isSchoolDay: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">นับเป็นวันเรียน</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
