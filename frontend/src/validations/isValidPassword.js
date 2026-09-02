export const isValidPassword = (password) => {
    const passwordString = String(password);

    if (passwordString.length < 3) {
        return "La clave debe tener a lo menos 3 caracteres";
    }
    if (passwordString.length > 100) {
        return "La clave no puede tener más de 100 caracteres";
    }
    return null;
} 