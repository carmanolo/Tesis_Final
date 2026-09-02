export const isValidEmail = (email) => {
    const emailString = String(email);
    // const emailRegex = /^[a-zA-Z0-9._%+-]+@(alumnos\.ubiobio\.cl|ubiobio\.cl)$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|gmail\.cl)$/;

    if (emailString.length <= 3) {
        return "El correo debe tener a lo menos 3 caracteres";
    }
    const emailMatchesRegex = emailRegex.exec(emailString);
    if (emailMatchesRegex === null) {
        return "Debe ingresar un correo válido de la UBB";
    }
    
    return null;
} 