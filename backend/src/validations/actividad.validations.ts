import Joi from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import { MIN_NOMBRE_ACTIVIDAD, MAX_NOMBRE_ACTIVIDAD, NOMBRE_OBLIGATORIO, ACTIVIDAD_OBLIGATORIA, PROCEDENCIA_OBLIGATORIA, MONTO_OBLIGATORIA, MONTO_MINIMO, CAMPOS_ADICIONALES, ERROR_CANTIDAD_INVALIDA } from "../constants/actividad.constants.js";

function hoyEnChile(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

export function fechaNoPasadaValidation(value: any, helpers: Joi.CustomHelpers) {
    const original = String(helpers.original ?? value);
    const fechaStr = original.slice(0, 10);

    if (fechaStr < hoyEnChile()) {
        return helpers.error("date.min");
    }
    return value;
}

export const integrityValidation = Joi.object({
    id_actividad: Joi.any().custom(idValidationFunction),

    nombre_actividad: Joi.string().min(MIN_NOMBRE_ACTIVIDAD).max(MAX_NOMBRE_ACTIVIDAD).messages({
        "string.base": "El nombre de la actividad debe ser un string",
        "string.empty": "El nombre de la actividad no puede ser vacía",
        "string.min": `El nombre de la actividad debe tener al menos ${MIN_NOMBRE_ACTIVIDAD} caracteres`,
        "string.max": `El nombre de la actividad  no puede tener más de ${MAX_NOMBRE_ACTIVIDAD} caracteres`,
    }),

    fecha_actividad: Joi.date().custom(fechaNoPasadaValidation).messages({
        "date.base": "La fecha de la actividad debe ser una fecha válida",
        "date.min": "La fecha de la actividad no puede ser anterior a hoy",
    }),
    procedencia: Joi.string().messages({
        "string.base": "El nombre de la actividad debe ser un string",
        "string.empty": "El nombre de la actividad no puede ser vacía", 
    }),
    monto: Joi.number().integer().messages({
        "number.base": ERROR_CANTIDAD_INVALIDA,
    }),


}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});

export const createValidation = Joi.object({
    nombre_actividad: Joi.any().required().messages({
        "any.required": NOMBRE_OBLIGATORIO,
    }),
    fecha_actividad: Joi.any().required().messages({
        "any.required": ACTIVIDAD_OBLIGATORIA,
    }),
    procedencia: Joi.any().required().messages({
        "any.required": PROCEDENCIA_OBLIGATORIA,
    }),
    monto: Joi.any().required().messages({
        "any.required":MONTO_OBLIGATORIA
    })

}).min(1).unknown(false)
  .messages({
    "object.min": "Debe proporcionar al menos un campo",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
  });

export const updateValidation = Joi.object({
    nombre_actividad: Joi.any(),
    fecha_actividad: Joi.any(),
    procedencia: Joi.any(),
    monto: Joi.any()

}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});