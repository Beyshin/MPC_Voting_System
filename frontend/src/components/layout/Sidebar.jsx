import {
  BallotIcon,
  HomeIcon,
  ShieldIcon,
  VerifyIcon,
} from "../icons/SystemIcons";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../context/AuthContext.jsx";

const navIconMap = {
  dashboard: HomeIcon,
  voting: BallotIcon,
  verification: VerifyIcon,
  results: BallotIcon,
};

export default function Sidebar({ items }) {
    const navigate = useNavigate();
    const {user, setUser} = useAuth();

    const logout = async () =>{
        try {
             await fetch("http://localhost:8005/logout", {
                method: "POST",
                credentials: "include"
            });

            if (user) {
                setUser(null);
            }
        }catch(err){
            console.log("Błąd podczas wylogowywania: " + err)
        }
    }

  return (
    <aside className="panel-border relative flex min-h-screen flex-col overflow-hidden rounded-r-2xl bg-white/90 px-5 py-7 backdrop-blur">
      <div
        className="absolute -top-20 right-4 h-40 w-40 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3 border-b border-slate-200/70 pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white shadow-soft">
          <ShieldIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            System MPC
          </p>
          <p className="text-xs font-medium text-slate-500">
            USER-ID: 69DA-1337
          </p>
        </div>
      </div>

      <nav className="relative mt-6 flex flex-col gap-2">
        {items.map((item) => {
          const Icon = navIconMap[item.id] ?? HomeIcon;

          return (
            <button
              key={item.id}
              type="button"
              className={`group flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition ${
                item.isActive
                  ? "border-brand-200 bg-brand-50 text-brand-800"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100/70 hover:text-slate-700"
              }`}
              onClick={() => {
                  if(item.path) {
                      item.isActive = true;
                      navigate(item.path);
                  }
              }}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="relative mt-auto space-y-3 border-t border-slate-200/80 pt-8">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
        >
          <span onClick={logout}>Wyloguj sesje</span>
        </button>
      </div>
    </aside>
  );
}
