
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginService } from "@services/auth.service.js";
import { DULoginCard } from "../components/Login/DULoginCard.jsx"
import { DUForgotCard } from "../components/Login/DUForgotCard.jsx";
import { DUResetCard } from "../components/Login/DUResetCard.jsx";

const Login = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("login");
  const [loginError, setLoginError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginSubmit = async () => {
    try {
      const response = await loginService({ email: String(email), password: String(password) });
      if (response.request.status === 200) {
        navigate("/home");
      } else {
        setLoginError("Usuario o clave incorrectos");
      }
    } catch (error) {
      console.error(error);
      setLoginError("Usuario o clave incorrectos");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-base-200 via-base-100 to-base-200">
      {/* Franja superior azul UBB con detalle naranjo */}
      <div className="absolute inset-x-0 top-0 h-2 bg-primary" />
      <div className="absolute inset-x-0 top-2 h-1 bg-secondary" />

      {/* Círculos decorativos suaves */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-secondary/10" />

      <div className="relative grid min-h-screen place-items-center px-4">
        {view === "login" && (
          <DULoginCard
            onSubmit={loginSubmit}
            onForgot={() => setView("forgot")}
            loginError={loginError}
            setLoginError={setLoginError}
            className="flex flex-col items-center w-full"
            email={email}
            password={password}
            setPassword={setPassword}
            setEmail={setEmail}
          />
        )}

        {view === "forgot" && (
          <DUForgotCard
            initialEmail={email}
            onBack={() => setView("login")}
            onHaveCode={() => setView("reset")}
          />
        )}

        {view === "reset" && (
          <DUResetCard
            initialEmail={email}
            onBack={() => setView("login")}
            onDone={() => { setPassword(""); setView("login"); }}
          />
        )}
      </div>
    </main>
  );
};

export default Login;

