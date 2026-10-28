/**
 * AquaIca — Perfil Técnico
 * Carga de datos, métricas y actualización de perfil operativo.
 */

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    const sesion = Panel.iniciar(["TECNICO", "ADMIN", "SOPORTE"]);
    if (!sesion) {
        return;
    }

    const { $, esc, fecha, gradiente } = Panel;

    const form = $("perfilTecnicoForm");
    const alerta = $("perfilAlerta");
    const btnGuardar = $("btnGuardar");

    const ESPECIALIDADES_INFO = {
        REDES_FUGAS: {
            nombre: "Redes y Fugas",
            desc: "Atiende fugas de agua en red pública, roturas de tuberías y conexiones clandestinas."
        },
        FUGA: {
            nombre: "Redes y Fugas",
            desc: "Atiende fugas de agua en red pública y roturas de tuberías."
        },
        PRESION_TUBERIAS: {
            nombre: "Presión y Tuberías",
            desc: "Atiende cortes imprevistos, baja presión y desarenado de redes secundarias."
        },
        FACTURACION: {
            nombre: "Facturación y Medición",
            desc: "Atiende reclamos de consumo atípico, inspección de medidores e inconformidades."
        },
        GENERAL: {
            nombre: "Atención General (Multidisciplinario)",
            desc: "Habilitado para atender todo tipo de incidencias y trabajos técnicos prioritarios."
        }
    };

    let personalActual = null;

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
            const personal = await apiFetch("/api/personal/me");
            personalActual = personal;

            // Header Hero
            $("perfilNombreHero").textContent = personal.nombre || "Técnico AquaIca";
            const avatarGrande = $("perfilAvatarGrande");
            const inicial = (personal.nombre || personal.username || "T").charAt(0).toUpperCase();
            avatarGrande.textContent = inicial;
            avatarGrande.style.background = gradiente(personal.nombre || "T");

            const espClave = String(personal.especialidad || "").toUpperCase();
            const espInfo = ESPECIALIDADES_INFO[espClave] || {
                nombre: personal.especialidad || "General",
                desc: "Atención técnica especializada."
            };

            $("perfilEspecialidadBadge").textContent = espInfo.nombre;
            $("perfilEstadoBadge").textContent = personal.estado === "ACTIVO" ? "Cuadrilla Activa" : personal.estado;

            // Formulario
            $("campoNombre").value = personal.nombre || "";
            $("campoDni").value = personal.dni || "";
            $("campoEspecialidad").value = espInfo.nombre;
            $("hintEspecialidad").textContent = espInfo.desc;
            $("campoUsername").value = personal.username || "";
            $("campoTelefono").value = personal.telefono || "";
            $("campoFechaRegistro").value = personal.fechaRegistro ? fecha(personal.fechaRegistro) : "—";

            // Cargar métricas operativas
            if (personal.id) {
                cargarMetricas(personal.id);
            }

        } catch (error) {
            console.error("Error al cargar perfil del técnico:", error);
            mostrarAlerta("No se pudo cargar la información del técnico: " + (error.message || "Error"), true);
        }
    }

    async function cargarMetricas(personalId) {
        try {
            const asignaciones = await apiFetch(`/api/personal/${personalId}/asignaciones`);
            const total = asignaciones.length;
            const finalizadas = asignaciones.filter(a => a.estado === "FINALIZADA").length;
            const enCurso = asignaciones.filter(a => ["ACTIVA", "EN_ATENCION", "PENDIENTE"].includes(a.estado)).length;

            $("metricFinalizados").textContent = finalizadas;
            $("metricEnCurso").textContent = enCurso;

            const eficacia = total > 0 ? Math.round((finalizadas / total) * 100) : 100;
            $("metricEficacia").textContent = `${eficacia}%`;

        } catch (err) {
            console.warn("No se pudieron obtener métricas:", err);
        }
    }

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        ocultarAlerta();

        const telefono = $("campoTelefono").value.trim();
        const password = $("campoPassword").value;
        const confirmarPassword = $("campoConfirmarPassword").value;

        if (password) {
            if (password.length < 6) {
                mostrarAlerta("La nueva contraseña debe tener al menos 6 caracteres.", true);
                $("campoPassword").focus();
                return;
            }
            if (password !== confirmarPassword) {
                mostrarAlerta("Las contraseñas ingresadas no coinciden.", true);
                $("campoConfirmarPassword").focus();
                return;
            }
        }

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = `
            <svg class="dp-ico" viewBox="0 0 24 24" style="width:18px;height:18px;animation:spin 1s linear infinite;"><path d="M3 12a9 9 0 1 1 3 6.7"/></svg>
            Guardando cambios...
        `;

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

            mostrarAlerta("Tus datos han sido actualizados correctamente.");
            $("campoPassword").value = "";
            $("campoConfirmarPassword").value = "";

            if (actualizado && actualizado.telefono) {
                $("campoTelefono").value = actualizado.telefono;
            }

        } catch (error) {
            console.error("Error al actualizar perfil:", error);
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
