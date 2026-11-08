
export const PUEDE_EDITAR_APORTE = [ "presidente cee", "vicepresidente cee", "tesorero cee"];
export const OPCIONES_PROCEDENCIA = ["DDE", "Rectoria", "Decanatura","Dirección de Departamento","FACE", "FACI", "FARCORDI","FI","FEDUH", "FACSA","Externo", "Otro"];
export const OPCIONES_DESCRIPCION = [
    "Aniversario FACE",
    "Aniversario Carrera",
    "Aniversario Universidad",
    "Otro",
];
export const APORTE_DESCRIPCION_MIN = 10;
export const APORTE_DESCRIPCION_MAX = 100;
export const COLOR_BASE = "#014898";
export const COLOR_DESTACADO = "#EE820F"; 
export const TOP_N = 10;

export const CRITERIOS = [
    { id: "procedencia", etiqueta: "Procedencia con más aportes" }, 
    { id: "actividad", etiqueta: "Actividad con mayor monto" },
    { id: "mes", etiqueta: "Aportes por mes" },
];