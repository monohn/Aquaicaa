/**
 * AquaIca — Padrón Unificado de Clientes y Suministros
 * Gestión completa de titulares, domicilios y conexiones de agua.
 */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    const sesion = Panel.iniciar(["ADMIN", "SOPORTE"]);
    if (!sesion) {
        return;
    }

    const { $, esc, fecha, gradiente } = Panel;

    const tabla = $("clientesTable");
    const buscar = $("buscarCliente");
    const filtroEstado = $("filtroEstado");
    const filtroSuministro = $("filtroSuministro");

    // Modal Cliente
    const modalCliente = $("clienteModal");
    const formCliente = $("clienteForm");
    const errorCliente = $("formError");
    const btnGuardarCliente = $("guardarCliente");

    // Modal Suministro
    const modalSum = $("suministroModal");
    const formSum = $("suministroForm");
    const errorSum = $("formSumError");
    const btnGuardarSum = $("guardarSuministro");
    const selectClienteSum = $("sumClienteSelect");

    let clientes = [];
    let suministros = [];
    let clientesExpandidos = new Set();
    let toastTimer;

    const ICONOS = {
        edit: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
        block: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
        check: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
        drop: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
        addDrop: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 9v6M9 12h6"/></svg>',
        trash: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>',
        chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg>'
    };

    function toast(mensaje, esError = false) {
        const el = $("clientesToast");
        if (!el) return;
        el.textContent = mensaje;
        el.classList.toggle("error", esError);
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), 3400);
    }

    async function cargarDatos() {
        try {
            const [respClientes, respSuministros] = await Promise.all([
                apiFetch("/api/clientes"),
                apiFetch("/api/suministros")
            ]);

            clientes = Array.isArray(respClientes) ? respClientes : [];
            suministros = Array.isArray(respSuministros) ? respSuministros : [];

            actualizarEstadisticas();
            llenarSelectorClientes();
            render();

        } catch (error) {
            console.error("Error al cargar datos:", error);
            tabla.innerHTML = `<tr><td colspan="7" class="clientes-vacio error">Error al cargar datos: ${esc(error.message)}</td></tr>`;
        }
    }

    function actualizarEstadisticas() {
        $("statTotal").textContent = clientes.length;
        $("statActivos").textContent = clientes.filter(c => c.estado === "ACTIVO").length;
        $("statSuministros").textContent = suministros.length;

        const dom = suministros.filter(s => (s.categoria || "DOMESTICO").toUpperCase() === "DOMESTICO").length;
        const com = suministros.filter(s => (s.categoria || "").toUpperCase() === "COMERCIAL").length;
        $("statCategorias").textContent = `${dom} Dom · ${com} Com`;
    }

    function llenarSelectorClientes() {
        selectClienteSum.innerHTML = clientes
            .filter(c => c.estado === "ACTIVO")
            .map(c => `<option value="${c.id}">${esc(c.nombreCompleto)} (DNI ${esc(c.dni)})</option>`)
            .join("");
    }

    function suministrosPorCliente(clienteId) {
        return suministros.filter(s => s.clienteId === clienteId);
    }

    function render() {
        const q = buscar.value.trim().toLowerCase();
        const estadoFiltro = filtroEstado.value;
        const sumFiltro = filtroSuministro.value;

        const filtrados = clientes.filter(c => {
            const sums = suministrosPorCliente(c.id);

            // Búsqueda por texto (nombre, dni, código de suministro o dirección)
            const matchTexto = !q ||
                (c.nombreCompleto || "").toLowerCase().includes(q) ||
                (c.dni || "").includes(q) ||
                (c.email || "").toLowerCase().includes(q) ||
                (c.telefono || "").includes(q) ||
                sums.some(s =>
                    (s.codigoSuministro || "").toLowerCase().includes(q) ||
                    (s.direccion || "").toLowerCase().includes(q)
                );

            // Filtro por estado
            const matchEstado = !estadoFiltro || c.estado === estadoFiltro;

            // Filtro por suministros
            let matchSuministro = true;
            if (sumFiltro === "CON_SUMINISTRO") {
                matchSuministro = sums.length > 0;
            } else if (sumFiltro === "SIN_SUMINISTRO") {
                matchSuministro = sums.length === 0;
            } else if (sumFiltro === "DOMESTICO") {
                matchSuministro = sums.some(s => (s.categoria || "DOMESTICO").toUpperCase() === "DOMESTICO");
            } else if (sumFiltro === "COMERCIAL") {
                matchSuministro = sums.some(s => (s.categoria || "").toUpperCase() === "COMERCIAL");
            }

            return matchTexto && matchEstado && matchSuministro;
        });

        if (!filtrados.length) {
            tabla.innerHTML = `<tr><td colspan="7" class="clientes-vacio">No se encontraron clientes ni suministros con los criterios seleccionados.</td></tr>`;
            return;
        }

        let html = "";
        filtrados.forEach(c => {
            const activo = c.estado === "ACTIVO";
            const sums = suministrosPorCliente(c.id);
            const expandido = clientesExpandidos.has(c.id);

            const badgeClase = sums.length > 0 ? "suministro-badge" : "suministro-badge vacio";
            const badgeTexto = sums.length === 0
                ? "Sin suministros"
                : `${sums.length} ${sums.length === 1 ? "suministro" : "suministros"}`;

            html += `
                <tr data-cliente-id="${c.id}">
                    <td>
                        <div class="cliente-persona">
                            <div class="cliente-avatar">
                                ${esc((c.nombreCompleto || "C").charAt(0).toUpperCase())}
                            </div>
                            <div>
                                <strong>${esc(c.nombreCompleto)}</strong>
                                <small>Cliente #${c.id}</small>
                            </div>
                        </div>
                    </td>
                    <td><strong>${esc(c.dni)}</strong></td>
                    <td>
                        <div style="font-size:11.5px;color:#334155;">
                            ${esc(c.telefono || "Sin teléfono")}<br>
                            <small style="color:#64748b;">${esc(c.email || "Sin correo")}</small>
                        </div>
                    </td>
                    <td>
                        <button type="button" class="${badgeClase} ${expandido ? "abierto" : ""}" data-toggle-sum="${c.id}" title="Ver o gestionar suministros">
                            ${ICONOS.drop}
                            <span>${badgeTexto}</span>
                            ${ICONOS.chev}
                        </button>
                    </td>
                    <td>${fecha(c.fechaRegistro)}</td>
                    <td>
                        <span class="cliente-estado ${activo ? "activo" : "inactivo"}">
                            ${activo ? "Activo" : "Inactivo"}
                        </span>
                    </td>
                    <td>
                        <div class="cliente-acciones">
                            <button class="cliente-btn-icon" title="Asociar nuevo suministro" data-action="add-sum" data-id="${c.id}">
                                ${ICONOS.addDrop}
                            </button>
                            <button class="cliente-btn-icon" title="Editar datos del cliente" data-action="edit" data-id="${c.id}">
                                ${ICONOS.edit}
                            </button>
                            <button class="cliente-btn-icon ${activo ? "peligro" : "exito"}" title="${activo ? "Desactivar" : "Activar"} cliente" data-action="toggle" data-id="${c.id}">
                                ${activo ? ICONOS.block : ICONOS.check}
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            // Fila expandible con el detalle de suministros del cliente
            if (expandido) {
                html += `
                    <tr class="sum-fila-panel" id="panel-sum-${c.id}">
                        <td colspan="7">
                            <div class="sum-panel-cuerpo">
                                <div class="sum-panel-top">
                                    <h4>
                                        ${ICONOS.drop}
                                        Suministros de ${esc(c.nombreCompleto)}
                                    </h4>
                                    <button type="button" class="sum-btn-mini-add" data-action="add-sum" data-id="${c.id}">
                                        + Asociar nuevo suministro
                                    </button>
                                </div>
                                <div class="sum-cards-grid">
                                    ${renderTarjetasSuministros(sums, c)}
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });

        tabla.innerHTML = html;
    }

    function renderTarjetasSuministros(sums, cliente) {
        if (!sums || !sums.length) {
            return `
                <div class="sum-card-vacio">
                    Este cliente aún no tiene conexiones de agua registradas.
                    <br><br>
                    <button type="button" class="sum-btn-mini-add" data-action="add-sum" data-id="${cliente.id}">
                        + Registrar primer suministro
                    </button>
                </div>
            `;
        }

        return sums.map(s => {
            const cat = (s.categoria || "DOMESTICO").toUpperCase();
            return `
                <div class="sum-card-item">
                    <div class="sum-card-head">
                        <span class="sum-card-codigo">${esc(s.codigoSuministro)}</span>
                        <select class="sum-cat-select" data-sum-cat="${s.id}" title="Cambiar categoría">
                            <option value="DOMESTICO" ${cat === "DOMESTICO" ? "selected" : ""}>Doméstico</option>
                            <option value="COMERCIAL" ${cat === "COMERCIAL" ? "selected" : ""}>Comercial</option>
                        </select>
                    </div>
                    <div class="sum-card-dir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>${esc(s.direccion || "Dirección no registrada")}</span>
                    </div>
                    <div class="sum-card-acciones">
                        <button type="button" class="sum-btn-act" data-sum-edit="${s.id}" title="Editar dirección o datos">
                            ${ICONOS.edit} Editar
                        </button>
                        <button type="button" class="sum-btn-act peligro" data-sum-del="${s.id}" title="Eliminar suministro">
                            ${ICONOS.trash} Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Modal Cliente
    function abrirModalCliente(cliente = null) {
        formCliente.reset();
        errorCliente.textContent = "";
        $("clienteId").value = cliente ? cliente.id : "";
        const esEdicion = !!cliente;

        $("modalKicker").textContent = esEdicion ? "Edición de titular" : "Nuevo registro";
        $("modalTitulo").textContent = esEdicion ? "Editar cliente" : "Nuevo cliente";
        $("estadoField").hidden = !esEdicion;

        if (cliente) {
            $("nombreCompleto").value = cliente.nombreCompleto || "";
            $("dni").value = cliente.dni || "";
            $("telefono").value = cliente.telefono || "";
            $("email").value = cliente.email || "";
            $("estado").value = cliente.estado || "ACTIVO";
        }

        modalCliente.classList.add("show");
        $("nombreCompleto").focus();
    }

    function cerrarModalCliente() {
        modalCliente.classList.remove("show");
    }

    // Modal Suministro
    function abrirModalSuministro(suministro = null, clienteIdPreseleccionado = null) {
        formSum.reset();
        errorSum.textContent = "";
        $("suministroId").value = suministro ? suministro.id : "";
        const esEdicion = !!suministro;

        $("modalSumKicker").textContent = esEdicion ? "Edición de conexión" : "Asociación domiciliaria";
        $("modalSumTitulo").textContent = esEdicion ? "Editar Suministro" : "Nuevo Suministro";

        if (suministro) {
            selectClienteSum.value = suministro.clienteId || "";
            $("sumCodigo").value = suministro.codigoSuministro || "";
            $("sumDireccion").value = suministro.direccion || "";
            $("sumCategoria").value = (suministro.categoria || "DOMESTICO").toUpperCase();
            $("sumLatitud").value = suministro.latitud != null ? suministro.latitud : "";
            $("sumLongitud").value = suministro.longitud != null ? suministro.longitud : "";
        } else {
            if (clienteIdPreseleccionado) {
                selectClienteSum.value = String(clienteIdPreseleccionado);
            }
            $("sumCategoria").value = "DOMESTICO";
        }

        modalSum.classList.add("show");
        $("sumCodigo").focus();
    }

    function cerrarModalSuministro() {
        modalSum.classList.remove("show");
    }

    // Eventos de click en la tabla (delegación)
    tabla.addEventListener("click", async (e) => {
        // Toggle desplegar suministros
        const btnToggle = e.target.closest("[data-toggle-sum]");
        if (btnToggle) {
            const clienteId = Number(btnToggle.getAttribute("data-toggle-sum"));
            if (clientesExpandidos.has(clienteId)) {
                clientesExpandidos.delete(clienteId);
            } else {
                clientesExpandidos.add(clienteId);
            }
            render();
            return;
        }

        // Acciones de cliente
        const btnCliente = e.target.closest("button[data-action]");
        if (btnCliente) {
            const clienteId = Number(btnCliente.dataset.id);
            const cliente = clientes.find(c => c.id === clienteId);
            if (!cliente) return;

            const accion = btnCliente.dataset.action;

            if (accion === "edit") {
                abrirModalCliente(cliente);
                return;
            }

            if (accion === "add-sum") {
                abrirModalSuministro(null, cliente.id);
                return;
            }

            if (accion === "toggle") {
                const siguiente = cliente.estado === "ACTIVO" ? "desactivar" : "activar";
                if (!confirm(`¿Deseas ${siguiente} al cliente ${cliente.nombreCompleto}?`)) return;

                try {
                    await apiFetch(`/api/clientes/${cliente.id}`, { method: "DELETE" });
                    toast(`Cliente ${siguiente === "activar" ? "activado" : "desactivado"} correctamente`);
                    await cargarDatos();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }
        }

        // Acciones de suministro
        const btnEditSum = e.target.closest("[data-sum-edit]");
        if (btnEditSum) {
            const sumId = Number(btnEditSum.getAttribute("data-sum-edit"));
            const sum = suministros.find(s => s.id === sumId);
            if (sum) abrirModalSuministro(sum);
            return;
        }

        const btnDelSum = e.target.closest("[data-sum-del]");
        if (btnDelSum) {
            const sumId = Number(btnDelSum.getAttribute("data-sum-del"));
            const sum = suministros.find(s => s.id === sumId);
            if (!sum) return;

            if (!confirm(`¿Estás seguro de eliminar el suministro ${sum.codigoSuministro}?`)) return;

            try {
                await apiFetch(`/api/suministros/${sum.id}`, { method: "DELETE" });
                toast("Suministro eliminado correctamente");
                await cargarDatos();
            } catch (err) {
                toast(err.message || "Error al eliminar el suministro", true);
            }
            return;
        }
    });

    // Cambio rápido de categoría en el select de la tarjeta
    tabla.addEventListener("change", async (e) => {
        const selectCat = e.target.closest("[data-sum-cat]");
        if (!selectCat) return;

        const sumId = Number(selectCat.getAttribute("data-sum-cat"));
        const nuevaCat = selectCat.value;

        try {
            await apiFetch(`/api/suministros/${sumId}/categoria`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoria: nuevaCat })
            });

            toast(`Categoría actualizada a ${nuevaCat}`);
            await cargarDatos();
        } catch (err) {
            toast(err.message || "Error al cambiar categoría", true);
            await cargarDatos();
        }
    });

    // Enviar formulario Cliente
    formCliente.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorCliente.textContent = "";

        const id = $("clienteId").value;
        const data = {
            nombreCompleto: $("nombreCompleto").value.trim(),
            dni: $("dni").value.trim(),
            telefono: $("telefono").value.trim(),
            email: $("email").value.trim()
        };

        if (id) data.estado = $("estado").value;

        if (!/^\d{8}$/.test(data.dni)) {
            errorCliente.textContent = "El DNI debe tener exactamente 8 dígitos numéricos.";
            return;
        }

        btnGuardarCliente.disabled = true;
        btnGuardarCliente.textContent = "Guardando...";

        try {
            await apiFetch(id ? `/api/clientes/${id}` : "/api/clientes", {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            cerrarModalCliente();
            toast(id ? "Cliente actualizado correctamente" : "Cliente registrado exitosamente");
            await cargarDatos();

        } catch (err) {
            errorCliente.textContent = err.message || "Error al guardar el cliente.";
        } finally {
            btnGuardarCliente.disabled = false;
            btnGuardarCliente.textContent = "Guardar cliente";
        }
    });

    // Enviar formulario Suministro
    formSum.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorSum.textContent = "";

        const id = $("suministroId").value;
        const codigo = $("sumCodigo").value.trim();
        const clienteId = Number(selectClienteSum.value);
        const direccion = $("sumDireccion").value.trim();
        const categoria = $("sumCategoria").value;
        const lat = $("sumLatitud").value ? parseFloat($("sumLatitud").value) : null;
        const lng = $("sumLongitud").value ? parseFloat($("sumLongitud").value) : null;

        if (!codigo) {
            errorSum.textContent = "El código de suministro es obligatorio.";
            return;
        }

        if (!clienteId) {
            errorSum.textContent = "Debes seleccionar un cliente titular.";
            return;
        }

        if (!direccion) {
            errorSum.textContent = "La dirección del predio es obligatoria.";
            return;
        }

        btnGuardarSum.disabled = true;
        btnGuardarSum.textContent = "Guardando...";

        try {
            const payload = {
                codigoSuministro: codigo,
                clienteId: clienteId,
                direccion: direccion,
                latitud: lat,
                longitud: lng
            };

            const guardado = await apiFetch(id ? `/api/suministros/${id}` : "/api/suministros", {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            // Si cambió la categoría y es distinta a la por defecto, actualizarla
            if (guardado && guardado.id && categoria) {
                await apiFetch(`/api/suministros/${guardado.id}/categoria`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ categoria: categoria })
                }).catch(() => {});
            }

            clientesExpandidos.add(clienteId);
            cerrarModalSuministro();
            toast(id ? "Suministro actualizado correctamente" : "Suministro asociado exitosamente");
            await cargarDatos();

        } catch (err) {
            errorSum.textContent = err.message || "Error al guardar el suministro.";
        } finally {
            btnGuardarSum.disabled = false;
            btnGuardarSum.textContent = "Guardar suministro";
        }
    });

    // Botones de modales
    $("nuevoClienteButton").addEventListener("click", () => abrirModalCliente());
    $("nuevoSuministroButton").addEventListener("click", () => abrirModalSuministro());

    $("cerrarModal").addEventListener("click", cerrarModalCliente);
    $("cancelarModal").addEventListener("click", cerrarModalCliente);
    modalCliente.addEventListener("click", e => { if (e.target === modalCliente) cerrarModalCliente(); });

    $("cerrarSumModal").addEventListener("click", cerrarModalSuministro);
    $("cancelarSumModal").addEventListener("click", cerrarModalSuministro);
    modalSum.addEventListener("click", e => { if (e.target === modalSum) cerrarModalSuministro(); });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            cerrarModalCliente();
            cerrarModalSuministro();
        }
    });

    // Validaciones de input
    $("dni").addEventListener("input", () => {
        $("dni").value = $("dni").value.replace(/\D/g, "").slice(0, 8);
    });

    $("telefono").addEventListener("input", () => {
        $("telefono").value = $("telefono").value.replace(/\D/g, "").slice(0, 15);
    });

    // Filtros interactivos
    buscar.addEventListener("input", render);
    filtroEstado.addEventListener("change", render);
    filtroSuministro.addEventListener("change", render);

    cargarDatos();
});
