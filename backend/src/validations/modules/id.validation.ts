import Joi, { CustomValidator } from "joi";
import { MIN_ID, MAX_ID } from "../../constants/user.constants.js";

export const idValidation = Joi.object({
    id: Joi.number().integer().positive().min(MIN_ID).max(MAX_ID).messages({
        "any.required": "El ID es obligatorio",
        "number.required": "El ID es obligatorio",
        "number.base": "El ID tiene que ser un número",
        "number.integer": "El ID tiene que ser un entero",
        "number.positive": "El ID tiene que ser positivo",
        "number.min": `El ID debe ser mayor que ${MIN_ID - 1}`,
        "number.max": `El ID debe ser menor que ${MAX_ID + 1}`,
    }),
}).unknown(false)
    .messages({
        "object.unknown": "No se permiten campos adicionales",
});

export const idValidationFunction: CustomValidator = (value, helpers) => {
    const result = idValidation.validate({ id: value });
    if (result.error) {
        return helpers.message(result.error.message ? result.error.message : "El ID no es válido" as any);
    }
    return true;
};