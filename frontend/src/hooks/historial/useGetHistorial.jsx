import { useState, useCallback } from "react";
import { getHistorialService, deleteHistorialItemService } from "../../services/historial.service.js";
import Swal from "sweetalert2";

export function useGetHistorial() {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistorial = useCallback(async (filtros = {}) => {
    setLoading(true);
    try {
      const data = await getHistorialService(filtros);
      setActividades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error en useGetHistorial:", error);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteItem = async (id) => {
    try {
      await deleteHistorialItemService(id);
      setActividades((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descartar el registro.",
      });
    }
  };

  return {
    actividades,
    loading,
    fetchHistorial,
    handleDeleteItem,
  };
}

