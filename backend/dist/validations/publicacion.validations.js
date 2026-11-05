import Joi from "joi";
import { idValidationFunction } from "./modules/id.validation.js";
import { MIN_TITULO, MAX_TITULO, MIN_DESCRIPCION, MAX_DESCRIPCION, TITULO_OBLIGATORIO, DESCRIPCION_OBLIGATORIA, CAMPOS_ADICIONALES, } from "../constants/publicacion.constants.js";
export const integrityValidation = Joi.object({
    id_publicacion: Joi.any().custom(idValidationFunction),
    titulo: Joi.string().min(MIN_TITULO).max(MAX_TITULO).messages({
        "string.base": "El título debe ser un texto",
        "string.empty": "El título no puede estar vacío",
        "string.min": `El título debe tener al menos ${MIN_TITULO} caracteres`,
        "string.max": `El título no puede tener más de ${MAX_TITULO} caracteres`,
    }),
    descripcion: Joi.string().min(MIN_DESCRIPCION).max(MAX_DESCRIPCION).messages({
        "string.base": "La descripción debe ser un texto",
        "string.empty": "La descripción no puede estar vacía",
        "string.min": `La descripción debe tener al menos ${MIN_DESCRIPCION} caracteres`,
        "string.max": `La descripción no puede tener más de ${MAX_DESCRIPCION} caracteres`,
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
    titulo: Joi.any().required().messages({
        "any.required": TITULO_OBLIGATORIO,
    }),
    descripcion: Joi.any().required().messages({
        "any.required": DESCRIPCION_OBLIGATORIA,
    }),
    carreraId: Joi.any(),
    id_carrera: Joi.any(),
}).min(1).unknown(false)
    .messages({
    "object.min": "Debe proporcionar al menos un campo",
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
// Sin .min(1): al actualizar se puede enviar solo imágenes (multipart) sin campos de texto.
// El controlador valida que venga al menos un campo o una imagen.
export const updateValidation = Joi.object({
    titulo: Joi.any(),
    descripcion: Joi.any(),
    carreraId: Joi.any(),
    id_carrera: Joi.any(),
}).unknown(false).messages({
    "any.unknown": CAMPOS_ADICIONALES,
    "object.unknown": CAMPOS_ADICIONALES,
});
