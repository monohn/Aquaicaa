document.addEventListener("DOMContentLoaded", () => {

    // Sesión y cabecera: panel-comun.js
    const sesion = Panel.iniciar(["ADMIN", "SOPORTE", "TECNICO"]);
    if (!sesion) return;

    const container = document.getElementById("asignacionesContainer");
    const totalAsignaciones = document.getElementById("totalAsignaciones");
    const asignacionesPendientes = document.getElementById("asignacionesPendientes");
    const asignacionesAtencion = document.getElementById("asignacionesAtencion");
    const asignacionesFinalizadas = document.getElementById("asignacionesFinalizadas");

    const rol = localStorage.getItem("rol");
    const personalId = localStorage.getItem("personalId");
    const esAdmin = rol === "ADMIN" || rol === "SOPORTE";

    const esc = val => String(val ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);

    const svgIco = trazo => `<svg class="as-ico" viewBox="0 0 24 24">${trazo}</svg>`;

    const ICO = {
        ok:     svgIco('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
        play:   svgIco('<polygon points="6 4 20 12 6 20 6 4"/>'),
        doc:    svgIco('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
        eye:    svgIco('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
        camara: svgIco('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>')
    };

    const ESTADOS = {
        PENDIENTE:   "Por iniciar",
        ACTIVA:      "Por iniciar",
        EN_ATENCION: "En curso",
        FINALIZADA:  "Completada"
    };

    function etiquetaEstado(estado) {
        return ESTADOS[estado] || (estado ? String(estado).replaceAll("_", " ") : "-");
    }

    function obtenerProgreso(asignacion) {
        if (asignacion.estado === "FINALIZADA") return 100;
        if (asignacion.estado === "EN_ATENCION") {
            const guardado = Number(localStorage.getItem(`aquaica_avance_${asignacion.id}`));
            if (!Number.isNaN(guardado) && guardado >= 10 && guardado <= 100) {
                return guardado;
            }
            return 50;
        }
        return 0;
    }

    if (!esAdmin && !personalId) {
        container.innerHTML = `
            <div class="asignaciones-vacio">
                <span>${ICO.doc}</span>
                <h3>No se encontró el personal</h3>
                <p>Cierra sesión y vuelve a ingresar para actualizar tus datos.</p>
            </div>`;
        return;
    }

    if (esAdmin) {
        const tituloSec = document.querySelector(".dp-titulo");
        if (tituloSec) {
            tituloSec.innerHTML = `<span>Supervisión Operativa</span><h1>Asignaciones Activas</h1>`;
        }
        const bannerTxt = document.querySelector(".as-banner-texto");
        if (bannerTxt) {
            bannerTxt.innerHTML = `<h2>Asignaciones de Cuadrillas</h2><p>Monitorea los reportes asignados a los técnicos y su avance en campo.</p>`;
        }
    }

    function mostrarToast(texto, esError = false) {
        let toast = document.getElementById("asigToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "asigToast";
            toast.className = "asig-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = texto;
        toast.className = `asig-toast show ${esError ? "error" : ""}`;
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove("show"), 3200);
    }

    async function cargarAsignaciones() {
        try {
            let asignaciones = [];
            if (esAdmin) {
                try {
                    asignaciones = await apiFetch("/api/asignaciones");
                } catch (errApi) {
                    const reps = await apiFetch("/api/reportes").catch(() => []);
                    const res = await Promise.all((reps || []).map(r =>
                        apiFetch(`/api/reportes/${r.reporteId}/asignaciones`).catch(() => [])
                    ));
                    asignaciones = res.flat();
                }
            } else {
                asignaciones = await apiFetch(`/api/personal/${personalId}/asignaciones`);
            }

            actualizarEstadisticas(asignaciones || []);
            await mostrarAsignaciones(asignaciones || []);

        } catch (error) {
            console.error("Error al cargar asignaciones:", error);
            container.innerHTML = `
                <div class="asignaciones-vacio error">
                    <span>${ICO.doc}</span>
                    <h3>No se pudieron cargar las asignaciones</h3>
                    <p>${esc(error.message)}</p>
                </div>`;
        }
    }

    function actualizarEstadisticas(asignaciones) {
        const total = asignaciones.length;
        const pendientes = asignaciones.filter(a => a.estado === "ACTIVA" || a.estado === "PENDIENTE").length;
        const atencion = asignaciones.filter(a => a.estado === "EN_ATENCION").length;
        const finalizadas = asignaciones.filter(a => a.estado === "FINALIZADA").length;

        totalAsignaciones.textContent = total;
        asignacionesPendientes.textContent = pendientes;
        asignacionesAtencion.textContent = atencion;
        asignacionesFinalizadas.textContent = finalizadas;

        const porcentaje = cant => (total ? Math.round((cant / total) * 100) : 0);

        [
            ["Pendientes", pendientes],
            ["Atencion", atencion],
            ["Finalizadas", finalizadas]
        ].forEach(([clave, cant]) => {
            document.getElementById("pct" + clave).textContent = `${porcentaje(cant)}% del total`;
            document.getElementById("barra" + clave).style.width = `${porcentaje(cant)}%`;
        });

        document.getElementById("bannerTotal").textContent = `${total} ${total === 1 ? "trabajo" : "trabajos"}`;
    }

    async function mostrarAsignaciones(asignaciones) {
        container.innerHTML = "";

        if (!asignaciones || asignaciones.length === 0) {
            container.innerHTML = `
                <div class="asignaciones-vacio">
                    <span>${ICO.ok}</span>
                    <h3>No tienes asignaciones</h3>
                    <p>Actualmente no tienes trabajos asignados.</p>
                </div>`;
            return;
        }

        // Ordenar: En curso primero, luego por iniciar, luego finalizadas
        const prioridadOrden = { EN_ATENCION: 0, ACTIVA: 1, PENDIENTE: 1, FINALIZADA: 2 };
        const ordenadas = [...asignaciones].sort((a, b) => {
            const pa = prioridadOrden[a.estado] ?? 3;
            const pb = prioridadOrden[b.estado] ?? 3;
            if (pa !== pb) return pa - pb;
            return new Date(b.fechaAsignacion) - new Date(a.fechaAsignacion);
        });

        for (const asignacion of ordenadas) {
            const tieneInforme = asignacion.estado === "EN_ATENCION"
                ? await tieneInformeTecnico(asignacion.id)
                : false;

            const pct = obtenerProgreso(asignacion);
            const enCurso = asignacion.estado === "EN_ATENCION";
            const porIniciar = asignacion.estado === "ACTIVA" || asignacion.estado === "PENDIENTE";
            const finalizada = asignacion.estado === "FINALIZADA";

            const tarjeta = document.createElement("article");
            tarjeta.className = `asignacion-card ${enCurso ? "asig-en-curso" : ""}`;
            tarjeta.dataset.estado = asignacion.estado ?? "";

            let progresoHtml = "";
            if (enCurso || finalizada) {
                progresoHtml = `
                    <div class="asig-progreso-box">
                        <div class="asig-progreso-head">
                            <span>Avance de la tarea</span>
                            <strong id="pctTxt-${asignacion.id}">${pct}%</strong>
                        </div>
                        <div class="asig-progreso-track">
                            <div class="asig-progreso-fill" id="pctFill-${asignacion.id}" style="width: ${pct}%;"></div>
                        </div>
                        ${enCurso && !esAdmin ? `
                            <div class="asig-progreso-steps">
                                ${[25, 50, 75].map(val => `
                                    <button type="button"
                                        class="asig-step-btn ${pct === val ? "activo" : ""}"
                                        onclick="actualizarAvance(${asignacion.id}, ${val}, this)">
                                        ${val}%
                                    </button>
                                `).join("")}
                            </div>
                        ` : ""}
                    </div>
                `;
            }

            let accionesHtml = `
                <button type="button" class="secondary-button" onclick="verReporte(${asignacion.reporteId})">
                    ${ICO.eye} Ver reporte
                </button>
            `;

            if (!esAdmin) {
                if (porIniciar) {
                    accionesHtml += `
                        <button type="button" class="primary-button" onclick="iniciarAtencion(${asignacion.id}, ${asignacion.reporteId}, this)">
                            ${ICO.play} Empezar tarea
                        </button>
                    `;
                } else if (enCurso) {
                    if (tieneInforme) {
                        accionesHtml += `
                            <button type="button" class="secondary-button" disabled>
                                ${ICO.ok} Informe enviado
                            </button>
                        `;
                    } else {
                        accionesHtml += `
                            <button type="button" class="primary-button" onclick="abrirModalInforme(${asignacion.reporteId}, ${asignacion.id})">
                                ${ICO.doc} Generar informe
                            </button>
                        `;
                    }
                }
            }

            tarjeta.innerHTML = `
                <div class="asignacion-card-header">
                    <div>
                        <span class="asignacion-id">#${esc(asignacion.reporteId)}</span>
                        <h3>${esc(asignacion.nombrePersonal ? "Asignado a " + asignacion.nombrePersonal : "Incidencia asignada")}</h3>
                    </div>
                    <span class="asignacion-estado">${esc(etiquetaEstado(asignacion.estado))}</span>
                </div>

                <div class="asignacion-info">
                    <div>
                        <span>Fecha asignada</span>
                        <strong>${esc(formatearFecha(asignacion.fechaAsignacion))}</strong>
                    </div>
                    <div>
                        <span>Indicación</span>
                        <strong>${esc(asignacion.observaciones || "Revisar incidencia en campo")}</strong>
                    </div>
                </div>

                ${progresoHtml}

                <div class="asignacion-actions">
                    ${accionesHtml}
                </div>
            `;

            container.appendChild(tarjeta);
        }
    }

    window.actualizarAvance = function (asignacionId, valor, btn) {
        localStorage.setItem(`aquaica_avance_${asignacionId}`, String(valor));
        const txt = document.getElementById(`pctTxt-${asignacionId}`);
        const fill = document.getElementById(`pctFill-${asignacionId}`);
        if (txt) txt.textContent = `${valor}%`;
        if (fill) fill.style.width = `${valor}%`;

        const wrap = btn?.parentElement;
        if (wrap) {
            wrap.querySelectorAll(".asig-step-btn").forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");
        }
    };

    window.verReporte = function (reporteId) {
        window.location.href = `reporte-detalle.html?id=${reporteId}`;
    };

    window.iniciarAtencion = async function (asignacionId, reporteId, btn) {
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Iniciando...";
        }

        try {
            await apiFetch(`/api/asignaciones/${asignacionId}/iniciar`, { method: "POST" });
            localStorage.setItem(`aquaica_avance_${asignacionId}`, "25");
            mostrarToast("Tarea iniciada. Ya puedes registrar tu avance y generar el informe al terminar.");
            await cargarAsignaciones();
        } catch (error) {
            console.error("Error al iniciar atención:", error);
            mostrarToast(error.message || "No se pudo iniciar la tarea.", true);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `${ICO.play} Empezar tarea`;
            }
        }
    };

    // Modal simplificado de Informe Técnico + Foto obligatoria
    function asegurarModalInforme() {
        let modal = document.getElementById("modalInformeSimple");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "modalInformeSimple";
        modal.className = "asig-modal-overlay";
        modal.innerHTML = `
            <div class="asig-modal-card">
                <div class="asig-modal-head">
                    <div>
                        <span class="asig-modal-kicker">Cierre de atención</span>
                        <h3 id="modalInfTitulo">Generar informe</h3>
                    </div>
                    <button type="button" id="btnCerrarModalInf" class="asig-modal-close" aria-label="Cerrar">×</button>
                </div>

                <form id="formInformeSimple">
                    <input type="hidden" id="infReporteId">
                    <input type="hidden" id="infAsignacionId">

                    <div class="asig-form-campo">
                        <label for="infTrabajo">¿Qué atendiste y qué realizaste?</label>
                        <div class="asig-quick-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                            <button type="button" class="asig-chip-btn" data-txt="Se reparó la fuga de agua y se verificó la presión.">Fuga reparada</button>
                            <button type="button" class="asig-chip-btn" data-txt="Se reguló la válvula y se restableció el flujo.">Válvula regulada</button>
                            <button type="button" class="asig-chip-btn" data-txt="Se restableció el servicio tras revisión técnica.">Servicio restablecido</button>
                        </div>
                        <textarea id="infTrabajo" rows="3" placeholder="Ej. Se reparó la fuga en la tubería principal y se verificó la presión..." required></textarea>
                    </div>

                    <div class="asig-form-campo">
                        <label for="infResultado">Estado final de la atención</label>
                        <select id="infResultado" required>
                            <option value="SOLUCIONADO">Solucionado (100%)</option>
                            <option value="MEJORA_PARCIAL">Mejora parcial (en monitoreo)</option>
                            <option value="REVISION_PROGRAMADA">Volver a revisar en unos días</option>
                            <option value="NO_SOLUCIONADO">No solucionado / Requiere apoyo</option>
                        </select>
                    </div>

                    <div class="asig-form-campo">
                        <label for="infFotoInput">Fotografía de evidencia (obligatorio)</label>
                        <label for="infFotoInput" class="asig-upload-box" id="infUploadLabel">
                            ${ICO.camara}
                            <span id="infFotoNombre">Toca aquí para tomar o elegir una foto</span>
                        </label>
                        <input type="file" id="infFotoInput" accept="image/*" capture="environment" style="display:none;">
                        <div id="infFotoPreviewWrap" style="display:none;margin-top:8px;">
                            <img id="infFotoPreview" src="" alt="Vista previa" style="max-height:140px;width:100%;object-fit:cover;border-radius:10px;border:1px solid #cbd5e1;">
                        </div>
                    </div>

                    <p id="infErrorMsg" class="asig-form-error" style="display:none;"></p>

                    <div class="asig-modal-actions">
                        <button type="button" id="btnCancelarModalInf" class="secondary-button">Cancelar</button>
                        <button type="submit" id="btnEnviarInf" class="primary-button">Enviar informe</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const cerrar = () => { modal.classList.remove("show"); };
        document.getElementById("btnCerrarModalInf").addEventListener("click", cerrar);
        document.getElementById("btnCancelarModalInf").addEventListener("click", cerrar);
        modal.addEventListener("click", e => { if (e.target === modal) cerrar(); });

        modal.querySelectorAll(".asig-chip-btn").forEach(chip => {
            chip.addEventListener("click", () => {
                const txt = document.getElementById("infTrabajo");
                if (txt) {
                    txt.value = chip.dataset.txt || "";
                    txt.focus();
                }
            });
        });

        const fotoInput = document.getElementById("infFotoInput");
        fotoInput.addEventListener("change", () => {
            const file = fotoInput.files[0];
            const nombreSpan = document.getElementById("infFotoNombre");
            const prevWrap = document.getElementById("infFotoPreviewWrap");
            const prevImg = document.getElementById("infFotoPreview");
            const errMsg = document.getElementById("infErrorMsg");
            if (errMsg) errMsg.style.display = "none";

            if (file) {
                nombreSpan.textContent = file.name;
                const reader = new FileReader();
                reader.onload = ev => {
                    prevImg.src = ev.target.result;
                    prevWrap.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                nombreSpan.textContent = "Toca aquí para tomar o elegir una foto";
                prevWrap.style.display = "none";
            }
        });

        document.getElementById("formInformeSimple").addEventListener("submit", async (e) => {
            e.preventDefault();
            const reporteId = document.getElementById("infReporteId").value;
            const asignacionId = document.getElementById("infAsignacionId").value;
            const trabajo = document.getElementById("infTrabajo").value.trim();
            const resultado = document.getElementById("infResultado").value;
            const foto = fotoInput.files[0];
            const errMsg = document.getElementById("infErrorMsg");
            const btnEnv = document.getElementById("btnEnviarInf");

            errMsg.style.display = "none";

            if (!trabajo) {
                errMsg.textContent = "Describe brevemente lo que atendiste.";
                errMsg.style.display = "block";
                return;
            }

            if (!foto) {
                errMsg.textContent = "La fotografía de evidencia es obligatoria para finalizar el informe.";
                errMsg.style.display = "block";
                return;
            }

            btnEnv.disabled = true;
            btnEnv.textContent = "Subiendo foto y guardando...";

            try {
                // 1. Comprimir y subir fotografía obligatoria
                const fotoLista = typeof comprimirImagenParaSubida === "function"
                    ? await comprimirImagenParaSubida(foto)
                    : foto;
                const formEv = new FormData();
                formEv.append("archivo", fotoLista);
                await apiFetch(`/api/reportes/${reporteId}/evidencias/tecnico`, {
                    method: "POST",
                    body: formEv
                });

                // 2. Guardar informe técnico
                const params = new URLSearchParams();
                params.append("diagnostico", trabajo);
                params.append("trabajoRealizado", trabajo);
                params.append("resultado", resultado);

                await apiFetch(`/api/reportes/${reporteId}/informe-tecnico?${params.toString()}`, {
                    method: "POST"
                });

                localStorage.setItem(`aquaica_avance_${asignacionId}`, resultado === "SOLUCIONADO" ? "100" : "75");
                cerrar();
                mostrarToast("Informe y fotografía enviados correctamente.");
                await cargarAsignaciones();

            } catch (err) {
                errMsg.textContent = err.message || "No se pudo guardar el informe.";
                errMsg.style.display = "block";
            } finally {
                btnEnv.disabled = false;
                btnEnv.textContent = "Enviar informe";
            }
        });

        return modal;
    }

    window.abrirModalInforme = function (reporteId, asignacionId) {
        const modal = asegurarModalInforme();
        document.getElementById("modalInfTitulo").textContent = `Generar informe (#${reporteId})`;
        document.getElementById("infReporteId").value = reporteId;
        document.getElementById("infAsignacionId").value = asignacionId;
        document.getElementById("infTrabajo").value = "";
        document.getElementById("infResultado").value = "SOLUCIONADO";
        document.getElementById("infFotoInput").value = "";
        document.getElementById("infFotoNombre").textContent = "Toca aquí para tomar o elegir una foto";
        document.getElementById("infFotoPreviewWrap").style.display = "none";
        document.getElementById("infErrorMsg").style.display = "none";
        modal.classList.add("show");
    };

    async function tieneInformeTecnico(asignacionId) {
        try {
            await apiFetch(`/api/reportes/asignacion/${asignacionId}/informe-tecnico`);
            return true;
        } catch (error) {
            return false;
        }
    }

    function formatearFecha(fecha) {
        if (!fecha) return "-";
        return new Date(fecha).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
    }

    cargarAsignaciones();
});
