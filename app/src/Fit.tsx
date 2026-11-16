import type { FitCheck, Job } from "./api";
import { fitSummary } from "./format";

/** The match as a ring, like a progress circle */
export function Ring({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 70 ? "var(--good)" : score >= 45 ? "var(--fair)" : "var(--poor)";
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${score}% compatible`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.27} fontWeight={700} fill="currentColor">
        {score}%
      </text>
    </svg>
  );
}

function Mark({ ok }: { ok: boolean | null }) {
  if (ok === true)
    return (
      <span className="mark yes" aria-label="Cumple">
        ✓
      </span>
    );
  if (ok === false)
    return (
      <span className="mark no" aria-label="No cumple">
        ✕
      </span>
    );
  return <span className="mark part" aria-label="En parte o sin datos" />;
}

/** The card in a job's detail that opens the full breakdown */
export function FitCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  if (job.match == null) return null;
  return (
    <button className="fit-card" onClick={onOpen}>
      <Ring score={job.match} size={60} />
      <span className="fit-card-text">
        <b>{job.match}% compatible</b>
        <span>{fitSummary(job.match)}</span>
      </span>
      <span className="chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}

/** Each criterion with ✓ / ✕ / ○, and the skills that match and don't */
export function FitDetail({ job }: { job: Job }) {
  if (job.match == null) return <p className="muted">Esta oferta no tiene compatibilidad calculada.</p>;
  const { have, missing, checks = [], title_only } = job.match_detail;
  return (
    <div className="fit-detail">
      <div className="fit-head">
        <Ring score={job.match} size={96} />
        <p className="muted">{fitSummary(job.match)}</p>
        <h2>{job.title}</h2>
        {title_only && <p className="muted small">Calculada solo con el título: la oferta no trae descripción.</p>}
      </div>
      <ul className="checks">
        {checks.map((c: FitCheck) => (
          <li key={c.key}>
            <Mark ok={c.ok} />
            <div>
              <span className="muted">{c.label}</span>
              <b>{c.detail}</b>
              {c.key === "skills" && (have.length > 0 || missing.length > 0) && (
                <>
                  {have.length > 0 && (
                    <>
                      <span className="muted small sub">
                        Conocimientos: {have.length} coincide{have.length === 1 ? "" : "n"}
                      </span>
                      <div className="pills">
                        {have.map((s) => (
                          <span key={s} className="pill yes">
                            {s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {missing.length > 0 && (
                    <>
                      <span className="muted small sub">
                        Conocimientos: {missing.length} no coincide{missing.length === 1 ? "" : "n"}
                      </span>
                      <div className="pills">
                        {missing.map((s) => (
                          <span key={s} className="pill">
                            {s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small">Mantén tu perfil y tu CV al día (pestaña Perfil) para que la compatibilidad sea lo más precisa posible.</p>
    </div>
  );
}
