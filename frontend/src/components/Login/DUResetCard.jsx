import { useState } from "react";
import { resetPasswordService } from "@services/auth.service.js";
import { DUTextInput } from "../daisyUI/DUTextInput.jsx";
import { isValidEmail } from "../../validations/isValidEmail.js";
import { isValidPassword } from "../../validations/isValidPassword.js";

export const DUResetCard = ({ initialEmail = "", onBack, onDone }) => {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const invalid = isValidEmail(email) || isValidPassword(password);
    if (invalid) return setError(invalid);
    if (code.trim().length !== 8) return setError("El código debe tener 8 caracteres");
    if (password !== confirm) return setError("Las contraseñas no coinciden");

    setError("");
    setLoading(true);
    const res = await resetPasswordService({
      email: String(email),
      code: code.trim().toUpperCase(),
      newPassword: String(password),
    });
    setLoading(false);

    if (res?.status === 200) {
      setOk(res.data.message);
      setTimeout(onDone, 2000);
    } else {
      setError(res?.data?.message || "No se pudo restablecer la contraseña");
    }
  };

  return (
    <div className="card w-full max-w-sm bg-base-100 border border-base-300/40 border-t-4 border-t-secondary shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-base-content">Nueva contraseña</h2>

        {DUTextInput("email", "nombre@email.com", "Correo", "mt-3 w-full", "reset-email", email, (e) => { setError(""); setEmail(e.target.value); })}
        {DUTextInput("text", "XXXXXXXX", "Código", "mt-3 w-full", "reset-code", code, (e) => { setError(""); setCode(e.target.value.toUpperCase()); })}
        {DUTextInput("password", "**********", "Clave nueva", "mt-3 w-full", "reset-pass", password, (e) => { setError(""); setPassword(e.target.value); })}
        {DUTextInput("password", "**********", "Repetir", "my-3 w-full", "reset-confirm", confirm, (e) => { setError(""); setConfirm(e.target.value); })}

        {error && <div role="alert" className="alert alert-error alert-soft mb-3">{error}</div>}
        {ok && <div role="alert" className="alert alert-success alert-soft mb-3">{ok}</div>}

        <button className="btn btn-primary w-full" onClick={submit} disabled={loading || !!ok}>
          Cambiar contraseña
        </button>

        <div className="flex justify-start mt-2">
          <button type="button" className="link link-primary text-sm" onClick={onBack}>Volver al inicio de sesión</button>
        </div>
      </div>
    </div>
  );
};