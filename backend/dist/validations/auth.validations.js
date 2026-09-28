import Joi from "joi";
import { VALIDAR_DOMINIO } from "../constants/user.constants.js";
const domainEmailValidator = (value, helpers) => {
    const isValid = VALIDAR_DOMINIO.some((domain) => value.endsWith(domain));
    if (!isValid) {
        return helpers.message(`El correo electrónico debe finalizar en: ${VALIDAR_DOMINIO.join(", ")}`);
    }
    return value;
};
export const registerValidation = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .required()
        .pattern(/^[a-zA-Z0-9_]+$/)
        .messages({
        "string.pattern.base": "El nombre de usuario solo puede contener letras, números y guiones bajos.",
        "string.min": "El nombre de usuario debe tener al menos 3 caracteres.",
        "string.max": "El nombre de usuario no puede exceder los 30 caracteres.",
        "string.empty": "El nombre de usuario es obligatorio.",
    }),
    rut: Joi.string()
        .required()
        .pattern(/^\d{2}\.\d{3}\.\d{3}-[\dkK]$/)
        .messages({
        "string.empty": "El rut no puede estar vacío.",
        "string.base": "El rut debe ser de tipo string.",
        "string.pattern.base": "Formato rut inválido. Debe ser xx.xxx.xxx-x.",
    }),
    email: Joi.string()
        .email()
        .required()
        .min(5)
        .max(100)
        .messages({
        "string.email": "El correo electrónico debe ser válido.",
        "string.min": "El correo electrónico debe tener al menos 5 caracteres.",
        "string.max": "El correo electrónico no puede exceder los 100 caracteres.",
        "string.empty": "El correo electrónico es obligatorio.",
    })
        .custom(domainEmailValidator, "Validación de dominio de correo electrónico"),
    password: Joi.string()
        .min(4)
        .max(100)
        .required()
        .messages({
        "string.empty": "La contraseña no puede estar vacía.",
        "any.required": "La contraseña es obligatoria.",
        "string.base": "La contraseña debe ser de tipo texto.",
        "string.min": "La contraseña debe tener al menos 4 caracteres.",
        "string.max": "La contraseña no puede exceder los 100 caracteres.",
    }),
})
    .unknown(false)
    .messages({
    "object.unknown": "No se permiten campos adicionales",
});
export const loginValidation = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
        "string.email": "El correo electrónico debe ser válido.",
        "string.empty": "El correo electrónico es obligatorio.",
    })
        .custom(domainEmailValidator, "Validación de dominio de correo electrónico"),
    password: Joi.string().min(1).max(100).required().messages({
        "string.empty": "La contraseña no puede estar vacía.",
        "any.required": "La contraseña es obligatoria.",
        "string.min": "La contraseña no puede estar vacía.",
        "string.max": "La contraseña no puede exceder los 100 caracteres.",
    }),
})
    .unknown(false)
    .messages({
    "object.unknown": "No se permiten campos adicionales",
});
