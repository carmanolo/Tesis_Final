export const MIN_FULLNAME = 3;
export const MAX_FULLNAME = 500;
export const FULLNAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]*$/;

export const ADMIN_ROLE = "administrador";
export const USUARIO_ROLE = "usuario";

export const NOMBRE_OBLIGATORIO = "El nombre debe ser obligatorio";
export const RUT_OBLIGATORIO = "El rut es obligatorio";
export const EMAIL_OBLIGATORIO = "El correo es obligatorio";
export const CONTRASENIA_OBLIGATORIO = "La contraseña es obligatoria";
export const ROL_OBLIGATORIO = "El rol es obligatorio";
export const ROLES_VALIDOS = ["administrador", "jefe de carrera", "presidente cee", "secretario cee", "tesorero cee", "vocal cee"] as const;

export const CAMPOS_ADICIONALES = "No se permiten campos adicionales";
export const UNKNOWN_ERROR = "Error desconocido";

export const VALIDAR_DOMINIO = ["@ubiobio.cl", "@alumnos.ubiobio.cl", "@gmail.com", "@gmail.cl"];

export const MAX_ID = 100000000;
export const MIN_ID = 1;

export const NOMBRE_PERMITIDOS = "El nombre solo puede tener letras y espacios";

export const USER_NO_ENCONTRADO = "USUARIO NO ENCONTRADO";

export const MIN_DATE_LENGTH = 1;
export const MAX_DATE_LENGTH = 200;