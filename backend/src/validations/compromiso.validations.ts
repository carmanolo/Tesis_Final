import Joi from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import {
    MIN_DESCRIPCION_COMPROMISO,
    MAX_DESCRIPCION_COMPROMISO,
    MONTO_MINIMO,
    DESCRIPCION_OBLIGATORIA,
    FECHA_OBLIGATORIA,
    MONTO_TOTAL_OBLIGATORIO,
    APORTE_ID_OBLIGATORIO,
    MONTO_ASIGNADO_OBLIGATORIO,
    CAMPOS_ADICIONALES,
    ERROR_CANTIDAD_INVALIDA,
} from "../constants/compromiso.constants.js";

// Paso 1: valida el FORMATO de los campos que lleguen (todos opcionales)
export const integrityValidation = Joi.object({
    id_compromiso: Joi.any().custom(idValidationFunction),

    descripcion_compromiso: Joi.string().min(MIN_DESCRIPCION_COMPROMISO).max(MAX_DESCRIPCION_COMPROMISO).messages({
        "string.base": "La descripción del compromiso debe ser un string",
        "string.empty": "La descripción del compromiso no puede ser vacía",
        "string.min": `La descripción del compromiso debe tener al menos ${MIN_DESCRIPCION_COMPROMISO} caracteres`,
        "string.max": `La descripción del compromiso no puede tener más de ${MAX_DESCRIPCION_COMPROMISO} caracteres`,
    }),
    // Fecha seleccionada por el usuario (formato ISO, p. ej. YYYY-MM-DD)
    fecha_compromiso: Joi.date().iso().messages({
        "date.base": "La fecha del compromiso debe ser una fecha válida",
        "date.format": "La fecha del compromiso debe tener formato YYYY-MM-DD",
    }),
    monto_total: Joi.number().integer().min(MONTO_MINIMO).messages({
        "number.base": ERROR_CANTIDAD_INVALIDA,
        "number.integer": ERROR_CANTIDAD_INVALIDA,
        "number.min": `El monto total del compromiso debe ser al menos ${MONTO_MINIMO}`,
    }),
    carreraId: Joi.number().integer().positive().messages({
        "number.base": "El id de la carrera debe ser un número",
        "number.positive": "El id de la carrera debe ser un número positivo",
    }),
    id_carrera: Joi.number().integer().positive().messages({
        "number.base": "El id de la carrera debe ser un número",
        "number.positive": "El id de la carrera debe ser un número positivo",
    }),

    // Campos de la asignación de aportes
    aporteId: Joi.number().integer().positive().messages({
        "number.base": "El id del aporte debe ser un número",
        "number.positive": "El id del aporte debe ser un número positivo",
    }),
    monto_asignado: Joi.number().integer().min(MONTO_MINIMO).messages({
        "number.base": ERROR_CANTIDAD_INVALIDA,
        "number.integer": ERROR_CANTIDAD_INVALIDA,
        "number.min": `El monto asignado debe ser al menos ${MONTO_MINIMO}`,
    }),
}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});

// Paso 2 (crear): valida que vengan los campos OBLIGATORIOS
export const createValidation = Joi.object({
    descripcion_compromiso: Joi.any().required().messages({
        "any.required": DESCRIPCION_OBLIGATORIA,
    }),
    fecha_compromiso: Joi.any().required().messages({
        "any.required": FECHA_OBLIGATORIA,
    }),
    monto_total: Joi.any().required().messages({
        "any.required": MONTO_TOTAL_OBLIGATORIO,
    }),
    // Solo lo usa el administrador; el resto queda ligado a su propia carrera
    carreraId: Joi.any(),
    id_carrera: Joi.any(),

}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});

// Paso 2 (actualizar): la carrera NO se puede cambiar en un compromiso
export const updateValidation = Joi.object({
    descripcion_compromiso: Joi.any(),
    fecha_compromiso: Joi.any(),
    monto_total: Joi.any(),

}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});

// Paso 2 (asignar aporte): ambos campos obligatorios
export const asignarAporteValidation = Joi.object({
    aporteId: Joi.any().required().messages({
        "any.required": APORTE_ID_OBLIGATORIO,
    }),
    monto_asignado: Joi.any().required().messages({
        "any.required": MONTO_ASIGNADO_OBLIGATORIO,
    }),

}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});