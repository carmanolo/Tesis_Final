import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createValidation, fechaNoPasadaValidation, integrityValidation, updateValidation, } from "../../validations/reunion.validations.js";
import { CAMPOS_ADICIONALES, DESCRIPCION_OBLIGATORIA, MAX_DESCRIPCION, MIN_DESCRIPCION, REUNION_OBLIGATORIA, } from "../../constants/reunion.constants.js";
import { MAX_ID, MIN_ID } from "../../constants/user.constants.js";
// 2026-10-14T01:00:00Z === 2026-10-13 22:00 en Chile (UTC-3).
// Sirve para verificar que "hoy" se calcula con la zona horaria de Chile y no con UTC.
const AHORA_FALSA = new Date("2026-10-14T01:00:00Z");
const HOY_CHILE = "2026-10-13";
const AYER_CHILE = "2026-10-12";
const MANANA_CHILE = "2026-10-14";
const descripcionValida = "Reunión de coordinación";
const mensajes = (error) => error?.details?.map((d) => d.message) ?? [];
describe("reunion.validations - Pruebas Unitarias", () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(AHORA_FALSA);
    });
    afterAll(() => {
        vi.useRealTimers();
    });
    describe("integrityValidation", () => {
        it("acepta un objeto vacío (todos los campos son opcionales)", () => {
            const { error } = integrityValidation.validate({});
            expect(error).toBeUndefined();
        });
        it("acepta fecha de hoy (en Chile) y descripción válida", () => {
            const { error } = integrityValidation.validate({
                fecha_reunion: HOY_CHILE,
                descripcion: descripcionValida,
            });
            expect(error).toBeUndefined();
        });
        it("acepta una fecha futura", () => {
            const { error } = integrityValidation.validate({ fecha_reunion: MANANA_CHILE });
            expect(error).toBeUndefined();
        });
        it("rechaza una fecha anterior a hoy", () => {
            const { error } = integrityValidation.validate({ fecha_reunion: AYER_CHILE });
            expect(error).toBeDefined();
            expect(error.message).toBe("La fecha de la reunión no puede ser anterior a hoy");
        });
        it("rechaza una fecha con formato inválido", () => {
            const { error } = integrityValidation.validate({ fecha_reunion: "no-es-una-fecha" });
            expect(error).toBeDefined();
            expect(error.message).toBe("La fecha de la reunión debe ser una fecha válida");
        });
        it("rechaza una descripción vacía", () => {
            const { error } = integrityValidation.validate({ descripcion: "" });
            expect(error).toBeDefined();
            expect(error.message).toBe("La descripción no puede ser vacía");
        });
        it("rechaza una descripción que no es string", () => {
            const { error } = integrityValidation.validate({ descripcion: 12345 });
            expect(error).toBeDefined();
            expect(error.message).toBe("La descripción debe ser un string");
        });
        it("rechaza una descripción más corta que el mínimo", () => {
            const { error } = integrityValidation.validate({
                descripcion: "a".repeat(MIN_DESCRIPCION - 1),
            });
            expect(error).toBeDefined();
            expect(error.message).toBe(`La descripción debe tener al menos ${MIN_DESCRIPCION} caracteres`);
        });
        it("acepta una descripción con exactamente el mínimo de caracteres", () => {
            const { error } = integrityValidation.validate({
                descripcion: "a".repeat(MIN_DESCRIPCION),
            });
            expect(error).toBeUndefined();
        });
        it("acepta una descripción con exactamente el máximo de caracteres", () => {
            const { error } = integrityValidation.validate({
                descripcion: "a".repeat(MAX_DESCRIPCION),
            });
            expect(error).toBeUndefined();
        });
        it("rechaza una descripción más larga que el máximo", () => {
            const { error } = integrityValidation.validate({
                descripcion: "a".repeat(MAX_DESCRIPCION + 1),
            });
            expect(error).toBeDefined();
            expect(error.message).toBe(`La descripción no puede tener más de ${MAX_DESCRIPCION} caracteres`);
        });
        it("rechaza campos adicionales no permitidos", () => {
            const { error } = integrityValidation.validate({
                descripcion: descripcionValida,
                campo_extra: "x",
            });
            expect(error).toBeDefined();
            expect(error.message).toBe(CAMPOS_ADICIONALES);
        });
        describe.each(["carreraId", "id_carrera"])("%s", (campo) => {
            it("acepta un id positivo", () => {
                const { error } = integrityValidation.validate({ [campo]: 1 });
                expect(error).toBeUndefined();
            });
            it("rechaza un valor que no es número", () => {
                const { error } = integrityValidation.validate({ [campo]: "abc" });
                expect(error).toBeDefined();
                expect(error.message).toBe("El id de la carrera debe ser un número");
            });
            it("rechaza cero", () => {
                const { error } = integrityValidation.validate({ [campo]: 0 });
                expect(error).toBeDefined();
                expect(error.message).toBe("El id de la carrera debe ser un número positivo");
            });
            it("rechaza un número negativo", () => {
                const { error } = integrityValidation.validate({ [campo]: -1 });
                expect(error).toBeDefined();
                expect(error.message).toBe("El id de la carrera debe ser un número positivo");
            });
            it("rechaza un número decimal", () => {
                const { error } = integrityValidation.validate({ [campo]: 1.5 });
                expect(error).toBeDefined();
                expect(error.details[0].type).toBe("number.integer");
            });
        });
        describe("id_reunion", () => {
            it("acepta un id válido", () => {
                const { error } = integrityValidation.validate({ id_reunion: MIN_ID });
                expect(error).toBeUndefined();
            });
            it("acepta el id máximo permitido", () => {
                const { error } = integrityValidation.validate({ id_reunion: MAX_ID });
                expect(error).toBeUndefined();
            });
            it("rechaza un id que no es número", () => {
                const { error } = integrityValidation.validate({ id_reunion: "abc" });
                expect(error).toBeDefined();
                expect(error.message).toBe("El ID tiene que ser un número");
            });
            it("rechaza un id decimal", () => {
                const { error } = integrityValidation.validate({ id_reunion: 1.5 });
                expect(error).toBeDefined();
                expect(error.message).toBe("El ID tiene que ser un entero");
            });
            it("rechaza un id negativo", () => {
                const { error } = integrityValidation.validate({ id_reunion: -1 });
                expect(error).toBeDefined();
                expect(error.message).toBe("El ID tiene que ser positivo");
            });
            it("rechaza un id mayor al máximo", () => {
                const { error } = integrityValidation.validate({ id_reunion: MAX_ID + 1 });
                expect(error).toBeDefined();
                expect(error.message).toBe(`El ID debe ser menor que ${MAX_ID + 1}`);
            });
        });
    });
    describe("createValidation", () => {
        it("acepta fecha y descripción presentes", () => {
            const { error } = createValidation.validate({
                fecha_reunion: HOY_CHILE,
                descripcion: descripcionValida,
            });
            expect(error).toBeUndefined();
        });
        it("acepta además carreraId e id_carrera (opcionales)", () => {
            const { error } = createValidation.validate({
                fecha_reunion: HOY_CHILE,
                descripcion: descripcionValida,
                carreraId: 1,
                id_carrera: 1,
            });
            expect(error).toBeUndefined();
        });
        it("exige la fecha de la reunión", () => {
            const { error } = createValidation.validate({ descripcion: descripcionValida });
            expect(error).toBeDefined();
            expect(error.message).toBe(REUNION_OBLIGATORIA);
        });
        it("exige la descripción", () => {
            const { error } = createValidation.validate({ fecha_reunion: HOY_CHILE });
            expect(error).toBeDefined();
            expect(error.message).toBe(DESCRIPCION_OBLIGATORIA);
        });
        it("reporta ambos campos obligatorios cuando el objeto está vacío", () => {
            const { error } = createValidation.validate({}, { abortEarly: false });
            expect(error).toBeDefined();
            const msgs = mensajes(error);
            expect(msgs).toContain(REUNION_OBLIGATORIA);
            expect(msgs).toContain(DESCRIPCION_OBLIGATORIA);
        });
        it("rechaza campos adicionales", () => {
            const { error } = createValidation.validate({
                fecha_reunion: HOY_CHILE,
                descripcion: descripcionValida,
                campo_extra: "x",
            });
            expect(error).toBeDefined();
            expect(error.message).toBe(CAMPOS_ADICIONALES);
        });
    });
    describe("updateValidation", () => {
        it.each([
            ["fecha_reunion", HOY_CHILE],
            ["descripcion", descripcionValida],
            ["carreraId", 1],
            ["id_carrera", 1],
        ])("acepta solo el campo %s", (campo, valor) => {
            const { error } = updateValidation.validate({ [campo]: valor });
            expect(error).toBeUndefined();
        });
        it("acepta varios campos", () => {
            const { error } = updateValidation.validate({
                fecha_reunion: HOY_CHILE,
                descripcion: descripcionValida,
                carreraId: 1,
            });
            expect(error).toBeUndefined();
        });
        it("rechaza un objeto vacío", () => {
            const { error } = updateValidation.validate({});
            expect(error).toBeDefined();
            expect(error.message).toBe("Debe proporcionar al menos un campo para actualizar");
        });
        it("rechaza campos adicionales", () => {
            const { error } = updateValidation.validate({
                descripcion: descripcionValida,
                campo_extra: "x",
            });
            expect(error).toBeDefined();
            expect(error.message).toBe(CAMPOS_ADICIONALES);
        });
    });
    describe("fechaNoPasadaValidation", () => {
        const crearHelpers = (original) => {
            const error = vi.fn((code) => ({ code }));
            return { helpers: { original, error }, error };
        };
        it("devuelve el mismo valor cuando la fecha es hoy en Chile", () => {
            const { helpers, error } = crearHelpers(HOY_CHILE);
            const valor = new Date(HOY_CHILE);
            expect(fechaNoPasadaValidation(valor, helpers)).toBe(valor);
            expect(error).not.toHaveBeenCalled();
        });
        it("devuelve date.min cuando la fecha es anterior a hoy", () => {
            const { helpers, error } = crearHelpers(AYER_CHILE);
            const resultado = fechaNoPasadaValidation(new Date(AYER_CHILE), helpers);
            expect(error).toHaveBeenCalledWith("date.min");
            expect(resultado).toEqual({ code: "date.min" });
        });
        it("usa los primeros 10 caracteres del valor original (ignora la hora)", () => {
            const { helpers, error } = crearHelpers(`${AYER_CHILE}T23:59:59.000Z`);
            fechaNoPasadaValidation(new Date(`${AYER_CHILE}T23:59:59.000Z`), helpers);
            expect(error).toHaveBeenCalledWith("date.min");
        });
        it("usa el día de Chile y no el de UTC para determinar 'hoy'", () => {
            // En UTC ya es 2026-10-14, pero en Chile todavía es 2026-10-13.
            const { helpers, error } = crearHelpers(HOY_CHILE);
            fechaNoPasadaValidation(new Date(HOY_CHILE), helpers);
            expect(error).not.toHaveBeenCalled();
        });
    });
});
