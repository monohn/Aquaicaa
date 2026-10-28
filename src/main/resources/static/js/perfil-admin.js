/**
 * AquaIca — Perfil Administrador
 * Visualización y actualización de credenciales de administración.
 */

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    const sesion = Panel.iniciar(["ADMIN", "SOPORTE"]);
    if (!sesion) {
        return;
    }

    const { $, esc, gradiente, toast } = Panel;

    const form = $("perfilAdminForm");
    const alerta = $("adminAlerta");
    const btnGuardar = $("btnGuardarAdmin");

    function mostrarAlerta(mensaje, esError = false) {
        alerta.className = `tp-alerta ${esError ? "error" : "exito"}`;
        alerta.innerHTML = `
            <svg class="dp-ico" viewBox="0 0 24 24" style="width:16px;height:16px;vertical-align:-2px;">
                ${esError
                    ? '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
                    : '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'}
            </svg>
            <span>${esc(mensaje)}</span>
        `;
        alerta.style.display = "inline-flex";
    }

    function ocultarAlerta() {
        alerta.style.display = "none";
    }

    async function cargarPerfil() {
        try {
            const admin = await apiFetch("/api/personal/me").catch(() => null);

            const username = localStorage.getItem("username") || "admin";
            const nombre = (admin && admin.nombre) ? admin.nombre : "Administrador AquaIca";

            $("perfilNombreHero").textContent = nombre;
            $("adminNombre").value = nombre;
            $("adminUsername").value = username;

            if (admin && admin.dni) $("adminDni").value = admin.dni;
            if (admin && admin.telefono) $("adminTelefono").value = admin.telefono;

            const avatarGrande = $("perfilAvatarGrande");
            avatarGrande.textContent = (nombre.charAt(0) || "A").toUpperCase();
            avatarGrande.style.background = gradiente(nombre);

            cargarMetricas();

        } catch (error) {
            console.error("Error al cargar perfil admin:", error);
        }
    }

    async function cargarMetricas() {
        try {
            const [reportes, clientes, personal] = await Promise.all([
                apiFetch("/api/reportes").catch(() => []),
                apiFetch("/api/clientes").catch(() => []),
                apiFetch("/api/personal").catch(() => [])
            ]);

            $("metricReportes").textContent = Array.isArray(reportes) ? reportes.length : 0;
            $("metricClientes").textContent = Array.isArray(clientes) ? clientes.length : 0;

            const tecnicos = Array.isArray(personal)
                ? personal.filter(p => p.rol === "TECNICO").length
                : 9;
            $("metricTecnicos").textContent = tecnicos;

        } catch (err) {
            console.warn("No se pudieron cargar métricas de administración:", err);
        }
    }

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        ocultarAlerta();

        const telefono = $("adminTelefono").value.trim();
        const password = $("adminPassword").value;
        const confirmarPassword = $("adminConfirmarPassword").value;

        if (password) {
            if (password.length < 6) {
                mostrarAlerta("La nueva contraseña debe tener al menos 6 caracteres.", true);
                $("adminPassword").focus();
                return;
            }
            if (password !== confirmarPassword) {
                mostrarAlerta("Las contraseñas no coinciden.", true);
                $("adminConfirmarPassword").focus();
                return;
            }
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            const payload = {
                telefono: telefono,
                password: password ? password : null
            };

            const actualizado = await apiFetch("/api/personal/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            mostrarAlerta("Perfil administrativo actualizado correctamente.");
            toast("Cambios guardados con éxito");

            $("adminPassword").value = "";
            $("adminConfirmarPassword").value = "";

            if (actualizado && actualizado.telefono) {
                $("adminTelefono").value = actualizado.telefono;
            }

        } catch (error) {
            console.error("Error al actualizar perfil admin:", error);
            mostrarAlerta(error.message || "Error al guardar los cambios.", true);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = `
                <svg class="dp-ico" viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Guardar cambios
            `;
        }
    });

    await cargarPerfil();
});
