import { DUTextInput } from "./DUTextInput.jsx";
import { VscError } from "react-icons/vsc";
import { useEffect, useState } from "react";
import { isValidEmail } from "../../validations/isValidEmail.js";
import { isValidPassword } from "../../validations/isValidPassword.js";
import escudoUBB from "../../assets/escudo-color-gradiente.svg";

export const DULoginCard = ({ onSubmit, loginError, setLoginError, className, email, setEmail, password, setPassword }) => {
  const [error, setError] = useState("Debe ingresar datos");

  useEffect(() => {
    setError(isValidEmail(email) || isValidPassword(password) || loginError);
  }, [email, password, loginError]);

  const handleEmailChange = (event) => {
    setLoginError("");
    setEmail(event.target.value);
  };
  const handlePasswordChange = (event) => {
    setLoginError("");
    setPassword(event.target.value);
  };

  return (
    <div className="card w-full max-w-sm bg-base-100 border border-base-300/40 border-t-4 border-t-secondary shadow-xl">
      <div className="card-body">
        <div className={className}>
          <div className="flex flex-col items-center mb-4">
            <img
              src={escudoUBB}
              alt="Escudo Universidad del Bío-Bío"
              className="w-32 h-32 object-contain mb-2"
            />
            <h1 className="text-3xl font-bold tracking-widest text-primary">FACECORE</h1>
            <p className="text-sm text-base-content/70">Facultad de Ciencias Empresariales</p>
          </div>

          <div className="divider my-1 before:bg-base-200 after:bg-base-200" />

          <h2 className="card-title text-base-content self-start mb-3">Iniciar sesión</h2>

          {DUTextInput("email", "nombre@email.com", "Correo", "mb-3 w-full", "email-field", email, handleEmailChange)}
          {DUTextInput("password", "**********", "Clave", "mb-3 w-full", "password-field", password, handlePasswordChange)}

          {error && (
            <div role="alert" className="alert alert-error alert-soft flex-row flex mb-3 w-full">
              <VscError className="mr-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn btn-primary w-full text-base tracking-wide"
            disabled={!!error}
            onClick={onSubmit}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
};