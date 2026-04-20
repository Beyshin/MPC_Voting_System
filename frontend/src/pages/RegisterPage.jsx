import {useNavigate} from "react-router-dom";
import {useState} from "react";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [checkPassword, setCheckPassword] = useState("");
    const [email, setEmail] = useState("");

    const registerUser = (e) => {
        e.preventDefault();
            if(password === checkPassword) {
                const req = fetch("http://localhost:8005/registerUser", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        mail: email,
                        login: login,
                        password: password,
                    })
                }).then((res) => {
                    if(res.status === 200){
                        navigate("/login");
                    }
                })
            }else{
                console.log("Hasla sie nie zgadzaja")
            }
        }


    return (
        <>
            <div className="flex min-h-screen bg-sand font-sans text-ink animate-fade-in-up">

                <form className="flex flex-col justify-center w-full max-w-md p-8 m-auto bg-white shadow-xl lg:w-1/2 lg:rounded-r-2xl border border-clay/30"
                    onSubmit={registerUser}>


                    <div className="mb-6">
                        <h1 className="mb-2 text-3xl font-bold font-display text-ink">Głosuj!</h1>
                        <p className="mb-6 text-sm opacity-75">Utwórz konto, aby głosować.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-ink">Login</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Login"
                                    className="w-full px-4 py-2 bg-transparent border rounded-md border-clay focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    onChange = {(e) => {
                                        setLogin(e.target.value);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-ink">Adres e-mail</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="jan@kowalski.pl"
                                    className="w-full px-4 py-2 bg-transparent border rounded-md border-clay focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    onChange = {(e) => {
                                        setEmail(e.target.value);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-ink">Hasło</label>
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 bg-transparent border rounded-md border-clay focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                        onChange = {(e) => {
                                            setPassword(e.target.value);
                                            }
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-ink">Powtórz hasło</label>
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 bg-transparent border rounded-md border-clay focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                        onChange = {(e) => {
                                            setCheckPassword(e.target.value);
                                        }
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-start mt-2">
                                <div className="flex items-center h-5">
                                    <input
                                        required
                                        id="terms"
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-clay text-brand-600 focus:ring-brand-500"
                                    />
                                </div>
                                <label htmlFor="terms" className="ml-2 text-sm opacity-80">
                                    Akceptuję <a href="#" className="font-medium text-brand-600 hover:text-brand-800 hover:underline">Regulamin</a> oraz <a href="#" className="font-medium text-brand-600 hover:text-brand-800 hover:underline">Politykę Prywatności</a>.
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full px-4 py-2 font-semibold text-white transition-colors
                         rounded-md bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2
                         focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-sand"

                    >
                        Zarejestruj się
                    </button>

                    <p className="mt-6 text-sm text-center opacity-80">
                        Masz już konto? <a href="#" className="font-medium transition-colors text-brand-600 hover:text-brand-800 hover:underline" onClick={() => navigate('/login')} >Zaloguj się</a>
                    </p>
                </form>

                <div className="hidden relative overflow-hidden lg:flex lg:w-1/2 bg-brand-800 items-center justify-center">

                    <div className="relative z-10 p-12 text-center text-white">
                        <h2 className="mb-4 text-4xl font-bold leading-tight font-display text-brand-50">
                            Głosowanie MPC
                        </h2>
                        <p className="text-lg text-brand-200">
                            Haszujemy 2543534 razy.
                        </p>
                    </div>


                    <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-brand-600 mix-blend-multiply filter blur-3xl opacity-50"></div>
                    <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-brand-900 mix-blend-multiply filter blur-3xl opacity-70"></div>
                </div>

            </div>
        </>
    );
}