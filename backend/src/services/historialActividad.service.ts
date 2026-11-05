import { AppDataSource } from "../config/configDb.js";
import HistorialActividadEntity, { IHistorialActividad } from "../entity/historialActividad.entity.js";
import { MoreThanOrEqual } from "typeorm";

export interface RegistrarActividadParams {
  usuarioId?: number | null;
  usuarioEmail?: string | null;
  usuarioNombre?: string | null;
  rol?: string | null;
  accion: string;
  modulo: string;
  descripcion: string;
  detalles?: any;
  ip: string;
  dispositivo?: string | null;
  metodoHttp?: string | null;
  ruta?: string | null;
  estadoHttp?: number | null;
  esSospechoso?: boolean;
  motivoSospecha?: string | null;
}

export async function registrarActividad(params: RegistrarActividadParams): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(HistorialActividadEntity);

    let esSospechoso = Boolean(params.esSospechoso);
    let motivoSospecha = params.motivoSospecha || null;

    // Regla de detección de anomalía 1: Múltiples fallos de inicio de sesión desde la misma IP o email en los últimos 15 min
    if (params.accion === "LOGIN_FALLIDO") {
      const quinceMinAtras = new Date(Date.now() - 15 * 60 * 1000);
      const fallosRecientes = await repo.count({
        where: [
          { ip: params.ip, accion: "LOGIN_FALLIDO", createdAt: MoreThanOrEqual(quinceMinAtras) },
          ...(params.usuarioEmail
            ? [{ usuarioEmail: params.usuarioEmail, accion: "LOGIN_FALLIDO", createdAt: MoreThanOrEqual(quinceMinAtras) }]
            : [])
        ]
      });

      if (fallosRecientes >= 2) { // Este es el 3er intento o más
        esSospechoso = true;
        motivoSospecha = `Múltiples intentos fallidos de inicio de sesión (${fallosRecientes + 1} intentos en 15 min)`;
      }
    }

    // Regla 2: Intento de acceso no autorizado (401/403)
    if (params.estadoHttp === 401 || params.estadoHttp === 403) {
      esSospechoso = true;
      if (!motivoSospecha) {
        motivoSospecha = `Acceso denegado o permisos insuficientes (Código HTTP ${params.estadoHttp})`;
      }
    }

    // Regla 3: Acciones críticas destructivas (eliminación de usuario, etc.)
    if (params.accion.includes("ELIMINAR_USUARIO") || params.accion.includes("ELIMINAR_CARRERA")) {
      esSospechoso = true;
      motivoSospecha = "Acción destructiva de alto impacto sobre el sistema";
    }

    const detallesStr = typeof params.detalles === "object"
      ? JSON.stringify(params.detalles)
      : params.detalles ? String(params.detalles) : null;

    const nuevaActividad = repo.create({
      usuarioId: params.usuarioId || null,
      usuarioEmail: params.usuarioEmail || null,
      usuarioNombre: params.usuarioNombre || null,
      rol: params.rol || null,
      accion: params.accion,
      modulo: params.modulo,
      descripcion: params.descripcion,
      detalles: detallesStr,
      ip: params.ip,
      dispositivo: params.dispositivo || null,
      metodoHttp: params.metodoHttp || null,
      ruta: params.ruta || null,
      estadoHttp: params.estadoHttp || null,
      esSospechoso,
      motivoSospecha,
    });

    await repo.save(nuevaActividad);
  } catch (error) {
    console.error("Error al registrar actividad en auditoría:", error);
  }
}

export async function listarHistorialService(filtros: {
  buscar?: string;
  soloSospechosos?: boolean;
  fecha?: string;
  modulo?: string;
}) {
  try {
    const repo = AppDataSource.getRepository(HistorialActividadEntity);
    const query = repo.createQueryBuilder("historial");

    if (filtros.soloSospechosos) {
      query.andWhere("historial.esSospechoso = :sospechoso", { sospechoso: true });
    }

    if (filtros.modulo) {
      query.andWhere("historial.modulo = :modulo", { modulo: filtros.modulo });
    }

    if (filtros.fecha) {
      // fecha en formato YYYY-MM-DD
      query.andWhere("DATE(historial.createdAt) = :fecha", { fecha: filtros.fecha });
    }

    if (filtros.buscar && filtros.buscar.trim()) {
      const q = `%${filtros.buscar.trim().toLowerCase()}%`;
      query.andWhere(
        "(LOWER(historial.descripcion) LIKE :q OR LOWER(historial.accion) LIKE :q OR LOWER(historial.usuarioEmail) LIKE :q OR LOWER(historial.usuarioNombre) LIKE :q OR LOWER(historial.ip) LIKE :q OR LOWER(historial.dispositivo) LIKE :q)",
        { q }
      );
    }

    query.orderBy("historial.createdAt", "DESC");
    query.limit(200);

    const actividades = await query.getMany();
    return [actividades, null];
  } catch (error: any) {
    console.error("Error al obtener historial de actividades:", error);
    return [null, error.message || "Error al listar actividades"];
  }
}

export async function eliminarRegistroHistorialService(id: number) {
  try {
    const repo = AppDataSource.getRepository(HistorialActividadEntity);
    const registro = await repo.findOneBy({ id });
    if (!registro) {
      return [null, "Registro no encontrado"];
    }
    await repo.delete(id);
    return [registro, null];
  } catch (error: any) {
    return [null, error.message || "Error al eliminar registro"];
  }
}

