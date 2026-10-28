/**
 * AquaIca — Menú de Navegación Lateral (Diseño UX/UI Optimizado)
 * Estructurado por roles: Flujo de campo enfocado para TÉCNICOS y categorizado para ADMINISTRADORES.
 */
(function () {

    const ICONOS = {
        dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
        mapa: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
        reportes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
        asignaciones: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/>',
        historial: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        perfil: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        solicitudes: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
        suministros: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
        clientes: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
        personal: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        configuracion: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
        comunidad: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/><line x1="7" y1="16" x2="11" y2="16"/>'
    };

    // ARQUITECTURA UX 1: TÉCNICO DE CAMPO (Solo sus procesos de trabajo en campo y su cuenta)
    const MENU_TECNICO = [
        {
            categoria: "TRABAJO DE CAMPO",
            items: [
                { href: "asignaciones.html", etiqueta: "Mis Asignaciones", icono: "asignaciones", badge: "Activas" },
                { href: "historial-tecnico.html", etiqueta: "Historial Técnico", icono: "historial" }
            ]
        },
        {
            categoria: "MI CUENTA",
            items: [
                { href: "perfil-tecnico.html", etiqueta: "Perfil Técnico", icono: "perfil" }
            ]
        }
    ];

    // ARQUITECTURA UX 2: ADMINISTRACIÓN (Dashboard, Reportes, Asignaciones activas, Mapa, Clientes y Suministros, Personal, Configuraciones, Perfil)
    const MENU_ADMIN = [
        {
            categoria: "MONITOREO",
            items: [
                { href: "dashboard.html", etiqueta: "Dashboard", icono: "dashboard" },
                { href: "mapa.html", etiqueta: "Mapa de Incidencias", icono: "mapa" }
            ]
        },
        {
            categoria: "OPERACIONES",
            items: [
                {
                    href: "reportes.html",
                    etiqueta: "Gestión de Reportes",
                    icono: "reportes",
                    tambien: ["reporte-detalle.html", "seguimientos.html", "evidencias.html"]
                },
                { href: "asignaciones.html", etiqueta: "Asignaciones Activas", icono: "asignaciones", badge: "En curso" }
            ]
        },
        {
            categoria: "PADRÓN Y RECURSOS",
            items: [
                { href: "clientes.html", etiqueta: "Clientes y Suministros", icono: "clientes", badge: "Padrón", tambien: ["suministros.html"] },
                { href: "personal.html", etiqueta: "Personal y Cuadrillas", icono: "personal" }
            ]
        },
        {
            categoria: "SISTEMA",
            items: [
                { href: "configuracion.html", etiqueta: "Configuraciones", icono: "configuracion" },
                { href: "perfil-admin.html", etiqueta: "Mi Perfil", icono: "perfil" }
            ]
        }
    ];

    const menu = document.getElementById("sidebarMenu")
        || document.querySelector(".sidebar-menu");

    if (!menu) {
        return;
    }

    const barra = menu.closest(".sidebar");

    if (!document.querySelector('link[href$="sidebar-pro.css"]')) {
        const enlace = document.createElement("link");
        enlace.rel = "stylesheet";
        enlace.href = "css/sidebar-pro.css";
        document.head.appendChild(enlace);
    }

    if (barra) {
        barra.classList.add("sidebar-pro");

        const logo = barra.querySelector(".brand-logo");
        if (logo && !logo.querySelector("img")) {
            logo.innerHTML = '<img src="images/aquaica-logo.png" alt="AquaIca">';
        }

        const pie = barra.querySelector(".sidebar-bottom");
        if (pie && !pie.querySelector(".sidebar-olas")) {
            pie.insertAdjacentHTML("afterbegin", `
                <div class="sidebar-olas" aria-hidden="true">
                    <svg viewBox="0 0 250 120" preserveAspectRatio="none">
                        <path d="M0 62C40 36 78 92 130 68S210 28 250 58V120H0Z" fill="rgba(255,255,255,.14)"/>
                        <path d="M0 88C46 64 92 112 146 90S218 62 250 82V120H0Z" fill="rgba(255,255,255,.13)"/>
                        <circle cx="92" cy="44" r="14" fill="rgba(255,255,255,.26)"/>
                        <circle cx="134" cy="70" r="7" fill="rgba(255,255,255,.28)"/>
                    </svg>
                </div>
                <p class="sidebar-frase">AquaIca · Gestión del Agua<br>Ica, Perú.</p>`);
        }
    }

    const rol = localStorage.getItem("rol");
    const paginaActual =
        (window.location.pathname.split("/").pop() || "index.html")
            .toLowerCase();

    // Seleccionar la arquitectura de menú adecuada
    const estructuraSecciones = (rol === "TECNICO") ? MENU_TECNICO : MENU_ADMIN;

    let html = "";
    estructuraSecciones.forEach(sec => {
        html += `<div class="menu-section-title">${sec.categoria}</div>`;

        sec.items.forEach(modulo => {
            const icono = `
                <span class="menu-icon">
                    <svg class="icon-svg" viewBox="0 0 24 24">${ICONOS[modulo.icono]}</svg>
                </span>`;

            const activo =
                modulo.href === paginaActual ||
                (modulo.tambien || []).includes(paginaActual);

            const badgeHtml = modulo.badge
                ? `<span class="menu-badge">${modulo.badge}</span>`
                : "";

            html += `
                <a href="${modulo.href}" class="menu-item${activo ? " active" : ""}">
                    ${icono}
                    <span class="menu-texto">${modulo.etiqueta}</span>
                    ${badgeHtml}
                </a>`;
        });
    });

    menu.innerHTML = html;

})();
