import Joi from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import { MIN_NOMBRE_APORTE, MAX_NOMBRE_APORTE, NOMBRE_OBLIGATORIO, APORTE_OBLIGATORIO, PROCEDENCIA_OBLIGATORIA, MONTO_OBLIGATORIA, CAMPOS_ADICIONALES, ERROR_CANTIDAD_INVALIDA } from "../constants/aporte.constants.js";
function hoyEnChile() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}
export function fechaNoPasadaValidation(value, helpers) {
    const original = String(helpers.original ?? value);
    const fechaStr = original.slice(0, 10);
    if (fechaStr < hoyEnChile()) {
        return helpers.error("date.min");
    }
    return value;
}
export const integrityValidation = Joi.object({
    id_aporte: Joi.any().custom(idValidationFunction),
    descripcion_aporte: Joi.string().min(MIN_NOMBRE_APORTE).max(MAX_NOMBRE_APORTE).messages({
        "string.base": "El nombre de la Aporte debe ser un string",
        "string.empty": "El nombre de la Aporte no puede ser vacía",
        "string.min": `El nombre de la Aporte debe tener al menos ${MIN_NOMBRE_APORTE} caracteres`,
        "string.max": `El nombre de la Aporte  no puede tener más de ${MAX_NOMBRE_APORTE} caracteres`,
    }),
    fecha_aporte: Joi.date().custom(fechaNoPasadaValidation).messages({
        "date.base": "La fecha del Aporte debe ser una fecha válida",
        "date.min": "La fecha del Aporte no puede ser anterior a hoy",
    }),
    procedencia: Joi.string().messages({
        "string.base": "El nombre de la Aporte debe ser un string",
        "string.empty": "El nombre de la Aporte no puede ser vacía",
    }),
    monto: Joi.number().integer().messages({
        "number.base": ERROR_CANTIDAD_INVALIDA,
    }),
    carreraId: Joi.number().integer().positive().messages({
        "number.base": "El id de la carrera debe ser un número",
        "number.positive": "El id de la carrera debe ser un número positivo",
    }),
    id_carrera: Joi.number().integer().positive().messages({
        "number.base": "El id de la carrera debe ser un número",
        "number.positive": "El id de la carrera debe ser un número positivo",
    }),
}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
export const createValidation = Joi.object({
    descripcion_aporte: Joi.any().required().messages({
        "any.required": NOMBRE_OBLIGATORIO,
    }),
    fecha_aporte: Joi.any().required().messages({
        "any.required": APORTE_OBLIGATORIO,
    }),
    procedencia: Joi.any().required().messages({
        "any.required": PROCEDENCIA_OBLIGATORIA,
    }),
    monto: Joi.any().required().messages({
        "any.required": MONTO_OBLIGATORIA
    }),
    carreraId: Joi.any(),
    id_carrera: Joi.any(),
}).min(1).unknown(false)
    .messages({
    "object.min": "Debe proporcionar al menos un campo",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
export const updateValidation = Joi.object({
    descripcion_aporte: Joi.any(),
    fecha_aporte: Joi.any(),
    procedencia: Joi.any(),
    monto: Joi.any(),
    carreraId: Joi.any(),
    id_carrera: Joi.any(),
}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
