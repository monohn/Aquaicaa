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

    const formulario =
        document.getElementById("reporteForm");

    const mensaje =
        document.getElementById("reporteMensaje");

    const codigoInput =
        document.getElementById("codigoSuministro");

    const buscarButton =
        document.getElementById("buscarSuministro");

    const datosSuministro =
        document.getElementById("datosSuministro");

    const titularSuministro =
        document.getElementById("titularSuministro");

    const dniSuministro =
        document.getElementById("dniSuministro");

    const direccionSuministro =
        document.getElementById("direccionSuministro");

    const evidenciaInput =
        document.getElementById("evidencia");


    let suministroEncontrado = false;
    let titularValidadoActual = "";
    let direccionValidadaActual = "";

    const direccionInput = document.getElementById("direccionIncidencia");

    async function validarSuministroRapido(codigo) {
        const valor = (codigo || "").trim();
        if (!valor) {
            suministroEncontrado = false;
            datosSuministro.style.display = "none";
            mostrarMensaje("Ingresa tu DNI de 8 dígitos o código de suministro.", "error");
            return;
        }

        if (valor === "00000000") {
            suministroEncontrado = true;
            titularValidadoActual = "Incidencia Vecinal / Vía Pública";
            titularSuministro.textContent = titularValidadoActual;
            dniSuministro.textContent = "00000000";
            const dirGps = (direccionInput?.value || "").trim();
            direccionValidadaActual = dirGps || "Pendiente de detectar por GPS o ingresar dirección";
            direccionSuministro.textContent = direccionValidadaActual;
            datosSuministro.style.display = "block";
            mostrarMensaje("Modo vía pública activado. Se registrará sin requerir recibo domiciliario.", "success");
            return;
        }

        buscarButton.disabled = true;
        buscarButton.textContent = "Validando...";
        mostrarMensaje("Consultando datos reales...", "info");

        try {
            const respuesta = await fetch(`/api/public/validar-identidad/${encodeURIComponent(valor)}`);
            if (!respuesta.ok) {
                throw new Error("No se pudo validar en este momento.");
            }
            const data = await respuesta.json();

            if (!data || !data.encontrado) {
                suministroEncontrado = false;
                titularValidadoActual = "";
                direccionValidadaActual = "";
                datosSuministro.style.display = "none";
                mostrarMensaje(
                    data?.mensaje || "No se encontró información registrada para ese DNI o código.",
                    "error"
                );
                return;
            }

            suministroEncontrado = true;
            titularValidadoActual = data.nombreCompleto || "";
            const dirGps = (direccionInput?.value || "").trim();
            direccionValidadaActual = data.direccion || dirGps || "";

            titularSuministro.textContent = titularValidadoActual || "Sin nombre registrado";
            dniSuministro.textContent = data.dni || valor;
            direccionSuministro.textContent = direccionValidadaActual || "Usa 'Detectar GPS' o ingresa tu ubicación exacta abajo";

            if (data.direccion && direccionInput) {
                direccionInput.value = data.direccion;
            }
            if (data.latitud && data.longitud) {
                const inLat = document.getElementById("reporteLatitud");
                const inLng = document.getElementById("reporteLongitud");
                if (inLat && !inLat.value) inLat.value = data.latitud;
                if (inLng && !inLng.value) inLng.value = data.longitud;
            }

            datosSuministro.style.display = "block";
            const origenTxt = data.fuente === "RENIEC" ? "RENIEC" : "Padrón AquaIca";
            mostrarMensaje(`Identidad validada (${origenTxt}): ${titularValidadoActual}.`, "success");
        } catch (e) {
            console.error("Error validando DNI/suministro:", e);
            suministroEncontrado = false;
            datosSuministro.style.display = "none";
            mostrarMensaje("No se pudo conectar con el servicio de validación.", "error");
        } finally {
            buscarButton.disabled = false;
            buscarButton.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" style="width:14px;height:14px"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></svg> Validar`;
        }
    }

    buscarButton.addEventListener("click", async () => {
        const codigo = codigoInput.value.trim();
        validarSuministroRapido(codigo);
    });

    const btnSinSuministro = document.getElementById("btnSinSuministro");
    if (btnSinSuministro) {
        btnSinSuministro.addEventListener("click", () => {
            codigoInput.value = "00000000";
            validarSuministroRapido("00000000");
            const btnGeo = document.getElementById("btnGeolocManual");
            const latVal = document.getElementById("reporteLatitud")?.value;
            if (btnGeo && !latVal) {
                btnGeo.click();
            }
        });
    }

    codigoInput.addEventListener("input", () => {
        const val = codigoInput.value.trim();

        if (/^\d{8}$/.test(val)) {
            validarSuministroRapido(val);
        } else {
            suministroEncontrado = false;
            titularValidadoActual = "";
            direccionValidadaActual = "";
            datosSuministro.style.display = "none";
            limpiarMensaje();
        }
    });

    formulario.addEventListener("submit", async (event) => {

        event.preventDefault();

        const codigoSuministro =
            codigoInput.value.trim();

        const tipoProblema =
            document.getElementById("tipoProblema").value;

        const descripcion =
            document.getElementById("descripcion")
                .value
                .trim();

        const archivo =
            evidenciaInput.files[0];

        if (!codigoSuministro ||
            !tipoProblema ||
            !descripcion) {

            mostrarMensaje(
                "Completa todos los campos.",
                "error"
            );

            return;
        }

        // Validar si aún no se validó
        if (!suministroEncontrado && /^\d{8}$/.test(codigoSuministro)) {
            await validarSuministroRapido(codigoSuministro);
        }
        if (!suministroEncontrado) {
            mostrarMensaje(
                "Por favor valida primero tu DNI o número de suministro (o usa el modo vía pública).",
                "error"
            );
            return;
        }

        if (archivo) {
            const tiposPermitidos = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "image/heic",
                "image/heif"
            ];
            const extensionesPermitidas = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
            const nombre = (archivo.name || "").toLowerCase();
            const esImagen = tiposPermitidos.includes((archivo.type || "").toLowerCase()) ||
                             extensionesPermitidas.some(ext => nombre.endsWith(ext)) ||
                             (archivo.type && archivo.type.startsWith("image/"));

            if (!esImagen) {
                mostrarMensaje(
                    "La evidencia debe ser una imagen (JPG, PNG o WEBP).",
                    "error"
                );
                return;
            }

            const tamañoMaximo = 20 * 1024 * 1024; // 20 MB

            if (archivo.size > tamañoMaximo) {
                mostrarMensaje(
                    "La imagen no puede superar los 20 MB.",
                    "error"
                );
                return;
            }
        }


        const boton =
            formulario.querySelector(
                "button[type='submit']"
            );


        boton.disabled = true;

        boton.textContent =
            "Enviando...";


        try {

            const formData =
                new URLSearchParams();


            formData.append(
                "codigoSuministro",
                codigoSuministro
            );


            formData.append(
                "tipoProblema",
                tipoProblema
            );


            const lat = document.getElementById("reporteLatitud")?.value;
            const lng = document.getElementById("reporteLongitud")?.value;
            const dirManual = (direccionInput?.value || direccionValidadaActual || "").trim();

            if (titularValidadoActual) {
                formData.append("nombreTitular", titularValidadoActual);
            }
            if (dirManual) {
                formData.append("direccion", dirManual);
            }

            let descFinal = descripcion;
            if (lat && lng) {
                formData.append("latitud", lat);
                formData.append("longitud", lng);
                descFinal = `${descripcion}\n[GPS: ${lat}, ${lng}]`;
            }

            formData.append(
                "descripcion",
                descFinal
            );


            const respuesta =
                await fetch(
                    "/api/reportes",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                        body: formData
                    }
                );


            if (!respuesta.ok) {

                const textoError =
                    await respuesta.text();


                console.error(
                    "Error del servidor:",
                    textoError
                );


                mostrarMensaje(
                    "No se pudo registrar el reporte.",
                    "error"
                );

                return;
            }


            const reporte =
                await respuesta.json();


            console.log(
                "Reporte creado:",
                reporte
            );

            if (archivo) {
                const evidenciaData = new FormData();
                evidenciaData.append("archivo", archivo);

                const headers = {};
                const token = localStorage.getItem("token");
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const respuestaEvidencia = await fetch(
                    `/api/reportes/${reporte.id}/evidencias`,
                    {
                        method: "POST",
                        headers: headers,
                        body: evidenciaData
                    }
                );

                if (!respuestaEvidencia.ok) {
                    let detalleError = "";
                    try {
                        const errJson = await respuestaEvidencia.json();
                        detalleError = errJson.message || "";
                    } catch (e) {
                        detalleError = await respuestaEvidencia.text().catch(() => "");
                    }
                    console.error("Error al guardar la evidencia:", respuestaEvidencia.status, detalleError);
                    mostrarMensaje(
                        `Reporte #${reporte.id} registrado, pero la evidencia no pudo guardarse: ${detalleError || 'Error de subida'}`,
                        "error"
                    );
                    return;
                }

                console.log("Evidencia guardada correctamente.");
            }

            mostrarMensaje(
                `Reporte registrado correctamente. Código: #${reporte.id}. Redirigiendo al muro de incidencias...`,
                "success"
            );

            formulario.reset();

            datosSuministro.style.display =
                "none";

            suministroEncontrado = false;

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1800);


        } catch (error) {

            console.error(
                "Error al crear reporte:",
                error
            );


            mostrarMensaje(
                "No se pudo conectar con AquaIca.",
                "error"
            );


        } finally {

            boton.disabled = false;

            boton.textContent =
                "Enviar reporte";
        }

    });


    function mostrarMensaje(texto, tipo) {

        mensaje.textContent =
            texto;

        mensaje.className =
            `reporte-mensaje ${tipo}`;
    }


    function limpiarMensaje() {

        mensaje.textContent =
            "";

        mensaje.className =
            "reporte-mensaje";
    }

    iniciarGeolocalizacionReporte();

    /* ===== GEOLOCALIZACIÓN GPS AUTOMÁTICA CON PERMISO ===== */
    function iniciarGeolocalizacionReporte() {
        const card = document.getElementById("geolocCard");
        const desc = document.getElementById("geolocDesc");
        const statusBar = document.getElementById("geolocStatusBar");
        const badge = document.getElementById("geolocBadge");
        const coordsSpan = document.getElementById("geolocCoords");
        const btnTxt = document.getElementById("btnGeolocTxt");
        const btnManual = document.getElementById("btnGeolocManual");
        const inputLat = document.getElementById("reporteLatitud");
        const inputLng = document.getElementById("reporteLongitud");

        if (!card) return;

        if (!navigator.geolocation) {
            if (desc) desc.textContent = "Geolocalización no soportada en este navegador.";
            if (btnManual) btnManual.style.display = "none";
            return;
        }

        function solicitarGPS(esAutomatico = false) {
            if (statusBar) statusBar.style.display = "flex";
            if (badge) {
                badge.className = "geoloc-badge pendiente";
                badge.textContent = esAutomatico
                    ? "Solicitando permiso de ubicación al navegador..."
                    : "Detectando señal satelital GPS...";
            }
            if (btnTxt) btnTxt.textContent = "Detectando...";
            if (btnManual) btnManual.disabled = true;

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const prec = Math.round(pos.coords.accuracy || 10);

                    if (inputLat) inputLat.value = lat.toFixed(6);
                    if (inputLng) inputLng.value = lng.toFixed(6);

                    localStorage.setItem("aquaica_last_lat", lat);
                    localStorage.setItem("aquaica_last_lng", lng);

                    if (badge) {
                        badge.className = "geoloc-badge exito";
                        badge.textContent = `Ubicación GPS detectada (±${prec} m)`;
                    }
                    if (coordsSpan) {
                        coordsSpan.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    }
                    if (btnTxt) btnTxt.textContent = "Ubicación detectada";
                    if (btnManual) btnManual.disabled = false;

                    // Reverse geocoding real con Nominatim para obtener dirección de calle exacta
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
                            if (dirReal) {
                                const inDir = document.getElementById("direccionIncidencia");
                                if (inDir && !inDir.value.trim()) {
                                    inDir.value = dirReal;
                                }
                                const spanDir = document.getElementById("direccionSuministro");
                                if (spanDir && (!direccionValidadaActual || spanDir.textContent.includes("Detectar GPS") || spanDir.textContent.includes("Pendiente"))) {
                                    spanDir.textContent = dirReal;
                                }
                            }
                        }
                    } catch (geoErr) {
                        console.log("Geocodificación inversa:", geoErr);
                    }
                },
                (err) => {
                    console.log("GPS no concedido o error:", err);
                    if (badge) {
                        badge.className = "geoloc-badge aviso";
                        if (err.code === err.PERMISSION_DENIED) {
                            badge.textContent = "Permiso de ubicación no concedido. Puedes ingresar tu dirección manualmente.";
                        } else {
                            badge.textContent = "Señal satelital no disponible en este instante.";
                        }
                    }
                    if (btnTxt) btnTxt.textContent = "Reintentar GPS";
                    if (btnManual) btnManual.disabled = false;
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }

        // Solicitar permiso de geolocalización automáticamente tras cargar la vista
        setTimeout(() => {
            solicitarGPS(true);
        }, 500);

        if (btnManual) {
            btnManual.addEventListener("click", () => solicitarGPS(false));
        }
    }

});

// PREFILL_CODIGO: solo si llegas desde el portal con ?codigo=... o el usuario logueado tiene suministro propio
document.addEventListener("DOMContentLoaded", () => {
    const urlCodigo = new URLSearchParams(window.location.search).get("codigo");
    const username = localStorage.getItem("username");
    const perfilCodigo = username ? localStorage.getItem(`perfil_${username}_suministro`) : null;
    const codigoFinal = urlCodigo || perfilCodigo;

    const input = document.getElementById("codigoSuministro");
    const boton = document.getElementById("buscarSuministro");
    if (codigoFinal && input && boton && !input.value) {
        input.value = codigoFinal;
        boton.click();
    }
});
