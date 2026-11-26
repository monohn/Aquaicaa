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
            const avatarTxt = $("perfilAvatarTxt");
            const avatarImg = $("perfilAvatarImg");
            const inicial = (nombre.charAt(0) || "A").toUpperCase();
            if (avatarTxt) avatarTxt.textContent = inicial;

            const rolActual = localStorage.getItem("rol") || "ADMIN";
            localStorage.removeItem("aquaica_avatar");
            const savedAvatar = localStorage.getItem(`aquaica_avatar_${rolActual}_${username}`);
            if (savedAvatar && avatarImg) {
                avatarImg.src = savedAvatar;
                avatarImg.style.display = "block";
                if (avatarTxt) avatarTxt.style.display = "none";
            } else {
                avatarGrande.style.background = "#0a74c9";
            }

            if (typeof sincronizarMiAvatar === "function") {
                sincronizarMiAvatar((serverAvatar) => {
                    if (avatarImg) {
                        avatarImg.src = serverAvatar;
                        avatarImg.style.display = "block";
                    }
                    if (avatarTxt) avatarTxt.style.display = "none";
                    if (avatarGrande) avatarGrande.style.background = "transparent";
                    const userAvatar = $("userAvatar");
                    if (userAvatar) {
                        userAvatar.innerHTML = `<img src="${serverAvatar}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                        userAvatar.style.background = "transparent";
                    }
                });
            }

            cargarMetricas();
            configurarSubidaAvatar();

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

    function configurarSubidaAvatar() {
        const input = $("avatarFileInput");
        const img = $("perfilAvatarImg");
        const txt = $("perfilAvatarTxt");
        const username = localStorage.getItem("username") || "admin";

        if (!input) return;

        input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const tempImg = new Image();
                tempImg.onload = () => {
                    const canvas = document.createElement("canvas");
                    const maxDim = 320;
                    let w = tempImg.width;
                    let h = tempImg.height;
                    if (w > h) {
                        if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
                    } else {
                        if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(tempImg, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

                    const rolActual = localStorage.getItem("rol") || "ADMIN";
                    localStorage.setItem(`aquaica_avatar_${rolActual}_${username}`, dataUrl);
                    localStorage.removeItem("aquaica_avatar");
                    if (typeof guardarMiAvatar === "function") {
                        guardarMiAvatar(dataUrl);
                    }

                    if (img) {
                        img.src = dataUrl;
                        img.style.display = "block";
                    }
                    if (txt) txt.style.display = "none";

                    const userAvatar = $("userAvatar");
                    if (userAvatar) {
                        userAvatar.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                        userAvatar.style.background = "transparent";
                    }
                    toast("Foto de perfil actualizada correctamente");
                };
                tempImg.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    await cargarPerfil();
});
