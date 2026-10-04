import { google } from "googleapis";
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "https://developers.google.com/oauthplayground");
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
// fecha_reunion es de tipo "date": se maneja como evento de día completo
function toDateStr(d) {
    return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}
function nextDayStr(dateStr) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}
function buildEvent(fecha, descripcion, attendees = []) {
    const start = toDateStr(fecha);
    return {
        summary: "Reunión",
        description: descripcion,
        start: { date: start },
        end: { date: nextDayStr(start) }, // en eventos de día completo el fin es exclusivo
        attendees: attendees.map((email) => ({ email })),
        reminders: {
            useDefault: false,
            overrides: [
                // 900 min antes de las 00:00 del día de la reunión = 09:00 del día anterior
                { method: "popup", minutes: 900 },
                { method: "email", minutes: 900 },
            ],
        },
    };
}
export async function crearEventoReunion(fecha, descripcion, attendees = []) {
    try {
        const res = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            sendUpdates: attendees.length ? "all" : "none",
            requestBody: buildEvent(fecha, descripcion, attendees),
        });
        return res.data.id ?? null;
    }
    catch (error) {
        console.error("Error al crear evento en Google Calendar", error);
        return null;
    }
}
export async function actualizarEventoReunion(eventId, fecha, descripcion) {
    try {
        await calendar.events.patch({
            calendarId: CALENDAR_ID,
            eventId,
            requestBody: buildEvent(fecha, descripcion),
        });
    }
    catch (error) {
        console.error("Error al actualizar evento en Google Calendar", error);
    }
}
export async function eliminarEventoReunion(eventId) {
    try {
        await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
    }
    catch (error) {
        console.error("Error al eliminar evento en Google Calendar", error);
    }
}
