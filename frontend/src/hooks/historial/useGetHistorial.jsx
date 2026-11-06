import { useState, useCallback } from "react";
import {
  getHistorialService,
  deleteHistorialItemService,
  deleteHistorialLoteService,
} from "../../services/historial.service.js";
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

  const handleDeleteLote = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return false;

    const confirmacion = await Swal.fire({
      title: "¿Eliminar elementos seleccionados?",
      text: `Se eliminarán ${ids.length} registro(s) del historial.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return false;

    try {
      await deleteHistorialLoteService(ids);
      const setEliminados = new Set(ids);
      setActividades((prev) => prev.filter((item) => !setEliminados.has(item.id)));
      Swal.fire({
        icon: "success",
        title: "Eliminados",
        text: "Los registros seleccionados se eliminaron correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });
      return true;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al eliminar los registros seleccionados.",
      });
      return false;
    }
  };

  return {
    actividades,
    loading,
    fetchHistorial,
    handleDeleteItem,
    handleDeleteLote,
  };
}
