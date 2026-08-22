"use client";

export default function S3UploadDemo({
  title,
  setTitle,
  fileName,
  setFileName,
  mimeType,
  setMimeType,
  fileSize,
  setFileSize,
  uploadResult,
  submittingDoc,
  handleUploadSubmit
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm font-sans select-none flex flex-col justify-between h-full">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-wide mb-4">S3 Presign Upload (Zod Guarded)</h2>
        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Document Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Invoice"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">File Name</label>
            <input 
              type="text" 
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="invoice.pdf"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Mime Type</label>
              <select 
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="application/pdf">PDF Document</option>
                <option value="image/png">PNG Image</option>
                <option value="image/jpeg">JPEG Image</option>
                <option value="application/json">JSON Data</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">File Size (bytes)</label>
              <input 
                type="number" 
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submittingDoc}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg text-sm font-semibold tracking-wide transition shadow-lg shadow-blue-600/10 cursor-pointer mt-2 text-white"
          >
            {submittingDoc ? "Generating URL..." : "Get Presigned S3 Upload URL"}
          </button>
        </form>

        {/* Upload results display */}
        {uploadResult && (
          <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs flex flex-col gap-2 animate-fadeIn max-w-full">
            <span className="font-bold text-blue-600 uppercase block tracking-wider">Payload Response:</span>
            <p className="text-slate-650"><span className="text-slate-800 font-semibold">S3 Key:</span> {uploadResult.document.s3Key}</p>
            <div className="overflow-x-auto whitespace-pre-wrap font-mono p-2 bg-white rounded border border-slate-200 max-h-[80px] text-blue-600 break-all shadow-inner">
              Presigned URL: {uploadResult.uploadUrl}
            </div>
            <p className="text-slate-500 italic text-[10px] mt-1 text-center flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Saved and signed with user scope.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
