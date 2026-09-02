import { GrMail } from 'react-icons/gr';

export const DUMailtoButton = (email, className="", mailto = true) => {
    if (mailto) {
        return (
            <a href={`mailto:${String(email)}`}>
                <button className={`btn btn-primary btn-sm ${className}`}><GrMail /></button>
            </a>
        )
    } else {
        // TODO: NO IMPLEMENTADO TODAVÍA
        return "";
    }

}