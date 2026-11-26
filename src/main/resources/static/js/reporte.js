document.addEventListener("DOMContentLoaded", () => {

    const sesionRol = localStorage.getItem("rol");
    if (sesionRol === "ADMIN" || sesionRol === "SOPORTE") {
        window.location.href = "dashboard.html";
        return;
    }
    if (sesionRol === "TECNICO") {
        window.location.href = "asignaciones.html";
        return;
    }

    const formulario = document.getElementById("reporteForm");
    const mensaje = document.getElementById("reporteMensaje");
    const codigoInput = document.getElementById("codigoSuministro");
    const btnSinSuministro = document.getElementById("btnSinSuministro");
    const dniEstadoInline = document.getElementById("dniEstadoInline");
    const nombreManualWrap = document.getElementById("nombreManualWrap");
    const nombreManualInput = document.getElementById("nombreManualInput");
    const direccionInput = document.getElementById("direccionIncidencia");
    const tipoInput = document.getElementById("tipoProblema");
    const evidenciaInput = document.getElementById("evidencia");
    const fileUploadWrap = document.getElementById("fileUploadWrap");
    const previewWrap = document.getElementById("evidenciaPreviewWrap");
    const previewImg = document.getElementById("evidenciaPreviewImg");
    const previewInfo = document.getElementById("evidenciaPreviewInfo");
    const btnQuitarFoto = document.getElementById("btnQuitarFoto");

    let titularValidadoActual = "";
    let modoViaPublica = false;
    let archivoPreparado = null;
    let timerLookup = null;

    // 1. Chips de 1 toque para tipo de problema
    document.querySelectorAll("#tipoChips .tipo-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll("#tipoChips .tipo-chip").forEach(c => c.classList.remove("selected"));
            chip.classList.add("selected");
            tipoInput.value = chip.dataset.valor || "";
            limpiarMensaje();
        });
    });

    // 2. Toggle simple vía pública (sin DNI)
    if (btnSinSuministro) {
        btnSinSuministro.addEventListener("click", () => {
            modoViaPublica = !modoViaPublica;
            btnSinSuministro.classList.toggle("activo", modoViaPublica);
            if (modoViaPublica) {
                codigoInput.value = "00000000";
                titularValidadoActual = "Incidencia Vecinal / Vía Pública";
                if (nombreManualWrap) nombreManualWrap.style.display = "none";
                mostrarEstadoDni("Modo vía pública activado (no requiere DNI).", "neutral");
                const latVal = document.getElementById("reporteLatitud")?.value;
                if (!latVal) {
                    document.getElementById("btnGeolocManual")?.click();
                }
            } else {
                codigoInput.value = "";
                titularValidadoActual = "";
                ocultarEstadoDni();
            }
        });
    }

    // 3. Validación silenciosa no bloqueante al escribir 8 dígitos
    async function consultarDniSilencioso(valor) {
        const codigo = (valor || "").trim();
        if (!codigo || codigo === "00000000") return;

        mostrarEstadoDni("Verificando DNI...", "info");
        try {
            const resp = await fetch(`/api/public/validar-identidad/${encodeURIComponent(codigo)}`);
            if (!resp.ok) throw new Error("lookup_fail");
            const data = await resp.json();

            if (data && data.encontrado && data.nombreCompleto) {
                titularValidadoActual = data.nombreCompleto;
                if (nombreManualWrap) nombreManualWrap.style.display = "none";
                if (data.direccion && direccionInput && !direccionInput.value.trim()) {
                    direccionInput.value = data.direccion;
                }
                if (data.latitud && data.longitud) {
                    const inLat = document.getElementById("reporteLatitud");
                    const inLng = document.getElementById("reporteLongitud");
                    if (inLat && !inLat.value) inLat.value = data.latitud;
                    if (inLng && !inLng.value) inLng.value = data.longitud;
                }
                mostrarEstadoDni(`✓ ${titularValidadoActual}`, "ok");
            } else {
                // Nunca bloquear al ciudadano si RENIEC no responde o no encuentra el DNI
                titularValidadoActual = "";
                if (nombreManualWrap) nombreManualWrap.style.display = "block";
                mostrarEstadoDni("DNI listo. Puedes escribir tu nombre abajo (opcional) y enviar igual.", "neutral");
            }
        } catch (_) {
            titularValidadoActual = "";
            if (nombreManualWrap) nombreManualWrap.style.display = "block";
            mostrarEstadoDni("DNI listo. Puedes continuar con tu reporte sin esperar verificación externa.", "neutral");
        }
    }

    codigoInput.addEventListener("input", () => {
        const val = codigoInput.value.trim();
        if (val !== "00000000" && modoViaPublica) {
            modoViaPublica = false;
            btnSinSuministro?.classList.remove("activo");
        }
        clearTimeout(timerLookup);
        if (/^\d{8}$/.test(val) && val !== "00000000") {
            timerLookup = setTimeout(() => consultarDniSilencioso(val), 250);
        } else if (val.length === 0) {
            titularValidadoActual = "";
            if (nombreManualWrap) nombreManualWrap.style.display = "none";
            ocultarEstadoDni();
        }
    });

    // 4. Selección y compresión automática de imagen (soporta cámara celular y HEIC -> JPEG <400KB)
    evidenciaInput.addEventListener("change", async () => {
        const file = evidenciaInput.files[0];
        if (!file) {
            resetFoto();
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            mostrarMensaje("La imagen supera los 25 MB.", "error");
            resetFoto();
            return;
        }

        if (previewInfo) previewInfo.textContent = "Optimizando imagen...";
        if (previewWrap) previewWrap.style.display = "flex";
        if (fileUploadWrap) fileUploadWrap.style.display = "none";

        const comprimida = typeof comprimirImagenParaSubida === "function"
            ? await comprimirImagenParaSubida(file, 1400, 0.82)
            : file;

        archivoPreparado = comprimida;

        const kb = Math.max(1, Math.round(comprimida.size / 1024));
        if (previewInfo) previewInfo.textContent = `Foto lista (${kb} KB)`;

        const reader = new FileReader();
        reader.onload = ev => {
            if (previewImg) previewImg.src = ev.target.result;
        };
        reader.readAsDataURL(comprimida);
    });

    if (btnQuitarFoto) {
        btnQuitarFoto.addEventListener("click", resetFoto);
    }

    function resetFoto() {
        archivoPreparado = null;
        evidenciaInput.value = "";
        if (previewImg) previewImg.src = "";
        if (previewWrap) previewWrap.style.display = "none";
        if (fileUploadWrap) fileUploadWrap.style.display = "block";
    }

    // 5. Envío directo del formulario (sin bloqueos)
    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();
        limpiarMensaje();

        let codigoSuministro = codigoInput.value.trim();
        if (!codigoSuministro) {
            codigoSuministro = "00000000";
        }
        if (codigoSuministro !== "00000000" && !/^\d{8}$/.test(codigoSuministro) && codigoSuministro.length < 4) {
            mostrarMensaje("Ingresa un DNI de 8 dígitos o toca 'Sin DNI (vía pública)'.", "error");
            return;
        }

        const tipoProblema = tipoInput.value;
        if (!tipoProblema) {
            mostrarMensaje("Toca el tipo de problema que estás reportando.", "error");
            return;
        }

        const descripcion = document.getElementById("descripcion").value.trim();
        if (!descripcion) {
            mostrarMensaje("Escribe brevemente qué ocurrió.", "error");
            return;
        }

        const boton = formulario.querySelector("button[type='submit']");
        boton.disabled = true;
        boton.textContent = "Enviando reporte...";

        try {
            const formData = new URLSearchParams();
            formData.append("codigoSuministro", codigoSuministro);
            formData.append("tipoProblema", tipoProblema);

            const lat = document.getElementById("reporteLatitud")?.value;
            const lng = document.getElementById("reporteLongitud")?.value;
            const dirManual = (direccionInput?.value || "").trim();
            const nombreManual = (nombreManualInput?.value || "").trim();
            const titularFinal = titularValidadoActual || nombreManual;

            if (titularFinal) formData.append("nombreTitular", titularFinal);
            if (dirManual) formData.append("direccion", dirManual);

            let descFinal = descripcion;
            if (lat && lng) {
                formData.append("latitud", lat);
                formData.append("longitud", lng);
                descFinal = `${descripcion}\n[GPS: ${lat}, ${lng}]`;
            }
            formData.append("descripcion", descFinal);

            const headersReporte = { "Content-Type": "application/x-www-form-urlencoded" };
            const tokenSesion = localStorage.getItem("token");
            if (tokenSesion) {
                headersReporte["Authorization"] = `Bearer ${tokenSesion}`;
            }

            const respuesta = await fetch("/api/reportes", {
                method: "POST",
                headers: headersReporte,
                body: formData
            });

            if (!respuesta.ok) {
                const txtErr = await respuesta.text().catch(() => "");
                throw new Error(txtErr || "No se pudo registrar el reporte.");
            }

            const reporte = await respuesta.json();

            const fotoASubir = archivoPreparado || evidenciaInput.files[0];
            if (fotoASubir) {
                boton.textContent = "Subiendo foto...";
                const evidenciaData = new FormData();
                evidenciaData.append("archivo", fotoASubir);

                const headersEv = {};
                if (tokenSesion) {
                    headersEv["Authorization"] = `Bearer ${tokenSesion}`;
                }

                const respEv = await fetch(`/api/reportes/${reporte.id}/evidencias`, {
                    method: "POST",
                    headers: headersEv,
                    body: evidenciaData
                });

                if (!respEv.ok) {
                    let detalle = "";
                    try {
                        const errJson = await respEv.json();
                        detalle = errJson.message || "";
                    } catch (_) {
                        detalle = await respEv.text().catch(() => "");
                    }
                    mostrarMensaje(
                        `Reporte #${reporte.id} guardado, pero la foto no pudo subirse (${detalle || "error " + respEv.status}).`,
                        "error"
                    );
                    return;
                }
            }

            mostrarMensaje(`¡Listo! Reporte #${reporte.id} enviado. Volviendo al feed...`, "success");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1200);

        } catch (error) {
            console.error("Error al crear reporte:", error);
            mostrarMensaje(error.message || "No se pudo conectar con AquaIca.", "error");
        } finally {
            boton.disabled = false;
            boton.textContent = "Enviar reporte";
        }
    });

    function mostrarEstadoDni(texto, tipo) {
        if (!dniEstadoInline) return;
        dniEstadoInline.textContent = texto;
        dniEstadoInline.className = `dni-estado-inline ${tipo || "info"}`;
        dniEstadoInline.style.display = "block";
    }

    function ocultarEstadoDni() {
        if (!dniEstadoInline) return;
        dniEstadoInline.style.display = "none";
        dniEstadoInline.textContent = "";
    }

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = `reporte-mensaje ${tipo}`;
    }

    function limpiarMensaje() {
        mensaje.textContent = "";
        mensaje.className = "reporte-mensaje";
    }

    // 6. Geolocalización GPS automática discreta
    iniciarGeolocalizacionReporte();

    function iniciarGeolocalizacionReporte() {
        const estadoEl = document.getElementById("geolocEstado");
        const btnTxt = document.getElementById("btnGeolocTxt");
        const btnManual = document.getElementById("btnGeolocManual");
        const inputLat = document.getElementById("reporteLatitud");
        const inputLng = document.getElementById("reporteLongitud");

        if (!navigator.geolocation) {
            if (btnManual) btnManual.style.display = "none";
            if (estadoEl) estadoEl.textContent = "Escribe tu dirección o referencia exacta.";
            return;
        }

        function solicitarGPS() {
            if (btnTxt) btnTxt.textContent = "Buscando GPS...";
            if (btnManual) btnManual.disabled = true;

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const prec = Math.round(pos.coords.accuracy || 15);
                    if (inputLat) inputLat.value = lat.toFixed(6);
                    if (inputLng) inputLng.value = lng.toFixed(6);

                    if (btnTxt) btnTxt.textContent = "GPS listo";
                    if (btnManual) btnManual.disabled = false;
                    if (estadoEl) estadoEl.textContent = `Ubicación GPS detectada (±${prec} m)`;

                    try {
                        const geoResp = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
                            { headers: { "Accept-Language": "es" } }
                        );
                        if (geoResp.ok) {
                            const geoData = await geoResp.json();
                            const addr = geoData.address || {};
                            const calle = [addr.road || addr.pedestrian || addr.neighbourhood, addr.house_number].filter(Boolean).join(" ");
                            const zona = addr.suburb || addr.city_district || addr.town || addr.city || "";
                            const dirReal = [calle, zona].filter(Boolean).join(", ");
                            if (dirReal && direccionInput && !direccionInput.value.trim()) {
                                direccionInput.value = dirReal;
                            }
                        }
                    } catch (_) {
                        // Sin bloqueo si falla reverse geocoding
                    }
                },
                () => {
                    if (btnTxt) btnTxt.textContent = "Usar mi GPS";
                    if (btnManual) btnManual.disabled = false;
                    if (estadoEl) estadoEl.textContent = "Puedes escribir tu calle o referencia manualmente.";
                },
                { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
            );
        }

        setTimeout(solicitarGPS, 400);
        if (btnManual) {
            btnManual.addEventListener("click", solicitarGPS);
        }
    }

    // Precarga si viene desde ?codigo= o sesión ciudadana
    const urlCodigo = new URLSearchParams(window.location.search).get("codigo");
    const username = localStorage.getItem("username");
    const perfilCodigo = username ? localStorage.getItem(`perfil_${username}_suministro`) : null;
    const codigoInicial = urlCodigo || perfilCodigo;
    if (codigoInicial && !codigoInput.value) {
        codigoInput.value = codigoInicial;
        if (codigoInicial !== "00000000") {
            consultarDniSilencioso(codigoInicial);
        }
    }
});
