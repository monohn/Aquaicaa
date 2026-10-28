/**
 * AquaIca — Mapa Territorial de Incidencias con Semáforo de Zonas
 */

const MENU_ADMIN_ITEMS = [
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

const ICONOS_DRAWER = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    mapa: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
    reportes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    asignaciones: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/>',
    clientes: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
    personal: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    configuracion: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    perfil: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};

function configurarVistaAdmin() {
    // 1. Cabecera superior adaptada a administración
    const headerBrandLink = document.getElementById('headerBrandLink') || document.querySelector('.header-brand');
    if (headerBrandLink) headerBrandLink.href = 'dashboard.html';

    const headerBrandSubtitle = document.getElementById('headerBrandSubtitle') || document.querySelector('.header-brand-text span');
    if (headerBrandSubtitle) headerBrandSubtitle.textContent = 'Panel Administrativo · Mapa de Incidencias';

    const btnReportar = document.getElementById('btnReportarMapa') || document.querySelector('.btn-reportar-mapa');
    if (btnReportar) {
        btnReportar.style.display = 'none';
    }

    // 2. Botón dockeado debajo del menú (a la izquierda, donde antes estaba zona y sectores)
    const btnDockVolver = document.getElementById('btnDockVolver');
    const txtDockVolver = document.getElementById('txtDockVolver');
    if (btnDockVolver) {
        btnDockVolver.href = 'dashboard.html';
        btnDockVolver.setAttribute('title', 'Volver al Dashboard administrativo');
    }
    if (txtDockVolver) {
        txtDockVolver.textContent = 'Volver al Dashboard';
    }

    // 3. Renderizar el drawer con el formato y estructura idénticos al sidebar del admin
    const drawer = document.getElementById('drawer');
    if (!drawer) return;

    drawer.className = 'drawer sidebar sidebar-pro';

    let menuHtml = '';
    MENU_ADMIN_ITEMS.forEach(sec => {
        menuHtml += `<div class="menu-section-title">${sec.categoria}</div>`;
        sec.items.forEach(modulo => {
            const icono = `
                <span class="menu-icon">
                    <svg class="icon-svg" viewBox="0 0 24 24">${ICONOS_DRAWER[modulo.icono]}</svg>
                </span>`;
            const activo = modulo.href === 'mapa.html';
            const badgeHtml = modulo.badge ? `<span class="menu-badge">${modulo.badge}</span>` : '';

            menuHtml += `
                <a href="${modulo.href}" class="menu-item${activo ? ' active' : ''}">
                    ${icono}
                    <span class="menu-texto">${modulo.etiqueta}</span>
                    ${badgeHtml}
                </a>`;
        });
    });

    drawer.innerHTML = `
        <div class="sidebar-brand">
            <div class="brand-logo"><img src="images/aquaica-logo.png" alt="AquaIca"></div>
            <div class="brand-text-block">
                <h2>AquaIca</h2>
                <span>Sistema de Gestión</span>
            </div>
            <button class="drawer-close-btn" id="drawerCloseBtn" aria-label="Cerrar menú" title="Cerrar menú">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        <nav class="sidebar-menu" id="sidebarMenu">
            ${menuHtml}
        </nav>

        <div class="sidebar-bottom">
            <div class="sidebar-olas" aria-hidden="true">
                <svg viewBox="0 0 250 120" preserveAspectRatio="none">
                    <path d="M0 62C40 36 78 92 130 68S210 28 250 58V120H0Z" fill="rgba(255,255,255,.14)"/>
                    <path d="M0 88C46 64 92 112 146 90S218 62 250 82V120H0Z" fill="rgba(255,255,255,.13)"/>
                    <circle cx="92" cy="44" r="14" fill="rgba(255,255,255,.26)"/>
                    <circle cx="134" cy="70" r="7" fill="rgba(255,255,255,.28)"/>
                </svg>
            </div>
            <p class="sidebar-frase">AquaIca · Gestión del Agua<br>Ica, Perú.</p>
            <button id="logoutButton" class="logout-button">Cerrar sesión</button>
        </div>
    `;

    // Cerrar sesión
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            ['token', 'username', 'rol', 'personalId', 'clienteId', 'usuario'].forEach(c => localStorage.removeItem(c));
            window.location.href = 'login.html';
        });
    }

    // Reconectar evento de cierre de drawer
    const closeBtn = document.getElementById('drawerCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            drawer.classList.remove('open');
            const overlay = document.getElementById('drawerOverlay');
            if (overlay) overlay.classList.remove('open');
            const menuBtn = document.getElementById('menuBtn');
            if (menuBtn) menuBtn.classList.remove('active');
        };
    }
}

function configurarVistaCiudadano() {
    const btnDockVolver = document.getElementById('btnDockVolver');
    const txtDockVolver = document.getElementById('txtDockVolver');
    if (btnDockVolver) {
        btnDockVolver.href = 'index.html';
        btnDockVolver.setAttribute('title', 'Volver al muro comunitario');
    }
    if (txtDockVolver) {
        txtDockVolver.textContent = 'Volver al Muro';
    }

    const headerBrandLink = document.getElementById('headerBrandLink');
    if (headerBrandLink) headerBrandLink.href = 'index.html';

    const headerBrandSubtitle = document.getElementById('headerBrandSubtitle');
    if (headerBrandSubtitle) headerBrandSubtitle.textContent = 'Mapa Territorial de Incidencias';

    const btnReportar = document.getElementById('btnReportarMapa');
    if (btnReportar) {
        btnReportar.style.display = 'inline-flex';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const rol = localStorage.getItem('rol');
    if (rol === 'TECNICO') {
        window.location.href = 'asignaciones.html';
        return;
    }

    if (rol === 'ADMIN' || rol === 'SOPORTE') {
        configurarVistaAdmin();
    } else {
        configurarVistaCiudadano();
    }

    initDrawer();
    initMapaTerritorial();
});

let mapa = null;
let currentTileLayer = null;
let satelliteTileLayer = null;
let isSatellite = false;

let capasZonas = [];
let marcadoresReportes = [];

const ZONAS_DATOS = [
    {
        id: 'zona-1',
        tipo: 'rojo',
        referencia: 'San Joaquín / Av. San Martín',
        titulo: 'San Joaquín / Av. San Martín',
        distrito: 'Ica Cercado',
        estadoTexto: 'Alerta Máxima',
        tagTexto: 'Alerta',
        motivo: 'Rotura de tubería matriz de 8" en Av. San Martín. Cuadrilla técnica asignada. Reparación en marcha.',
        presion: '0.1 bar (Corte)',
        reportes: 14,
        coords: [-14.0650, -75.7330],
        radio: 550,
        color: '#ef4444'
    },
    {
        id: 'zona-2',
        tipo: 'amarillo',
        referencia: 'Urb. Los Ángeles',
        titulo: 'Urb. Los Ángeles',
        distrito: 'Parcona',
        estadoTexto: 'Atención Media',
        tagTexto: 'Medio',
        motivo: 'Baja presión por mantenimiento preventivo en Pozo #2.',
        presion: '0.4 bar (Baja)',
        reportes: 5,
        coords: [-14.0530, -75.7060],
        radio: 480,
        color: '#f59e0b'
    },
    {
        id: 'zona-3',
        tipo: 'amarillo',
        referencia: 'Manzanilla / Pte. Blanco',
        titulo: 'Manzanilla / Pte. Blanco',
        distrito: 'Ica Cercado',
        estadoTexto: 'Atención Media',
        tagTexto: 'Medio',
        motivo: 'Fuga en vereda comunitaria. Cuadrilla en ruta de atención.',
        presion: '0.6 bar (Moderada)',
        reportes: 3,
        coords: [-14.0750, -75.7230],
        radio: 420,
        color: '#f59e0b'
    },
    {
        id: 'zona-4',
        tipo: 'verde',
        referencia: 'Sector Las Flores',
        titulo: 'Sector Las Flores',
        distrito: 'La Tinguiña',
        estadoTexto: 'Servicio Óptimo',
        tagTexto: 'Óptimo',
        motivo: 'Abastecimiento continuo las 24 horas y presión normal.',
        presion: '1.2 bar (Normal)',
        reportes: 0,
        coords: [-14.0450, -75.7140],
        radio: 600,
        color: '#10b981'
    },
    {
        id: 'zona-5',
        tipo: 'verde',
        referencia: 'Residencial Los Maestros',
        titulo: 'Residencial Los Maestros',
        distrito: 'Subtanjalla',
        estadoTexto: 'Servicio Óptimo',
        tagTexto: 'Óptimo',
        motivo: 'Red renovada con presión estable y cloración óptima.',
        presion: '1.4 bar (Normal)',
        reportes: 0,
        coords: [-14.0280, -75.7480],
        radio: 650,
        color: '#10b981'
    },
    {
        id: 'zona-6',
        tipo: 'verde',
        referencia: 'San Isidro / Huacachina',
        titulo: 'San Isidro / Huacachina',
        distrito: 'Ica Sur',
        estadoTexto: 'Servicio Óptimo',
        tagTexto: 'Óptimo',
        motivo: 'Distribución y presión regulares desde el reservorio.',
        presion: '1.1 bar (Normal)',
        reportes: 0,
        coords: [-14.0840, -75.7580],
        radio: 500,
        color: '#10b981'
    }
];

function initDrawer() {
    const btn = document.getElementById('menuBtn');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');

    function cerrar() {
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        if (btn) btn.classList.remove('active');
    }

    function alternar() {
        if (!drawer || !overlay) return;
        const abriendo = !drawer.classList.contains('open');
        if (abriendo) {
            drawer.classList.add('open');
            overlay.classList.add('open');
            if (btn) btn.classList.add('active');
        } else {
            cerrar();
        }
    }

    if (btn) {
        btn.onclick = (e) => {
            e.stopPropagation();
            alternar();
        };
    }

    if (overlay) {
        overlay.onclick = cerrar;
    }

    const closeBtn = document.getElementById('drawerCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = cerrar;
    }

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
            cerrar();
        }
    });
}

function initMapaTerritorial() {
    // Coordenadas del Cercado de Ica
    const ICA_CENTER = [-14.0678, -75.7286];

    mapa = L.map('mapaCompleto', {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView(ICA_CENTER, 13);

    // Capa de mapa base (OpenStreetMap)
    currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap · AquaIca 2026',
        maxZoom: 19
    }).addTo(mapa);

    // Capa satelital opcional
    satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, Maxar, Earthstar Geographics',
        maxZoom: 18
    });

    // Renderizar zonas del semáforo
    renderizarZonasSemaforo(ZONAS_DATOS);
    renderizarListaLateral(ZONAS_DATOS);

    // Cargar marcadores de reportes reales del backend
    cargarMarcadoresReales();

    // Eventos de controles flotantes
    document.getElementById('btnCentrarIca').addEventListener('click', () => {
        mapa.flyTo(ICA_CENTER, 13, { duration: 1.2 });
    });

    document.getElementById('btnAlternarCapas').addEventListener('click', alternarCapaSatelite);

    // Filtros de semáforo (Todas, Roja, Amarilla, Verde)
    document.querySelectorAll('.semaforo-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.semaforo-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filtrarZonasPorEstado(tab.getAttribute('data-filtro'));
        });
    });

    // Buscador de distritos/zonas
    const searchInput = document.getElementById('mapaSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtradas = ZONAS_DATOS.filter(z =>
                (z.referencia && z.referencia.toLowerCase().includes(query)) ||
                (z.titulo && z.titulo.toLowerCase().includes(query)) ||
                (z.distrito && z.distrito.toLowerCase().includes(query))
            );
            renderizarZonasSemaforo(filtradas);
            renderizarListaLateral(filtradas);
        });
    }
}

function alternarCapaSatelite() {
    const txt = document.getElementById('txtEstiloMapa');
    if (isSatellite) {
        mapa.removeLayer(satelliteTileLayer);
        currentTileLayer.addTo(mapa);
        txt.textContent = 'Vista Satélite';
        isSatellite = false;
    } else {
        mapa.removeLayer(currentTileLayer);
        satelliteTileLayer.addTo(mapa);
        txt.textContent = 'Vista Calles';
        isSatellite = true;
    }
}

function renderizarZonasSemaforo(zonas) {
    // Limpiar capas previas
    capasZonas.forEach(c => mapa.removeLayer(c));
    capasZonas = [];

    zonas.forEach(z => {
        // Círculo de calor territorial
        const circle = L.circle(z.coords, {
            radius: z.radio,
            color: z.color,
            fillColor: z.color,
            fillOpacity: z.tipo === 'rojo' ? 0.38 : (z.tipo === 'amarillo' ? 0.30 : 0.22),
            weight: 2.5
        }).addTo(mapa);

        // Popup con información extra
        const tagClass = z.tipo === 'rojo' ? 'pill-roja' : (z.tipo === 'amarillo' ? 'pill-amarilla' : 'pill-verde');
        const popupContent = `
            <div class="popup-zona">
                <span class="popup-zona-tag ${tagClass}">${z.estadoTexto.toUpperCase()}</span>
                <strong>${escapeHtml(z.titulo)}</strong>
                <p>${escapeHtml(z.motivo)}</p>
                <div class="popup-zona-meta">
                    <div>💧 Presión: <strong>${escapeHtml(z.presion)}</strong></div>
                    <div>📋 Reportes activos: <strong>${z.reportes}</strong></div>
                </div>
            </div>
        `;

        circle.bindPopup(popupContent);
        circle.zonaId = z.id;
        capasZonas.push(circle);

        // Al hacer clic en el círculo, scroll hacia la tarjeta lateral
        circle.on('click', () => {
            const el = document.getElementById(z.id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                el.style.borderColor = z.color;
                el.style.boxShadow = `0 0 0 3px ${z.color}33`;
                setTimeout(() => {
                    el.style.borderColor = '';
                    el.style.boxShadow = '';
                }, 2000);
            }
        });
    });
}

function renderizarListaLateral(zonas) {
    const contenedor = document.getElementById('zonasList');
    if (!contenedor) return;

    if (zonas.length === 0) {
        contenedor.innerHTML = `<p style="text-align:center;padding:24px 12px;color:#64748b;font-size:12px;">No se encontraron zonas coincidentes.</p>`;
        return;
    }

    let html = '';
    zonas.forEach(z => {
        html += `
            <div class="zona-item zona-${z.tipo}" id="${z.id}" onclick="centrarEnZona('${z.id}')" title="Ubicar ${escapeHtml(z.referencia)}">
                <span class="zona-dot dot-${z.tipo}" aria-hidden="true"></span>
                <div class="zona-info">
                    <strong class="zona-ref">${escapeHtml(z.referencia)}</strong>
                    <span class="zona-distrito">${escapeHtml(z.distrito)}</span>
                </div>
                <span class="zona-tag tag-${z.tipo}">${escapeHtml(z.tagTexto)}</span>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}

window.centrarEnZona = function(zonaId) {
    const z = ZONAS_DATOS.find(item => item.id === zonaId);
    if (!z || !mapa) return;

    mapa.flyTo(z.coords, 15, { duration: 1.0 });

    const capa = capasZonas.find(c => c.zonaId === zonaId);
    if (capa) {
        capa.openPopup();
    }
};

function filtrarZonasPorEstado(filtro) {
    if (filtro === 'todos') {
        renderizarZonasSemaforo(ZONAS_DATOS);
        renderizarListaLateral(ZONAS_DATOS);
    } else {
        const filtradas = ZONAS_DATOS.filter(z => z.tipo === filtro);
        renderizarZonasSemaforo(filtradas);
        renderizarListaLateral(filtradas);
    }
}

async function cargarMarcadoresReales() {
    try {
        const resp = await fetch('/api/public/feed/mapa');
        if (!resp.ok) return;

        const puntos = await resp.json();
        if (!Array.isArray(puntos)) return;

        puntos.forEach(p => {
            if (!p.latitud || !p.longitud) return;

            const isOficial = p.tipoItem === 'COMUNICADO_OFICIAL';
            const pinColor = isOficial ? '#0284c7' : '#ea580c';

            const customIcon = L.divIcon({
                className: 'custom-map-pin',
                html: `<div style="background:${pinColor};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });

            const marker = L.marker([p.latitud, p.longitud], { icon: customIcon }).addTo(mapa);
            marker.bindPopup(`
                <div style="font-family:'Poppins',sans-serif;font-size:12px;padding:4px;">
                    <strong style="color:${pinColor};">${escapeHtml(p.titulo || 'Incidencia de Agua')}</strong>
                    <div style="margin:3px 0;color:#334155;">${escapeHtml(p.direccion || p.zonaAfectada || 'Ica')}</div>
                    <div style="font-size:11px;color:#64748b;">Distrito: ${escapeHtml(p.distrito || 'Ica')}</div>
                </div>
            `);
            marcadoresReportes.push(marker);
        });
    } catch (e) {
        console.log('No se cargaron puntos adicionales de la API:', e);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
