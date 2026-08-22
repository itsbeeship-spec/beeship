"use client";

import { useState } from "react";

export default function AnalyticsCharts({ courierData = [] }) {
  // SVG Solid Pie Chart Calculation Helpers:
  // For solid pie charts, we use a circle of radius r = 25 and strokeWidth = 50.
  // Circumference C = 2 * PI * r = 157.08
  const C = 157.08;

  // Track active tooltip states for each of the three charts
  const [loadTooltip, setLoadTooltip] = useState(null);     // { label, percent, color, x, y }
  const [loadHoverIdx, setLoadHoverIdx] = useState(null);
  
  const [rtoTooltip, setRtoTooltip] = useState(null);
  const [rtoHoverIdx, setRtoHoverIdx] = useState(null);

  const [statusTooltip, setStatusTooltip] = useState(null);
  const [statusHoverIdx, setStatusHoverIdx] = useState(null);

  const handleMouseMove = (e, seg, setTooltip) => {
    const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    setTooltip({
      label: seg.name || seg.label,
      percent: seg.percent,
      color: seg.color,
      x,
      y
    });
  };

  const renderPie = (segments, hoverIdx, setHoverIdx, setTooltip) => {
    let accumulatedPercent = 0;
    let accumulatedLabelPercent = 0;

    return (
      <div className="relative">
        <svg className="w-48 h-48 select-none drop-shadow-sm transform -rotate-90" viewBox="0 0 100 100">
          {/* Background base circle */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="0.5"
          />
          
          {/* Pie slices */}
          {segments.map((seg, idx) => {
            if (seg.percent <= 0) return null;
            
            const dashOffset = C - (seg.percent / 100) * C;
            const strokeOffset = C - (accumulatedPercent / 100) * C;
            accumulatedPercent += seg.percent;

            const isHovered = hoverIdx === idx;

            return (
              <circle
                key={`slice-${idx}`}
                cx="50"
                cy="50"
                r="25"
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? 53 : 50}
                strokeDasharray="157.08"
                strokeDashoffset={dashOffset}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => {
                  setHoverIdx(null);
                  setTooltip(null);
                }}
                onMouseMove={(e) => handleMouseMove(e, seg, setTooltip)}
                className="cursor-pointer"
                style={{
                  strokeDashoffset: strokeOffset,
                  transition: "stroke-width 0.2s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 0.6s ease",
                  transformOrigin: "50px 50px",
                  transform: "rotate(0.5deg)"
                }}
              />
            );
          })}

          {/* Upright percentage labels inside slices */}
          {segments.map((seg, idx) => {
            if (seg.percent < 5) {
              // Skip labels for tiny segments to avoid overlapping text
              accumulatedLabelPercent += seg.percent;
              return null;
            }
            
            const startAngle = (accumulatedLabelPercent / 100) * 360;
            const sliceAngle = (seg.percent / 100) * 360;
            const midAngle = startAngle + sliceAngle / 2;
            accumulatedLabelPercent += seg.percent;

            // Coordinates for text label placement (offset r = 27)
            const rad = ((midAngle - 90) * Math.PI) / 180;
            const rText = 27;
            const x = 50 + rText * Math.cos(rad);
            const y = 50 + rText * Math.sin(rad);

            const isLightColor = seg.color === "#e2e8f0" || seg.color === "#f1f5f9" || seg.color === "#fef08a";
            const textColor = isLightColor ? "#1e293b" : "#ffffff";

            return (
              <text
                key={`label-${idx}`}
                x={x}
                y={y}
                fill={textColor}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(90, ${x}, ${y})`}
                className="text-[6.5px] font-black pointer-events-none select-none tracking-tighter"
              >
                {Math.round(seg.percent)}%
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // 1. Dynamic Load Distribution: Only 3 real couriers
  const loadStats = courierData.map(c => {
    const total = (c.booked || 0) + (c.pendingPickup || 0) + (c.inTransit || 0) + (c.outForDelivery || 0) + (c.delivered || 0) + (c.rto || 0) + (c.exception || 0);
    return { name: c.name, total };
  });

  const totalLoadSum = loadStats.reduce((sum, item) => sum + item.total, 0);

  const COURIER_COLORS = [
    "#3b82f6", // Blue  – Bluedart
    "#f59e0b", // Amber – Delhivery
    "#10b981", // Emerald – Xpressbees
  ];

  const loadSegments = loadStats.map((item, idx) => ({
    name: item.name,
    total: item.total,
    percent: totalLoadSum > 0 ? (item.total / totalLoadSum) * 100 : (100 / loadStats.length),
    color: COURIER_COLORS[idx] || "#64748b"
  }));

  // 2. Dynamic Delivery vs RTO: Green success, Orange in transit, Red failed
  const totalDelivered = courierData.reduce((sum, c) => sum + (c.delivered || 0), 0);
  const totalRto = courierData.reduce((sum, c) => sum + (c.rto || 0), 0);
  const totalDelRtoSum = totalDelivered + totalRto;

  const deliveredPct = totalDelRtoSum > 0 ? (totalDelivered / totalDelRtoSum) * 100 : 88;
  const rtoPct = totalDelRtoSum > 0 ? (totalRto / totalDelRtoSum) * 100 : 12;

  const rtoTransitPct = rtoPct * 0.8;
  const rtoDeliveredPct = rtoPct * 0.2;

  const deliveryRtoSegments = [
    { label: "Delivered", percent: Math.round(deliveredPct), color: "#10b981" },      // Emerald Green
    { label: "RTO In Transit", percent: Math.round(rtoTransitPct), color: "#f97316" }, // Orange
    { label: "RTO Delivered", percent: Math.round(rtoDeliveredPct), color: "#ef4444" }  // Red
  ];

  const sumDelCheck = deliveryRtoSegments.reduce((sum, s) => sum + s.percent, 0);
  if (sumDelCheck !== 100) {
    deliveryRtoSegments[0].percent += (100 - sumDelCheck);
  }

  // 3. Dynamic Status Breakdown: Purple, Blue, Green, Cyan
  const totalBooked = courierData.reduce((sum, c) => sum + (c.booked || 0), 0);
  const totalPending = courierData.reduce((sum, c) => sum + (c.pendingPickup || 0), 0);
  const totalTransit = courierData.reduce((sum, c) => sum + (c.inTransit || 0) + (c.outForDelivery || 0), 0);
  const totalStageDelivered = courierData.reduce((sum, c) => sum + (c.delivered || 0), 0);
  const totalStageSum = totalBooked + totalPending + totalTransit + totalStageDelivered;

  const stageBookedPct = totalStageSum > 0 ? (totalBooked / totalStageSum) * 100 : 4;
  const stagePendingPct = totalStageSum > 0 ? (totalPending / totalStageSum) * 100 : 64;
  const stageTransitPct = totalStageSum > 0 ? (totalTransit / totalStageSum) * 100 : 23;
  const stageDeliveredPct = totalStageSum > 0 ? (totalStageDelivered / totalStageSum) * 100 : 9;

  const statusSegments = [
    { label: "Pending Pickup", percent: Math.round(stagePendingPct), color: "#8b5cf6" }, // Violet/Purple
    { label: "In Transit", percent: Math.round(stageTransitPct), color: "#3b82f6" },     // Royal Blue
    { label: "Delivered", percent: Math.round(stageDeliveredPct), color: "#10b981" },    // Green
    { label: "New / Booked", percent: Math.round(stageBookedPct), color: "#0ea5e9" }     // Cyan/Sky Blue
  ];

  const sumStageCheck = statusSegments.reduce((sum, s) => sum + s.percent, 0);
  if (sumStageCheck !== 100) {
    statusSegments[0].percent += (100 - sumStageCheck);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full font-sans select-none animate-fadeIn">
      {/* Chart 1: Load Distribution – Donut with 3 couriers, total in center */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm flex flex-col justify-between items-center gap-6 min-h-[360px] relative">
        {/* Header */}
        <div className="flex justify-between items-start w-full">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Load Distribution</h3>
            <p className="text-[11px] text-slate-450">Shipment volume by courier partner</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="relative flex items-center justify-center load-donut-wrap">
          <svg
            className="w-44 h-44 select-none drop-shadow-sm"
            viewBox="0 0 100 100"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Track ring */}
            <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" strokeWidth="18" />

            {/* Donut segments */}
            {(() => {
              const R = 35;
              const CIRC = 2 * Math.PI * R; // 219.91
              let offset = 0;
              const GAP = 1.5; // small gap between segments in px of circumference
              return loadSegments.map((seg, idx) => {
                const dash = (seg.percent / 100) * CIRC - GAP;
                const el = (
                  <circle
                    key={idx}
                    cx="50" cy="50" r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={loadHoverIdx === idx ? 22 : 18}
                    strokeDasharray={`${Math.max(0, dash)} ${CIRC}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-width 0.2s ease, opacity 0.2s ease", opacity: loadHoverIdx === null || loadHoverIdx === idx ? 1 : 0.45 }}
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setLoadHoverIdx(idx);
                      const rect = e.currentTarget.ownerSVGElement.closest('.load-donut-wrap').getBoundingClientRect();
                      setLoadTooltip({ label: seg.name, total: seg.total, percent: seg.percent, color: seg.color, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.ownerSVGElement.closest('.load-donut-wrap').getBoundingClientRect();
                      setLoadTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                    }}
                    onMouseLeave={() => { setLoadHoverIdx(null); setLoadTooltip(null); }}
                  />
                );
                offset += (seg.percent / 100) * CIRC;
                return el;
              });
            })()}
          </svg>

          {/* Center label: shows hovered segment info or total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
            {loadHoverIdx !== null && loadSegments[loadHoverIdx] ? (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: loadSegments[loadHoverIdx].color }}>
                  {Math.round(loadSegments[loadHoverIdx].percent)}%
                </span>
                <span className="text-lg font-extrabold text-slate-800">
                  {loadSegments[loadHoverIdx].total.toLocaleString('en-IN')}
                </span>
                <span className="text-[8px] text-slate-400 font-semibold text-center px-2 leading-tight mt-0.5">
                  {loadSegments[loadHoverIdx].name.split(" ")[0]}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total</span>
                <span className="text-xl font-extrabold text-slate-800">{totalLoadSum.toLocaleString('en-IN')}</span>
              </>
            )}
          </div>
        </div>

        {/* Floating tooltip */}
        {loadTooltip && (
          <div
            className="absolute z-30 pointer-events-none animate-fadeIn"
            style={{ left: loadTooltip.x + 14, top: loadTooltip.y - 44 }}
          >
            <div className="bg-slate-900/95 text-white text-[10px] px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 flex flex-col gap-0.5 min-w-[130px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: loadTooltip.color }} />
                <span className="font-extrabold truncate">{loadTooltip.label}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Shipments</span>
                <span className="font-bold text-white">{loadTooltip.total?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Share</span>
                <span className="font-bold text-white">{Math.round(loadTooltip.percent)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend: 3 items vertical */}
        <div className="flex flex-col gap-2.5 w-full border-t border-slate-50 pt-4">
          {loadSegments.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setLoadHoverIdx(idx)}
              onMouseLeave={() => setLoadHoverIdx(null)}
              className={`flex items-center justify-between text-[11px] font-bold cursor-pointer transition-all duration-150 ${
                loadHoverIdx === idx ? "text-slate-900" : "text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="text-slate-400 font-semibold">{item.total.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Delivery vs RTO */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm flex flex-col justify-between items-center gap-6 min-h-[360px] relative">
        {/* Header */}
        <div className="flex justify-between items-start w-full">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Delivery vs RTO</h3>
            <p className="text-[11px] text-slate-450">Efficiency ratio across all carriers</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="relative flex items-center justify-center rto-donut-wrap">
          <svg className="w-44 h-44 select-none drop-shadow-sm" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" strokeWidth="18" />
            {(() => {
              const R = 35;
              const CIRC = 2 * Math.PI * R;
              let offset = 0;
              const GAP = 1.5;
              return deliveryRtoSegments.map((seg, idx) => {
                const dash = (seg.percent / 100) * CIRC - GAP;
                const el = (
                  <circle
                    key={idx}
                    cx="50" cy="50" r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={rtoHoverIdx === idx ? 22 : 18}
                    strokeDasharray={`${Math.max(0, dash)} ${CIRC}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-width 0.2s ease, opacity 0.2s ease", opacity: rtoHoverIdx === null || rtoHoverIdx === idx ? 1 : 0.45 }}
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setRtoHoverIdx(idx);
                      const rect = e.currentTarget.ownerSVGElement.closest('.rto-donut-wrap').getBoundingClientRect();
                      setRtoTooltip({ label: seg.label, percent: seg.percent, color: seg.color, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.ownerSVGElement.closest('.rto-donut-wrap').getBoundingClientRect();
                      setRtoTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                    }}
                    onMouseLeave={() => { setRtoHoverIdx(null); setRtoTooltip(null); }}
                  />
                );
                offset += (seg.percent / 100) * CIRC;
                return el;
              });
            })()}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
            {rtoHoverIdx !== null && deliveryRtoSegments[rtoHoverIdx] ? (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: deliveryRtoSegments[rtoHoverIdx].color }}>
                  {Math.round(deliveryRtoSegments[rtoHoverIdx].percent)}%
                </span>
                <span className="text-lg font-extrabold text-slate-800">
                  {deliveryRtoSegments[rtoHoverIdx].label.split(" ")[0]}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rate</span>
                <span className="text-xl font-extrabold text-emerald-600">{Math.round(deliveryRtoSegments[0]?.percent || 0)}%</span>
                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Delivered</span>
              </>
            )}
          </div>
        </div>

        {/* Floating tooltip */}
        {rtoTooltip && (
          <div className="absolute z-30 pointer-events-none animate-fadeIn" style={{ left: rtoTooltip.x + 14, top: rtoTooltip.y - 44 }}>
            <div className="bg-slate-900/95 text-white text-[10px] px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 flex flex-col gap-0.5 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rtoTooltip.color }} />
                <span className="font-extrabold">{rtoTooltip.label}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Share</span>
                <span className="font-bold text-white">{Math.round(rtoTooltip.percent)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-col gap-2.5 w-full border-t border-slate-50 pt-4">
          {deliveryRtoSegments.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setRtoHoverIdx(idx)}
              onMouseLeave={() => setRtoHoverIdx(null)}
              className={`flex items-center justify-between text-[11px] font-bold cursor-pointer transition-all duration-150 ${
                rtoHoverIdx === idx ? "text-slate-900" : "text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
              <span className="font-bold" style={{ color: item.color }}>{Math.round(item.percent)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 3: Status Breakdown */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm flex flex-col justify-between items-center gap-6 min-h-[360px] relative">
        {/* Header */}
        <div className="flex justify-between items-start w-full">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Status Breakdown</h3>
            <p className="text-[11px] text-slate-450">Distribution across active shipment stages</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="relative flex items-center justify-center status-donut-wrap">
          <svg className="w-44 h-44 select-none drop-shadow-sm" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" strokeWidth="18" />
            {(() => {
              const R = 35;
              const CIRC = 2 * Math.PI * R;
              let offset = 0;
              const GAP = 1.5;
              return statusSegments.map((seg, idx) => {
                const dash = (seg.percent / 100) * CIRC - GAP;
                const el = (
                  <circle
                    key={idx}
                    cx="50" cy="50" r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={statusHoverIdx === idx ? 22 : 18}
                    strokeDasharray={`${Math.max(0, dash)} ${CIRC}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-width 0.2s ease, opacity 0.2s ease", opacity: statusHoverIdx === null || statusHoverIdx === idx ? 1 : 0.45 }}
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setStatusHoverIdx(idx);
                      const rect = e.currentTarget.ownerSVGElement.closest('.status-donut-wrap').getBoundingClientRect();
                      setStatusTooltip({ label: seg.label, percent: seg.percent, color: seg.color, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.ownerSVGElement.closest('.status-donut-wrap').getBoundingClientRect();
                      setStatusTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                    }}
                    onMouseLeave={() => { setStatusHoverIdx(null); setStatusTooltip(null); }}
                  />
                );
                offset += (seg.percent / 100) * CIRC;
                return el;
              });
            })()}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
            {statusHoverIdx !== null && statusSegments[statusHoverIdx] ? (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: statusSegments[statusHoverIdx].color }}>
                  {Math.round(statusSegments[statusHoverIdx].percent)}%
                </span>
                <span className="text-lg font-extrabold text-slate-800">
                  {statusSegments[statusHoverIdx].label.split(" ")[0]}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Stages</span>
                <span className="text-xl font-extrabold text-slate-800">{statusSegments.length}</span>
              </>
            )}
          </div>
        </div>

        {/* Floating tooltip */}
        {statusTooltip && (
          <div className="absolute z-30 pointer-events-none animate-fadeIn" style={{ left: statusTooltip.x + 14, top: statusTooltip.y - 44 }}>
            <div className="bg-slate-900/95 text-white text-[10px] px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 flex flex-col gap-0.5 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusTooltip.color }} />
                <span className="font-extrabold">{statusTooltip.label}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Share</span>
                <span className="font-bold text-white">{Math.round(statusTooltip.percent)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full border-t border-slate-50 pt-4">
          {statusSegments.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setStatusHoverIdx(idx)}
              onMouseLeave={() => setStatusHoverIdx(null)}
              className={`flex items-center gap-2 text-[11px] font-bold cursor-pointer transition-all duration-150 ${
                statusHoverIdx === idx ? "text-slate-900" : "text-slate-600"
              }`}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
