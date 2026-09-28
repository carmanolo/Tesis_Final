import Joi from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import { MIN_FULLCARRERA, MAX_FULLCARRERA, CARRERA_PERMITIDA, CARRERA_REGEX, CARRERA_OBLIGATORIO, SIGLA_OBLIGATORIA, CAMPOS_ADICIONALES, MAX_SIGLA, MIN_SIGLA } from "../constants/carrera.constants.js";
export const integrityValidation = Joi.object({
    id_carrera: Joi.any().custom(idValidationFunction),
    nombre_carrera: Joi.string().min(MIN_FULLCARRERA).max(MAX_FULLCARRERA).pattern(CARRERA_REGEX).messages({
        "string.base": "El nombre de la carrera debe ser un string",
        "string.empty": "El nombre no puede ser vacío",
        "string.min": `El nombre debe al menos ser de ${MIN_FULLCARRERA} caracteres`,
        "string.max": `El nombre no puede tener más de ${MAX_FULLCARRERA} caracteres`,
        "string.pattern.base": CARRERA_PERMITIDA
    }),
    sigla: Joi.string().min(MIN_SIGLA).max(MAX_SIGLA).messages({
        "string.base": "La sigla debe ser un string",
        "string.min": "La sigla no puede ser vacía",
        "string.empty": "La sigla no puede ser vacía",
        "string.max": `La sigla debe tener menos de ${MAX_SIGLA} caracteres`,
    }),
}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
export const createValidation = Joi.object({
    nombre_carrera: Joi.any().required().messages({
        "any.required": CARRERA_OBLIGATORIO,
    }),
    sigla: Joi.any().required().messages({
        "any.required": SIGLA_OBLIGATORIA
    }),
}).min(1).unknown(false)
    .messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
export const updateValidation = Joi.object({
    nombre_carrera: Joi.any(),
    sigla: Joi.any(),
}).min(1).unknown(false).messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar",
    "any.min": "Debe proporcionar al menos un campo para actualizar",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
