import { useEffect, useState } from "react";
import ElectionCard from "../components/dashboard/ElectionCard";
import Layout from "../components/layout/Layout.jsx";

export default function DashboardPage() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadElections = async () => {
        try {
            const response = await fetch("http://localhost:8005/elections");
            if (!response.ok) {
                throw new Error("Błąd przy pobieraniu wyborów");
            }
            const data = await response.json();
            setElections(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {

        loadElections();
    }, []);




    return (
        <Layout title="Aktywne głosowania">
            {loading ? (
                <p>Ładowanie wyborów...</p>
            ) : error ? (
                <p className="text-red-600">Błąd: {error}</p>
            ) : elections.length === 0 ? (
                <p>Brak dostępnych wyborów.</p>
            ) : (
                elections.map((election) => (
                    <ElectionCard key={election.id} election={election} callback={loadElections} />
                ))
            )}
        </Layout>
    );
}
