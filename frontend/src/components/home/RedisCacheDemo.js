"use client";

export default function RedisCacheDemo({
  documents,
  fetchDocuments,
  loadingDocs,
  docCacheHeader,
  fetchingDocsTime
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between font-sans select-none">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 tracking-wide">Redis Caching (Protected)</h2>
          <button 
            type="button"
            onClick={fetchDocuments} 
            disabled={loadingDocs}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg font-medium transition cursor-pointer text-white animate-fadeIn"
          >
            {loadingDocs ? "Loading..." : "Get Documents"}
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Loads files stored metadata under the current user token session using Redis middleware. Demonstrates CORS and authorization checks directly.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-center">
            <span className="text-xs text-slate-450 font-bold block mb-1">X-CACHE HEADER</span>
            <span className={`text-base font-bold ${
              docCacheHeader === "HIT" ? "text-emerald-600" : "text-amber-600"
            }`}>
              {docCacheHeader}
            </span>
          </div>
          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-center">
            <span className="text-xs text-slate-450 font-bold block mb-1">RESPONSE SPEED</span>
            <span className="text-base font-bold text-blue-600">
              {fetchingDocsTime} ms
            </span>
          </div>
        </div>

        {/* Log/Listing */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white max-h-[160px] overflow-y-auto shadow-inner">
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Documents Saved</p>
          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No documents saved. Generate S3 urls to create entries.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs text-slate-700">
              {documents.map((doc) => (
                <li key={doc.id} className="py-2 flex justify-between items-center gap-2">
                  <span className="truncate text-slate-650 font-medium">{doc.title}</span>
                  <span className="text-[10px] text-slate-505 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded uppercase font-mono shrink-0">{doc.mimeType.split('/')[1] || doc.mimeType}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <p className="text-[10px] text-slate-400 mt-4">
        * Auto cache invalidation executes upon any document creation.
      </p>
    </div>
  );
}
