"use client";

import { useState, useEffect } from "react";

export default function TagsModal({ isOpen, onClose, order, onUpdate }) {
  const [inputVal, setInputVal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when modal opens or order changes
  useEffect(() => {
    if (isOpen && order) {
      document.body.style.overflow = "hidden";
      setInputVal(order.tags ? order.tags.join(", ") : "");
    } else {
      document.body.style.overflow = "";
      setInputVal("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleAction = async (actionType) => {
    setIsSaving(true);
    try {
      const tagsToProcess = inputVal
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");

      let updatedTags = [];
      const currentTags = order.tags || [];

      if (actionType === "add") {
        // Merge tags, keeping unique entries
        updatedTags = [...new Set([...currentTags, ...tagsToProcess])];
      } else if (actionType === "remove") {
        // Filter out tags that are in the input list
        updatedTags = currentTags.filter((t) => !tagsToProcess.includes(t));
      }

      await onUpdate(order.id, updatedTags, actionType, tagsToProcess);
      onClose();
    } catch (err) {
      console.error(`Failed to ${actionType} tags:`, err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTagBadge = async (tagToRemove) => {
    setIsSaving(true);
    try {
      const currentTags = order.tags || [];
      const updatedTags = currentTags.filter((t) => t !== tagToRemove);
      
      // Update database and parent state
      await onUpdate(order.id, updatedTags, "remove", [tagToRemove]);
      
      // Sync text input box value
      setInputVal(updatedTags.join(", "));
    } catch (err) {
      console.error("Failed to remove tag badge:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTags = order.tags || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 border border-slate-150 font-sans flex flex-col gap-4 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <h2 className="text-lg font-bold text-slate-900">Add/Remove Tags</h2>

        {/* Tag Input Box */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full border border-slate-250 rounded-lg px-4 py-3 text-slate-800 text-sm font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
            placeholder="Type tags separated by commas..."
            autoFocus
          />

          {/* Current tags display helper */}
          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1 items-center">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Active Tags:</span>
              {currentTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTagBadge(tag)}
                    className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title="Remove from input list"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            onClick={() => handleAction("remove")}
            disabled={isSaving}
            className="border border-slate-200 rounded-lg px-5 py-2 text-slate-700 text-sm font-bold bg-white hover:bg-slate-50 hover:border-slate-350 transition cursor-pointer disabled:opacity-50"
          >
            Remove
          </button>
          <button
            onClick={() => handleAction("add")}
            disabled={isSaving}
            className="bg-[#1e293b] text-white rounded-lg px-5 py-2 text-sm font-bold hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? "Saving..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
