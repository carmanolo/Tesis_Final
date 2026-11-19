import { getReunionSer } from "../services/reunion.service.js";
import { contenidoValidation } from "../validations/reunion.validations.js";
import { obtenerContenidoActaSer, guardarContenidoActaSer, finalizarActaSer, generarActaPdf, generarActaDocx } from "../services/acta.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
const ROLES_GESTION_ACTAS = ["presidente cee", "vicepresidente cee", "secretario cee"];
function parseId(req) {
    const n = Number(req.params.id_reunion);
    return Number.isInteger(n) && n > 0 ? n : null;
}
// Verifica que la reunión exista y pertenezca a la carrera del usuario
async function reunionPermitida(req, id) {
    const { carreraId, rol, role } = req.user || {};
    return getReunionSer(id, carreraId, rol || role);
}
export async function getContenidoActa(req, res) {
    try {
        const id = parseId(req);
        if (!id)
            return handleErrorClient(res, 400, "el id de la reunión es inválido");
        if (!(await reunionPermitida(req, id)))
            return handleErrorClient(res, 404, "Reunión no encontrada");
        const reunion = await obtenerContenidoActaSer(id);
        // Usuarios sin rol de gestión solo ven el acta cuando ya está finalizada
        const { rol, role } = req.user || {};
        const rolActual = rol || role || "";
        const puedeVerBorrador = ROLES_GESTION_ACTAS.includes(rolActual);
        if (!puedeVerBorrador && reunion?.acta_estado !== "finalizada") {
            return handleErrorClient(res, 403, "El acta aún no ha sido publicada");
        }
        return handleSuccess(res, 200, "Contenido del acta obtenido", {
            contenido: reunion?.contenido_acta ?? "",
            acta_estado: reunion?.acta_estado ?? null,
        });
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function guardarContenidoActa(req, res) {
    try {
        const id = parseId(req);
        if (!id)
            return handleErrorClient(res, 400, "el id de la reunión es inválido");
        if (!(await reunionPermitida(req, id)))
            return handleErrorClient(res, 404, "Reunión no encontrada");
        const { error } = contenidoValidation.validate(req.body);
        if (error)
            return handleErrorClient(res, 400, "parametros invalidos", error.message);
        const result = await guardarContenidoActaSer(id, req.body.contenido);
        if (!result.data)
            return handleErrorClient(res, 400, result.message);
        return handleSuccess(res, 200, result.message, result.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function exportarActa(req, res) {
    try {
        const id = parseId(req);
        if (!id)
            return handleErrorClient(res, 400, "el id de la reunión es inválido");
        if (!(await reunionPermitida(req, id)))
            return handleErrorClient(res, 404, "Reunión no encontrada");
        const formato = String(req.query.formato || "pdf").toLowerCase();
        if (!["pdf", "docx"].includes(formato)) {
            return handleErrorClient(res, 400, "Formato inválido. Use pdf o docx");
        }
        const reunion = await obtenerContenidoActaSer(id);
        if (!reunion?.contenido_acta?.trim()) {
            return handleErrorClient(res, 404, "El acta aún no tiene contenido");
        }
        const fecha = String(reunion.fecha_reunion).slice(0, 10);
        if (formato === "pdf") {
            const pdf = await generarActaPdf(reunion, reunion.contenido_acta);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="Acta_reunion_${fecha}.pdf"`);
            return res.send(pdf);
        }
        const docx = await generarActaDocx(reunion, reunion.contenido_acta);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="Acta_reunion_${fecha}.docx"`);
        return res.send(docx);
    }
    catch (error) {
        console.error("Error al exportar el acta", error);
        return handleErrorServer(res, 500, "Error al generar el archivo", error.message);
    }
}
// genera el PDF oficial y lo publica como acta de la reunión
export async function finalizarActa(req, res) {
    try {
        const id = parseId(req);
        if (!id)
            return handleErrorClient(res, 400, "el id de la reunión es inválido");
        if (!(await reunionPermitida(req, id)))
            return handleErrorClient(res, 404, "Reunión no encontrada");
        const result = await finalizarActaSer(id);
        if (!result.data)
            return handleErrorClient(res, 400, result.message);
        return handleSuccess(res, 200, result.message, result.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
