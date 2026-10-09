// Funciones auxiliares para construir formularios limpios y ordenados en SweetAlert2

export const createSwalInputField = ({
  id,
  label,
  value = "",
  type = "text",
  placeholder = "",
  required = false,
  min,
  max,
  step
}) => {
  const reqMark = required ? '<span style="color:#e11113;">*</span>' : '';
  const minAttr = min !== undefined ? `min="${min}"` : '';
  const maxAttr = max !== undefined ? `max="${max}"` : '';
  const stepAttr = step !== undefined ? `step="${step}"` : '';

  return `
    <div class="swal-form-group">
      <label class="swal-form-label" for="${id}">
        ${label} ${reqMark}
      </label>
      <input 
        id="${id}" 
        type="${type}" 
        class="swal-form-input" 
        value="${value ?? ""}"
        placeholder="${placeholder || label}"
        ${minAttr}
        ${maxAttr}
        ${stepAttr}
      />
    </div>
  `;
};

export const createSwalSelectField = ({
  id,
  label,
  options = [],
  selectedValue = "",
  required = false
}) => {
  const reqMark = required ? '<span style="color:#e11113;">*</span>' : '';
  
  const optionsHtml = options.map((opt) => {
    const val = typeof opt === "object" ? opt.value : opt;
    const text = typeof opt === "object" ? opt.label : String(opt).charAt(0).toUpperCase() + String(opt).slice(1);
    const isSelected = String(val).toLowerCase() === String(selectedValue ?? "").toLowerCase();
    return `<option value="${val}" ${isSelected ? "selected" : ""}>${text}</option>`;
  }).join("");

  return `
    <div class="swal-form-group">
      <label class="swal-form-label" for="${id}">
        ${label} ${reqMark}
      </label>
      <select id="${id}" class="swal-form-select">
        ${optionsHtml}
      </select>
    </div>
  `;
};

export const createSwalRow = (...fields) => {
  return `
    <div class="swal-form-row">
      ${fields.join("")}
    </div>
  `;
};

export const createSwalContainer = (contentHtml, hint = "") => {
  const hintHtml = hint ? `<p class="swal-form-hint">${hint}</p>` : "";
  return `
    <div class="swal-form-container">
      ${contentHtml}
      ${hintHtml}
    </div>
  `;
};

/**
 * Genera el HTML completo del formulario de Material (Crear / Editar)
 */
export const createMaterialFormHtml = (material = {}, isEdit = false) => {
  const fechaVal = material.fecha_prestamo ? String(material.fecha_prestamo).slice(0, 10) : "";
  const prestatarioVal = material.prestatario ?? material.nombre_prestamo ?? "";
  const stockVal = Number(material.stock ?? (isEdit ? 0 : 1));
  const estadoVal = String(material.estado_prestamo || "prestado").toLowerCase();
  const tneVal = material.tne_entregada === true ? "true" : "false";

  const estados = [
    { label: "Prestado", value: "prestado" },
    { label: "Pendiente", value: "pendiente" },
    { label: "Disponible", value: "disponible" },
    { label: "Devuelto", value: "devuelto" },
  ];

  const tneOptions = [
    { label: "No", value: "false" },
    { label: "Sí", value: "true" },
  ];

  const prefix = isEdit ? "material-edit" : "material";

  const content = `
    ${createSwalInputField({
      id: `${prefix}-nombre`,
      label: "Nombre del material",
      value: material.nombre_material || "",
      placeholder: "Ej. Cable HDMI, Proyector Epson, Balón...",
      required: true
    })}

    ${createSwalRow(
      createSwalInputField({
        id: `${prefix}-fecha`,
        label: "Fecha",
        value: fechaVal,
        type: "date",
        required: false
      }),
      createSwalInputField({
        id: `${prefix}-stock`,
        label: isEdit ? "Stock actual" : "Stock",
        value: stockVal,
        type: "number",
        min: 0,
        step: 1,
        required: true
      })
    )}

    ${createSwalInputField({
      id: `${prefix}-prestatario`,
      label: "Prestatario (Solicitante)",
      value: prestatarioVal,
      placeholder: "Nombre completo del alumno o solicitante (opcional)",
      required: false
    })}

    ${createSwalRow(
      createSwalSelectField({
        id: `${prefix}-estado`,
        label: "Estado préstamo",
        options: estados,
        selectedValue: estadoVal,
        required: true
      }),
      createSwalSelectField({
        id: `${prefix}-tne`,
        label: "¿TNE entregada?",
        options: tneOptions,
        selectedValue: tneVal
      })
    )}
  `;

  const hint = isEdit
    ? " <em>Nota: Si cambias el estado a <b>Prestado</b> se descontará 1 unidad. Si cambia a <b>Devuelto/Disponible</b> se recuperará 1 unidad.</em>"
    : " <em>Nota: Si el estado es <b>Prestado</b>, se descontará automáticamente 1 unidad del stock ingresado al crearlo.</em>";

  return createSwalContainer(content, hint);
};

// --- Mantenimiento de compatibilidad para otros módulos antiguos ---
export const createSwalField = (inputId, label, value = "", type = "text") => {
  return `
    <div class="input m-1 form-group">
      <label for="swal2-input${inputId}" class="label">${label}</label>  
      <input 
        type="${type}"
        id="swal2-input${inputId}" 
        placeholder="${label}" 
        value="${value ?? ""}">
    </div>
  `;
};

export const createSwalDateField = (inputId, label, value = "") => {
  return `
    <label class="input m-1">
      <span class="label">${label}</span>
      <input 
        type="date" 
        id="swal2-input${inputId}" 
        value="${value ?? ""}" />
    </label>
  `;
};

export const createSwalTextarea = (inputId, label, value) => {
  return `
    <legend for="swal2-input${inputId}" class="fieldset-legend center content-center">
      ${label}
    </legend>
    <div class="textarea-container m-1 form-group center content-center justify-center align-center center-items">
      <fieldset class="fieldset">
        <textarea 
          class="textarea h-24" 
          id="swal2-input${inputId}" 
          placeholder="${value ?? ""}">
        </textarea>
      </fieldset> 
    </div>
  `;
};