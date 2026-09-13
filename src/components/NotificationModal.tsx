import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationModalProps {
  notifications?: SystemNotification[];
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications = [],
  onClose,
  onMarkAsRead = (_id: string) => {},
  onMarkAllAsRead = () => {},
}) => {
  const safeNotifications = notifications || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">การแจ้งเตือนระบบ</h3>
              <p className="text-xs text-slate-500">แจ้งเตือนเมื่อข้อมูลถูกแก้ไข ส่งงานวิชาการ หรือมีความเสี่ยง</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            มี {safeNotifications.filter(n => n && !n.isRead).length} การแจ้งเตือนใหม่
          </span>
          <button
            onClick={onMarkAllAsRead}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {safeNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={`p-3.5 rounded-2xl border transition text-xs cursor-pointer space-y-1 ${
                !n.isRead 
                  ? 'bg-indigo-50/40 border-indigo-200' 
                  : 'bg-white border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  {n.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  {n.type === 'score_edited' && <Info className="w-3.5 h-3.5 text-blue-600" />}
                  {n.type === 'workflow' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {n.type === 'system' && <Bell className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{n.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(n.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed pl-5">{n.message}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
