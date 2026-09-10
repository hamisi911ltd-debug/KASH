/* ============================================================
   One list component for every table in the app.
   - Desktop: a sortable, paginated table + CSV export.
   - Phones: the same rows as compact stacked cards, so there is
     no sideways scrolling.
   ============================================================ */
import React, { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { C } from "../lib/constants";
import { downloadCSV } from "../lib/format";
import { EmptyState, IconButton } from "./ui.jsx";
import { useOnDismiss, useMediaQuery } from "../lib/hooks.js";

function RowMenu({ actions, row }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  useOnDismiss(ref, () => setOpen(false), open);
  const items = actions.filter((a) => !a.hidden || !a.hidden(row));
  if (!items.length) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: C.muted, background: open ? C.surface2 : "transparent" }}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div
          className="n1-pop absolute right-0 mt-1 w-40 rounded-xl border py-1 z-30"
          style={{ background: C.surface, borderColor: C.line, boxShadow: C.shadowMd }}
        >
          {items.map((a) => (
            <button
              key={a.label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); a.onClick(row); }}
              className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2 hover:opacity-70 transition-opacity"
              style={{ color: a.tone === "danger" ? C.coral : C.ink }}
            >
              {a.icon && <a.icon size={14} />}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @param {object[]} columns  { key, header, align?, sortable?, sortValue?(row), render?(row), width?, wrap?, muted? }
 * @param {object[]} rows
 * @param {object[]} [actions] row menu: { label, icon?, onClick(row), tone?, hidden?(row) }
 * @param {function} [onRowClick]
 * @param {string}   [exportName]  enables a CSV button for the current rows
 * @param {number}   [pageSize]
 */
export default function DataTable({
  columns,
  rows,
  actions,
  onRowClick,
  exportName,
  pageSize = 10,
  initialSort,
  dense = false,
  emptyText = "Nothing to show yet.",
  emptyIcon,
}) {
  const [sort, setSort] = useState(initialSort || null); // { key, dir }
  const [page, setPage] = useState(0);
  const isMobile = useMediaQuery("(max-width: 640px)");

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = col.sortValue || ((r) => r[sort.key]);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const view = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key) => {
    setPage(0);
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const handleExport = () => {
    const cols = columns
      .filter((c) => c.key !== "_actions")
      .map((c) => ({ label: c.header || c.key, key: c.key, map: c.exportValue || c.sortValue }));
    downloadCSV(exportName, cols, sorted);
  };

  const pad = dense ? "px-3 py-2" : "px-3 py-2.5 sm:px-5 sm:py-3";
  const dataCols = columns.filter((c) => c.key !== "_actions");
  const sortableCols = dataCols.filter((c) => c.sortable !== false);

  /* ---------- shared: export + pagination ---------- */
  const Toolbar = exportName ? (
    <div className="flex justify-end mb-2 n1-no-print">
      <button
        onClick={handleExport}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
        style={{ color: C.muted, background: C.surface2 }}
      >
        <Download size={13} /> Export {sorted.length} row{sorted.length === 1 ? "" : "s"}
      </button>
    </div>
  ) : null;

  const Pager =
    pageCount > 1 ? (
      <div className="flex items-center justify-between mt-3 text-xs n1-no-print" style={{ color: C.muted }}>
        <span>
          {safePage * pageSize + 1}-{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
        </span>
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} size={15} onClick={() => setPage(Math.max(0, safePage - 1))} />
          <span className="px-2 font-semibold" style={{ color: C.ink }}>
            {safePage + 1} / {pageCount}
          </span>
          <IconButton icon={ChevronRight} size={15} onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} />
        </div>
      </div>
    ) : null;

  /* ---------- mobile: stacked cards ---------- */
  if (isMobile) {
    const title = dataCols[0];
    // the value you scan for = the right-aligned column (amount / status), else the last one
    const trailing =
      dataCols.length > 1
        ? dataCols.slice(1).find((c) => c.align === "right") || dataCols[dataCols.length - 1]
        : null;
    const middle = dataCols.slice(1).filter((c) => c !== trailing);
    const cell = (c, row) => (c.render ? c.render(row) : row[c.key]);

    return (
      <div>
        {Toolbar}

        {sortableCols.length > 0 && sorted.length > 1 && (
          <div className="flex items-center gap-2 mb-2 n1-no-print">
            <span className="text-xs" style={{ color: C.faint }}>Sort</span>
            <select
              value={sort ? `${sort.key}:${sort.dir}` : ""}
              onChange={(e) => {
                if (!e.target.value) return setSort(null);
                const [key, dir] = e.target.value.split(":");
                setSort({ key, dir });
                setPage(0);
              }}
              className="rounded-lg border px-2 py-1.5 text-xs flex-1"
              style={{ borderColor: C.line, background: C.surface, color: C.ink }}
            >
              <option value="">Default</option>
              {sortableCols.map((c) => (
                <React.Fragment key={c.key}>
                  <option value={`${c.key}:desc`}>{c.header} ↓</option>
                  <option value={`${c.key}:asc`}>{c.header} ↑</option>
                </React.Fragment>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          {view.map((row, idx) => (
            <div
              key={row.id || idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className="rounded-xl border p-2.5"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm font-semibold" style={{ color: C.ink }}>
                  {cell(title, row)}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {trailing && <div className="text-sm font-semibold text-right" style={{ color: C.ink }}>{cell(trailing, row)}</div>}
                  {actions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <RowMenu actions={actions} row={row} />
                    </div>
                  )}
                </div>
              </div>

              {middle.length > 0 && (
                <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                  {middle.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide leading-none" style={{ color: C.faint }}>{c.header}</p>
                      <div className="text-xs mt-0.5 break-words leading-snug" style={{ color: c.muted ? C.muted : C.ink }}>{cell(c, row)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="rounded-xl border" style={{ borderColor: C.line }}>
            <EmptyState icon={emptyIcon} text={emptyText} />
          </div>
        )}

        {Pager}
      </div>
    );
  }

  /* ---------- desktop: table ---------- */
  return (
    <div>
      {Toolbar}

      <div className="overflow-x-auto n1-scroll rounded-2xl border" style={{ borderColor: C.line }}>
        <table className="w-full text-[13px] sm:text-sm" style={{ minWidth: columns.length > 5 ? 680 : undefined }}>
          <thead>
            <tr style={{ background: C.surface2 }}>
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.key}
                    className={`font-semibold text-xs ${pad} ${col.align === "right" ? "text-right" : "text-left"}`}
                    style={{ color: C.muted, width: col.width }}
                  >
                    {col.sortable === false ? (
                      col.header
                    ) : (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:opacity-70 ${col.align === "right" ? "flex-row-reverse" : ""}`}
                        style={{ color: active ? C.ink : C.muted }}
                      >
                        {col.header}
                        <Icon size={12} />
                      </button>
                    )}
                  </th>
                );
              })}
              {actions && <th className={pad} style={{ width: 44 }} />}
            </tr>
          </thead>
          <tbody>
            {view.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-t transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                style={{ borderColor: C.line }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.surface2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${pad} ${col.align === "right" ? "text-right" : "text-left"}`}
                    style={{ color: col.muted ? C.muted : C.ink, whiteSpace: col.wrap ? "normal" : "nowrap" }}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className={pad} onClick={(e) => e.stopPropagation()}>
                    <RowMenu actions={actions} row={row} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && <EmptyState icon={emptyIcon} text={emptyText} />}
      </div>

      {Pager}
    </div>
  );
}
