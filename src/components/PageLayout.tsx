import React from "react";
import { Outlet } from "react-router-dom";

const PageLayout: React.FC = () => {
  return (
    <div
      className="relative w-full min-h-screen bg-sky-400 text-slate-900 dark:text-slate-100 overflow-x-hidden safe-area-bottom"
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <style>{`
        /* Ensure text is readable on sky-400 background */
        .text-gray-600, .text-slate-600 {
          color: #1e293b;
        }
        .text-gray-700, .text-slate-700 {
          color: #0f172a;
        }
        .text-gray-500, .text-slate-500 {
          color: #334155;
        }
        .text-muted-foreground {
          color: #334155;
        }
        /* Cards and containers on sky background */
        .bg-card, .bg-white {
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        /* Links should be visible */
        a {
          color: #0284c7;
        }
        a:hover {
          color: #0369a1;
        }
        /* Ensure buttons are readable */
        .bg-muted {
          background: #e0f2fe;
        }
        /* Input fields */
        input, textarea, select {
          background: white;
          color: #1e293b;
        }
      `}</style>
      <Outlet />
    </div>
  );
};

export default PageLayout;
