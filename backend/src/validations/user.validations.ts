import Joi, { CustomValidator } from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import { MAX_FULLNAME, MIN_FULLNAME, VALIDAR_DOMINIO, FULLNAME_REGEX, MIN_DATE_LENGTH, MAX_DATE_LENGTH } from "../constants/user.constants.js";
import { CAMPOS_ADICIONALES, CONTRASENIA_OBLIGATORIO, EMAIL_OBLIGATORIO, NOMBRE_OBLIGATORIO, NOMBRE_PERMITIDOS, ROL_OBLIGATORIO, ROLES_VALIDOS } from "../constants/user.constants.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

export const emailDomainValidationFunction: CustomValidator = (value, helpers) => {
    for (const domain in VALIDAR_DOMINIO) {
        if (value.endsWith && value.endsWith(VALIDAR_DOMINIO[domain])) {
            return true;
        }
    }
    return helpers.message(`Solo se permiten los siguientes dominios: ${VALIDAR_DOMINIO.join(", ")}` as any);
}

export const integrityValidation = Joi.object({
    id: Joi.any().custom(idValidationFunction),

    username: Joi.string().min(MIN_FULLNAME).max(MAX_FULLNAME).pattern(FULLNAME_REGEX).messages({
        "string.base": "El nombre de usuario debe ser un string",
        "string.empty": "El nombre no puede ser vacío",
        "string.min": `El nombre debe al menos ser de ${MIN_FULLNAME} caracteres`,
        "string.max": `El nombre no puede tener más de ${MAX_FULLNAME} caracteres`,
        "string.pattern.base": NOMBRE_PERMITIDOS
    }),

    email: Joi.string().email().min(1).max(MAX_FULLNAME).custom(emailDomainValidationFunction).messages({
        "string.base": "El correo debe ser un string",
        "string.min": "El correo no puede ser vacío",
        "string.empty": "El correo no puede ser vacío",
        "string.email": "Correo malformado",
        "string.max": `El correo no debe ser de más de ${MAX_FULLNAME} caracteres`,
    }),
    password: Joi.string().min(1).max(MAX_FULLNAME).messages({
        "string.base": "La contraseña debe ser un string",
        "string.min": "La contraseña no puede ser vacía",
        "string.empty": "La contraseña no puede ser vacía",
        "string.max": `La contraseña debe tener menos de ${MAX_FULLNAME} caracteres`,
    }),

    role: Joi.string().min(1).max(MAX_FULLNAME).valid(...ROLES_VALIDOS).messages({
        "string.base": "El rol debe ser un string",
        "string.min": "El rol no puede ser vacío",
        "string.empty": "El rol no puede ser vacío",
        "string.max": `El rol no debe ser de más de ${MAX_FULLNAME} caracteres`,
    }),
    created_at: Joi.string().min(MIN_DATE_LENGTH).max(MAX_DATE_LENGTH).messages({
        "string.base": "La fecha de creación debe ser un string",
        "string.min": "La fecha de creación no puede ser vacía",
        "string.empty": "La fecha de creación no puede ser vacía",
        "string.max": `La fecha debe ser de menos de ${MAX_DATE_LENGTH}`,
    }),
    updated_at: Joi.string().min(MIN_DATE_LENGTH).max(MAX_DATE_LENGTH).messages({
        "string.base": "La fecha de actualización debe ser un string",
        "string.min": "La fecha de actualización no puede ser vacía",
        "string.empty": "La fecha de actualización no puede ser vacía",
        "string.max": `La fecha debe ser de menos de ${MAX_DATE_LENGTH}`,        
    }),
}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});

export const createValidation = Joi.object({
    username: Joi.any().required().messages({
        "any.required": NOMBRE_OBLIGATORIO,
    }),

    email: Joi.any().required().messages({
        "any.required": EMAIL_OBLIGATORIO
    }),
    password: Joi.any().required().messages({
        "any.required": CONTRASENIA_OBLIGATORIO
    }),
    role: Joi.any().required().messages({
        "any.required": ROL_OBLIGATORIO,
        "any.valid": `El rol debe ser uno de los siguientes: ${ROLES_VALIDOS}`,
    }),
}).min(1).unknown(false)
  .messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES, 
  });

export const updateValidation = Joi.object({
    username: Joi.any(),
    email: Joi.any(),
    password: Joi.any(),
    role: Joi.any(),    
}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,    
});