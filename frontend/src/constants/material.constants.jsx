export const ESTADOS_PRESTAMO = ["pendiente", "devuelto", "prestado", "disponible"];
export const PUEDE_EDITAR_MATERIAL = [
    "administrador",
    "presidente cee",
    "secretario cee",
    "tesorero cee",
    "vocal cee",
];

export const ESTADO_ESTILOS= {
    pendiente: {
        label: "Pendiente",
        card: "bg-yellow-100 border-yellow-400 text-yellow-900",
        badge: "bg-yellow-400 border-yellow-400 text-yellow-950",
    },
    disponible: {
        label: "Disponible",
        card: "bg-green-100 border-green-500 text-green-900",
        badge: "bg-green-500 border-green-500 text-white",
    },
    prestado: {
        label: "Prestado",
        card: "bg-red-100 border-red-500 text-red-900",
        badge: "bg-red-500 border-red-500 text-white",
    },
    devuelto: {
        label: "Devuelto",
        card: "bg-orange-100 border-orange-500 text-orange-900",
        badge: "bg-orange-500 border-orange-500 text-white",
    },
};
 
const ESTADO_DEFAULT = {
    label: "Sin estado",
    card: "bg-base-200 border-base-300 text-base-content",
    badge: "bg-base-300 border-base-300 text-base-content",
};
 
export const getEstadoStyle = (estado) =>
    ESTADO_ESTILOS[String(estado ?? "").trim().toLowerCase()] ?? ESTADO_DEFAULT;
