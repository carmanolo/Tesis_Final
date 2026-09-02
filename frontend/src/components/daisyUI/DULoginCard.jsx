import { DUTextInput } from "./DUTextInput.jsx";
import DUGenericCard from "./DUGenericCard.jsx";
import { VscError } from 'react-icons/vsc';
import { useEffect, useState } from "react";
import { isValidEmail } from "../../validations/isValidEmail.js";
import { isValidPassword } from "../../validations/isValidPassword.js";

export const DULoginCard = ({onSubmit, loginError, setLoginError, className, email, setEmail, password, setPassword}) => {  
    const [error, setError] = useState("Debe ingresar datos");

    useEffect(() => {
        setError(isValidEmail(email) || isValidPassword(password) || loginError);
    }, [email, password, loginError]);

    const handleEmailChange = (event) => {
        setLoginError("");
        setEmail(event.target.value);
    }
    const handlePasswordChange = (event) => {
        setLoginError("");
        setPassword(event.target.value);
    }    

    const insideContent = (
        <div className={className}>
            <h2 className="card-title mb-3">Iniciar sesión</h2>
            {DUTextInput("email", "nombre@email.com", "Correo", "mb-3 w-full", "email-field", email, handleEmailChange)}
            {DUTextInput("password", "**********", "Clave", "mb-3 w-full", "password-field", password, handlePasswordChange)}
            {error && <div role="alert" className="alert alert-error alert-soft flex-row flex mb-3">
                <VscError className="mr-0"></VscError>
                <span>{error}</span>
            </div>}   
            <button className="btn btn-primary w-full" disabled={error && true} onClick={onSubmit}>Entrar</button>         
        </div>
    );

    return (
        <>{DUGenericCard(insideContent)}</>
    );
}

