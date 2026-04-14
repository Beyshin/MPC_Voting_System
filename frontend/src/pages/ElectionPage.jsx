import HealthPanel from "../components/dashboard/HealthPanel";
import Sidebar from "../components/layout/Sidebar";
import {
    navigationItems,
    systemHealth,
} from "../data/dashboardData";
import {useLocation} from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import {useState} from "react";

export default function ElectionPage() {
    const location = useLocation();
    const election = location.state;
    const [selected, setSelected] = useState(null);


    const sendVote = async() =>{
        for(let i = 0; i<3; i++){
            const response = await fetch(`http://localhost:800${i}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    votingId: election.id,
                    candidateId: selected.id
                })
            })

            if(response.ok){
                console.log(`Server ${i+1} zwrocił odpowiedz`);
            }
        }

        console.log(election.id, selected.id)
    }

    return (
       <Layout title={election.title}>
          <div className="animate-fade-in-up rounded-xl border bg-white p-5 shadow-card sm:p-6 border-l-4">
              {election.candidates.map((candidate) => (
                  <div className="flex-col">
                      <label className="p-3" key={candidate.id} htmlFor={candidate.id}>{candidate.firstName + " " + candidate.lastName}</label>
                      <input type="checkbox" checked={selected?.id === candidate.id} name={election.id} id={candidate.id} value={candidate.id} onChange={e => setSelected(candidate)} />
                  </div>
              ))}
              <button type="button" onClick={sendVote}>
                  ZAGŁOSUJ
              </button>
          </div>
       </Layout>
    );
}
