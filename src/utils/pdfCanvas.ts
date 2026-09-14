import html2canvas from 'html2canvas-pro';

/**
 * Capture HTML element to canvas safely without oklch color errors.
 * Replaces modern color functions (oklch, lab, etc.) with Hex/RGB fallbacks.
 */
export async function captureSafeCanvas(
  element: HTMLElement,
  options: any = {}
): Promise<HTMLCanvasElement> {
  const mergedOptions = {
    scale: options.scale || 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: options.backgroundColor || '#ffffff',
    logging: false,
    ...options,
    onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
      // 1. Sanitize all <style> tags in the cloned document by converting oklch/oklab to standard Hex/RGB
      const styleTags = clonedDoc.querySelectorAll('style');
      styleTags.forEach(st => {
        try {
          if (st.innerHTML && /oklch|oklab/i.test(st.innerHTML)) {
            st.innerHTML = st.innerHTML.replace(/oklch\([^)]+\)/gi, '#334155');
            st.innerHTML = st.innerHTML.replace(/oklab\([^)]+\)/gi, '#334155');
          }
        } catch {}
      });

      // 2. Inject explicit Hex/RGB high-contrast CSS overrides
      const safeStyle = clonedDoc.createElement('style');
      safeStyle.id = 'safe-canvas-color-override';
      safeStyle.innerHTML = `
        * {
          color: #1e293b !important;
          border-color: #cbd5e1 !important;
          outline-color: #cbd5e1 !important;
          text-shadow: none !important;
        }
        body, html {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        .bg-white, [class*="bg-white"] { background-color: #ffffff !important; }
        .bg-slate-50, [class*="bg-slate-50"] { background-color: #f8fafc !important; }
        .bg-slate-100, [class*="bg-slate-100"] { background-color: #f1f5f9 !important; }
        .bg-slate-200, [class*="bg-slate-200"] { background-color: #e2e8f0 !important; }
        .bg-indigo-50, [class*="bg-indigo-50"] { background-color: #eef2ff !important; }
        .bg-indigo-100, [class*="bg-indigo-100"] { background-color: #e0e7ff !important; }
        .bg-indigo-600, [class*="bg-indigo-600"] { background-color: #4f46e5 !important; color: #ffffff !important; }
        .bg-indigo-700, [class*="bg-indigo-700"] { background-color: #4338ca !important; color: #ffffff !important; }
        .bg-emerald-50, [class*="bg-emerald-50"] { background-color: #ecfdf5 !important; }
        .bg-emerald-600, [class*="bg-emerald-600"] { background-color: #059669 !important; color: #ffffff !important; }
        .bg-rose-50, [class*="bg-rose-50"] { background-color: #fff1f2 !important; }
        .bg-rose-600, [class*="bg-rose-600"] { background-color: #e11d48 !important; color: #ffffff !important; }
        .bg-amber-50, [class*="bg-amber-50"] { background-color: #fffbeb !important; }
        .bg-amber-600, [class*="bg-amber-600"] { background-color: #d97706 !important; color: #ffffff !important; }
        .text-indigo-600, [class*="text-indigo-600"] { color: #4f46e5 !important; }
        .text-indigo-700, [class*="text-indigo-700"] { color: #4338ca !important; }
        .text-indigo-900, [class*="text-indigo-900"] { color: #312e81 !important; }
        .text-slate-400, [class*="text-slate-400"] { color: #94a3b8 !important; }
        .text-slate-500, [class*="text-slate-500"] { color: #64748b !important; }
        .text-slate-600, [class*="text-slate-600"] { color: #475569 !important; }
        .text-slate-700, [class*="text-slate-700"] { color: #334155 !important; }
        .text-slate-800, [class*="text-slate-800"] { color: #1e293b !important; }
        .text-slate-900, [class*="text-slate-900"] { color: #0f172a !important; }
        .text-emerald-600, [class*="text-emerald-600"] { color: #059669 !important; }
        .text-rose-600, [class*="text-rose-600"] { color: #e11d48 !important; }
        .text-amber-600, [class*="text-amber-600"] { color: #d97706 !important; }
        .text-blue-600, [class*="text-blue-600"] { color: #2563eb !important; }
      `;
      clonedDoc.head.appendChild(safeStyle);

      if (options.onclone) {
        options.onclone(clonedDoc, clonedEl);
      }
    }
  };

  return await html2canvas(element, mergedOptions);
}
