import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { resetToDefaultData } from '../services/storageService';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleResetSystemData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลระบบกลับเป็นค่าเริ่มต้นเพื่อกู้คืนการทำงานหรือไม่? ข้อมูลทดลองจะถูกตั้งค่าใหม่')) {
      resetToDefaultData();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-rose-200 shadow-lg p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {this.props.fallbackTitle || 'เกิดข้อผิดพลาดในการแสดงผล'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิด ({this.state.error?.message || 'Unknown error'})
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-rose-700 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ลองโหลดใหม่</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSystemData}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>รีเซ็ตข้อมูลเริ่มต้น (กู้คืน)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
