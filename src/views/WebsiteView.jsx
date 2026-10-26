/* A division Manager's own page for what shows up about their department
   on the public marketing site - a link to see it live, and a simple list
   of listings they publish/edit/remove. Company-wide roles (Super Admin,
   Admin, Director) see every division here, with a filter. */
import React, { useMemo, useState } from "react";
import { ExternalLink, Plus, Pencil, Trash2, Globe, Image as ImageIcon } from "lucide-react";
import { C, DIVISIONS, DIVISION_SITE_PAGE, MARKETING_SITE_URL, divisionLabel, divisionOptions } from "../lib/constants";
import { formatKES } from "../lib/format";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, ChipRow } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const SITE_DIVISIONS = ["Transport", "Food", "Hospitality"];

export default function WebsiteView() {
  const { data, session, patchRecord } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const lockedDivision = session?.division && SITE_DIVISIONS.includes(session.division) ? session.division : null;
  const [division, setDivision] = useState(lockedDivision || "All");

  const listings = data.listings || [];
  const shown = lockedDivision ? listings.filter((l) => l.division === lockedDivision) : listings.filter((l) => division === "All" || l.division === division);
  const activeCount = shown.filter((l) => l.active).length;
  const liveDivision = lockedDivision || (division !== "All" ? division : "Transport");
  const liveUrl = `${MARKETING_SITE_URL}/${DIVISION_SITE_PAGE[liveDivision] || ""}`;

  const columns = [
    {
      key: "title", header: "Listing", wrap: true,
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center" style={{ background: C.surface2 }}>
            {r.imageUrl ? <img src={r.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={16} style={{ color: C.faint }} />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{r.title || "Untitled"}</p>
            {r.meta && <p className="text-xs truncate" style={{ color: C.faint }}>{r.meta}</p>}
          </div>
        </div>
      ),
    },
    ...(lockedDivision ? [] : [{ key: "division", header: "Division", sortValue: (r) => r.division, render: (r) => <Badge tone="slate" size="sm">{divisionLabel(r.division)}</Badge> }]),
    { key: "price", header: "Price", align: "right", sortValue: (r) => r.price, render: (r) => (r.price ? formatKES(r.price) : "-") },
    { key: "active", header: "Status", sortValue: (r) => (r.active ? 1 : 0), render: (r) => <Badge tone={r.active ? "emerald" : "slate"} size="sm">{r.active ? "Live" : "Hidden"}</Badge> },
  ];

  const actions = caps.manageListings ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord("listings", r.id) },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord("listings", r.id) },
  ] : [];

  /* Quote / ride / delivery / booking forms filled in on the public site. */
  const requests = (data.webRequests || []).filter((r) => lockedDivision ? r.division === lockedDivision : division === "All" || r.division === division);
  const newCount = requests.filter((r) => r.status === "New").length;
  const STATUS_TONE = { New: "amber", Contacted: "blue", Done: "emerald", Spam: "slate" };
  const requestColumns = [
    {
      key: "name", header: "From", wrap: true, sortValue: (r) => r.name,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold truncate">{r.name || "Unknown"}</p>
          <p className="text-xs truncate" style={{ color: C.faint }}>{[r.phone, r.email].filter(Boolean).join(" · ")}</p>
        </div>
      ),
    },
    {
      key: "summary", header: "Request", wrap: true, sortValue: (r) => r.summary,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium">{r.summary}</p>
          <p className="text-xs" style={{ color: C.faint }}>
            {Object.entries(r.details || {}).filter(([k]) => !["lat", "lng", "items", "estimatedTotal"].includes(k)).slice(0, 4).map(([k, v]) => `${k}: ${String(v).slice(0, 60)}`).join(" · ")}
          </p>
        </div>
      ),
    },
    ...(lockedDivision ? [] : [{ key: "division", header: "Division", sortValue: (r) => r.division, render: (r) => <Badge tone="slate" size="sm">{divisionLabel(r.division)}</Badge> }]),
    { key: "receivedAt", header: "Received", sortValue: (r) => r.receivedAt, render: (r) => new Date(r.receivedAt).toLocaleString() },
    {
      key: "status", header: "Status", sortValue: (r) => r.status,
      render: (r) => (
        caps.write || caps.manageListings ? (
          <select
            aria-label="Request status"
            value={r.status}
            onChange={(e) => patchRecord("webRequests", r.id, { status: e.target.value })}
            className="text-xs rounded-md px-2 py-1 border"
            style={{ borderColor: C.line, background: C.surface }}
          >
            {["New", "Contacted", "Done", "Spam"].map((s) => <option key={s}>{s}</option>)}
          </select>
        ) : <Badge tone={STATUS_TONE[r.status] || "slate"} size="sm">{r.status}</Badge>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Website"
        subtitle="What shows up about your department on the public website."
        actions={
          <div className="flex items-center gap-2">
            <Button as="a" href={liveUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
              <ExternalLink size={14} /> View live site
            </Button>
            {caps.manageListings && <Button size="sm" onClick={() => openForm("listing")}><Plus size={14} /> Add listing</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 max-w-xl">
        <StatCard icon={Globe} label="Live on the website" value={activeCount} tint={C.emerald} />
        <StatCard icon={ImageIcon} label="Total listings" value={shown.length} tint={C.blue} />
        <StatCard icon={Globe} label="New website requests" value={newCount} tint={C.amber} />
      </div>

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3">
          <SectionTitle title={`${requests.length} request${requests.length === 1 ? "" : "s"} from the website`} />
        </div>
        <div className="px-3 sm:px-5 pb-5">
          <DataTable
            columns={requestColumns}
            rows={requests}
            exportName="kash-website-requests"
            emptyIcon={Globe}
            emptyText="No requests from the website yet."
          />
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3">
          <SectionTitle title={`${shown.length} listing${shown.length === 1 ? "" : "s"}`} />
        </div>
        {!lockedDivision && (
          <div className="px-3 sm:px-5 pb-4">
            <ChipRow options={divisionOptions(["All", ...SITE_DIVISIONS])} value={division} onChange={setDivision} />
          </div>
        )}
        <div className="px-3 sm:px-5 pb-5">
          <DataTable
            columns={columns}
            rows={shown}
            actions={actions}
            exportName="kash-website-listings"
            emptyIcon={Globe}
            emptyText={caps.manageListings ? "Nothing published yet - add your first listing." : "Nothing published yet."}
          />
        </div>
      </Card>
    </Page>
  );
}
