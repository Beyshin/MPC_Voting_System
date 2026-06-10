import { SupportIcon } from "../icons/SystemIcons";
import {useEffect, useRef, useState} from "react";

export default function HealthPanel({ systemHealth }) {

  //Referencja do timera interwałów, leci okreslony czaspotem reset do 0 i znowu
  const ref = useRef(null);

  //State na serwerowe node'y zeby updateowac status i styl na bazie requesta
  const [nodes, setNodes] = useState(systemHealth.nodes);


  // Asynchroniczna metoda do sprawdzania serwer po serwerze endpointa /health
  // health zwraca tylko 200 jak działa
  const checkHealth = async () => {
    for(let i = 0; i < 3; i++) {
      try{
        //Request port po porcie 8000, 8001, 8002
        const request = await fetch(`https://mpc.alexandria-pcz.com/node${i+1}/health`, {
          method: "GET",
        });

        //Jak działa serwer update state = "OK"
        if (request.status === 200) {
          console.log(`Server ${i+1} działa, super`);
          systemHealth.nodes[i].state = "OK";
        }
      }catch(error){
        //Jak nie działa (Network error) to state = "ERROR"
        console.log(`Server ${i+1} nie działa, niedobrze`);
        systemHealth.nodes[i].state = "ERROR";
      }finally {
        //finalny update stanu node'ów
        setNodes([...systemHealth.nodes]);
      }
    }
  }

  useEffect(() => {
    checkHealth();
    ref.current = setInterval(checkHealth,5 * 1000 * 60);

    return () => {
      if(ref.current) {
        clearInterval(ref.current);
      }
    }

  }, [])


  return (
    <aside className="space-y-4 animate-fade-in-up animation-delay-200">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <h3 className="text-sm font-bold pb-4 uppercase tracking-widest text-slate-800">
          Status Systemu MPC
        </h3>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Aktywne Wezly Obliczeniowe
          </p>
          <ul className="space-y-2">
            {nodes.map((node) => (
              <li
                key={node.id}
                className="flex items-center justify-between text-sm font-medium text-slate-700"
              >
                <span>{node.name}</span>
                <span
                  className={
                    node.state === "OK"
                      ? "inline-flex items-center gap-1 text-emerald-600"
                      : "inline-flex items-center gap-1 text-rose-600"
                  }
                >
                  <span
                    className={
                      node.state === "OK"
                        ? "h-2 w-2 rounded-full bg-emerald-500"
                        : "h-2 w-2 rounded-full bg-rose-500"
                    }
                  />
                  {node.state}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </section>

    </aside>
  );
}
