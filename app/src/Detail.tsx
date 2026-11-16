import { useEffect, useState, type ReactNode } from "react";
import type { Job } from "./api";
import { useApp } from "./context";
import { ago, conditions, longDate, salary } from "./format";
import { BackIcon, ExternalIcon } from "./icons";
import { FitCard, FitDetail } from "./Fit";
import { Logo, SaveButton } from "./JobCard";
import { openExternal, shareLink } from "./platform";

/** Descriptions come as markdown with a blank line after every line: tighten them */
function tidy(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\\([<>*_#\-+.!\[\]()`])/g, "$1")
    .replace(/\n[ \t]*\n(?=[^\n])/g, "\n")
    .trim();
}

function Row({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <li>
      <span className="row-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

function modality(job: Job): string | null {
  if (job.work_from_home_type) return job.work_from_home_type;
  return job.is_remote ? "Teletrabajo" : null;
}

export function Detail({ job: summary, onBack }: { job: Job; onBack: () => void }) {
  const { api, change, changed } = useApp();
  const [full, setFull] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState(summary.note ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [showFit, setShowFit] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .job(summary.id)
      .then((j) => {
        if (!alive) return;
        setFull(j);
        setNote(j.note ?? "");
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [api, summary.id]);

  // the freshest state: a change made here or elsewhere, over what the server sent
  const job: Job = { ...summary, ...(full ?? {}), ...(changed[summary.id] ?? {}), description: full?.description };

  const saveNote = async () => {
    setSavingNote(true);
    await change(job, { note: note.trim() || null });
    setSavingNote(false);
  };

  if (showFit) {
    return (
      <div className="page detail">
        <header className="top-bar">
          <button className="icon-btn" onClick={() => setShowFit(false)} aria-label="Volver">
            <BackIcon />
          </button>
          <span className="top-title">Compatibilidad con la oferta</span>
        </header>
        <div className="page-body">
          <FitDetail job={job} />
        </div>
      </div>
    );
  }

  const pay = salary(job.salary);
  const posted = longDate(job.date_posted);
  const site = job.site ?? "la web";
  return (
    <div className="page detail">
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack} aria-label="Volver">
          <BackIcon />
        </button>
        <span className="top-title">Detalle de la oferta</span>
        <SaveButton job={job} />
        <button className="icon-btn" onClick={() => void shareLink(job.title, job.job_url)} aria-label="Compartir">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
          </svg>
        </button>
      </header>
      <div className="page-body">
        <h1 className="detail-title">{job.title}</h1>

        <div className="company-row">
          <Logo job={job} size={64} />
          <div>
            {job.company &&
              (job.company_url ? (
                <button className="text-btn company-link" onClick={() => openExternal(job.company_url!)}>
                  {job.company}
                </button>
              ) : (
                <b className="company big">{job.company}</b>
              ))}
            {job.applied_at && <span className="tag applied">✓ Aplicada {ago(job.applied_at)}</span>}
          </div>
        </div>

        <ul className="info-rows">
          <Row icon="📍">{job.location ?? "Ubicación sin indicar"}</Row>
          {modality(job) && <Row icon="🏠">{modality(job)}</Row>}
          <Row icon="💶">{pay ? <span className="pay">{pay}</span> : <span className="muted">Salario no disponible</span>}</Row>
          {conditions(job) && <Row icon="📄">{conditions(job)}</Row>}
        </ul>

        <p className="muted small posted">
          {posted ? `Publicada el ${posted} (${ago(job.date_posted)})` : "Fecha de publicación no disponible"}
          {` · en ${site}`}
          {job.search ? ` · búsqueda «${job.search}»` : ""}
        </p>

        <FitCard job={job} onOpen={() => setShowFit(true)} />

        <div className="detail-actions">
          <button className={job.applied_at ? "on" : ""} onClick={() => void change(job, { applied: !job.applied_at })}>
            {job.applied_at ? "✓ Aplicada" : "Marcar como aplicada"}
          </button>
          <button className={job.hidden_at ? "on" : ""} onClick={() => void change(job, { hidden: !job.hidden_at })}>
            {job.hidden_at ? "Recuperar" : "Descartar"}
          </button>
        </div>

        <section className="panel">
          <h2>Descripción</h2>
          {!full && !error && <p className="muted">Cargando…</p>}
          {error && <p className="error">{error}</p>}
          {full &&
            (full.description ? (
              <div className="description">{tidy(full.description)}</div>
            ) : (
              <p className="muted">Esta oferta no trae descripción. Ábrela en {site}.</p>
            ))}
        </section>

        <section className="panel">
          <h2>Mis notas</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej.: llamar el lunes, pedir rango salarial…"
            rows={3}
            maxLength={2000}
          />
          <button className="primary" disabled={savingNote || note.trim() === (job.note ?? "")} onClick={() => void saveNote()}>
            {savingNote ? "Guardando…" : "Guardar nota"}
          </button>
        </section>

        <button className="wide text-btn" onClick={() => openExternal(job.job_url)}>
          <ExternalIcon size={16} /> Abrir en {site}
        </button>
      </div>
      <div className="cta">
        <button className="primary" onClick={() => openExternal(job.job_url)}>
          {job.site === "infojobs" ? "Inscribirme en InfoJobs" : `Inscribirme en ${site}`}
        </button>
      </div>
    </div>
  );
}
