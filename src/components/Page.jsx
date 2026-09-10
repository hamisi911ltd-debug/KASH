/* Shared page scaffolding: the title block every view opens with. */
import React from "react";
import { C } from "../lib/constants";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-display" style={{ color: C.ink }}>{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm mt-1" style={{ color: C.muted }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Page({ children }) {
  return <div className="space-y-4 sm:space-y-6 n1-rise">{children}</div>;
}
