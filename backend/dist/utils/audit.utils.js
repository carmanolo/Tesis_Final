export function obtenerIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return forwarded[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}
export function obtenerDispositivo(req) {
    const userAgent = req.headers["user-agent"] || "Desconocido";
    // Detección simple y limpia para visualización amigable
    let browser = "Navegador";
    if (userAgent.includes("Edg/"))
        browser = "Edge";
    else if (userAgent.includes("Chrome/"))
        browser = "Chrome";
    else if (userAgent.includes("Firefox/"))
        browser = "Firefox";
    else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/"))
        browser = "Safari";
    else if (userAgent.includes("PostmanRuntime"))
        browser = "Postman / API Client";
    let os = "SO";
    if (userAgent.includes("Windows NT 10.0"))
        os = "Windows 10/11";
    else if (userAgent.includes("Windows"))
        os = "Windows";
    else if (userAgent.includes("Macintosh"))
        os = "macOS";
    else if (userAgent.includes("Linux"))
        os = "Linux";
    else if (userAgent.includes("Android"))
        os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
        os = "iOS";
    return `${browser} (${os})`;
}
