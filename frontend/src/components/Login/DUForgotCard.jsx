import { useState } from "react";
import { requestRecoveryService } from "@services/auth.service.js";
import { DUTextInput } from "../daisyUI/DUTextInput.jsx"
import { isValidEmail } from "../../validations/isValidEmail.js"

export const DUForgotCard = ({ initialEmail = "", onBack, onHaveCode }) => {
  const [email, setEmail] = useState(initialEmail);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const invalid = isValidEmail(email);
    if (invalid) return setError(invalid);

    setError("");
    setLoading(true);
    const res = await requestRecoveryService(String(email));
    setLoading(false);

    if (res?.status === 200) setMsg(res.data.message);
    else setError(res?.data?.message || "No se pudo enviar la solicitud");
  };

  return (
    <div className="card w-full max-w-sm bg-base-100 border border-base-300/40 border-t-4 border-t-secondary shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-base-content">Recuperar cuenta</h2>
        <p className="text-sm text-base-content/70">
          Ingresa tu correo. El administrador recibirá tu solicitud y te entregará un código.
        </p>

        {DUTextInput("email", "nombre@email.com", "Correo", "my-3 w-full", "recovery-email", email, (e) => { setError(""); setEmail(e.target.value); })}

        {error && <div role="alert" className="alert alert-error alert-soft mb-3">{error}</div>}
        {msg && <div role="alert" className="alert alert-success alert-soft mb-3">{msg}</div>}

        <button className="btn btn-primary w-full" onClick={submit} disabled={loading || !!msg}>
          Solicitar recuperación
        </button>

        <div className="flex justify-between mt-2">
          <button type="button" className="link link-primary text-sm" onClick={onBack}>Volver</button>
          <button type="button" className="link link-primary text-sm" onClick={onHaveCode}>Ya tengo un código</button>
        </div>
      </div>
    </div>
  );
};