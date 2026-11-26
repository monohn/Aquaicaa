/**
 * AquaIca — Feed Comunitario (JavaScript Vanilla)
 * Portal ciudadano en tiempo real interactivo, moderno, minimalista y responsivo.
 */

// ====== ESTADO ======
let currentPage = 0;
const PAGE_SIZE = 10;
let currentDistrito = 'todos';
let currentCategoria = 'todos';
let feedFinished = false;
let feedItemsCache = [];
let mapaInstance = null;
let markersLayer = null;

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', () => {
    // Si es personal técnico, mantener en su área operativa de campo
    const rol = localStorage.getItem('rol');
    if (rol === 'TECNICO') {
        window.location.href = 'asignaciones.html';
        return;
    }

    initDrawer();
    initAuthUI();
    initModalPrompt();
    initLightbox();
    initFiltros();
    initMobileTabs();
    initSearch();
    cargarDistritos();
    cargarFeed();
    initMapa();
});


// ====== MENÚ LATERAL (DRAWER) ======
function initDrawer() {
    const btn = document.getElementById('menuBtn');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    const closeBtn = document.getElementById('drawerCloseBtn');

    if (!btn || !drawer || !overlay) return;

    btn.addEventListener('click', () => {
        drawer.classList.toggle('open');
        overlay.classList.toggle('open');
    });

    overlay.addEventListener('click', () => {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
        });
    }
}


// ====== ESTADO DE AUTENTICACIÓN Y UI ADAPTATIVA ======
function initAuthUI() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const rol = localStorage.getItem('rol');

    const headerAuthArea = document.getElementById('headerAuthArea');
    const drawerUserStatus = document.getElementById('drawerUserStatus');
    const drawerFooter = document.getElementById('drawerFooter');
    const drawerReportarLink = document.getElementById('drawerReportarLink');
    const drawerPerfilLink = document.getElementById('drawerPerfilLink');
    const drawerNav = document.querySelector('.drawer-nav');

    const composerAvatar = document.getElementById('composerAvatar');
    const composerTitle = document.getElementById('composerTitle');
    const composerSubtitle = document.getElementById('composerSubtitle');
    const composerBtn = document.getElementById('composerBtn');
    const fabReportar = document.getElementById('fabReportar');

    const isLogged = Boolean(token && username);

    if (isLogged) {
        const inicial = username.charAt(0).toUpperCase();
        const esAdmin = rol === 'ADMIN' || rol === 'SOPORTE';

        localStorage.removeItem("aquaica_avatar");
        const savedAvatar = localStorage.getItem(`aquaica_avatar_${rol || 'CIUDADANO'}_${username}`);
        const avatarContent = savedAvatar
            ? `<img src="${savedAvatar}" alt="${escapeHtml(username)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
            : inicial;

        if (typeof sincronizarMiAvatar === 'function') {
            sincronizarMiAvatar((serverAvatar) => {
                const badgeAvatar = document.querySelector('#headerAuthArea .user-badge-avatar');
                if (badgeAvatar) {
                    badgeAvatar.innerHTML = `<img src="${serverAvatar}" alt="${escapeHtml(username)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    badgeAvatar.style.background = 'transparent';
                }
                if (composerAvatar) {
                    composerAvatar.innerHTML = `<img src="${serverAvatar}" alt="${escapeHtml(username)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    composerAvatar.style.background = 'transparent';
                }
            });
        }

        if (esAdmin) {
            // Cabecera Administrador / Soporte
            headerAuthArea.innerHTML = `
                <div class="user-profile-badge admin-badge" title="Sesión de ${escapeHtml(rol)} activa">
                    <div class="user-badge-avatar" style="${savedAvatar ? 'background:transparent;' : 'background:#0a74c9;'}">${avatarContent}</div>
                    <div class="user-badge-info">
                        <span class="user-badge-name">${escapeHtml(username)}</span>
                        <span class="user-badge-role">${escapeHtml(rol === 'ADMIN' ? 'Administrador' : 'Soporte')}</span>
                    </div>
                </div>
                <a href="dashboard.html" class="btn-header-admin-portal" title="Volver al panel administrativo">Ir al Dashboard</a>
                <button type="button" class="btn-logout-header" onclick="cerrarSesion()" title="Cerrar sesión">Salir</button>
            `;

            if (drawerUserStatus) {
                drawerUserStatus.textContent = `${rol}: ${username}`;
            }

            // Añadir enlaces administrativos en drawer
            if (drawerNav && !document.getElementById('drawerAdminSection')) {
                const adminSection = document.createElement('div');
                adminSection.id = 'drawerAdminSection';
                adminSection.innerHTML = `
                    <div class="drawer-section-title" style="margin-top:16px;">Administración</div>
                    <a href="dashboard.html" class="drawer-link">
                        <span class="drawer-icon">
                            <svg class="drawer-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>
                        </span>
                        <span>Dashboard General</span>
                    </a>
                    <a href="reportes.html" class="drawer-link">
                        <span class="drawer-icon">
                            <svg class="drawer-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                        </span>
                        <span>Gestión de Reportes</span>
                    </a>
                    <a href="clientes.html" class="drawer-link">
                        <span class="drawer-icon">
                            <svg class="drawer-svg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/></svg>
                        </span>
                        <span>Clientes y Suministros</span>
                    </a>
                `;
                drawerNav.appendChild(adminSection);
            }

            // Barra de composición adaptada para admin
            if (composerAvatar) {
                if (savedAvatar) {
                    composerAvatar.innerHTML = `<img src="${savedAvatar}" alt="${escapeHtml(username)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    composerAvatar.style.background = 'transparent';
                } else {
                    composerAvatar.textContent = inicial;
                    composerAvatar.style.background = '#0a74c9';
                    composerAvatar.style.color = '#ffffff';
                }
            }
            if (composerTitle) composerTitle.textContent = `Panel Administrador · ${username}`;
            if (composerSubtitle) composerSubtitle.textContent = 'Monitoreo en tiempo real de reportes vecinales y avisos EMAPICA.';
            if (composerBtn) {
                composerBtn.textContent = 'Gestión de reportes';
                composerBtn.onclick = () => { window.location.href = 'reportes.html'; };
            }
            if (fabReportar) {
                fabReportar.title = 'Ir a gestión de reportes';
                fabReportar.onclick = () => { window.location.href = 'reportes.html'; };
            }

        } else {
            // Cabecera Ciudadano Logueado
            headerAuthArea.innerHTML = `
                <a href="perfil.html" class="user-profile-badge" style="text-decoration:none;" title="Ver y editar mis datos personales">
                    <div class="user-badge-avatar" style="${savedAvatar ? 'background:transparent;' : ''}">${avatarContent}</div>
                    <div class="user-badge-info">
                        <span class="user-badge-name">${escapeHtml(username)}</span>
                        <span class="user-badge-role">Ciudadano · Mi Perfil</span>
                    </div>
                </a>
                <button type="button" class="btn-logout-header" onclick="cerrarSesion()" title="Cerrar sesión">Salir</button>
            `;

            if (drawerUserStatus) {
                drawerUserStatus.textContent = `Sesión: ${username}`;
            }

            if (drawerReportarLink) drawerReportarLink.onclick = null;
            if (drawerPerfilLink) drawerPerfilLink.onclick = null;

            if (composerAvatar) {
                if (savedAvatar) {
                    composerAvatar.innerHTML = `<img src="${savedAvatar}" alt="${escapeHtml(username)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    composerAvatar.style.background = 'transparent';
                } else {
                    composerAvatar.textContent = inicial;
                    composerAvatar.style.background = '#0a74c9';
                    composerAvatar.style.color = '#ffffff';
                }
            }
            if (composerTitle) composerTitle.textContent = `¡Hola, ${username}!`;
            if (composerSubtitle) composerSubtitle.textContent = '¿Tienes alguna fuga, rotura o corte de agua? Reporta en 1 minuto.';
            if (composerBtn) {
                composerBtn.textContent = '+ Registrar reporte';
                composerBtn.onclick = () => { window.location.href = 'reporte.html'; };
            }
            if (fabReportar) {
                fabReportar.onclick = () => { window.location.href = 'reporte.html'; };
            }
        }

        // Drawer Footer para usuarios logueados
        if (drawerFooter) {
            drawerFooter.innerHTML = `
                <button type="button" class="drawer-login-btn" onclick="cerrarSesion()" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;box-shadow:none;">
                    <svg class="drawer-btn-svg" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span>Cerrar sesión (${escapeHtml(username)})</span>
                </button>
            `;
        }

    } else {
        // MODO INVITADO / OBSERVADOR NO LOGUEADO
        headerAuthArea.innerHTML = `
            <a href="login.html" class="btn-header-login">Iniciar sesión</a>
            <a href="registro.html" class="btn-header-registro">Registrarme</a>
        `;

        if (drawerUserStatus) {
            drawerUserStatus.textContent = 'Atención Ciudadana';
        }

        const adminSection = document.getElementById('drawerAdminSection');
        if (adminSection) {
            adminSection.remove();
        }

        if (drawerReportarLink) {
            drawerReportarLink.onclick = (e) => {
                e.preventDefault();
                abrirModalLogin();
            };
        }

        if (drawerPerfilLink) {
            drawerPerfilLink.onclick = (e) => {
                e.preventDefault();
                abrirModalLogin();
            };
        }

        if (drawerFooter) {
            drawerFooter.innerHTML = `
                <a href="login.html" class="drawer-login-btn">
                    <svg class="drawer-btn-svg" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    <span>Acceder con mi cuenta</span>
                </a>
            `;
        }

        // Barra de composición protegida
        if (composerAvatar) {
            composerAvatar.textContent = '?';
            composerAvatar.style.background = '#e2e8f0';
            composerAvatar.style.color = '#64748b';
        }
        if (composerTitle) composerTitle.textContent = '¿Problemas de agua en tu zona?';
        if (composerSubtitle) composerSubtitle.textContent = 'Inicia sesión para registrar una incidencia con tu suministro.';
        if (composerBtn) {
            composerBtn.textContent = 'Reportar problema';
            composerBtn.onclick = abrirModalLogin;
        }

        if (fabReportar) {
            fabReportar.onclick = abrirModalLogin;
        }
    }
}

function cerrarSesion() {
    ['token', 'username', 'rol', 'personalId', 'clienteId'].forEach(k => localStorage.removeItem(k));
    window.location.reload();
}


// ====== MODAL PROMPT DE INICIO DE SESIÓN ======
function initModalPrompt() {
    const modal = document.getElementById('authPromptModal');
    const closeBtn = document.getElementById('closeAuthModal');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });
    }
}

function abrirModalLogin() {
    const modal = document.getElementById('authPromptModal');
    if (modal) {
        modal.classList.add('open');
    }
}


// ====== LIGHTBOX MODAL PARA EVIDENCIAS ======
function initLightbox() {
    const overlay = document.getElementById('imageLightboxModal');
    const closeBtn = document.getElementById('lightboxCloseBtn');

    if (closeBtn && overlay) {
        closeBtn.addEventListener('click', cerrarLightbox);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cerrarLightbox();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) cerrarLightbox();
        });
    }
}

function abrirLightbox(url, caption = '') {
    const overlay = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImg');
    const captionEl = document.getElementById('lightboxCaption');
    if (!overlay || !img) return;

    img.src = url;
    if (captionEl) captionEl.textContent = caption;
    overlay.classList.add('open');
}

function cerrarLightbox() {
    const overlay = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImg');
    if (overlay) overlay.classList.remove('open');
    if (img) setTimeout(() => { img.src = ''; }, 200);
}


// ====== TOAST FLOTANTE ======
let toastTimer = null;
function mostrarToast(mensaje, duracion = 3200) {
    const toast = document.getElementById('feedToast');
    if (!toast) return;

    toast.textContent = mensaje;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, duracion);
}


// ====== DISTRITOS ======
async function cargarDistritos() {
    try {
        const res = await fetch('/api/public/distritos');
        if (!res.ok) return;
        const distritos = await res.json();
        const select = document.getElementById('filtroDistrito');
        if (!select) return;
        select.innerHTML = '<option value="todos">Todos los distritos de Ica</option>';
        distritos.forEach(d => {
            if (d.toLowerCase() === 'todos') return;
            const opt = document.createElement('option');
            opt.value = d.toLowerCase().replace(/ /g, '_');
            opt.textContent = d;
            select.appendChild(opt);
        });
    } catch (e) {
        // Silencio si falla
    }
}


// ====== FILTROS ======
function initFiltros() {
    const distritoSelect = document.getElementById('filtroDistrito');
    if (distritoSelect) {
        distritoSelect.addEventListener('change', (e) => {
            currentDistrito = e.target.value;
            resetYCargar();
        });
    }

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategoria = tab.dataset.cat;
            resetYCargar();
        });
    });

    const loadMore = document.getElementById('loadMoreBtn');
    if (loadMore) {
        loadMore.addEventListener('click', () => {
            currentPage++;
            cargarFeed(true);
        });
    }
}

function resetYCargar() {
    currentPage = 0;
    feedFinished = false;
    const feedList = document.getElementById('feedList');
    const feedEmpty = document.getElementById('feedEmpty');
    const loadMore = document.getElementById('loadMoreBtn');

    if (feedList) feedList.innerHTML = '';
    if (feedEmpty) feedEmpty.style.display = 'none';
    if (loadMore) loadMore.style.display = 'none';
    cargarFeed();
}

function resetFiltros() {
    currentDistrito = 'todos';
    currentCategoria = 'todos';
    const distSelect = document.getElementById('filtroDistrito');
    if (distSelect) distSelect.value = 'todos';
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    const allTab = document.querySelector('.filter-tab[data-cat="todos"]');
    if (allTab) allTab.classList.add('active');
    resetYCargar();
}


// ====== BUSCADOR INTELIGENTE ======
function initSearch() {
    let timer;
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const q = input.value.trim().toLowerCase();
            const cards = document.querySelectorAll('.feed-card');
            let visibles = 0;
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const match = !q || text.includes(q);
                card.style.display = match ? '' : 'none';
                if (match) visibles++;
            });
            const empty = document.getElementById('feedEmpty');
            if (empty) {
                empty.style.display = (visibles === 0 && q) ? 'block' : 'none';
            }
        }, 220);
    });
}


// ====== MOBILE TABS ======
function initMobileTabs() {
    const tabFeed = document.getElementById('tabFeed');
    const tabMapa = document.getElementById('tabMapa');
    const feedCol = document.querySelector('.feed-column');
    const mapCol = document.querySelector('.map-column');

    if (!tabFeed || !tabMapa || !feedCol || !mapCol) return;

    tabFeed.addEventListener('click', () => {
        tabFeed.classList.add('active');
        tabMapa.classList.remove('active');
        feedCol.classList.remove('hidden');
        mapCol.classList.remove('visible');
    });

    tabMapa.addEventListener('click', () => {
        tabMapa.classList.add('active');
        tabFeed.classList.remove('active');
        feedCol.classList.add('hidden');
        mapCol.classList.add('visible');
        if (mapaInstance) setTimeout(() => mapaInstance.invalidateSize(), 150);
    });
}


// ====== ACTUALIZAR FRANJA DE ESTADO COMUNITARIO ======
function actualizarFranjaEnVivo(items) {
    const statusText = document.getElementById('liveStatusText');
    const chipReportes = document.getElementById('chipReportesCount');
    const chipResueltos = document.getElementById('chipResueltosCount');
    const chipComunicados = document.getElementById('chipComunicadosCount');

    if (!items || !items.length) {
        if (statusText) statusText.textContent = 'Sin incidencias activas reportadas';
        return;
    }

    const comunicados = items.filter(i => i.tipoItem === 'COMUNICADO_OFICIAL').length;
    const reportes = items.filter(i => i.tipoItem !== 'COMUNICADO_OFICIAL').length;
    const resueltos = items.filter(i => (i.estado || '').toUpperCase().includes('RESUELTO')).length;

    if (chipReportes) chipReportes.textContent = reportes;
    if (chipResueltos) chipResueltos.textContent = resueltos;
    if (chipComunicados) chipComunicados.textContent = comunicados;

    if (statusText) {
        statusText.textContent = `${items.length} incidencias registradas en tiempo real · EMAPICA y vecinos`;
    }
}


// ====== CARGAR FEED ======
async function cargarFeed(append = false) {
    const feedList = document.getElementById('feedList');
    const loading = document.getElementById('feedLoading');
    const empty = document.getElementById('feedEmpty');
    const loadMore = document.getElementById('loadMoreBtn');

    if (!feedList) return;

    if (!append) {
        feedList.innerHTML = '';
        if (loading) {
            loading.style.display = 'block';
            feedList.appendChild(loading);
        }
    }

    try {
        const params = new URLSearchParams({
            page: currentPage,
            size: PAGE_SIZE
        });
        if (currentDistrito && currentDistrito !== 'todos') {
            params.set('distrito', currentDistrito.replace(/_/g, ' '));
        }
        if (currentCategoria && currentCategoria !== 'todos') {
            params.set('categoria', currentCategoria);
        }

        const res = await fetch(`/api/public/feed?${params}`);
        if (!res.ok) throw new Error('Error al cargar feed');

        const items = await res.json();
        if (loading) loading.style.display = 'none';

        if (!append) {
            feedItemsCache = items;
            actualizarFranjaEnVivo(items);
        } else {
            feedItemsCache = feedItemsCache.concat(items);
        }

        if (items.length === 0 && currentPage === 0) {
            if (empty) empty.style.display = 'block';
            if (loadMore) loadMore.style.display = 'none';
            return;
        }

        items.forEach(item => {
            feedList.appendChild(crearTarjeta(item));
        });

        if (loadMore) {
            if (items.length < PAGE_SIZE) {
                feedFinished = true;
                loadMore.style.display = 'none';
            } else {
                loadMore.style.display = 'block';
            }
        }

    } catch (e) {
        if (loading) loading.style.display = 'none';
        if (!append) {
            feedList.innerHTML = `
                <div class="feed-empty">
                    <p>No se pudo conectar con el servidor de AquaIca.</p>
                    <button class="feed-empty-btn" onclick="resetYCargar()">Reintentar conexión</button>
                </div>
            `;
        }
    }
}


// ====== CREAR TARJETA INTERACTIVA ======
function crearTarjeta(item) {
    const card = document.createElement('div');
    card.className = 'feed-card';
    card.id = `reporte-card-${item.id}`;

    const esComunicado = item.tipoItem === 'COMUNICADO_OFICIAL';

    const avatarClass = esComunicado ? 'avatar-comunicado' : 'avatar-reporte';
    const avatarLetter = esComunicado ? 'E' : 'V';

    const source = esComunicado
        ? (item.entidadEmisora || 'EMAPICA S.A.')
        : ('Vecino en ' + (item.distrito || 'Ica'));
    const limpiarTextoSinCoordenadas = (txt) => {
        if (!txt) return '';
        return String(txt)
            .replace(/\s*\[GPS:[^\]]*\]/gi, '')
            .replace(/Ubicaci[oó]n GPS\s*\([^)]*\)/gi, '')
            .trim();
    };

    const subtitleRaw = esComunicado ? 'Comunicado Oficial de Corte y Mantenimiento' : (limpiarTextoSinCoordenadas(item.ubicacionReferencia) || item.distrito || 'Ica');
    const subtitle = subtitleRaw || (item.distrito || 'Ica');

    // Badge de estado moderno
    let badgeClass = 'badge-pendiente';
    let badgeText = item.estado || 'PENDIENTE';
    let badgeIcon = '<span class="badge-dot dot-amber"></span>';

    if (esComunicado) {
        badgeClass = 'badge-comunicado';
        badgeText = item.prioridad === 'EMERGENCIA' ? 'Corte de Emergencia' : 'Corte Programado';
        badgeIcon = '<svg class="badge-svg" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    } else {
        const est = (item.estado || '').toUpperCase();
        if (est.includes('RESUELTO') && !est.includes('NO_RESUELTO')) {
            badgeClass = 'badge-resuelto';
            badgeText = 'Resuelto ✓';
            badgeIcon = '<span class="badge-dot dot-green"></span>';
        } else if (est.includes('MEJORA_PARCIAL')) {
            badgeClass = 'badge-en-atencion';
            badgeText = 'Mejora parcial';
            badgeIcon = '<span class="badge-dot dot-blue pulse"></span>';
        } else if (est.includes('REVISION_PROGRAMADA')) {
            badgeClass = 'badge-pendiente';
            badgeText = 'Revisión programada';
            badgeIcon = '<span class="badge-dot dot-amber pulse"></span>';
        } else if (est.includes('ATENCION') || est.includes('ASIGNADO') || est.includes('PROCESO')) {
            badgeClass = 'badge-en-atencion';
            badgeText = 'En atención técnica';
            badgeIcon = '<span class="badge-dot dot-blue pulse"></span>';
        } else if (est.includes('REABIERTO') || est.includes('NO_RESUELTO')) {
            badgeClass = 'badge-reabierto';
            badgeText = est.includes('NO_RESUELTO') ? 'En reevaluación' : 'Reabierto';
            badgeIcon = '<span class="badge-dot dot-purple"></span>';
        } else {
            badgeText = 'Reportado';
            badgeIcon = '<span class="badge-dot dot-amber"></span>';
        }
    }

    // Categoría visual sobria
    let catTagHtml = '';
    const cat = (item.categoria || '').toUpperCase();
    if (cat.includes('FUGA') || cat.includes('ROTURA')) {
        catTagHtml = `<span class="feed-cat-chip cat-fuga">Fuga de agua</span>`;
    } else if (cat.includes('CORTE') || cat.includes('SIN_AGUA') || cat.includes('INTERRUPCION')) {
        catTagHtml = `<span class="feed-cat-chip cat-corte">Sin servicio / Corte</span>`;
    } else if (cat.includes('PRESION')) {
        catTagHtml = `<span class="feed-cat-chip cat-presion">Baja presión</span>`;
    } else if (esComunicado) {
        catTagHtml = `<span class="feed-cat-chip cat-oficial">EMAPICA Oficial</span>`;
    }

    const tiempo = item.tiempoUltimaActualizacion || item.tiempoRelativo || 'Reciente';

    // Comprobar si el usuario ya apoyó este reporte localmente
    const apoyados = JSON.parse(localStorage.getItem('aquaica_apoyados') || '[]');
    const yaApoyado = apoyados.includes(item.id);

    // Comprobar notas de vecinos en localStorage
    const notasClave = `aquaica_notas_${item.id}`;
    const notasGuardadas = JSON.parse(localStorage.getItem(notasClave) || '[]');
    const numNotas = notasGuardadas.length;

    const esAvatarValido = (v) => typeof esUrlImagenValida === 'function'
        ? esUrlImagenValida(v)
        : /^(data:image\/|https?:\/\/)/i.test(String(v || ''));

    const autorAvatarUrl = esAvatarValido(item.autorAvatar)
        ? item.autorAvatar
        : null;
    const cardAvatarHtml = autorAvatarUrl
        ? `<img src="${autorAvatarUrl}" alt="${escapeHtml(source)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`
        : avatarLetter;

    let html = `
        <div class="card-header">
            <div class="card-source">
                <div class="card-avatar ${avatarClass}" style="${autorAvatarUrl ? 'background:transparent;padding:0;overflow:hidden;' : ''}">${cardAvatarHtml}</div>
                <div class="card-meta">
                    <strong>${escapeHtml(source)}</strong>
                    <span>${escapeHtml(subtitle)}</span>
                </div>
            </div>
            <div class="card-header-right">
                <span class="card-time">${escapeHtml(tiempo)}</span>
            </div>
        </div>

        <div class="card-tags-row">
            <span class="card-badge ${badgeClass}">${badgeIcon} ${badgeText}</span>
            ${catTagHtml}
        </div>
    `;

    if (item.titulo) {
        html += `<div class="card-body card-title-wrap"><h4 class="card-title">${escapeHtml(item.titulo)}</h4></div>`;
    }
    const descLimpia = limpiarTextoSinCoordenadas(item.descripcion);
    if (descLimpia) {
        html += `<div class="card-body"><p class="card-desc">${escapeHtml(descLimpia)}</p></div>`;
    }

    // Imagen reportada por el vecino (siempre visible cuando existe)
    const imgReporteUrl = item.imagenUrl
        ? (typeof resolveApiUrl === 'function' ? resolveApiUrl(item.imagenUrl) : item.imagenUrl)
        : null;
    const imgTecnicoUrl = item.imagenTecnicoUrl
        ? (typeof resolveApiUrl === 'function' ? resolveApiUrl(item.imagenTecnicoUrl) : item.imagenTecnicoUrl)
        : null;

    if (imgReporteUrl) {
        html += `
            <div class="card-image-wrap" onclick="abrirLightbox('${escapeHtml(imgReporteUrl)}', '${escapeHtml(item.titulo || 'Evidencia del vecino')}')" title="Toca para ampliar foto">
                <img class="card-image" src="${escapeHtml(imgReporteUrl)}" alt="Evidencia reportada por vecino" loading="lazy" onerror="this.parentElement.style.display='none'">
                <span class="image-zoom-badge">Reporte inicial</span>
            </div>
        `;
    }

    // Actualizaciones / informe técnico: primero comentario, abajo botón desplegable "Ver evidencia"
    const tieneActualizaciones = !esComunicado && Array.isArray(item.actualizaciones) && item.actualizaciones.length > 0;
    if (tieneActualizaciones || (!esComunicado && imgTecnicoUrl)) {
        const evidenciaTecnicaHtml = imgTecnicoUrl ? `
            <div class="official-evidencia-actions">
                <button type="button" class="btn-ver-evidencia" onclick="toggleEvidenciaTecnica(${item.id}, this)">Ver evidencia</button>
            </div>
            <div class="official-evidencia-collapse" id="evidencia-tec-${item.id}" style="display:none;">
                <div class="card-image-wrap official-evidencia-wrap" onclick="abrirLightbox('${escapeHtml(imgTecnicoUrl)}', 'Evidencia técnica oficial')" title="Toca para ampliar">
                    <img class="card-image" src="${escapeHtml(imgTecnicoUrl)}" alt="Evidencia técnica" loading="lazy" onerror="this.parentElement.innerHTML='<small style=\\'color:#64748b\\'>No se pudo cargar la evidencia.</small>'">
                </div>
            </div>
        ` : '';

        if (tieneActualizaciones) {
            const ultimaAct = item.actualizaciones[0];
            const restoActs = item.actualizaciones.slice(1);
            const toggleBtnHtml = restoActs.length > 0
                ? `<button type="button" class="btn-toggle-updates" onclick="toggleUpdates(${item.id})">Ver historial (${item.actualizaciones.length})</button>`
                : '';
            const ultimaActAvatarHtml = esAvatarValido(ultimaAct.autorAvatar)
                ? `<img src="${ultimaAct.autorAvatar}" alt="${escapeHtml(ultimaAct.autor || 'Autor')}" class="official-mini-avatar">`
                : '';

            html += `
                <div class="card-official-updates">
                    <div class="official-updates-head">
                        <span class="official-updates-author">
                            ${ultimaActAvatarHtml}
                            <span class="official-updates-tag">${escapeHtml(ultimaAct.autor || 'Administración AquaIca')}</span>
                        </span>
                        <div class="official-updates-right">
                            <span class="official-updates-time">${escapeHtml(ultimaAct.tiempoRelativo || 'Reciente')}</span>
                            ${toggleBtnHtml}
                        </div>
                    </div>
                    <p class="official-update-latest">${escapeHtml(ultimaAct.mensaje || '')}</p>
                    ${evidenciaTecnicaHtml}
                    ${restoActs.length > 0 ? `
                        <div class="official-updates-history" id="updates-hist-${item.id}" style="display:none;">
                            ${restoActs.map(act => {
                                const subAvatarHtml = esAvatarValido(act.autorAvatar)
                                    ? `<img src="${act.autorAvatar}" alt="${escapeHtml(act.autor || 'Autor')}" class="official-mini-avatar">`
                                    : '';
                                return `
                                <div class="official-update-item">
                                    <div class="update-item-meta">
                                        <span class="official-updates-author">
                                            ${subAvatarHtml}
                                            <strong>${escapeHtml(act.autor || 'Administración AquaIca')}</strong>
                                        </span>
                                        <span>${escapeHtml(act.tiempoRelativo || '')}</span>
                                    </div>
                                    <p>${escapeHtml(act.mensaje || '')}</p>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else if (evidenciaTecnicaHtml) {
            html += `
                <div class="card-official-updates">
                    <div class="official-updates-head">
                        <span class="official-updates-tag">Atención técnica en campo</span>
                    </div>
                    ${evidenciaTecnicaHtml}
                </div>
            `;
        }
    }

    // Ubicación de referencia (sin coordenadas numéricas)
    const ubicacionLimpia = limpiarTextoSinCoordenadas(item.ubicacionReferencia);
    if (ubicacionLimpia || item.distrito) {
        const textoUbicacion = ubicacionLimpia && item.distrito && !ubicacionLimpia.toLowerCase().includes(item.distrito.toLowerCase())
            ? `${ubicacionLimpia} · ${item.distrito}`
            : (ubicacionLimpia || item.distrito);
        html += `
            <div class="card-location">
                <svg viewBox="0 0 24 24"><path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span>${escapeHtml(textoUbicacion)}</span>
            </div>
        `;
    }

    // Horario para comunicados oficiales
    if (esComunicado && item.fechaInicioCorte) {
        const inicio = formatearHora(item.fechaInicioCorte);
        const fin = item.fechaFinCorte ? formatearHora(item.fechaFinCorte) : '';
        html += `
            <div class="card-schedule">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                <span>Horario previsto: <strong>${inicio}${fin ? ' — ' + fin : ''}</strong></span>
            </div>
        `;
    }

    // Barra de acciones interactivas
    html += `<div class="card-footer">`;

    if (!esComunicado) {
        const count = item.afectadosCount || 1;
        html += `
            <button class="btn-apoyar ${yaApoyado ? 'apoyado' : ''}" data-id="${item.id}" onclick="apoyarReporte(this, ${item.id})" title="Indicar que este problema también ocurre en tu casa o cuadra">
                <svg viewBox="0 0 24 24" class="btn-icon"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                <span class="apoyar-texto">${yaApoyado ? 'Me afecta' : 'A mí también'}</span>
                <span class="apoyar-count">(${count})</span>
            </button>
        `;
    } else {
        html += `
            <span class="comunicado-aviso-pill">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Aviso oficial
            </span>
        `;
    }

    // Botón interactivo de notas de vecinos
    html += `
        <button type="button" class="btn-notas" onclick="toggleNotas(${item.id})" title="Ver o agregar notas sobre esta zona">
            <svg viewBox="0 0 24 24" class="btn-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="notas-btn-txt">Notas (<span id="count-notas-${item.id}">${numNotas}</span>)</span>
        </button>
    `;

    // Botón compartir
    html += `
        <button type="button" class="btn-compartir" onclick="compartirReporte(${item.id}, '${escapeHtml(item.titulo || 'Incidencia de agua')}', '${escapeHtml(item.ubicacionReferencia || item.distrito || '')}')" title="Copiar enlace o datos para avisar por WhatsApp">
            <svg viewBox="0 0 24 24" class="btn-icon"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span>Compartir</span>
        </button>
    `;

    // Botón ver en mapa
    if (item.latitud && item.longitud) {
        html += `
            <button type="button" class="btn-ver-mapa" onclick="centrarMapa(${item.latitud}, ${item.longitud})" title="Ubicar este punto en el mapa de Ica">
                <svg viewBox="0 0 24 24" class="btn-icon"><path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span>Mapa</span>
            </button>
        `;
    }

    html += `</div>`; // Fin card-footer

    // Acordeón interactivo de notas vecinales
    html += `
        <div class="card-notas-section" id="notas-sec-${item.id}" style="display:none;">
            <div class="notas-header">
                <strong>Comentarios y novedades de vecinos en la zona</strong>
                <small>Información colaborativa en tiempo real</small>
            </div>
            <div class="notas-list" id="notas-list-${item.id}">
                ${renderizarNotas(notasGuardadas)}
            </div>
            <div class="notas-input-wrap">
                <input type="text" id="nota-input-${item.id}" class="nota-input" placeholder="¿Tienes alguna novedad sobre este problema? Escribe aquí..." maxlength="180" onkeydown="if(event.key==='Enter') agregarNota(${item.id})">
                <button type="button" class="btn-enviar-nota" onclick="agregarNota(${item.id})" aria-label="Publicar nota">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
        </div>
    `;

    card.innerHTML = html;
    return card;
}


// ====== INTERACCIÓN: DESPLEGAR HISTORIAL OFICIAL Y EVIDENCIA TÉCNICA ======
function toggleUpdates(reporteId) {
    const hist = document.getElementById(`updates-hist-${reporteId}`);
    if (!hist) return;
    const oculto = hist.style.display === 'none' || !hist.style.display;
    hist.style.display = oculto ? 'flex' : 'none';
}

function toggleEvidenciaTecnica(reporteId, btn) {
    const box = document.getElementById(`evidencia-tec-${reporteId}`);
    if (!box) return;
    const oculto = box.style.display === 'none' || !box.style.display;
    box.style.display = oculto ? 'block' : 'none';
    if (btn) {
        btn.textContent = oculto ? 'Ocultar evidencia' : 'Ver evidencia';
    }
}

// ====== INTERACCIÓN: APOYAR REPORTE ======
async function apoyarReporte(btn, reporteId) {
    const apoyados = JSON.parse(localStorage.getItem('aquaica_apoyados') || '[]');
    if (apoyados.includes(reporteId)) {
        mostrarToast('¡Ya sumaste tu apoyo a este reporte vecinal!');
        return;
    }

    try {
        const res = await fetch(`/api/public/reportes/${reporteId}/apoyar`, { method: 'POST' });
        if (!res.ok) throw new Error();
        const data = await res.json();

        apoyados.push(reporteId);
        localStorage.setItem('aquaica_apoyados', JSON.stringify(apoyados));

        btn.classList.add('apoyado');
        const countEl = btn.querySelector('.apoyar-count');
        const txtEl = btn.querySelector('.apoyar-texto');
        if (countEl) countEl.textContent = `(${data.afectadosCount})`;
        if (txtEl) txtEl.textContent = 'Me afecta';

        mostrarToast('Registrado. Has sumado tu apoyo a esta incidencia vecinal.');

    } catch (e) {
        // En caso de que el backend no responda, actualizar en UI de forma optimista
        apoyados.push(reporteId);
        localStorage.setItem('aquaica_apoyados', JSON.stringify(apoyados));
        btn.classList.add('apoyado');
        const countEl = btn.querySelector('.apoyar-count');
        if (countEl) {
            const actual = parseInt(countEl.textContent.replace(/\D/g, '') || '1', 10);
            countEl.textContent = `(${actual + 1})`;
        }
        mostrarToast('Apoyo registrado.');
    }
}


// ====== INTERACCIÓN: COMPARTIR REPORTE ======
function compartirReporte(id, titulo, ubicacion) {
    const url = window.location.origin + window.location.pathname + `#reporte-card-${id}`;
    const texto = `[AquaIca] ${titulo}${ubicacion ? ' en ' + ubicacion : ''}. Mira los detalles y el mapa aquí: ${url}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast('Datos del reporte copiados al portapapeles.');
        }).catch(() => {
            promptCopiar(texto);
        });
    } else {
        promptCopiar(texto);
    }
}

function promptCopiar(texto) {
    window.prompt('Copia este texto para compartir por WhatsApp:', texto);
}


// ====== INTERACCIÓN: NOVEDADES Y NOTAS DE VECINOS ======
function toggleNotas(reporteId) {
    const sec = document.getElementById(`notas-sec-${reporteId}`);
    if (!sec) return;
    const estaVisible = sec.style.display !== 'none';
    sec.style.display = estaVisible ? 'none' : 'block';
    if (!estaVisible) {
        const input = document.getElementById(`nota-input-${reporteId}`);
        if (input) input.focus();
    }
}

function renderizarNotas(notas) {
    if (!notas || !notas.length) {
        return '<div class="nota-vacia">Sé el primero en aportar una novedad o aviso sobre esta incidencia.</div>';
    }
    return notas.map(n => `
        <div class="nota-item">
            <div class="nota-item-avatar">${escapeHtml((n.autor || 'V').charAt(0).toUpperCase())}</div>
            <div class="nota-item-body">
                <div class="nota-item-meta">
                    <strong>${escapeHtml(n.autor || 'Vecino de Ica')}</strong>
                    <span class="nota-time">${escapeHtml(n.tiempo || 'Reciente')}</span>
                </div>
                <p class="nota-text">${escapeHtml(n.texto)}</p>
            </div>
        </div>
    `).join('');
}

function agregarNota(reporteId) {
    const input = document.getElementById(`nota-input-${reporteId}`);
    if (!input) return;
    const texto = input.value.trim();
    if (!texto) return;

    const username = localStorage.getItem('username') || 'Vecino de Ica';
    const notasClave = `aquaica_notas_${reporteId}`;
    const notas = JSON.parse(localStorage.getItem(notasClave) || '[]');

    notas.push({
        autor: username,
        texto: texto,
        tiempo: 'Hace unos momentos'
    });

    localStorage.setItem(notasClave, JSON.stringify(notas));
    input.value = '';

    const listEl = document.getElementById(`notas-list-${reporteId}`);
    if (listEl) listEl.innerHTML = renderizarNotas(notas);

    const countEl = document.getElementById(`count-notas-${reporteId}`);
    if (countEl) countEl.textContent = notas.length;

    mostrarToast('💬 Nota comunitaria publicada.');
}


// ====== MAPA (Leaflet) ======
function initMapa() {
    const mapaContainer = document.getElementById('mapaFeed');
    if (!mapaContainer) return;

    try {
        mapaInstance = L.map('mapaFeed').setView([-14.0678, -75.7286], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 18
        }).addTo(mapaInstance);

        markersLayer = L.layerGroup().addTo(mapaInstance);

        cargarPuntosMapa();
    } catch (e) {
        // Silencio si no carga Leaflet
    }
}

async function cargarPuntosMapa() {
    try {
        const res = await fetch('/api/public/feed/mapa');
        if (!res.ok) return;
        const puntos = await res.json();

        if (markersLayer) markersLayer.clearLayers();

        puntos.forEach(p => {
            if (p.latitud == null || p.longitud == null) return;

            const colores = {
                'ROJO': '#ef4444',
                'AMARILLO': '#f59e0b',
                'VERDE': '#10b981',
                'AZUL': '#0a74c9'
            };
            const color = colores[p.colorSemafaro] || '#ef4444';

            const marker = L.circleMarker([p.latitud, p.longitud], {
                radius: 8,
                fillColor: color,
                color: '#ffffff',
                weight: 2.5,
                fillOpacity: 0.9
            });

            const popup = `
                <div style="font-family:Poppins,sans-serif;font-size:12px;max-width:220px;padding:4px 2px;">
                    <strong style="display:block;margin-bottom:4px;color:#0b2a4a;font-size:13px;">${escapeHtml(p.titulo || '')}</strong>
                    <span style="color:#5d7389;">${escapeHtml(p.direccion || p.distrito || '')}</span>
                    <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:11px;color:${color};font-weight:700;text-transform:uppercase;">${escapeHtml(p.estado || '')}</span>
                        ${p.afectadosCount ? '<span style="font-size:11px;color:#0a74c9;font-weight:600;">💧 ' + p.afectadosCount + ' vecinos</span>' : ''}
                    </div>
                </div>
            `;
            marker.bindPopup(popup);
            markersLayer.addLayer(marker);
        });

    } catch (e) {
        // Silencio
    }
}

function centrarMapa(lat, lng) {
    if (window.innerWidth <= 900) {
        const tabMapa = document.getElementById('tabMapa');
        if (tabMapa) tabMapa.click();
    }
    if (mapaInstance) {
        setTimeout(() => {
            mapaInstance.invalidateSize();
            mapaInstance.flyTo([lat, lng], 16, { animate: true, duration: 1 });
        }, 120);
    }
    const mapSection = document.getElementById('mapa-section');
    if (mapSection && window.innerWidth > 900) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


// ====== UTILIDADES ======
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatearHora(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return isoStr;
    }
}
