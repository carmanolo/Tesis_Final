import Joi from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import { MIN_DESCRIPCION, MAX_DESCRIPCION, REUNION_OBLIGATORIA, DESCRIPCION_OBLIGATORIA, CAMPOS_ADICIONALES } from "../constants/reunion.constants.js";
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
    id_reunion: Joi.any().custom(idValidationFunction),
    fecha_reunion: Joi.date().custom(fechaNoPasadaValidation).messages({
        "date.base": "La fecha de la reunión debe ser una fecha válida",
        "date.min": "La fecha de la reunión no puede ser anterior a hoy",
    }),
    descripcion: Joi.string().min(MIN_DESCRIPCION).max(MAX_DESCRIPCION).messages({
        "string.base": "La descripción debe ser un string",
        "string.empty": "La descripción no puede ser vacía",
        "string.min": `La descripción debe tener al menos ${MIN_DESCRIPCION} caracteres`,
        "string.max": `La descripción no puede tener más de ${MAX_DESCRIPCION} caracteres`,
    }),
}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
export const createValidation = Joi.object({
    fecha_reunion: Joi.any().required().messages({
        "any.required": REUNION_OBLIGATORIA,
    }),
    descripcion: Joi.any().required().messages({
        "any.required": DESCRIPCION_OBLIGATORIA,
    }),
}).min(1).unknown(false)
    .messages({
    "object.min": "Debe proporcionar al menos un campo",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
export const updateValidation = Joi.object({
    fecha_reunion: Joi.any(),
    descripcion: Joi.any(),
}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
