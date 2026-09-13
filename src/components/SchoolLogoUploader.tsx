import React, { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, CheckCircle2, AlertCircle, School, Eye } from 'lucide-react';

interface SchoolLogoUploaderProps {
  logoUrl?: string;
  schoolName?: string;
  onLogoChange: (newLogoUrl: string) => void;
}

export const SchoolLogoUploader: React.FC<SchoolLogoUploaderProps> = ({
  logoUrl,
  schoolName = 'โรงเรียนวัดราษฎร์ศรัทธาธรรม',
  onLogoChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize and optimize image via Canvas to prevent storage quota issues
  const processImageFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์ภาพใหญ่เกิน 5MB กรุณาเลือกภาพที่มีขนาดเล็กลง');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setErrorMsg('ไม่สามารถอ่านไฟล์ภาพได้');
        setIsProcessing(false);
        return;
      }

      // Load into HTML image for resizing
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 320; // maximum width or height
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Export as PNG data URL
            const optimizedDataUrl = canvas.toDataURL('image/png', 0.92);
            onLogoChange(optimizedDataUrl);
            setSuccessMsg('อัพโหลดและปรับแต่งตราสัญลักษณ์โรงเรียนเรียบร้อยแล้ว');
          } else {
            onLogoChange(dataUrl);
            setSuccessMsg('อัพโหลดตราสัญลักษณ์โรงเรียนเรียบร้อยแล้ว');
          }
        } catch (err) {
          onLogoChange(dataUrl);
          setSuccessMsg('อัพโหลดตราสัญลักษณ์โรงเรียนเรียบร้อยแล้ว');
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setErrorMsg('ไฟล์รูปภาพเสียหายหรือไม่รองรับ');
        setIsProcessing(false);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดไฟล์');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('คุณต้องการลบตราโรงเรียนและคืนค่าเป็นไอคอนมาตรฐานหรือไม่?')) {
      onLogoChange('');
      setSuccessMsg('คืนค่าตราสัญลักษณ์เป็นค่าเริ่มต้นเรียบร้อยแล้ว');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-600" />
            <span>ตราสัญลักษณ์โรงเรียน / ตราประจำโรงเรียน (School Emblem & Logo)</span>
          </h4>
          <p className="text-slate-500 text-[11px] mt-0.5">
            ตราโรงเรียนจะปรากฏบนแถบเมนูด้านบน หน้าลงชื่อเข้าใช้ และบนหน้าปกเอกสาร ปพ.5
          </p>
        </div>

        {logoUrl && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>มีตราโรงเรียนในระบบ</span>
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left: Drag & Drop upload zone (7 cols) */}
        <div className="md:col-span-7">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-white bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="font-bold text-slate-800 text-xs">
                {isProcessing ? 'กำลังประมวลผลรูปภาพ...' : 'คลิกเพื่อเลือกไฟล์ หรือลากรูปภาพมาวางที่นี่'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                รองรับ PNG, JPG, WebP, SVG (ระบบจะปรับความคมชัดและขนาดให้พอดีอัตโนมัติ)
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs"
            >
              เลือกรูปภาพตราโรงเรียน
            </button>
          </div>
        </div>

        {/* Right: Live Preview Panel (5 cols) */}
        <div className="md:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="text-slate-500 font-semibold text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>ตัวอย่างการแสดงผล (Live Preview)</span>
            </span>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold text-[11px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบตรา</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 py-1">
            {/* Circular Preview (for Navbar & Badge) */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 p-1.5 flex items-center justify-center shadow-inner overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="School Logo Preview"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <School className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <span className="text-[10px] text-slate-400">ขนาด 64px</span>
            </div>

            {/* Document Header Preview (for PP5) */}
            <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
              <div className="font-bold text-slate-900 truncate">
                {schoolName}
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold">
                แบบบันทึกผลการพัฒนาผู้เรียน (ปพ.5)
              </div>
              <div className="text-[9px] text-slate-400">
                กระทรวงศึกษาธิการ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
