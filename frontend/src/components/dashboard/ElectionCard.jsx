import { LockIcon } from "../icons/SystemIcons";
import {useNavigate} from 'react-router-dom'

function StatusBadge({ status }) {
  return (
    <div className="rounded-lg bg-slate-50 px-5 py-3 text-right">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Status
      </p>
      <p className="text-lg font-semibold text-slate-800">{status}</p>
    </div>
  );
}

export default function ElectionCard({ election, isPrimary = false }) {
    const navigate = useNavigate();

  return (
    <article className="election-card animate-fade-in-up rounded-xl border bg-white p-5 shadow-card sm:p-6 border-l-4 border-l-brand-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <span className="text-brand-700">{election.level}</span>
            <span aria-hidden="true">&#9679;</span>
            <span>{election.dateRange}</span>
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">
            {election.title}
          </h2>
        </div>

        <StatusBadge status={election.status} />
      </div>

      {election.description ? (
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-500">
          {election.description}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <LockIcon className="h-4 w-4" />
          <span>Szyfrowanie End-to-End</span>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold uppercase tracking-wide transition bg-brand-700 text-white hover:bg-brand-800"
          onClick={() => navigate("/election", {state: election})}
        >
          Przejdź do karty głosowania
          <span>&#8594;</span>
        </button>
      </div>
    </article>
  );
}
