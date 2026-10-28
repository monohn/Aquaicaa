/**
 * AquaIca — Historial Técnico
 * Carga de reportes finalizados, filtrado interactivo y visualización de informe técnico con evidencias.
 */

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    const sesion = Panel.iniciar(["TECNICO", "ADMIN", "SOPORTE"]);
    if (!sesion) {
        return;
    }

    const { $, esc, fecha, normalizar, pill } = Panel;

    const container = $("historialContainer");
    const buscar = $("buscarReporte");
    const filtroProblema = $("filtroProblema");
    const filtroResultado = $("filtroResultado");

    const kpiTotal = $("kpiTotal");
    const kpiInformes = $("kpiInformes");
    const kpiEficacia = $("kpiEficacia");
    const bannerTotal = $("bannerTotal");

    // Modal
    const modal = $("modalDetalle");
    const btnCerrarModal = $("btnCerrarModal");

    const TIPOS = {
        FUGA_AGUA: {
            nombre: "Fuga de agua",
            color: "#0a74c9",
            bg: "#eef6fc",
            trazo: '<path d="M12 2.7s6 6.1 6 10.3a6 6 0 0 1-12 0c0-4.2 6-10.3 6-10.3z"/>'
        },
        SIN_AGUA: {
            nombre: "Corte de agua",
            color: "#e11d48",
            bg: "#ffe4e6",
            trazo: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>'
        },
        CORTE_AGUA: {
            nombre: "Corte de agua",
            color: "#e11d48",
            bg: "#ffe4e6",
            trazo: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>'
        },
        BAJA_PRESION: {
            nombre: "Baja presión",
            color: "#d97706",
            bg: "#fef3c7",
            trazo: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>'
        },
        FACTURACION: {
            nombre: "Facturación",
            color: "#7c3aed",
            bg: "#f3e8ff",
            trazo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'
        },
        OTRO: {
            nombre: "Otro tipo",
            color: "#059669",
            bg: "#d1fae5",
            trazo: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'
        }
    };

    let listaHistorial = [];

    async function cargarHistorial() {
        try {
            let datos = [];
            try {
                datos = await apiFetch("/api/personal/me/historial");
            } catch (errMe) {
                const personalId = localStorage.getItem("personalId");
                if (personalId) {
                    datos = await apiFetch(`/api/personal/${personalId}/historial`);
                } else {
                    throw errMe;
                }
            }

            listaHistorial = Array.isArray(datos) ? datos : [];
            actualizarKPIs(listaHistorial);
            renderizarHistorial(filtrarDatos());

        } catch (error) {
            console.error("Error al cargar historial técnico:", error);
            container.innerHTML = `
                <div class="ht-vacio">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <h3>No se pudo cargar el historial</h3>
                    <p>${esc(error.message || "Verifica tu conexión y permisos.")}</p>
                </div>
            `;
        }
    }

    function actualizarKPIs(items) {
        const total = items.length;
        const conInforme = items.filter(i => i.diagnostico && i.diagnostico !== "Atención completada").length;
        const solucionados = items.filter(i => !i.resultado || i.resultado.toUpperCase() === "SOLUCIONADO").length;

        kpiTotal.textContent = total;
        bannerTotal.textContent = `${total} ${total === 1 ? "caso" : "casos"}`;
        kpiInformes.textContent = conInforme;

        const eficacia = total > 0 ? Math.round((solucionados / total) * 100) : 100;
        kpiEficacia.textContent = `${eficacia}%`;
    }

    function filtrarDatos() {
        const texto = normalizar(buscar.value);
        const problema = normalizar(filtroProblema.value);
        const resultado = normalizar(filtroResultado.value);

        return listaHistorial.filter(item => {
            const matchTexto = !texto ||
                String(item.reporteId).includes(texto) ||
                normalizar(item.codigoSuministro).includes(texto) ||
                normalizar(item.direccion).includes(texto) ||
                normalizar(item.descripcion).includes(texto) ||
                normalizar(item.diagnostico).includes(texto) ||
                normalizar(item.trabajoRealizado).includes(texto);

            const matchProblema = !problema ||
                normalizar(item.tipoProblema) === problema ||
                (problema === "SIN_AGUA" && normalizar(item.tipoProblema) === "CORTE_AGUA");

            let resNormal = normalizar(item.resultado);
            if (!resNormal) resNormal = "SOLUCIONADO";
            const matchResultado = !resultado || resNormal.includes(resultado);

            return matchTexto && matchProblema && matchResultado;
        });
    }

    function renderizarHistorial(items) {
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="ht-vacio">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <h3>No se encontraron reportes en el historial</h3>
                    <p>No hay registros que coincidan con los criterios de búsqueda.</p>
                </div>
            `;
            return;
        }

        let html = "";
        items.forEach(item => {
            const tipoInfo = TIPOS[normalizar(item.tipoProblema)] || TIPOS.OTRO;
            const esSolucionado = !item.resultado || item.resultado.toUpperCase() === "SOLUCIONADO";
            const badgeResultado = esSolucionado
                ? pill("p-verde", "Solucionado", true)
                : pill("p-rojo", "No Resuelto", true);

            html += `
                <article class="ht-card" data-reporte-id="${item.reporteId}">
                    <div class="ht-card-top">
                        <div class="ht-card-id">
                            <span class="ht-id-pill">Reporte #${item.reporteId}</span>
                            <span style="font-size:12px;color:#64748b;font-weight:500;">Sum: ${esc(item.codigoSuministro || "-")}</span>
                        </div>
                        <div>
                            ${badgeResultado}
                        </div>
                    </div>

                    <div class="ht-card-body">
                        <div class="ht-card-tipo">
                            <div class="ht-tipo-ico" style="background:${tipoInfo.bg};color:${tipoInfo.color};">
                                <svg viewBox="0 0 24 24">${tipoInfo.trazo}</svg>
                            </div>
                            <div>
                                <h4>${esc(tipoInfo.nombre)}</h4>
                                <span>Prioridad ${esc(item.prioridad || "Media")}</span>
                            </div>
                        </div>

                        <div class="ht-card-dir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>${esc(item.direccion || "Dirección no especificada")}</span>
                        </div>

                        <div class="ht-card-informe-box">
                            <strong>Diagnóstico técnico:</strong>
                            ${esc(item.diagnostico || "Atención técnica completada.")}
                        </div>
                    </div>

                    <div class="ht-card-footer">
                        <div class="ht-card-fecha">
                            <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span>${fecha(item.fechaResolucion || item.fechaAsignacion)}</span>
                        </div>

                        <button type="button" class="ht-btn-ver" data-ver="${item.reporteId}">
                            <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Ficha de Cierre
                        </button>
                    </div>
                </article>
            `;
        });

        container.innerHTML = html;

        // Listeners en botones de Ver Ficha
        container.querySelectorAll("[data-ver]").forEach(btn => {
            btn.addEventListener("click", () => {
                const reporteId = Number(btn.getAttribute("data-ver"));
                const item = listaHistorial.find(i => i.reporteId === reporteId);
                if (item) {
                    abrirModalDetalle(item);
                }
            });
        });
    }

    async function abrirModalDetalle(item) {
        const tipoInfo = TIPOS[normalizar(item.tipoProblema)] || TIPOS.OTRO;

        $("modalReportePill").textContent = `Reporte #${item.reporteId}`;
        $("modalTituloProblema").textContent = `${tipoInfo.nombre} — Informe Técnico`;
        $("modalSuministro").textContent = item.codigoSuministro || "—";
        $("modalEstadoReporte").textContent = item.estadoReporte || "RESUELTO";
        $("modalDireccion").textContent = item.direccion || "—";
        $("modalDiagnostico").textContent = item.diagnostico || "Sin observaciones de diagnóstico.";
        $("modalTrabajoRealizado").textContent = item.trabajoRealizado || "Trabajo técnico finalizado en campo.";

        const contenedorEvidencias = $("modalEvidencias");
        contenedorEvidencias.innerHTML = `<p style="font-size:13px; color:#64748b;">Cargando fotografías de evidencia...</p>`;

        modal.classList.add("show");

        // Cargar evidencias fotográficas del reporte
        try {
            const evidencias = await apiFetch(`/api/reportes/${item.reporteId}/evidencias`);
            if (!evidencias || evidencias.length === 0) {
                contenedorEvidencias.innerHTML = `<p style="font-size:13px; color:#94a3b8; grid-column:1/-1;">No se adjuntaron fotos para este reporte.</p>`;
            } else {
                let fotosHtml = "";
                evidencias.forEach(ev => {
                    const url = ev.archivoUrl || (ev.id ? `/api/evidencias/archivo/${ev.id}` : "");
                    if (url) {
                        fotosHtml += `
                            <a href="${esc(url)}" target="_blank" title="Ver foto completa">
                                <img src="${esc(url)}" alt="Evidencia ${item.reporteId}">
                            </a>
                        `;
                    }
                });
                contenedorEvidencias.innerHTML = fotosHtml || `<p style="font-size:13px; color:#94a3b8;">Sin fotos disponibles.</p>`;
            }
        } catch (err) {
            console.warn("No se pudieron cargar evidencias:", err);
            contenedorEvidencias.innerHTML = `<p style="font-size:13px; color:#94a3b8;">No hay fotografías registradas.</p>`;
        }
    }

    btnCerrarModal.addEventListener("click", () => {
        modal.classList.remove("show");
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("show")) {
            modal.classList.remove("show");
        }
    });

    // Filtros interactivos
    buscar.addEventListener("input", () => renderizarHistorial(filtrarDatos()));
    filtroProblema.addEventListener("change", () => renderizarHistorial(filtrarDatos()));
    filtroResultado.addEventListener("change", () => renderizarHistorial(filtrarDatos()));

    await cargarHistorial();
});
