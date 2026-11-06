import fs from "fs";

// Inspecciona los primeros bytes  de un archivos para verificar su integridad y formato real
export function validarFirmaArchivo(filePath: string): { valido: boolean; formatoDetectado?: string; error?: string } {
    try {
        if (!fs.existsSync(filePath)) {
            return { valido: false, error: "El archivo no existe en el servidor." };
        }

        const stat = fs.statSync(filePath);
        // Comprobar que no sea un archivo vacío o corrupto (mínimo 16 bytes para tener cabecera válida)
        if (stat.size < 16) {
            return { valido: false, error: "El archivo está vacío o corrupto (tamaño insuficiente)." };
        }

        // Leemos los primeros 16 bytes
        const buffer = Buffer.alloc(16);
        const fd = fs.openSync(filePath, "r");
        fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);

        // 1. Firma PNG
        if (
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0d &&
            buffer[5] === 0x0a &&
            buffer[6] === 0x1a &&
            buffer[7] === 0x0a
        ) {
            return { valido: true, formatoDetectado: "png" };
        }

        // 2. Firma JPEG / JPG
        if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
            return { valido: true, formatoDetectado: "jpeg" };
        }

        // 3. Firma PDF
        if (
            buffer[0] === 0x25 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x44 &&
            buffer[3] === 0x46
        ) {
            return { valido: true, formatoDetectado: "pdf" };
        }

        // 4. Firma DOCX 
        if (
            buffer[0] === 0x50 &&
            buffer[1] === 0x4b &&
            buffer[2] === 0x03 &&
            buffer[3] === 0x04
        ) {
            return { valido: true, formatoDetectado: "docx" };
        }

        // 5. Firma DOC 
        if (
            buffer[0] === 0xd0 &&
            buffer[1] === 0xcf &&
            buffer[2] === 0x11 &&
            buffer[3] === 0xe0
        ) {
            return { valido: true, formatoDetectado: "doc" };
        }

        return {
            valido: false,
            error: "La estructura binaria del archivo no corresponde a un formato válido (archivo dañado o corrupto).",
        };
    } catch (err: any) {
        return { valido: false, error: `Error al validar archivo: ${err.message}` };
    }
}

