export const SHOW_ERRORS = true;
export const DEFAULT_ERROR = Error("Error desconocido");
export const ROL_ESTUDIANTE = ["presidente cee", "vicepresidente cee", "secretario cee", "tesorero cee", "vocal cee", "estudiante"];
export const TZ = "America/Santiago";
export const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MINUTOS_VIGENCIA = 30;
export const MAX_INTENTOS = 5;
export const CAMPOS_RECUPERACION = {
    id: true,
    username: true,
    email: true,
    role: true,
    recoveryStatus: true,
    recoveryRequestedAt: true,
    recoveryCodeHash: true,
    recoveryCodeExpires: true,
    recoveryAttempts: true,
};
export const LIMPIAR = {
    recoveryStatus: null,
    recoveryRequestedAt: null,
    recoveryCodeHash: null,
    recoveryCodeExpires: null,
    recoveryAttempts: 0,
};
