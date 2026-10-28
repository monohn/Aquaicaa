/**
 * AquaIca — Configuraciones del Sistema
 * Persistencia y gestión de parámetros operativos, SLAs e información de la empresa prestadora.
 */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    const sesion = Panel.iniciar(["ADMIN", "SOPORTE"]);
    if (!sesion) {
        return;
    }

    const { $, esc, toast } = Panel;

    const form = $("configForm");
    const alerta = $("configAlerta");
    const btnGuardar = $("btnGuardarConfig");

    const CONFIG_KEY = "aquaica_config_sistema";

    const VALORES_DEFECTO = {
        slaAlta: 4,
        slaMedia: 12,
        slaBaja: 24,
        presionOptima: 2.5,
        umbralAlerta: 0.8,
        radioAlertaMetros: 500,
        entidadNombre: "EMAPICA S.A. / AquaIca",
        centralEmergencias: "(056) 234567 / 956 100 200",
        correoSoporte: "atencion@aquaica.gob.pe"
    };

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

    function cargarConfiguracion() {
        try {
            const raw = localStorage.getItem(CONFIG_KEY);
            const config = raw ? JSON.parse(raw) : VALORES_DEFECTO;

            $("slaAlta").value = config.slaAlta ?? VALORES_DEFECTO.slaAlta;
            $("slaMedia").value = config.slaMedia ?? VALORES_DEFECTO.slaMedia;
            $("slaBaja").value = config.slaBaja ?? VALORES_DEFECTO.slaBaja;

            $("presionOptima").value = config.presionOptima ?? VALORES_DEFECTO.presionOptima;
            $("umbralAlerta").value = config.umbralAlerta ?? VALORES_DEFECTO.umbralAlerta;
            $("radioAlertaMetros").value = config.radioAlertaMetros ?? VALORES_DEFECTO.radioAlertaMetros;

            $("entidadNombre").value = config.entidadNombre ?? VALORES_DEFECTO.entidadNombre;
            $("centralEmergencias").value = config.centralEmergencias ?? VALORES_DEFECTO.centralEmergencias;
            $("correoSoporte").value = config.correoSoporte ?? VALORES_DEFECTO.correoSoporte;

        } catch (e) {
            console.warn("Error al leer configuración almacenada:", e);
        }
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            const nuevaConfig = {
                slaAlta: Number($("slaAlta").value),
                slaMedia: Number($("slaMedia").value),
                slaBaja: Number($("slaBaja").value),
                presionOptima: parseFloat($("presionOptima").value),
                umbralAlerta: parseFloat($("umbralAlerta").value),
                radioAlertaMetros: Number($("radioAlertaMetros").value),
                entidadNombre: $("entidadNombre").value.trim(),
                centralEmergencias: $("centralEmergencias").value.trim(),
                correoSoporte: $("correoSoporte").value.trim(),
                fechaActualizacion: new Date().toISOString()
            };

            localStorage.setItem(CONFIG_KEY, JSON.stringify(nuevaConfig));

            mostrarAlerta("Parámetros del sistema guardados exitosamente.");
            toast("Configuración actualizada correctamente");

        } catch (err) {
            mostrarAlerta("Error al guardar la configuración: " + (err.message || "Error"), true);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = `
                <svg class="dp-ico" viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Guardar configuración
            `;
        }
    });

    cargarConfiguracion();
});
