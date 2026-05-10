"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHubSession } from "@/lib/use-hub-session";
import { supabase } from "@/lib/supabase";

type WeeklyReport = {
  id: string;
  week_of: string;
  tasks: string;
  certified: boolean;
  submitted_at: string;
};

type UploadedDoc = {
  name: string;
  path: string;
  uploadedAt: string;
};

// ── Real resource URLs ────────────────────────────────────────────────────────

const USEFUL_LINKS = [
  { label: "Employee Handbook (SHRM Template)", href: "https://www.shrm.org/content/dam/en/shrm/business-solutions/SHRM-Sample-Employee-Handbook-2023.docx" },
  { label: "OGP SharePoint Site", href: "#" },
  { label: "DOL Employment Law Guide", href: "https://webapps.dol.gov/elaws/elg/" },
  // { label: "OSHA Outreach Training (10/30-hr)", href: "https://www.osha.gov/training/outreach" },
];

const LABOR_LAW_POSTERS = [
  // Federal
  { label: "FLSA — Minimum Wage (Federal)", href: "https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/minwagep.pdf", tag: "Federal" },
  { label: "FMLA — Family & Medical Leave (Federal)", href: "https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/fmlaen.pdf", tag: "Federal" },
  { label: "OSHA — Job Safety & Health (Federal)", href: "https://www.osha.gov/sites/default/files/publications/osha3165.pdf", tag: "Federal" },
  { label: "EEO — Know Your Rights (EEOC)", href: "https://www.eeoc.gov/sites/default/files/2023-06/22-088_EEOC_KnowYourRights6.12ScreenRdr.pdf", tag: "Federal" },
  { label: "Employee Polygraph Protection Act", href: "https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/eppac.pdf", tag: "Federal" },
  // Texas
  { label: "TX Payday Law (TWC)", href: "https://www.twc.texas.gov/sites/default/files/fdcm/docs/payday-law-poster-wh-10-twc.pdf", tag: "Texas" },
  { label: "TX Unemployment Compensation (TWC)", href: "https://www.twc.texas.gov/sites/default/files/fdcm/docs/texas-unemployment-compensation-act-and-texas-payday-law-poster-twc.pdf", tag: "Texas" },
  { label: "TX Workplace Violence Notice (2024)", href: "https://www.twc.texas.gov/sites/default/files/fdcm/docs/workplace-violence-poster-twc.pdf", tag: "Texas" },
];

//const SAFETY_RESOURCES = [
  //{ label: "OSHA H2S Safety — Oil & Gas eTool", href: "https://www.osha.gov/etools/oil-and-gas/general-safety/h2s-monitoring" },
  //{ label: "OSHA H2S Fact Sheet (PDF)", href: "https://www.osha.gov/sites/default/files/publications/OSHA4204.pdf" },
  //{ label: "Find a Certified OSHA Trainer", href: "https://www.osha.gov/training/outreach/find-a-trainer" },
];

const PAYROLL_URL = "https://signin.adp.com/";
const TRAINING_URL = "https://www.osha.gov/training/outreach/general-industry";

// ─────────────────────────────────────────────────────────────────────────────

export function HubDashboardClient() {
  const router = useRouter();
  const session = useHubSession();

  const [weekOf, setWeekOf] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  });
  const [tasks, setTasks] = useState("");
  const [certified, setCertified] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [submitError, setSubmitError] = useState("");
  const [pastReports, setPastReports] = useState<WeeklyReport[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "ok" | "err">("idle");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session === null) router.replace("/hub");
  }, [session, router]);

  useEffect(() => {
    if (!session?.userId) return;
    supabase
      .from("weekly_reports")
      .select("id, week_of, tasks, certified, submitted_at")
      .eq("employee_id", session.userId)
      .order("submitted_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setPastReports(data as WeeklyReport[]);
      });
  }, [session?.userId]);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  async function submitReport() {
    if (!session?.userId) return;
    if (!tasks.trim()) { setSubmitError("Please enter your completed tasks."); return; }
    if (!certified) { setSubmitError("Please check the certification box."); return; }
    setSubmitStatus("saving");
    setSubmitError("");
    const { error } = await supabase.from("weekly_reports").insert({
      employee_id: session.userId,
      week_of: weekOf,
      tasks: tasks.trim(),
      certified: true,
    });
    if (error) {
      setSubmitStatus("err");
      setSubmitError(error.message);
      return;
    }
    setSubmitStatus("ok");
    setTasks("");
    setCertified(false);
    supabase
      .from("weekly_reports")
      .select("id, week_of, tasks, certified, submitted_at")
      .eq("employee_id", session.userId)
      .order("submitted_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setPastReports(data as WeeklyReport[]); });
    setTimeout(() => setSubmitStatus("idle"), 3000);
  }

  function cancelReport() {
    setTasks("");
    setCertified(false);
    setSubmitStatus("idle");
    setSubmitError("");
  }

  async function uploadDocuments() {
    if (!session?.userId || files.length === 0) {
      setUploadError("Add at least one file to upload.");
      return;
    }
    setUploadStatus("uploading");
    setUploadError("");
    const uploaded: UploadedDoc[] = [];
    for (const file of files) {
      const path = `${session.userId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("hr-documents").upload(path, file);
      if (error) {
        setUploadStatus("err");
        setUploadError(error.message);
        return;
      }
      uploaded.push({ name: file.name, path, uploadedAt: new Date().toISOString() });
    }
    setUploadedDocs((prev) => [...uploaded, ...prev]);
    setFiles([]);
    setUploadStatus("ok");
    setTimeout(() => setUploadStatus("idle"), 3000);
  }

  if (!session) {
    return (
      <p className="text-[var(--photo-muted)] p-8" aria-live="polite">
        Loading…
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-none px-5 py-10 sm:px-6 lg:px-8 xl:px-10">

      {/* Employee header */}
      <div className="glass mb-8 rounded-2xl p-6 text-center">
        <p className="text-xl font-medium text-[var(--photo-text)]">{session.displayName}</p>
        {session.title && (
          <p className="mt-1 text-sm text-[var(--photo-muted)]">{session.title}</p>
        )}
        <p className="mt-1 text-sm text-[var(--photo-dim)]">{session.email}</p>
      </div>

      {/* 3-column portal layout */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── LEFT: Useful Links + Quick Contacts ─────────────────────── */}
        <div className="space-y-6">

          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Useful Links</h2>
            <ul className="mt-4 space-y-3">
              {USEFUL_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link-slide text-sm text-[var(--photo-muted)] hover:text-[var(--photo-text)]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Quick Contacts</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--photo-dim)] text-xs uppercase tracking-wider">Management</dt>
                <dd>
                  <a href="mailto:management@ogprocess.com" className="nav-link-slide text-[var(--photo-muted)] hover:text-[var(--photo-text)]">
                    management@ogprocess.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--photo-dim)] text-xs uppercase tracking-wider">Payroll</dt>
                <dd>
                  <a href="mailto:payroll@ogprocess.com" className="nav-link-slide text-[var(--photo-muted)] hover:text-[var(--photo-text)]">
                    payroll@ogprocess.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--photo-dim)] text-xs uppercase tracking-wider">Accounting</dt>
                <dd>
                  <a href="mailto:accounting@ogprocess.com" className="nav-link-slide text-[var(--photo-muted)] hover:text-[var(--photo-text)]">
                    accounting@ogprocess.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--photo-dim)] text-xs uppercase tracking-wider">HR / General</dt>
                <dd>
                  <a href="mailto:hr@ogprocess.com" className="nav-link-slide text-[var(--photo-muted)] hover:text-[var(--photo-text)]">
                    hr@ogprocess.com
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Safety Resources */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Safety &amp; OSHA</h2>
            <ul className="mt-4 space-y-3">
              {SAFETY_RESOURCES.map((r) => (
                <li key={r.label}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link-slide text-sm text-[var(--photo-muted)] hover:text-[var(--photo-text)]"
                  >
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Past report history */}
          {pastReports.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Past Reports</h2>
              <ul className="mt-4 space-y-3">
                {pastReports.map((r) => {
                  const isOpen = expandedReport === r.id;
                  return (
                    <li key={r.id} className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--photo-muted)]">
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-2 text-left"
                        onClick={() => setExpandedReport(isOpen ? null : r.id)}
                      >
                        <span className="font-medium text-[var(--photo-text)]">
                          Week of {r.week_of}
                          <span className="ml-2 font-normal text-[var(--color-dim)]">
                            {new Date(r.submitted_at).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="shrink-0 text-[var(--color-dim)]">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {!isOpen && (
                        <p className="mt-1 line-clamp-2 text-[var(--photo-muted)]">{r.tasks}</p>
                      )}
                      {isOpen && (
                        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[var(--photo-muted)]">{r.tasks}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* ── MIDDLE: Weekly Report + Document Upload ───────────────────── */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Weekly Report</h2>

          <div className="mt-5">
            <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="week-of">
              Week of
            </label>
            <input
              id="week-of"
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(8,7,6,0.65)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[rgba(255,255,255,0.22)] focus:ring-2 focus:ring-[rgba(90,122,90,0.35)]"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="weekly-tasks">
              Completed tasks &amp; documents
            </label>
            <p className="mt-1 text-xs text-[var(--photo-dim)]">
              Enter your completed tasks and documents for the past week
            </p>
            <textarea
              id="weekly-tasks"
              value={tasks}
              onChange={(e) => setTasks(e.target.value.slice(0, 1000))}
              rows={8}
              maxLength={1000}
              placeholder="e.g. Completed P&ID review for Unit 3, submitted HSE report, attended site walk..."
              className="mt-2 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[rgba(8,7,6,0.65)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-dim)] focus:border-[rgba(255,255,255,0.22)] focus:ring-2 focus:ring-[rgba(90,122,90,0.35)]"
            />
            <p className="mt-1 text-right text-xs text-[var(--photo-dim)]">{tasks.length}/1000</p>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            <span className="text-sm text-[var(--photo-muted)]">
              I hereby certify this information is correct.
            </span>
          </label>

          {submitError && (
            <p className="mt-3 text-xs text-[#c9a8a8]" role="alert">{submitError}</p>
          )}
          {submitStatus === "ok" && (
            <p className="mt-3 text-xs text-[#a8c9a8]" role="status">Report submitted successfully.</p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={submitReport}
              disabled={submitStatus === "saving"}
              className="btn-pill btn-pill--accent text-xs disabled:opacity-60"
            >
              {submitStatus === "saving" ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={cancelReport}
              className="btn-pill btn-pill--outline text-xs"
            >
              Cancel
            </button>
          </div>

          {/* Document Upload */}
          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h3 className="font-display text-base font-light text-[var(--photo-text)]">Upload Documents to HR</h3>
            <p className="mt-1 text-xs text-[var(--photo-dim)]">
              Certifications, credentials, onboarding documents, or any HR paperwork.
            </p>
            <label
              htmlFor="hub-doc-files"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[rgba(6,5,4,0.35)] px-4 py-6 hover:border-[rgba(255,255,255,0.2)]"
            >
              <span className="text-sm font-medium text-[var(--color-text)]">Drop files or browse</span>
              <span className="mt-1 text-xs text-[var(--color-dim)]">PDF, DOC, DOCX accepted</span>
              <input
                id="hub-doc-files"
                ref={fileInputRef}
                type="file"
                className="sr-only"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>

            {files.length > 0 && (
              <ul className="mt-3 space-y-1">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="shrink-0 text-[var(--photo-label)] hover:text-[var(--photo-text)]"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {uploadError && <p className="mt-2 text-xs text-[#c9a8a8]">{uploadError}</p>}
            {uploadStatus === "ok" && <p className="mt-2 text-xs text-[#a8c9a8]">Files uploaded to HR successfully.</p>}

            <button
              type="button"
              onClick={uploadDocuments}
              disabled={uploadStatus === "uploading"}
              className="btn-pill btn-pill--accent mt-3 text-xs disabled:opacity-60"
            >
              {uploadStatus === "uploading" ? "Uploading…" : "Submit to HR"}
            </button>

            {uploadedDocs.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3">
                {uploadedDocs.map((d, i) => (
                  <li key={`${d.name}-${i}`} className="text-xs text-[var(--color-muted)]">
                    {d.name}{" "}
                    <span className="text-[var(--color-dim)]">— {new Date(d.uploadedAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── RIGHT: Labor Law Posters + Payroll + Training ─────────────── */}
        <div className="space-y-6">

          {/* Labor Law Posters */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Labor Law Posters</h2>
            <p className="mt-2 text-xs text-[var(--photo-dim)]">
              Required federal &amp; Texas state postings. Click to view or download the official PDF from the issuing agency.
            </p>

            <div className="mt-4">
              <p className="font-mono-label text-[var(--color-dim)] mb-2">Federal</p>
              <ul className="space-y-2">
                {LABOR_LAW_POSTERS.filter(p => p.tag === "Federal").map((p) => (
                  <li key={p.label}>
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[rgba(6,5,4,0.35)] px-3 py-2 text-xs text-[var(--photo-muted)] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:text-[var(--photo-text)]"
                    >
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent-lt)] border border-[rgba(90,122,90,0.4)]">PDF</span>
                      {p.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <p className="font-mono-label text-[var(--color-dim)] mb-2">Texas State</p>
              <ul className="space-y-2">
                {LABOR_LAW_POSTERS.filter(p => p.tag === "Texas").map((p) => (
                  <li key={p.label}>
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[rgba(6,5,4,0.35)] px-3 py-2 text-xs text-[var(--photo-muted)] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:text-[var(--photo-text)]"
                    >
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent-lt)] border border-[rgba(90,122,90,0.4)]">PDF</span>
                      {p.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payroll Portal */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Payroll Portal</h2>
            <p className="mt-3 text-sm text-[var(--photo-muted)]">
              Access your payroll information to view and download pay stubs, verify and update personal information including direct deposit and W-4 information.
            </p>
            <a
              href={PAYROLL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill--outline mt-5 inline-flex text-xs"
            >
              Go to Payroll (ADP)
            </a>
          </div>

          {/* Training Videos / OSHA */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-light text-[var(--photo-text)]">Training &amp; Compliance</h2>
            <p className="mt-3 text-sm text-[var(--photo-muted)]">
              OSHA General Industry outreach training (10-hr / 30-hr) for process engineering and oil &amp; gas operations.
            </p>
            <a
              href={TRAINING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill--outline mt-5 inline-flex text-xs"
            >
              OSHA Training Programs
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
