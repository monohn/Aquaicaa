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

    async function validarSuministroRapido(codigo) {
        if (codigo === "00000000") {
            suministroEncontrado = true;
            titularSuministro.textContent = "Incidencia Vecinal / Vía Pública";
            dniSuministro.textContent = "00000000";
            direccionSuministro.textContent = "Vía Pública, Cercado de Ica";
            datosSuministro.style.display = "block";
            mostrarMensaje("Modo vía pública activado. Se registrará la incidencia sin requerir recibo domiciliario.", "success");
            return;
        }

        if (!/^\d{8}$/.test(codigo)) {
            suministroEncontrado = false;
            datosSuministro.style.display = "none";
            mostrarMensaje("El número de suministro debe contener exactamente 8 dígitos.", "error");
            return;
        }

        // Válido de inmediato con los 8 dígitos
        suministroEncontrado = true;
        titularSuministro.textContent = localStorage.getItem("username") || "Titular de Suministro";
        dniSuministro.textContent = codigo;
        direccionSuministro.textContent = "Ica, Perú";
        datosSuministro.style.display = "block";
        mostrarMensaje("Número de suministro aceptado (8 dígitos).", "success");

        // Consulta en segundo plano para enriquecer datos si ya existe registrado
        try {
            const respuesta = await fetch(`/api/suministros/${encodeURIComponent(codigo)}`);
            if (respuesta.ok) {
                const s = await respuesta.json();
                if (s.nombreTitular || s.nombreCliente) {
                    titularSuministro.textContent = s.nombreTitular || s.nombreCliente;
                }
                if (s.dni || s.dniCliente) {
                    dniSuministro.textContent = s.dni || s.dniCliente;
                }
                if (s.direccion) {
                    direccionSuministro.textContent = s.direccion;
                }
            }
        } catch (e) {
            console.log("Consulta complementaria en segundo plano:", e);
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
        // Permitir solo números y máximo 8 dígitos
        codigoInput.value = codigoInput.value.replace(/\D/g, '').slice(0, 8);
        const val = codigoInput.value;

        if (val.length === 8) {
            validarSuministroRapido(val);
        } else {
            suministroEncontrado = false;
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

        // Validación de 8 dígitos
        if (!/^\d{8}$/.test(codigoSuministro)) {
            mostrarMensaje(
                "El número de suministro debe tener exactamente 8 dígitos.",
                "error"
            );
            return;
        }
        suministroEncontrado = true;

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
                    ? "📍 Solicitando permiso de ubicación al navegador..."
                    : "📍 Detectando señal satelital GPS...";
            }
            if (btnTxt) btnTxt.textContent = "Detectando...";
            if (btnManual) btnManual.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const prec = Math.round(pos.coords.accuracy || 10);

                    if (inputLat) inputLat.value = lat.toFixed(6);
                    if (inputLng) inputLng.value = lng.toFixed(6);

                    localStorage.setItem("aquaica_last_lat", lat);
                    localStorage.setItem("aquaica_last_lng", lng);

                    if (badge) {
                        badge.className = "geoloc-badge exito";
                        badge.textContent = `✅ Ubicación GPS detectada (±${prec} m)`;
                    }
                    if (coordsSpan) {
                        coordsSpan.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    }
                    if (btnTxt) btnTxt.textContent = "Ubicación detectada";
                    if (btnManual) btnManual.disabled = false;
                },
                (err) => {
                    console.log("GPS no concedido o error:", err);
                    if (badge) {
                        badge.className = "geoloc-badge aviso";
                        if (err.code === err.PERMISSION_DENIED) {
                            badge.textContent = "ℹ️ Permiso de ubicación no concedido. Puedes continuar ingresando tu dirección.";
                        } else {
                            badge.textContent = "⚠️ Señal satelital no disponible en este instante.";
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

// PREFILL_CODIGO: si llegas desde el portal (reporte.html?codigo=...) o tienes suministro guardado en tu perfil
document.addEventListener("DOMContentLoaded", () => {
    const urlCodigo = new URLSearchParams(window.location.search).get("codigo");
    const perfilCodigo = localStorage.getItem("perfil_suministro");
    const codigoFinal = urlCodigo || perfilCodigo;

    const input = document.getElementById("codigoSuministro");
    const boton = document.getElementById("buscarSuministro");
    if (codigoFinal && input && boton && !input.value) {
        input.value = codigoFinal;
        boton.click();
    }
});
