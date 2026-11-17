import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPendingRecoveriesService,
  generateRecoveryCodeService,
  rejectRecoveryService,
} from "@services/auth.service.js";

const RecoveryNotifier = () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
  const isAdmin = usuario?.role === "administrador";

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState({}); // id -> { code, expiresAt }
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    const res = await getPendingRecoveriesService();
    if (res?.status !== 200) return;
    const data = res.data.data;
    setItems(data);
    // Se abre automáticamente al entrar si hay solicitudes pendientes
    if (firstLoad.current && data.some((i) => i.status === "pendiente")) setOpen(true);
    firstLoad.current = false;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [isAdmin, load]);

  if (!isAdmin || items.length === 0) return null;

  const pendientes = items.filter((i) => i.status === "pendiente").length;

  const generar = async (id) => {
    const res = await generateRecoveryCodeService(id);
    if (res?.status === 200) {
      setCodes((c) => ({ ...c, [id]: res.data.data }));
      load();
    }
  };

  const rechazar = async (id) => {
    const res = await rejectRecoveryService(id);
    if (res?.status === 200) load();
  };

  return (
    <>
      {pendientes > 0 && (
        <div role="alert" className="alert alert-warning m-2">
          <span>
            {pendientes} usuario(s) solicitaron recuperar su cuenta.
          </span>
          <button className="btn btn-sm" onClick={() => setOpen(true)}>Ver</button>
        </div>
      )}

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-xl">
            <h3 className="font-bold text-lg mb-3">Solicitudes de recuperación de cuenta</h3>

            <div className="flex flex-col gap-3">
              {items.map((s) => (
                <div key={s.id} className="border border-base-300 rounded-lg p-3">
                  <p className="font-semibold">{s.username}</p>
                  <p className="text-sm text-base-content/70">{s.email}</p>
                  <p className="text-xs text-base-content/60">
                    Solicitado: {new Date(s.createdAt).toLocaleString("es-CL")}
                  </p>

                  {codes[s.id] && (
                    codes[s.id].emailSent ? (
                      <div className="alert alert-success alert-soft my-2">
                        <span>
                          Código enviado a {codes[s.id].email}. Vence a las{" "}
                          {new Date(codes[s.id].expiresAt).toLocaleTimeString("es-CL")}.
                        </span>
                      </div>
                  ) : (
                    <div className="alert alert-warning alert-soft my-2 flex-col items-start">
                      <span className="text-xs">No se pudo enviar el correo. Entrega este código al usuario:</span>
                      <span className="text-2xl font-mono tracking-widest">{codes[s.id].code}</span>
                      <span className="text-xs">
                        Vence: {new Date(codes[s.id].expiresAt).toLocaleTimeString("es-CL")}. Solo se muestra ahora.
                      </span>
                    </div>
                  )
                )}

                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={() => generar(s.id)}>
                      {s.status === "codigo_generado" ? "Generar código nuevo" : "Generar código"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => rechazar(s.id)}>
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setOpen(false)}>Cerrar</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default RecoveryNotifier;