import { useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";

export default function ElectionPage() {
    const location = useLocation();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [election, setElection] = useState(location.state ?? null);
    const [selected, setSelected] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingElection, setIsLoadingElection] = useState(false);
    const [loadingError, setLoadingError] = useState(null);

    const electionId = location.state?.id ?? id ?? searchParams.get("id");

    useEffect(() => {
    if (!electionId) return;

    // Sprawdzamy, czy mamy już dane (albo z nawigacji, albo już pobrane w stanie)
    const hasData = election && Array.isArray(election.candidates) && election.candidates.length > 0;
    
    // Pobieramy tylko jeśli:
    // 1. Nie mamy danych w stanie 'election' 
    // 2. ORAZ nie otrzymaliśmy ich w 'location.state'
    if (hasData || (location.state && !hasData)) {
        // Jeśli mamy dane z dowolnego źródła, nie robimy fetcha
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
    // USUNĄŁEM 'election' z poniższej tablicy
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

            const candidatePrime = Number(candidate.primeValue ?? candidate.p_value ?? selected);
            if (!Number.isInteger(candidatePrime) || candidatePrime <= 0) {
                throw new Error("Nieprawidłowa wartość liczby pierwszej kandydata");
            }

            console.log(`Wysyłanie głosu na kandydata: ${selected}, prime: ${candidatePrime}`);

            const fragments = [];
            const first = Math.floor(Math.random() * (candidatePrime - 2)) + 1;
            const second = Math.floor(Math.random() * (candidatePrime - 1 - first)) + 1;
            const third = candidatePrime - first - second;
            fragments.push(first, second, third);

            for (let i = 0; i < fragments.length; i++) {
                const payload = {
                    votingId: election.id,
                    candidate_val: fragments[i],
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
                    console.log(`Server ${i + 1} (port 800${i}) przyjął fragment ${payload.candidate_val}`);
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
          <div className="animate-fade-in-up rounded-xl border bg-white p-5 shadow-card sm:p-6 border-l-4">
              <p className="mb-4 text-sm text-gray-600">Wybierz kandydata:</p>
              {election.candidates.map((candidate, idx) => (
                  <div key={candidate.id} className="mb-3 flex items-center">
                      <input 
                          type="radio" 
                          checked={selected === candidate.id} 
                          name={election.id} 
                          id={candidate.id} 
                          value={candidate.id} 
                          onChange={() => setSelected(candidate.id)}
                          className="cursor-pointer"
                      />
                      <label htmlFor={candidate.id} className="ml-3 cursor-pointer p-2">
                          {candidate.firstName} {candidate.lastName}
                      </label>
                  </div>
              ))}
              <button 
                  type="button" 
                  onClick={sendVote}
                  disabled={isLoading}
                  className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isLoading ? "Wysyłanie..." : "ZAGŁOSUJ"}
              </button>
          </div>
       </Layout>
    );
}
