import React from 'react';
import { X, ShieldCheck, Clock, User, ArrowRight } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogModalProps {
  logs?: AuditLog[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ logs = [], onClose }) => {
  const safeLogs = logs || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">ประวัติการแก้ไขข้อมูล (Audit Trail)</h3>
              <p className="text-xs text-slate-500">บันทึกทุกการแก้ไขคะแนน เวลาเรียน และการเปลี่ยนสถานะเพื่อความโปร่งใส</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-3 flex-1">
          {safeLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              ยังไม่มีประวัติการบันทึกหรือแก้ไขข้อมูลในระบบ
            </div>
          ) : (
            safeLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{log.userName}</span>
                    <span className="text-[10px] text-slate-400">({log.targetType})</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleString('th-TH')}</span>
                  </div>
                </div>

                <div className="font-medium text-slate-700">{log.action}</div>

                {(log.oldValue !== undefined || log.newValue !== undefined) && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                    <span>เดิม: <b className="text-slate-700">{String(log.oldValue ?? '-')}</b></span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>ใหม่: <b className="text-indigo-600">{String(log.newValue ?? '-')}</b></span>
                  </div>
                )}
              </div>
            ))
          )}
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
