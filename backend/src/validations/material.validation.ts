import Joi from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import {
    MIN_NOMBRE_MATERIAL,
    MAX_NOMBRE_MATERIAL,
    STOCK_MINIMO,
    STOCK_OBLIGATORIO,
    NOMBREMATERIAL_OBLIGATORIO,
    NOMBRE_OBLIGATORIO,
    FECHA_OBLIGATORIA,
    CAMPOS_ADICIONALES,
    ERROR_CANTIDAD_INVALIDA,
    ESTADOS_PRESTAMO
} from "../constants/material.constants.js";  

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
    id_material: Joi.any().custom(idValidationFunction),

    nombre_material: Joi.string().min(MIN_NOMBRE_MATERIAL).max(MAX_NOMBRE_MATERIAL).messages({
        "string.base": "El nombre del material debe ser un string",
        "string.empty": "El nombre del material no puede ser vacío",
        "string.min": `El nombre del material debe tener al menos ${MIN_NOMBRE_MATERIAL} caracteres`,
        "string.max": `El nombre del material no puede tener más de ${MAX_NOMBRE_MATERIAL} caracteres`,
    }),

    fecha_prestamo: Joi.date().custom(fechaNoPasadaValidation).messages({
        "date.base": "La fecha del material debe ser una fecha válida",
        "date.min": "La fecha del material no puede ser anterior a hoy",
    }),
    nombre_prestamo: Joi.string().messages({
        "string.base": "El nombre de quien pidió el material debe ser un string",
        "string.empty": "El nombre de quien pidió el material no puede ser vacío", 
    }),
    stock: Joi.number().integer().min(STOCK_MINIMO).messages({
        "number.base": ERROR_CANTIDAD_INVALIDA,
        "number.min": `El stock mínimo debe ser ${STOCK_MINIMO}`,
    }),
    estado_prestamo: Joi.string().valid(...ESTADOS_PRESTAMO).messages({
        "string.base": "El estado de préstamo debe ser un texto",
        "any.only": "El estado de préstamo debe ser: pendiente, devuelto o prestado",
    }),
    tne_entregada: Joi.boolean().messages({
        "boolean.base": "El campo tne_entregada debe ser un valor booleano (true o false)",
    }),
    paso_tne: Joi.boolean().messages({
        "boolean.base": "El campo paso_tne debe ser un valor booleano (true o false)",
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
    nombre_material: Joi.any().required().messages({
        "any.required": NOMBREMATERIAL_OBLIGATORIO,
    }),
    fecha_prestamo: Joi.any().required().messages({
        "any.required": FECHA_OBLIGATORIA,
    }),
    nombre_prestamo: Joi.any().required().messages({
        "any.required": NOMBRE_OBLIGATORIO,
    }),
    stock: Joi.any().required().messages({
        "any.required": STOCK_OBLIGATORIO,
    }),
    estado_prestamo: Joi.any(),
    tne_entregada: Joi.any(),
    paso_tne: Joi.any(),
    carreraId: Joi.any(),
    id_carrera: Joi.any(),
}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});

export const updateValidation = Joi.object({
    nombre_material: Joi.any(),
    fecha_prestamo: Joi.any(),
    nombre_prestamo: Joi.any(),
    stock: Joi.any(),
    estado_prestamo: Joi.any(),
    tne_entregada: Joi.any(),
    paso_tne: Joi.any(),
    carreraId: Joi.any(),
    id_carrera: Joi.any(),
}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});