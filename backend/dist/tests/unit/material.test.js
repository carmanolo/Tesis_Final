import { beforeEach, describe, expect, it, vi } from "vitest";
// Mocks (se hoistean automáticamente por encima de los imports)
const repos = vi.hoisted(() => ({ user: { findOne: vi.fn() }, carrera: { findOne: vi.fn() }, }));
vi.mock("../../entity/user.entity.js", () => ({ default: { nombre: "UserEntity" } }));
vi.mock("../../entity/carrera.entity.js", () => ({ default: { nombre: "CarreraEntity" } }));
vi.mock("../../config/configDb.js", () => ({
    AppDataSource: { getRepository: vi.fn() },
}));
vi.mock("../../services/material.service.js", () => ({
    getMaterialSer: vi.fn(),
    getMaterialesSer: vi.fn(),
    createMaterialSer: vi.fn(),
    patchMaterialSer: vi.fn(),
    deleteMaterialSer: vi.fn(),
}));
vi.mock("../../validations/material.validation.js", () => ({
    createValidation: { validate: vi.fn() },
    integrityValidation: { validate: vi.fn() },
    updateValidation: { validate: vi.fn() },
}));
vi.mock("../../validations/modules/id.validation.js", () => ({
    idValidation: { validate: vi.fn() },
}));
vi.mock("../../handlers/responseHandlers.js", () => ({
    handleErrorClient: vi.fn(),
    handleErrorServer: vi.fn(),
    handleSuccess: vi.fn(),
}));
import { createMaterial, deleteMaterialById, getMaterialById, getMateriales, patchMaterialById } from "../../controllers/material.controller.js";
import { createMaterialSer, deleteMaterialSer, getMaterialSer, getMaterialesSer, patchMaterialSer } from "../../services/material.service.js";
import { createValidation, integrityValidation, updateValidation, } from "../../validations/material.validation.js";
import { idValidation } from "../../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess, } from "../../handlers/responseHandlers.js";
import { AppDataSource } from "../../config/configDb.js";
import UserEntity from "../../entity/user.entity.js";
import { MATERIAL_NO_ENCONTRADO } from "../../constants/material.constants.js";
// Helpers
const res = {};
const crearReq = (parcial = {}) => ({ body: {}, params: {}, query: {}, ...parcial });
const validacionOk = { error: undefined };
const validacionFalla = (message) => ({ error: { message } });
describe("material.controller - Pruebas Unitarias", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        AppDataSource.getRepository.mockImplementation((entidad) => entidad === UserEntity ? repos.user : repos.carrera);
        repos.user.findOne.mockResolvedValue(null);
        repos.carrera.findOne.mockResolvedValue(null);
        integrityValidation.validate.mockReturnValue(validacionOk);
        createValidation.validate.mockReturnValue(validacionOk);
        updateValidation.validate.mockReturnValue(validacionOk);
        idValidation.validate.mockReturnValue(validacionOk);
    });
    describe("createMaterial", () => {
        const bodyBase = {
            nombre_material: "Proyector",
            fecha_prestamo: "2026-10-20",
            nombre_prestamo: "  Ana Pérez  ",
            stock: 5,
        };
        const user = { id: 1, carreraId: 2 };
        beforeEach(() => {
            createMaterialSer.mockResolvedValue({ data: { id_material: 1 }, error: null });
        });
        it("responde 400 si no hay body", async () => {
            await createMaterial(crearReq({ body: undefined, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Datos no proporcionados");
        });
        it("responde 400 si falla integrityValidation", async () => {
            integrityValidation.validate.mockReturnValue(validacionFalla("extra"));
            await createMaterial(crearReq({ body: bodyBase, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Parámetros inválidos", "extra");
            expect(createMaterialSer).not.toHaveBeenCalled();
        });
        it("responde 400 si falla createValidation", async () => {
            createValidation.validate.mockReturnValue(validacionFalla("falta nombre"));
            await createMaterial(crearReq({ body: bodyBase, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Faltan parámetros requeridos", "falta nombre");
            expect(createMaterialSer).not.toHaveBeenCalled();
        });
        it.each([
            ["negativo", -1],
            ["no numérico", "abc"],
            ["undefined", undefined],
        ])("responde 400 si el stock es %s", async (_, stock) => {
            await createMaterial(crearReq({ body: { ...bodyBase, stock }, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "El stock debe ser un número entero mayor o igual a 0");
            expect(createMaterialSer).not.toHaveBeenCalled();
        });
        it("responde 400 si está prestado (por defecto) y el stock es 0", async () => {
            await createMaterial(crearReq({ body: { ...bodyBase, stock: 0 }, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "No es posible registrar en estado prestado con stock menor a 1");
        });
        it("descuenta 1 del stock cuando el estado es prestado (por defecto)", async () => {
            await createMaterial(crearReq({ body: bodyBase, user }), res);
            expect(createMaterialSer).toHaveBeenCalledWith("Proyector", "2026-10-20", "Ana Pérez", 4, 2, "prestado", false);
        });
        it("no descuenta stock si el estado no es prestado", async () => {
            await createMaterial(crearReq({ body: { ...bodyBase, stock: 0, estado_prestamo: "disponible" }, user }), res);
            expect(createMaterialSer).toHaveBeenCalledWith("Proyector", "2026-10-20", "Ana Pérez", 0, 2, "disponible", false);
        });
        it("usa 'prestatario' si no viene nombre_prestamo", async () => {
            const { nombre_prestamo, ...sinNombre } = bodyBase;
            await createMaterial(crearReq({ body: { ...sinNombre, prestatario: "Luis" }, user }), res);
            expect(createMaterialSer.mock.calls[0][2]).toBe("Luis");
        });
        it("envía string vacío y fecha null si no vienen", async () => {
            await createMaterial(crearReq({ body: { nombre_material: "Cable", stock: 3 }, user }), res);
            const args = createMaterialSer.mock.calls[0];
            expect(args[1]).toBeNull();
            expect(args[2]).toBe("");
        });
        describe("determinación de la carrera", () => {
            it("usa la carrera del usuario autenticado", async () => {
                await createMaterial(crearReq({ body: { ...bodyBase, carreraId: 9 }, user: { id: 1, carreraId: 2 } }), res);
                expect(createMaterialSer.mock.calls[0][4]).toBe(2);
            });
            it("usa carreraId del body si el usuario no tiene carrera", async () => {
                await createMaterial(crearReq({ body: { ...bodyBase, carreraId: 9 }, user: { id: 1 } }), res);
                expect(createMaterialSer.mock.calls[0][4]).toBe(9);
                expect(repos.user.findOne).not.toHaveBeenCalled();
            });
            it("usa id_carrera del body como alternativa", async () => {
                await createMaterial(crearReq({ body: { ...bodyBase, id_carrera: 8 }, user: {} }), res);
                expect(createMaterialSer.mock.calls[0][4]).toBe(8);
            });
            it("busca la carrera en la BD a partir del id del usuario", async () => {
                repos.user.findOne.mockResolvedValue({ id: 1, carreraId: 4 });
                await createMaterial(crearReq({ body: bodyBase, user: { id: 1 } }), res);
                expect(repos.user.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
                expect(createMaterialSer.mock.calls[0][4]).toBe(4);
            });
            it("toma la primera carrera registrada si no hay ninguna otra", async () => {
                repos.user.findOne.mockResolvedValue({ id: 1 });
                repos.carrera.findOne.mockResolvedValue({ id_carrera: 6 });
                await createMaterial(crearReq({ body: bodyBase, user: { id: 1 } }), res);
                expect(repos.carrera.findOne).toHaveBeenCalledWith({ where: {} });
                expect(createMaterialSer.mock.calls[0][4]).toBe(6);
            });
            it("funciona sin req.user (toma la primera carrera)", async () => {
                repos.carrera.findOne.mockResolvedValue({ id_carrera: 6 });
                await createMaterial(crearReq({ body: bodyBase }), res);
                expect(repos.user.findOne).not.toHaveBeenCalled();
                expect(createMaterialSer.mock.calls[0][4]).toBe(6);
            });
            it("responde 400 si no hay ninguna carrera disponible", async () => {
                await createMaterial(crearReq({ body: bodyBase, user: { id: 1 } }), res);
                expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "No se encontró ninguna carrera disponible para asociar al material");
                expect(createMaterialSer).not.toHaveBeenCalled();
            });
        });
        describe("tne", () => {
            it("prioriza tne_entregada sobre paso_tne", async () => {
                await createMaterial(crearReq({ body: { ...bodyBase, tne_entregada: true, paso_tne: false }, user }), res);
                expect(createMaterialSer.mock.calls[0][6]).toBe(true);
            });
            it("usa paso_tne si no viene tne_entregada", async () => {
                await createMaterial(crearReq({ body: { ...bodyBase, paso_tne: true }, user }), res);
                expect(createMaterialSer.mock.calls[0][6]).toBe(true);
            });
        });
        it("responde 400 con el error del servicio", async () => {
            createMaterialSer.mockResolvedValue({ data: null, error: "duplicado" });
            await createMaterial(crearReq({ body: bodyBase, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "duplicado");
        });
        it("responde 400 con mensaje genérico si no hay data ni error", async () => {
            createMaterialSer.mockResolvedValue({ data: null, error: null });
            await createMaterial(crearReq({ body: bodyBase, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Error al registrar el material");
        });
        it("responde 201 al crear correctamente", async () => {
            await createMaterial(crearReq({ body: bodyBase, user }), res);
            expect(handleSuccess).toHaveBeenCalledWith(res, 201, "Material registrado exitosamente", { id_material: 1 });
        });
        it("responde 500 si hay una excepción", async () => {
            createMaterialSer.mockRejectedValue(new Error("boom"));
            await createMaterial(crearReq({ body: bodyBase, user }), res);
            expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error interno del servidor", "boom");
        });
    });
    describe("getMateriales", () => {
        it("usa la carrera y el rol del usuario", async () => {
            getMaterialesSer.mockResolvedValue([{ id_material: 1 }]);
            await getMateriales(crearReq({ user: { carreraId: 2, role: "usuario" } }), res);
            expect(getMaterialesSer).toHaveBeenCalledWith(2, "usuario");
            expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Materiales obtenidos exitosamente", [{ id_material: 1 }]);
        });
        it("prioriza 'rol' sobre 'role'", async () => {
            getMaterialesSer.mockResolvedValue([]);
            await getMateriales(crearReq({ user: { rol: "administrador", role: "usuario" } }), res);
            expect(getMaterialesSer.mock.calls[0][1]).toBe("administrador");
        });
        it("prioriza el carreraId de la query sobre el del usuario", async () => {
            getMaterialesSer.mockResolvedValue([]);
            await getMateriales(crearReq({ query: { carreraId: "5" }, user: { carreraId: 2, role: "administrador" } }), res);
            expect(getMaterialesSer).toHaveBeenCalledWith(5, "administrador");
        });
        it("funciona sin req.user", async () => {
            getMaterialesSer.mockResolvedValue([]);
            await getMateriales(crearReq(), res);
            expect(getMaterialesSer).toHaveBeenCalledWith(undefined, undefined);
        });
        it("responde 500 si el servicio devuelve null", async () => {
            getMaterialesSer.mockResolvedValue(null);
            await getMateriales(crearReq({ user: {} }), res);
            expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error interno del servidor al obtener los materiales");
        });
        it("responde 500 si hay una excepción", async () => {
            getMaterialesSer.mockRejectedValue(new Error("boom"));
            await getMateriales(crearReq({ user: {} }), res);
            expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error interno del servidor", "boom");
        });
    });
    describe("getMaterialById", () => {
        it.each([["abc"], [undefined]])("responde 400 si el id es %s", async (id) => {
            await getMaterialById(crearReq({ params: { id_material: id } }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "El id del material es inválido");
            expect(getMaterialSer).not.toHaveBeenCalled();
        });
        it("responde 404 si el material no existe", async () => {
            getMaterialSer.mockResolvedValue(null);
            await getMaterialById(crearReq({ params: { id_material: "3" }, user: {} }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 404, MATERIAL_NO_ENCONTRADO);
        });
        it("responde 200 y consulta con id, carrera y rol", async () => {
            const material = { id_material: 3 };
            getMaterialSer.mockResolvedValue(material);
            await getMaterialById(crearReq({ params: { id_material: "3" }, user: { carreraId: 2, role: "usuario" } }), res);
            expect(getMaterialSer).toHaveBeenCalledWith(3, 2, "usuario");
            expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Material encontrado", material);
        });
        it("responde 500 si hay una excepción", async () => {
            getMaterialSer.mockRejectedValue(new Error("boom"));
            await getMaterialById(crearReq({ params: { id_material: "3" } }), res);
            expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error interno del servidor", "boom");
        });
    });
    describe("patchMaterialById", () => {
        const user = { carreraId: 2, role: "usuario" };
        const materialBase = (extra = {}) => ({
            id_material: 3,
            nombre_material: "Proyector",
            estado_prestamo: "disponible",
            stock: 5,
            tne_entregada: false,
            carreraId: 2,
            ...extra,
        });
        const ejecutar = async (body, material = materialBase()) => {
            getMaterialSer.mockResolvedValue(material);
            patchMaterialSer.mockImplementation(async (m) => ({
                data: m,
                message: "Material actualizado",
            }));
            await patchMaterialById(crearReq({ params: { id_material: "3" }, body, user }), res);
            return material;
        };
        it("responde 400 si no hay body", async () => {
            await patchMaterialById(crearReq({ body: undefined, params: { id_material: "3" } }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Datos no proporcionados");
        });
        it("responde 400 si el id es inválido", async () => {
            idValidation.validate.mockReturnValue(validacionFalla("id inválido"));
            await patchMaterialById(crearReq({ params: { id_material: "abc" } }), res);
            expect(idValidation.validate).toHaveBeenCalledWith({ id: "abc" });
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "id inválido");
        });
        it("responde 400 si falla integrityValidation", async () => {
            integrityValidation.validate.mockReturnValue(validacionFalla("extra"));
            await patchMaterialById(crearReq({ params: { id_material: "3" }, body: {} }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Parámetros inválidos", "extra");
        });
        it("responde 400 si falla updateValidation", async () => {
            updateValidation.validate.mockReturnValue(validacionFalla("vacío"));
            await patchMaterialById(crearReq({ params: { id_material: "3" }, body: {} }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Faltó actualizar parámetros", "vacío");
        });
        it("responde 404 si el material no existe", async () => {
            getMaterialSer.mockResolvedValue(null);
            await patchMaterialById(crearReq({ params: { id_material: "3" }, body: { stock: 1 }, user }), res);
            expect(getMaterialSer).toHaveBeenCalledWith(3, 2, "usuario");
            expect(handleErrorClient).toHaveBeenCalledWith(res, 404, MATERIAL_NO_ENCONTRADO);
        });
        describe("manejo de stock según el estado", () => {
            it("descuenta 1 al pasar a prestado", async () => {
                const m = await ejecutar({ estado_prestamo: "prestado" });
                expect(m.stock).toBe(4);
            });
            it("responde 400 al pasar a prestado sin stock", async () => {
                await ejecutar({ estado_prestamo: "prestado" }, materialBase({ stock: 0 }));
                expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "No hay stock disponible para prestar este material");
                expect(patchMaterialSer).not.toHaveBeenCalled();
            });
            it.each(["devuelto", "disponible"])("suma 1 al pasar de prestado a %s", async (estado) => {
                const m = await ejecutar({ estado_prestamo: estado }, materialBase({ estado_prestamo: "prestado", stock: 2 }));
                expect(m.stock).toBe(3);
            });
            it("no cambia el stock si el estado no cambia", async () => {
                const m = await ejecutar({ nombre_material: "Otro" });
                expect(m.stock).toBe(5);
            });
            it("no cambia el stock si sigue prestado", async () => {
                const m = await ejecutar({ estado_prestamo: "prestado" }, materialBase({ estado_prestamo: "prestado", stock: 2 }));
                expect(m.stock).toBe(2);
            });
            it("usa el stock del body como base cuando viene", async () => {
                const m = await ejecutar({ stock: 10, estado_prestamo: "prestado" });
                expect(m.stock).toBe(9);
            });
        });
        describe("campos", () => {
            it("copia los campos del body al material", async () => {
                const m = await ejecutar({ nombre_material: "Notebook" });
                expect(m.nombre_material).toBe("Notebook");
            });
            it("mapea 'prestatario' a nombre_prestamo", async () => {
                const m = await ejecutar({ prestatario: "Luis" });
                expect(m.nombre_prestamo).toBe("Luis");
                expect(m.prestatario).toBeUndefined();
            });
            it("no pisa nombre_prestamo si ambos vienen", async () => {
                const m = await ejecutar({ prestatario: "Luis", nombre_prestamo: "Ana" });
                expect(m.nombre_prestamo).toBe("Ana");
            });
            it("convierte paso_tne en tne_entregada", async () => {
                const m = await ejecutar({ paso_tne: true });
                expect(m.tne_entregada).toBe(true);
                expect(m.paso_tne).toBeUndefined();
            });
            it("prioriza tne_entregada sobre paso_tne", async () => {
                const m = await ejecutar({ paso_tne: true, tne_entregada: false });
                expect(m.tne_entregada).toBe(false);
            });
            it.each([["carreraId"], ["id_carrera"]])("actualiza la carrera con %s", async (campo) => {
                const m = await ejecutar({ [campo]: "7" });
                expect(m.carreraId).toBe(7);
                expect(m.carrera).toEqual({ id_carrera: 7 });
            });
        });
        it("responde 400 si patchMaterialSer no devuelve data", async () => {
            getMaterialSer.mockResolvedValue(materialBase());
            patchMaterialSer.mockResolvedValue({ data: null, message: "falló" });
            await patchMaterialById(crearReq({ params: { id_material: "3" }, body: { stock: 1 }, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "falló");
        });
        it("responde 200 con el mensaje y data del servicio", async () => {
            await ejecutar({ nombre_material: "Notebook" });
            expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Material actualizado", expect.objectContaining({ nombre_material: "Notebook" }));
        });
        it("responde 500 si hay una excepción", async () => {
            getMaterialSer.mockRejectedValue(new Error("boom"));
            await patchMaterialById(crearReq({ params: { id_material: "3" }, body: { stock: 1 }, user }), res);
            expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error interno del servidor", "boom");
        });
    });
    describe("deleteMaterialById", () => {
        const user = { carreraId: 2, role: "usuario" };
        it.each([["abc"], [undefined]])("responde 400 si el id es %s", async (id) => {
            await deleteMaterialById(crearReq({ params: { id_material: id } }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "El id del material es inválido");
        });
        it("responde 404 si el material no existe", async () => {
            getMaterialSer.mockResolvedValue(null);
            await deleteMaterialById(crearReq({ params: { id_material: "3" }, user }), res);
            expect(getMaterialSer).toHaveBeenCalledWith(3, 2, "usuario");
            expect(handleErrorClient).toHaveBeenCalledWith(res, 404, MATERIAL_NO_ENCONTRADO);
            expect(deleteMaterialSer).not.toHaveBeenCalled();
        });
        it("responde 400 si el servicio no devuelve result", async () => {
            getMaterialSer.mockResolvedValue({ id_material: 3 });
            deleteMaterialSer.mockResolvedValue({ message: "no se pudo", result: undefined });
            await deleteMaterialById(crearReq({ params: { id_material: "3" }, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "no se pudo");
        });
        it("responde 400 si no se afectó ningún registro", async () => {
            getMaterialSer.mockResolvedValue({ id_material: 3 });
            deleteMaterialSer.mockResolvedValue({ message: "nada eliminado", result: { affected: 0 } });
            await deleteMaterialById(crearReq({ params: { id_material: "3" }, user }), res);
            expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "nada eliminado");
        });
        it("responde 200 al eliminar correctamente", async () => {
            getMaterialSer.mockResolvedValue({ id_material: 3 });
            deleteMaterialSer.mockResolvedValue({ message: "Material eliminado", result: { affected: 1 } });
            await deleteMaterialById(crearReq({ params: { id_material: "3" }, user }), res);
            expect(deleteMaterialSer).toHaveBeenCalledWith(3);
            expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Material eliminado");
        });
        it("responde 500 si hay una excepción", async () => {
            getMaterialSer.mockRejectedValue(new Error("boom"));
            await deleteMaterialById(crearReq({ params: { id_material: "3" }, user }), res);
            expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error al eliminar el material", "boom");
        });
    });
});
