import {useNavigate} from "react-router-dom";
import {useCallback, useState} from "react";

export default function LoginPage() {
    const navigate = useNavigate();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const loginUser =  (e) => {
        e.preventDefault();
        try{
            const req = fetch("http://localhost:8005/loginUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    login: login,
                    password: password
                })
            }).then(async res => {
                if(res.status === 200) {
                    const payload = await res.json();
                    console.log(payload.user_id);
                    navigate("/" )
                }else{
                    console.log(res.status);
                }
            })

        }catch(err){
            console.log(err);
        }
    }

    return (
        <>
            <div className="flex min-h-screen bg-sand font-sans text-ink animate-fade-in-up">
                <form className="flex flex-col justify-center w-full max-w-md p-8 m-auto bg-white shadow-xl lg:w-1/2 lg:rounded-r-2xl border border-clay/30"
                    onSubmit={loginUser}
                >

                    <div className="mb-6">
                        <h1 className="mb-2 text-3xl font-bold font-display text-ink">Witaj ponownie!</h1>
                        <p className="mb-8 text-sm opacity-75">Zaloguj się, aby uzyskać dostęp do swojego konta.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-ink">Login</label>
                                <input
                                    type="text"
                                    placeholder="login"
                                    className="w-full px-4 py-2 bg-transparent border rounded-md border-clay focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    onChange={(e) => setLogin(e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between">
                                    <label className="block mb-1 text-sm font-medium text-ink">Hasło</label>
                                    <a href="#" className="text-sm font-medium transition-colors text-brand-600 hover:text-brand-800 hover:underline">
                                        Zapomniałeś hasła?
                                    </a>
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2 bg-transparent border rounded-md border-clay focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="w-full px-4 py-2 font-semibold text-white transition-colors rounded-md bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-sand">
                        Zaloguj się
                    </button>

                    <p className="mt-6 text-sm text-center opacity-80">
                        Nie masz jeszcze konta? <a href="#" className="font-medium transition-colors text-brand-600 hover:text-brand-800 hover:underline" onClick={() => navigate("/register")}>Zarejestruj się</a>
                    </p>
                </form>

                <div className="hidden relative overflow-hidden lg:flex lg:w-1/2 bg-brand-800 items-center justify-center">

                    <div className="relative z-10 p-12 text-center text-white">
                        <h2 className="mb-4 text-4xl font-bold leading-tight font-display text-brand-50">
                            Zacznij głosować już dziś.
                        </h2>
                        <p className="text-lg text-brand-200">
                            Zaloguj się do panelu i zyskaj dostęp do bezpiecznych, anonimowych głosowań online.
                        </p>
                    </div>

                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand-600 mix-blend-multiply filter blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-900 mix-blend-multiply filter blur-3xl opacity-80"></div>
                </div>

            </div>
        </>
    );
}