import { beforeEach, describe, expect, it, vi } from "vitest";


const repos = vi.hoisted(() => ({
  user: { findOne: vi.fn() },
  carrera: { findOne: vi.fn() },
}));

vi.mock("../../entity/user.entity.js", () => ({ default: { nombre: "UserEntity" } }));
vi.mock("../../entity/carrera.entity.js", () => ({ default: { nombre: "CarreraEntity" } }));

vi.mock("../../config/configDb.js", () => ({
  AppDataSource: { getRepository: vi.fn() },
}));

vi.mock("../../services/reunion.service.js", () => ({
  getReunionSer: vi.fn(),
  getReunionesSer: vi.fn(),
  createReunionSer: vi.fn(),
  patchReunionSer: vi.fn(),
  deleteReunionSer: vi.fn(),
  subirActaSer: vi.fn(),
  obtenerActaSer: vi.fn(),
}));

vi.mock("../../validations/reunion.validations.js", () => ({
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

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock("../../constants/reunion.constants.js", () => ({
  REUNION_NO_ENCONTRADA: "Reunión no encontrada",
  ACTA_NO_PROPORCIONADA: "No se proporcionó ningún archivo",
  ACTA_UPLOAD_DIR: "/uploads/actas",
  MIN_DESCRIPCION: 5,
  MAX_DESCRIPCION: 500,
}));

// Imports
import {
  createReunion,
  deleteReunionById,
  getReunionById,
  getReuniones,
  patchReunionById,
  subirActa,
  descargarActa,
} from "../../controllers/reunion.controller.js";
import {
  createReunionSer,
  deleteReunionSer,
  getReunionSer,
  getReunionesSer,
  patchReunionSer,
  subirActaSer,
  obtenerActaSer,
} from "../../services/reunion.service.js";
import {
  createValidation,
  integrityValidation,
  updateValidation,
} from "../../validations/reunion.validations.js";
import { idValidation } from "../../validations/modules/id.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../../handlers/responseHandlers.js";
import { AppDataSource } from "../../config/configDb.js";
import UserEntity from "../../entity/user.entity.js";
import CarreraEntity from "../../entity/carrera.entity.js";
import fs from "fs";
import { REUNION_NO_ENCONTRADA } from "../../constants/reunion.constants.js";

// Helpers
const res: any = {};
const crearReq = (parcial: Record<string, any> = {}) =>
  ({ body: {}, params: {}, query: {}, ...parcial }) as any;

const validacionOk = { error: undefined };
const validacionFalla = (message: string) => ({ error: { message, cause: message } });

// Tests
describe("reunion.controller - Pruebas Unitarias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
     vi.spyOn(console, "error").mockImplementation(() => {});

    (AppDataSource.getRepository as any).mockImplementation((entidad: any) => {
      if (entidad === UserEntity) return repos.user;
      if (entidad === CarreraEntity) return repos.carrera;
      return repos.carrera;
    });
    repos.user.findOne.mockResolvedValue(null);
    repos.carrera.findOne.mockResolvedValue(null);

    (integrityValidation.validate as any).mockReturnValue(validacionOk);
    (createValidation.validate as any).mockReturnValue(validacionOk);
    (updateValidation.validate as any).mockReturnValue(validacionOk);
    (idValidation.validate as any).mockReturnValue(validacionOk);
  });

  // createReunion
  describe("createReunion", () => {
    const bodyBase = {
      fecha_reunion: "2026-10-20",
      descripcion: "Reunión de coordinación",
    };
    const user = { id: 1, carreraId: 2 };

    beforeEach(() => {
      (createReunionSer as any).mockResolvedValue({
        data: { id_reunion: 1 },
        error: null,
      });
    });

    const argsLlamada = () => (createReunionSer as any).mock.calls[0];

    it("responde 400 si no hay body", async () => {
      await createReunion(crearReq({ body: undefined, user }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "datos no proporcionados"
      );
    });

    it("responde 400 si falla integrityValidation", async () => {
      (integrityValidation.validate as any).mockReturnValue(validacionFalla("extra"));
      await createReunion(crearReq({ body: bodyBase, user }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "parametros invalidos", "extra"
      );
      expect(createReunionSer).not.toHaveBeenCalled();
    });

    it("responde 400 si falla createValidation", async () => {
      (createValidation.validate as any).mockReturnValue(validacionFalla("falta descripcion"));
      await createReunion(crearReq({ body: bodyBase, user }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "faltan parametros", "falta descripcion"
      );
      expect(createReunionSer).not.toHaveBeenCalled();
    });

    it("responde 401 si no hay usuario autenticado", async () => {
      await createReunion(crearReq({ body: bodyBase, user: undefined }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 401, "usuario no autenticado"
      );
      expect(createReunionSer).not.toHaveBeenCalled();
    });

    it("usa la carrera del usuario autenticado", async () => {
      await createReunion(
        crearReq({ body: { ...bodyBase, carreraId: 9 }, user: { id: 1, carreraId: 2 } }),
        res
      );
      expect(argsLlamada()).toEqual([
        "2026-10-20",
        "Reunión de coordinación",
        1,
        2,
      ]);
    });

    it("usa carreraId del body si el usuario no tiene carrera", async () => {
      await createReunion(
        crearReq({ body: { ...bodyBase, carreraId: 9 }, user: { id: 1 } }),
        res
      );
      expect(argsLlamada()[3]).toBe(9);
      expect(repos.user.findOne).not.toHaveBeenCalled();
    });

    it("usa id_carrera del body como alternativa", async () => {
      await createReunion(
        crearReq({ body: { ...bodyBase, id_carrera: 8 }, user: { id: 1 } }),
        res
      );
      expect(argsLlamada()[3]).toBe(8);
    });

    it("convierte la carrera a número", async () => {
      await createReunion(
        crearReq({ body: { ...bodyBase, carreraId: "9" }, user: { id: 1 } }),
        res
      );
      expect(argsLlamada()[3]).toBe(9);
    });

    it("busca la carrera del usuario en la BD si no viene en token ni body", async () => {
      repos.user.findOne.mockResolvedValue({ id: 1, carreraId: 4 });
      await createReunion(crearReq({ body: bodyBase, user: { id: 1 } }), res);
      expect(repos.user.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(argsLlamada()[3]).toBe(4);
      expect(repos.carrera.findOne).not.toHaveBeenCalled();
    });

    it("toma la primera carrera registrada si no hay ninguna otra", async () => {
      repos.user.findOne.mockResolvedValue({ id: 1 });
      repos.carrera.findOne.mockResolvedValue({ id_carrera: 6 });
      await createReunion(crearReq({ body: bodyBase, user: { id: 1 } }), res);
      expect(repos.carrera.findOne).toHaveBeenCalledWith({ where: {} });
      expect(argsLlamada()[3]).toBe(6);
    });

    it("responde 400 si no hay ninguna carrera disponible", async () => {
      repos.user.findOne.mockResolvedValue({ id: 1 });
      repos.carrera.findOne.mockResolvedValue(null);
      await createReunion(crearReq({ body: bodyBase, user: { id: 1 } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res,
        400,
        "No se encontró ninguna carrera disponible para asociar a la reunión"
      );
      expect(createReunionSer).not.toHaveBeenCalled();
    });

    it("responde 400 con el error del servicio", async () => {
      (createReunionSer as any).mockResolvedValue({ data: null, error: "duplicado" });
      await createReunion(crearReq({ body: bodyBase, user }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "duplicado");
    });

    it("responde 400 con mensaje genérico si no hay data ni error", async () => {
      (createReunionSer as any).mockResolvedValue({ data: null, error: null });
      await createReunion(crearReq({ body: bodyBase, user }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "error al registrar la reunión"
      );
    });

    it("responde 201 al crear correctamente", async () => {
      await createReunion(crearReq({ body: bodyBase, user }), res);
      expect(handleSuccess).toHaveBeenCalledWith(
        res, 201, "Reunión registrada exitosamente", { id_reunion: 1 }
      );
    });

    it("responde 500 si hay una excepción", async () => {
      (createReunionSer as any).mockRejectedValue(new Error("boom"));
      await createReunion(crearReq({ body: bodyBase, user }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "error interno del servidor", "boom"
      );
    });
  });

  // getReuniones
  describe("getReuniones", () => {
    it("usa la carrera y el rol del usuario", async () => {
      (getReunionesSer as any).mockResolvedValue([{ id_reunion: 1 }]);
      await getReuniones(crearReq({ user: { carreraId: 2, role: "usuario" } }), res);
      expect(getReunionesSer).toHaveBeenCalledWith(2, "usuario");
      expect(handleSuccess).toHaveBeenCalledWith(
        res, 200, "Reuniones obtenidas exitosamente", [{ id_reunion: 1 }]
      );
    });

    it("prioriza 'rol' sobre 'role'", async () => {
      (getReunionesSer as any).mockResolvedValue([]);
      await getReuniones(crearReq({ user: { rol: "administrador", role: "usuario" } }), res);
      expect((getReunionesSer as any).mock.calls[0][1]).toBe("administrador");
    });

    it("prioriza el carreraId de la query sobre el del usuario", async () => {
      (getReunionesSer as any).mockResolvedValue([]);
      await getReuniones(
        crearReq({
          query: { carreraId: "5" },
          user: { carreraId: 2, role: "administrador" },
        }),
        res
      );
      expect(getReunionesSer).toHaveBeenCalledWith(5, "administrador");
    });

    it("funciona sin req.user", async () => {
      (getReunionesSer as any).mockResolvedValue([]);
      await getReuniones(crearReq(), res);
      expect(getReunionesSer).toHaveBeenCalledWith(undefined, undefined);
    });

    it("responde 500 si el servicio devuelve null", async () => {
      (getReunionesSer as any).mockResolvedValue(null);
      await getReuniones(crearReq({ user: {} }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "Error interno del servidor"
      );
    });

    it("responde 500 si hay una excepción", async () => {
      (getReunionesSer as any).mockRejectedValue(new Error("boom"));
      await getReuniones(crearReq({ user: {} }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "Error interno del servidor", "boom"
      );
    });
  });

  // getReunionById
  describe("getReunionById", () => {
    it.each([["abc"], [undefined]])("responde 400 si el id es %s", async (id) => {
      await getReunionById(crearReq({ params: { id_reunion: id } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "el id de la reunión es inválido"
      );
      expect(getReunionSer).not.toHaveBeenCalled();
    });

    it("responde 404 si la reunión no existe", async () => {
      (getReunionSer as any).mockResolvedValue(null);
      await getReunionById(
        crearReq({ params: { id_reunion: "3" }, user: {} }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "Reunión no encontrada");
    });

    it("responde 200 y consulta con id, carrera y rol", async () => {
      const reunion = { id_reunion: 3 };
      (getReunionSer as any).mockResolvedValue(reunion);
      await getReunionById(
        crearReq({
          params: { id_reunion: "3" },
          user: { carreraId: 2, role: "usuario" },
        }),
        res
      );
      expect(getReunionSer).toHaveBeenCalledWith(3, 2, "usuario");
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Reunión encontrada", reunion);
    });

    it("responde 500 si hay una excepción", async () => {
      (getReunionSer as any).mockRejectedValue(new Error("boom"));
      await getReunionById(crearReq({ params: { id_reunion: "3" } }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "Error interno del servidor", "boom"
      );
    });
  });

  // patchReunionById
  describe("patchReunionById", () => {
    const user = { carreraId: 2, role: "usuario" };
    const reunionBase = (extra: Record<string, any> = {}) => ({
      id_reunion: 3,
      fecha_reunion: "2026-10-20T00:00:00.000Z",
      descripcion: "original",
      carreraId: 2,
      recordatorio_enviado: true,
      ...extra,
    });

    const ejecutar = async (body: Record<string, any>, reunion = reunionBase()) => {
      (getReunionSer as any).mockResolvedValue(reunion);
      (patchReunionSer as any).mockImplementation(async (r: any) => ({
        data: r,
        message: "Reunión actualizada con éxito",
        error: null,
      }));
      await patchReunionById(
        crearReq({ params: { id_reunion: "3" }, body, user }),
        res
      );
      return reunion as any;
    };

    it("responde 400 si no hay body o params", async () => {
      await patchReunionById(
        crearReq({ body: undefined, params: { id_reunion: "3" } }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "datos no proporcionados");
    });

    it("responde 400 si no viene id_reunion", async () => {
      await patchReunionById(crearReq({ params: {}, body: { descripcion: "x" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "el id de la reunión es obligatorio"
      );
      expect(getReunionSer).not.toHaveBeenCalled();
    });

    it("responde 400 si idValidation falla", async () => {
      (idValidation.validate as any).mockReturnValue(validacionFalla("id inválido"));
      await patchReunionById(
        crearReq({ params: { id_reunion: "abc" }, body: { descripcion: "x" } }),
        res
      );
      expect(idValidation.validate).toHaveBeenCalledWith({ id: "abc" });
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "id inválido");
      expect(getReunionSer).not.toHaveBeenCalled();
    });

    it("responde 400 si falla integrityValidation", async () => {
      (integrityValidation.validate as any).mockReturnValue(validacionFalla("extra"));
      await patchReunionById(
        crearReq({ params: { id_reunion: "3" }, body: { descripcion: "x" } }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "Parámetros invalidos", "extra"
      );
    });

    it("responde 400 si falla updateValidation", async () => {
      (updateValidation.validate as any).mockReturnValue(validacionFalla("vacío"));
      await patchReunionById(
        crearReq({ params: { id_reunion: "3" }, body: {} }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "faltó actualizar parametros", "vacío"
      );
    });

    it("responde 404 si la reunión no existe", async () => {
      (getReunionSer as any).mockResolvedValue(null);
      await patchReunionById(
        crearReq({ params: { id_reunion: "3" }, body: { descripcion: "x" }, user }),
        res
      );
      expect(getReunionSer).toHaveBeenCalledWith(3, 2, "usuario");
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "Reunión no encontrada");
      expect(patchReunionSer).not.toHaveBeenCalled();
    });

    it("actualiza descripción sin tocar recordatorio", async () => {
      const r = await ejecutar({ descripcion: "nueva" });
      expect(r.descripcion).toBe("nueva");
      expect(r.recordatorio_enviado).toBe(true);
      expect(handleSuccess).toHaveBeenCalledWith(
        res,
        200,
        "Reunión actualizada con éxito",
        expect.objectContaining({ descripcion: "nueva" })
      );
    });

    it("resetea recordatorio_enviado si cambia la fecha", async () => {
      const r = await ejecutar({ fecha_reunion: "2026-12-01" });
      expect(r.recordatorio_enviado).toBe(false);
    });

    it("no resetea recordatorio si la fecha tiene el mismo día", async () => {
      const r = await ejecutar({ fecha_reunion: "2026-10-20" });
      expect(r.recordatorio_enviado).toBe(true);
    });

    it.each([["carreraId"], ["id_carrera"]])(
      "actualiza la carrera con %s",
      async (campo) => {
        const r = await ejecutar({ [campo]: "7" });
        expect(r.carreraId).toBe(7);
        expect(r.carrera).toEqual({ id_carrera: 7 });
      }
    );

    it("responde 400 si patchReunionSer no devuelve data", async () => {
      (getReunionSer as any).mockResolvedValue(reunionBase());
      (patchReunionSer as any).mockResolvedValue({
        data: null,
        message: "falló",
        error: null,
      });
      await patchReunionById(
        crearReq({ params: { id_reunion: "3" }, body: { descripcion: "x" }, user }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "falló");
    });

    it("responde 500 si hay una excepción", async () => {
      (getReunionSer as any).mockRejectedValue(new Error("boom"));
      await patchReunionById(
        crearReq({ params: { id_reunion: "3" }, body: { descripcion: "x" }, user }),
        res
      );
      expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "Error interno del servidor", "boom"
      );
    });
  });

  // deleteReunionById
  describe("deleteReunionById", () => {
    const user = { carreraId: 2, role: "usuario" };

    it.each([["abc"], [undefined]])("responde 400 si el id es %s", async (id) => {
      await deleteReunionById(crearReq({ params: { id_reunion: id } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "El id de la reunión es inválido"
      );
      expect(getReunionSer).not.toHaveBeenCalled();
    });

    it("responde 404 si la reunión no existe", async () => {
      (getReunionSer as any).mockResolvedValue(null);
      await deleteReunionById(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect(getReunionSer).toHaveBeenCalledWith(3, 2, "usuario");
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "Reunión no encontrada");
      expect(deleteReunionSer).not.toHaveBeenCalled();
    });

    it("responde 200 al eliminar correctamente", async () => {
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      (deleteReunionSer as any).mockResolvedValue({
        result: { affected: 1 },
        message: "reunión eliminada exitosamente",
      });
      await deleteReunionById(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect(deleteReunionSer).toHaveBeenCalledWith(3);
      expect(handleSuccess).toHaveBeenCalledWith(
        res, 200, "Reunión eliminada exitosamente"
      );
    });

    it("responde 404 si el servicio indica REUNION_NO_ENCONTRADA", async () => {
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      (deleteReunionSer as any).mockResolvedValue({
        result: null,
        message: REUNION_NO_ENCONTRADA,
      });
      await deleteReunionById(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, REUNION_NO_ENCONTRADA);
    });

    it("responde 400 en otros casos", async () => {
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      (deleteReunionSer as any).mockResolvedValue({
        result: { affected: 0 },
        message: "otro error",
      });
      await deleteReunionById(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "otro error", { affected: 0 }
      );
    });

    it("responde 500 si hay una excepción", async () => {
      (getReunionSer as any).mockRejectedValue(new Error("boom"));
      await deleteReunionById(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "Error al eliminar la reunión", "boom"
      );
    });
  });

  // subirActa
  describe("subirActa", () => {
    const user = { carreraId: 2, role: "usuario" };
    const archivo = { path: "/tmp/acta.pdf" } as Express.Multer.File;

    it.each([["abc"], [undefined]])("responde 400 si el id es %s", async (id) => {
      await subirActa(crearReq({ params: { id_reunion: id }, file: archivo }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "el id de la reunión es inválido"
      );
      expect(getReunionSer).not.toHaveBeenCalled();
    });

    it("responde 404 y borra el archivo si la reunión no existe", async () => {
      (getReunionSer as any).mockResolvedValue(null);
      (fs.existsSync as any).mockReturnValue(true);
      await subirActa(
        crearReq({ params: { id_reunion: "3" }, file: archivo, user }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "Reunión no encontrada");
      expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/acta.pdf");
    });

    it("no borra el archivo si no existe en disco", async () => {
      (getReunionSer as any).mockResolvedValue(null);
      (fs.existsSync as any).mockReturnValue(false);
      await subirActa(
        crearReq({ params: { id_reunion: "3" }, file: archivo, user }),
        res
      );
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it("responde 400 si no se envía archivo", async () => {
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      await subirActa(crearReq({ params: { id_reunion: "3" }, user }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "No se proporcionó ningún archivo"
      );
      expect(subirActaSer).not.toHaveBeenCalled();
    });

    it("responde 400 si el servicio falla", async () => {
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      (subirActaSer as any).mockResolvedValue({ data: null, message: "falló" });
      await subirActa(
        crearReq({ params: { id_reunion: "3" }, file: archivo, user }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "falló");
    });

    it("responde 200 al subir correctamente", async () => {
      const data = { id_reunion: 3, nombre_archivo: "acta.pdf" };
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      (subirActaSer as any).mockResolvedValue({
        data,
        message: "Acta subida exitosamente",
      });
      await subirActa(
        crearReq({ params: { id_reunion: "3" }, file: archivo, user }),
        res
      );
      expect(subirActaSer).toHaveBeenCalledWith(3, archivo);
      expect(handleSuccess).toHaveBeenCalledWith(
        res, 200, "Acta subida exitosamente", data
      );
    });

    it("responde 500 si hay una excepción", async () => {
      (getReunionSer as any).mockRejectedValue(new Error("boom"));
      await subirActa(
        crearReq({ params: { id_reunion: "3" }, file: archivo, user }),
        res
      );
      expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "Error interno del servidor", "boom"
      );
    });
  });

  // descargarActa
  describe("descargarActa", () => {
    const user = { carreraId: 2, role: "usuario" };

    beforeEach(() => {
      (res as any).download = vi.fn();
      (res as any).headersSent = false;
    });

    it.each([["abc"], [undefined]])("responde 400 si el id es %s", async (id) => {
      await descargarActa(crearReq({ params: { id_reunion: id } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(
        res, 400, "el id de la reunión es inválido"
      );
      expect(getReunionSer).not.toHaveBeenCalled();
    });

    it("responde 404 si la reunión no existe", async () => {
      (getReunionSer as any).mockResolvedValue(null);
      await descargarActa(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "Reunión no encontrada");
      expect(obtenerActaSer).not.toHaveBeenCalled();
    });

    it("responde 404 si el acta no existe", async () => {
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      (obtenerActaSer as any).mockResolvedValue({ data: null, message: "no hay" });
      await descargarActa(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "no hay");
      expect((res as any).download).not.toHaveBeenCalled();
    });

    it("llama a res.download con la ruta y nombre original", async () => {
      (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
      (obtenerActaSer as any).mockResolvedValue({
        data: {
          ruta_archivo: "/uploads/actas/acta_3.pdf",
          nombre_original: "Acta.pdf",
        },
        message: "ok",
      });
      await descargarActa(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
      );
      expect((res as any).download).toHaveBeenCalledWith(
        expect.stringContaining("acta_3.pdf"),
        "Acta.pdf",
        expect.any(Function)
      );
    });

   it("invoca handleErrorServer si el download falla y no se han enviado headers", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (getReunionSer as any).mockResolvedValue({ id_reunion: 3 });
    (obtenerActaSer as any).mockResolvedValue({
        data: { ruta_archivo: "/uploads/actas/acta_3.pdf", nombre_original: "Acta.pdf" },
        message: "ok",
    });

    (res as any).download = vi.fn((_path: string, _name: string, cb: any) => {
        cb(new Error("download error"));
    });

    await descargarActa(
        crearReq({ params: { id_reunion: "3" }, user }),
        res
    );

    expect(handleErrorServer).toHaveBeenCalledWith(
        res, 500, "Error al descargar el acta"
    );

    // 2. Restauramos el console.error original
    consoleSpy.mockRestore();
    });
  });
});