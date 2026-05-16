import { useState } from "react";
import { LockIcon } from "../icons/SystemIcons";
import { useNavigate } from 'react-router-dom';

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
  
  // Stany potrzebne do obsługi wyników
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  // Funkcja pobierająca wyniki z backendu
  const handleToggleResults = async () => {
    // Jeśli wyniki są już otwarte, to po prostu je zwiń
    if (showResults) {
      setShowResults(false);
      return;
    }

    // Rozwiń sekcję wyników
    setShowResults(true);

    // Jeśli już raz pobraliśmy dane z bazy dla tej karty, nie róbmy tego drugi raz
    if (!resultsData) {
      setIsLoadingResults(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8005/results/${election.id}`);
        if (!response.ok) {
          throw new Error("Nie udało się pobrać wyników");
        }
        const data = await response.json();
        setResultsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingResults(false);
      }
    }
  };

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

      {/* ROZWIJANA SEKCJA WYNIKÓW */}
      {showResults && (
        <div className="mt-6 bg-slate-50 rounded-lg p-5 border border-slate-200 animate-fade-in-up">
          <h3 className="text-lg font-bold text-slate-800 mb-3">Wyniki głosowania</h3>
          
          {isLoadingResults ? (
            <p className="text-slate-500">Ładowanie i zliczanie sekretów...</p>
          ) : error ? (
            <p className="text-red-500 font-medium">Błąd: {error}</p>
          ) : resultsData ? (
            <div>
              <div className="mb-4 flex gap-4 text-sm font-medium text-slate-600">
                <span className="bg-white px-3 py-1 rounded shadow-sm border border-slate-100">Wszystkich głosów: {resultsData.totalVotes}</span>
                <span className="bg-white px-3 py-1 rounded shadow-sm border border-slate-100 text-red-500">Nieważne: {resultsData.invalidVotes}</span>
              </div>
              
              <ul className="space-y-2">
                {resultsData.results.map((candidate, index) => (
                  <li key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="font-medium text-slate-700">{candidate.firstName} {candidate.lastName}</span>
                    <span className="font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
                      {candidate.votes} {candidate.votes === 1 ? 'głos' : candidate.votes > 1 && candidate.votes < 5 ? 'głosy' : 'głosów'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <LockIcon className="h-4 w-4" />
          <span>Szyfrowanie End-to-End</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* NOWY PRZYCISK DO WYNIKÓW */}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold uppercase tracking-wide transition bg-slate-100 text-slate-700 hover:bg-slate-200"
            onClick={handleToggleResults}
          >
            {showResults ? "Ukryj wyniki" : "Zobacz wyniki"}
          </button>

          {/* STARY PRZYCISK DO GŁOSOWANIA */}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold uppercase tracking-wide transition bg-brand-700 text-white hover:bg-brand-800"
            onClick={() => navigate(`/election/${election.id}`)}
          >
            Przejdź do karty
            <span>&#8594;</span>
          </button>
        </div>
      </div>
    </article>
  );
}