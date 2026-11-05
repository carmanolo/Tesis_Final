import { GrMail } from "react-icons/gr";

export const DUMailtoButton = (email, className = "", onClick = null) => {
    if (typeof onClick === "function") {
        return (
            <button
                type="button"
                title="Enviar correo de registro"
                className={`btn btn-primary btn-sm ${className}`}
                onClick={onClick}
            >
                <GrMail />
            </button>
        );
    }

    return (
        <a href={`mailto:${String(email)}`}>
            <button className={`btn btn-primary btn-sm ${className}`}><GrMail /></button>
        </a>
    );
};