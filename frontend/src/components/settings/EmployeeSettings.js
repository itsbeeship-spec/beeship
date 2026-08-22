"use client";

import { useState } from "react";

export default function EmployeeSettings() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Syam Sundar", email: "syam@beeship.com", role: "Developer" },
    { id: 2, name: "Prashant Kumar", email: "prashant@beeship.com", role: "Support Manager" }
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900">Manage Employees</h3>
          <p className="text-xs text-slate-500 mt-1">Add and manage staff members with granular role permissions access.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 transition text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm">
          + Add Employee
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="border border-slate-150 rounded-2xl p-5 bg-white flex justify-between items-center shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-800">{emp.name}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{emp.email}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-slate-100 border border-slate-200 text-slate-600 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase">
                {emp.role}
              </span>
              <button className="text-rose-500 hover:text-rose-700 font-bold text-[10px] cursor-pointer">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
