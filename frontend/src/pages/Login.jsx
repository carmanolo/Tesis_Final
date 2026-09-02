import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginService } from "@services/auth.service.js";
import { DULoginCard } from "../components/daisyUI/DULoginCard.jsx";

const Login = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginSubmit = async () => {
    try {
      const response = await loginService({email: String(email), password: String(password)});
      if (response.request.status === 200) {
        navigate("/home");
      } else {
        setLoginError("Usuario o clave incorrectos");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="page-root h-fit">
      <div className="grid h-screen place-items-center">
        <DULoginCard onSubmit={loginSubmit} loginError={loginError} setLoginError={setLoginError} className={"items-center"} email={email} password={password} setPassword={setPassword} setEmail={setEmail}></DULoginCard>
      </div>
    </main>
  );
};

export default Login;
