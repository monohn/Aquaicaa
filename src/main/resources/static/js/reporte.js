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


            formData.append(
                "descripcion",
                descripcion
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
