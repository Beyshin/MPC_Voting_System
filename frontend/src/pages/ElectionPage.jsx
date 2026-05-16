import { useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import {useAuth} from "../context/AuthContext.jsx";

export default function ElectionPage() {
    const location = useLocation();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [election, setElection] = useState(location.state ?? null);
    const [selected, setSelected] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingElection, setIsLoadingElection] = useState(false);
    const [loadingError, setLoadingError] = useState(null);
    const {user} = useAuth();

    const electionId = location.state?.id ?? id ?? searchParams.get("id");

    useEffect(() => {
    if (!electionId) return;

    // Sprawdzamy, czy mamy już dane (albo z nawigacji, albo już pobrane w stanie)
    const hasData = election && Array.isArray(election.candidates) && election.candidates.length > 0;

    if (hasData || (location.state && !hasData)) {
        return;
    }

    const loadElection = async () => {
        setIsLoadingElection(true);
        try {
            const response = await fetch(`http://localhost:8005/elections/${electionId}`);
            if (!response.ok) throw new Error("Nie można pobrać danych wyborów");
            const data = await response.json();
            setElection(data);
        } catch (err) {
            console.error(err);
            setLoadingError(err.message);
        } finally {
            setIsLoadingElection(false);
        }
    };

    loadElection();
}, [electionId, location.state]);

    const sendVote = async() => {
        if (selected === null) {
            alert("Proszę wybrać kandydata");
            return;
        }

        setIsLoading(true);
        try {
            const candidate = election.candidates.find(c => c.id === selected);
            if (!candidate) {
                throw new Error("Nie znaleziono wybranego kandydata");
            }

            const candidatePrime = Number(candidate.pValue ?? candidate.p_value ?? selected);
            if (!Number.isInteger(candidatePrime) || candidatePrime <= 0) {
                throw new Error("Nieprawidłowa wartość liczby pierwszej kandydata");
            }

            console.log(`Wysyłanie głosu na kandydata: ${selected}, prime: ${candidatePrime}`);

            // Obliczamy fragmenty
            const fragments = [];
            const first = Math.floor(Math.random() * (candidatePrime - 2)) + 1;
            const second = Math.floor(Math.random() * (candidatePrime - 1 - first)) + 1;
            const third = candidatePrime - first - second;
            fragments.push(first, second, third);

            const currentUserId = user.id;

            for (let i = 0; i < fragments.length; i++) {
                const payload = {
                    votingId: election.id,
                    userId: currentUserId,
                    value: fragments[i],

                    candidateId: candidate.id,
                    primeValue: candidatePrime
                };

                const response = await fetch(`http://localhost:800${i}/vote`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    console.log(`Server ${i + 1} (port 800${i}) przyjął fragment ${payload.value}`);
                } else {
                    console.error(`Błąd na serwerze ${i + 1}`);
                }
            }

            alert("Głos został pomyślnie oddany!");
            setSelected(null);
        } catch (err) {
            console.error("Błąd przy wysyłaniu głosu:", err);
            alert("Błąd przy wysyłaniu głosu: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoadingElection) {
        return (
            <Layout title="Ładowanie wyborów...">
                <div className="rounded-xl border bg-white p-5 shadow-card sm:p-6 border-l-4">
                    <p>Ładowanie danych wyborów...</p>
                </div>
            </Layout>
        );
    }

    if (loadingError) {
        return (
            <Layout title="Błąd">
                <div className="rounded-xl border bg-white p-5 shadow-card sm:p-6 border-l-4">
                    <p className="text-red-600">Błąd: {loadingError}</p>
                </div>
            </Layout>
        );
    }

    if (!election) {
        return (
            <Layout title="Brak wyboru">
                <div className="rounded-xl border bg-white p-5 shadow-card sm:p-6 border-l-4">
                    <p>Nie znaleziono danych wyboru. Proszę wrócić do listy wyborów.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={election.title}>
            <div className="animate-fade-in-up mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-lg sm:p-8 border-t-4 border-t-brand-500">

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Karta do głosowania</h2>
                    <p className="mt-1 text-sm text-gray-500">Wybierz jednego kandydata z poniższej listy, a następnie oddaj swój głos.</p>
                </div>

                <div className="space-y-3">
                    {election.candidates.map((candidate) => {
                        const isSelected = selected === candidate.id;

                        return (
                            <label
                                key={candidate.id}
                                className={`flex cursor-pointer items-center rounded-xl border p-4 transition-all duration-200 ${
                                    isSelected
                                        ? "border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-500"
                                        : "border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={election.id}
                                    id={candidate.id}
                                    value={candidate.id}
                                    checked={isSelected}
                                    onChange={() => setSelected(candidate.id)}
                                    className="h-5 w-5 cursor-pointer border-gray-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
                                />
                                <span className="ml-4 flex flex-col">
                           <span className={`text-base font-medium ${isSelected ? "text-brand-900" : "text-gray-900"}`}>
                               {candidate.firstName} {candidate.lastName}
                           </span>
                       </span>
                            </label>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={sendVote}
                        // Przycisk jest wyłączony podczas ładowania LUB jeśli nie wybrano kandydata
                        disabled={isLoading || !selected}
                        className={`inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 
               ${isLoading || !selected
                            ? "bg-gray-300 cursor-not-allowed opacity-70"
                            : "bg-brand-600 hover:bg-brand-700 hover:shadow-md active:translate-y-px"
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Wysyłanie...
                            </>
                        ) : (
                            "Oddaj głos"
                        )}
                    </button>
                </div>
            </div>
        </Layout>
    );
}
