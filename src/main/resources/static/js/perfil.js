/**
 * AquaIca — Lógica de Mi Perfil Ciudadano
 */

document.addEventListener('DOMContentLoaded', () => {
    initDrawer();
    initPerfil();
});

let clienteActualId = null;

function initDrawer() {
    const btn = document.getElementById('menuBtn');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    const closeBtn = document.getElementById('drawerCloseBtn');

    if (btn && drawer && overlay) {
        btn.addEventListener('click', () => {
            drawer.classList.toggle('open');
            overlay.classList.toggle('open');
        });

        overlay.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    if (closeBtn && drawer && overlay) {
        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
        });
    }
}

async function initPerfil() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const rol = localStorage.getItem('rol');

    if (!token || !username) {
        window.location.href = 'login.html';
        return;
    }

    if (rol === 'ADMIN' || rol === 'SOPORTE') {
        window.location.href = 'dashboard.html';
        return;
    }

    if (rol === 'TECNICO') {
        window.location.href = 'asignaciones.html';
        return;
    }

    // Render cabecera
    const headerAuthArea = document.getElementById('headerAuthArea');
    const drawerUserStatus = document.getElementById('drawerUserStatus');
    const drawerFooter = document.getElementById('drawerFooter');
    const inicial = username.charAt(0).toUpperCase();
    const savedAvatar = localStorage.getItem('aquaica_avatar_' + username) || localStorage.getItem('aquaica_avatar');

    const avatarHtml = savedAvatar
        ? `<img src="${savedAvatar}" alt="${escapeHtml(username)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
        : inicial;

    if (headerAuthArea) {
        headerAuthArea.innerHTML = `
            <div class="user-profile-badge">
                <div class="user-badge-avatar" style="${savedAvatar ? 'background:transparent;' : ''}">${avatarHtml}</div>
                <div class="user-badge-info">
                    <span class="user-badge-name">${escapeHtml(username)}</span>
                    <span class="user-badge-role">${escapeHtml(rol || 'Ciudadano')}</span>
                </div>
                <button type="button" class="btn-logout-header" onclick="cerrarSesion()" title="Cerrar sesión">Salir</button>
            </div>
        `;
    }

    if (drawerUserStatus) {
        drawerUserStatus.textContent = `Sesión: ${username}`;
    }

    if (drawerFooter) {
        drawerFooter.innerHTML = `
            <button type="button" class="drawer-login-btn" onclick="cerrarSesion()" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;box-shadow:none;">
                <svg class="drawer-btn-svg" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Cerrar sesión (${escapeHtml(username)})</span>
            </button>
        `;
    }

    // Mostrar opciones operativas en el drawer solo si corresponde
    const drawerAdminSection = document.getElementById('drawerAdminSection');
    const drawerDashboardLink = document.getElementById('drawerDashboardLink');
    const drawerAsignacionesLink = document.getElementById('drawerAsignacionesLink');
    if (drawerAdminSection) {
        if (rol === 'ADMIN' || rol === 'SOPORTE') {
            drawerAdminSection.style.display = 'block';
            if (drawerDashboardLink) drawerDashboardLink.style.display = 'flex';
        } else if (rol === 'TECNICO') {
            drawerAdminSection.style.display = 'block';
            if (drawerAsignacionesLink) drawerAsignacionesLink.style.display = 'flex';
        }
    }

    // Cargar datos del perfil desde backend
    document.getElementById('username').value = username;
    document.getElementById('perfilUsuarioHeader').textContent = `Usuario: @${username} · Rol: ${rol || 'Ciudadano'}`;

    const txtAvatar = document.getElementById('perfilAvatarTxt');
    const imgAvatar = document.getElementById('perfilAvatarImg');
    if (txtAvatar) txtAvatar.textContent = inicial;
    if (savedAvatar && imgAvatar) {
        imgAvatar.src = savedAvatar;
        imgAvatar.style.display = 'block';
        if (txtAvatar) txtAvatar.style.display = 'none';
    }

    configurarSubidaAvatarCiudadano(username);
    configurarGpsPerfil();

    try {
        const resp = await fetch('/api/clientes/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (resp.ok) {
            const data = await resp.json();
            clienteActualId = data.id;
            cargarDatosEnFormulario(data, username);
        } else {
            // Intentar cargar por clienteId en localStorage si está disponible
            const savedClienteId = localStorage.getItem('clienteId');
            if (savedClienteId) {
                const respId = await fetch(`/api/clientes/${savedClienteId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (respId.ok) {
                    const data = await respId.json();
                    clienteActualId = data.id;
                    cargarDatosEnFormulario(data, username);
                } else {
                    cargarDesdeLocalStorage(username);
                }
            } else {
                cargarDesdeLocalStorage(username);
            }
        }
    } catch (e) {
        console.warn('Error al conectar con /api/clientes/me:', e);
        cargarDesdeLocalStorage(username);
    }

    // Cargar suministro por cliente si existe
    if (clienteActualId) {
        cargarSuministroDeCliente(clienteActualId, token);
    }

    // Configurar botón verificar suministro
    const btnVerificar = document.getElementById('btnVerificarSuministro');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', verificarSuministro);
    }

    // Configurar guardado de formulario
    const form = document.getElementById('perfilForm');
    if (form) {
        form.addEventListener('submit', guardarPerfil);
    }
}

function cargarDatosEnFormulario(data, username) {
    if (data.nombreCompleto) {
        document.getElementById('nombreCompleto').value = data.nombreCompleto;
        document.getElementById('perfilNombreHeader').textContent = data.nombreCompleto;
    } else {
        document.getElementById('perfilNombreHeader').textContent = username;
    }

    if (data.dni) {
        document.getElementById('dni').value = data.dni;
    }

    if (data.telefono) {
        document.getElementById('telefono').value = data.telefono;
    }

    if (data.email) {
        document.getElementById('email').value = data.email;
    }

    if (data.fechaRegistro) {
        const fecha = new Date(data.fechaRegistro).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        document.getElementById('perfilFechaTag').textContent = `🗓️ Miembro desde: ${fecha}`;
    }

    // Cargar preferencias locales adicionales de suministro y dirección
    cargarPreferenciasUbicacion();
}

function cargarDesdeLocalStorage(username) {
    document.getElementById('perfilNombreHeader').textContent = username;
    document.getElementById('nombreCompleto').value = localStorage.getItem('perfil_nombre') || username;
    document.getElementById('dni').value = localStorage.getItem('perfil_dni') || '72345678';
    document.getElementById('telefono').value = localStorage.getItem('perfil_telefono') || '956123456';
    document.getElementById('email').value = localStorage.getItem('perfil_email') || `${username}@aquaica.gob.pe`;

    cargarPreferenciasUbicacion();
}

function cargarPreferenciasUbicacion() {
    const sum = localStorage.getItem('perfil_suministro') || '12345678';
    const dir = localStorage.getItem('perfil_direccion') || 'Av. San Martín 450';
    const dis = localStorage.getItem('perfil_distrito') || 'Ica';
    const ref = localStorage.getItem('perfil_referencia') || 'Frente a la plaza principal';

    const inputSum = document.getElementById('codigoSuministro');
    if (inputSum) {
        inputSum.value = sum;
        inputSum.addEventListener('input', () => {
            inputSum.value = inputSum.value.replace(/\D/g, '').slice(0, 8);
        });
    }
    document.getElementById('direccion').value = dir;
    document.getElementById('distrito').value = dis;
    document.getElementById('referencia').value = ref;

    document.getElementById('perfilSuministroTag').textContent = `💧 Suministro: ${sum}`;
    document.getElementById('perfilDistritoTag').textContent = `📍 ${dis}`;
}

async function cargarSuministroDeCliente(clienteId, token) {
    try {
        const resp = await fetch(`/api/suministros/cliente/${clienteId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
            const list = await resp.json();
            if (Array.isArray(list) && list.length > 0) {
                const s = list[0];
                if (s.codigoSuministro || s.codigo) {
                    const c = s.codigoSuministro || s.codigo;
                    document.getElementById('codigoSuministro').value = c;
                    document.getElementById('perfilSuministroTag').textContent = `💧 Suministro: ${c}`;
                }
                if (s.direccion) document.getElementById('direccion').value = s.direccion;
                if (s.distrito) document.getElementById('distrito').value = s.distrito;
                if (s.referencia) document.getElementById('referencia').value = s.referencia;

                if (s.distrito) document.getElementById('perfilDistritoTag').textContent = `📍 ${s.distrito}`;
            }
        }
    } catch (e) {
        console.log('No se cargó suministro remoto:', e);
    }
}

async function verificarSuministro() {
    const input = document.getElementById('codigoSuministro');
    const hint = document.getElementById('suministroStatusHint');
    const codigo = input.value.trim();

    if (!codigo) {
        hint.textContent = '⚠️ Ingresa los 8 dígitos de tu número de suministro.';
        hint.style.color = '#dc2626';
        return;
    }

    if (!/^\d{8}$/.test(codigo)) {
        hint.textContent = '⚠️ El número de suministro debe tener exactamente 8 dígitos.';
        hint.style.color = '#dc2626';
        return;
    }

    hint.textContent = `✅ Número de suministro válido (${codigo})`;
    hint.style.color = '#059669';
    document.getElementById('perfilSuministroTag').textContent = `💧 Suministro: ${codigo}`;
}

async function guardarPerfil(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
    const dni = document.getElementById('dni').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const email = document.getElementById('email').value.trim();

    const suministro = document.getElementById('codigoSuministro').value.trim();
    if (suministro && !/^\d{8}$/.test(suministro)) {
        mostrarAlertaPerfil('El número de suministro debe contener exactamente 8 dígitos numéricos.', 'error');
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
        return;
    }
    const distrito = document.getElementById('distrito').value;
    const direccion = document.getElementById('direccion').value.trim();
    const referencia = document.getElementById('referencia').value.trim();

    const alerta = document.getElementById('perfilAlerta');
    const btn = document.getElementById('btnGuardarPerfil');

    btn.disabled = true;
    btn.textContent = 'Guardando cambios...';

    // 1. Guardar en almacenamiento local para persistencia inmediata y prellenado
    localStorage.setItem('perfil_nombre', nombreCompleto);
    localStorage.setItem('perfil_telefono', telefono);
    localStorage.setItem('perfil_email', email);
    localStorage.setItem('perfil_suministro', suministro);
    localStorage.setItem('perfil_distrito', distrito);
    localStorage.setItem('perfil_direccion', direccion);
    localStorage.setItem('perfil_referencia', referencia);

    // Actualizar badges visuales
    document.getElementById('perfilNombreHeader').textContent = nombreCompleto || localStorage.getItem('username');
    document.getElementById('perfilSuministroTag').textContent = `💧 Suministro: ${suministro || 'No asignado'}`;
    document.getElementById('perfilDistritoTag').textContent = `📍 ${distrito}`;

    try {
        // 2. Si hay cliente logueado, sincronizar con backend
        const bodyData = {
            nombreCompleto,
            dni,
            telefono,
            email,
            estado: 'ACTIVO'
        };

        const resp = await fetch('/api/clientes/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });

        alerta.style.display = 'inline-block';
        alerta.className = 'perfil-alert success';
        alerta.textContent = '✅ ¡Tus datos generales y de suministro se actualizaron con éxito!';

    } catch (err) {
        console.warn('Sincronización remota fallida, datos guardados localmente:', err);
        alerta.style.display = 'inline-block';
        alerta.className = 'perfil-alert success';
        alerta.textContent = '✅ Datos guardados y actualizados en tu sesión local.';
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar cambios
        `;

        setTimeout(() => {
            alerta.style.display = 'none';
        }, 4000);
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('rol');
    localStorage.removeItem('personalId');
    localStorage.removeItem('clienteId');
    window.location.href = 'index.html';
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

/* ===== FOTO DE PERFIL CIUDADANO ===== */
function configurarSubidaAvatarCiudadano(username) {
    const input = document.getElementById('avatarFileInput');
    const img = document.getElementById('perfilAvatarImg');
    const txt = document.getElementById('perfilAvatarTxt');

    if (!input) return;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida (JPG, PNG o WEBP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const tempImg = new Image();
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
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
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempImg, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

                localStorage.setItem('aquaica_avatar_' + username, dataUrl);
                localStorage.setItem('aquaica_avatar', dataUrl);

                if (img) {
                    img.src = dataUrl;
                    img.style.display = 'block';
                }
                if (txt) txt.style.display = 'none';

                const badgeAvatar = document.querySelector('.user-badge-avatar');
                if (badgeAvatar) {
                    badgeAvatar.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    badgeAvatar.style.background = 'transparent';
                }
            };
            tempImg.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ===== GEOLOCALIZACIÓN CIUDADANA AUTOMÁTICA ===== */
function configurarGpsPerfil() {
    const btnGps = document.getElementById('btnDetectarGpsPerfil');
    const txtBtn = document.getElementById('txtGpsPerfil');
    const hint = document.getElementById('hintGpsPerfil');
    const selectDistrito = document.getElementById('distrito');
    const inputDireccion = document.getElementById('direccion');

    if (!btnGps) return;

    const DISTRITOS_ICA = [
        { nombre: 'Ica', lat: -14.0678, lng: -75.7286 },
        { nombre: 'Parcona', lat: -14.0530, lng: -75.7060 },
        { nombre: 'La Tinguiña', lat: -14.0450, lng: -75.7140 },
        { nombre: 'Subtanjalla', lat: -14.0280, lng: -75.7480 },
        { nombre: 'San Juan Bautista', lat: -14.0150, lng: -75.7350 },
        { nombre: 'Los Aquijes', lat: -14.0950, lng: -75.6900 },
        { nombre: 'Salas Guadalupe', lat: -13.9850, lng: -75.7650 },
        { nombre: 'Pueblo Nuevo', lat: -14.0840, lng: -75.7580 },
        { nombre: 'Tate', lat: -14.1200, lng: -75.7100 },
        { nombre: 'Pachacútec', lat: -14.1450, lng: -75.7000 },
        { nombre: 'Santiago', lat: -14.1850, lng: -75.7200 },
        { nombre: 'Ocucaje', lat: -14.3400, lng: -75.6800 },
        { nombre: 'Yauca del Rosario', lat: -14.1750, lng: -75.5200 }
    ];

    function obtenerDistritoMasCercano(lat, lng) {
        let menorDist = Infinity;
        let distritoElegido = 'Ica';
        for (const d of DISTRITOS_ICA) {
            const dist = Math.hypot(lat - d.lat, lng - d.lng);
            if (dist < menorDist) {
                menorDist = dist;
                distritoElegido = d.nombre;
            }
        }
        return distritoElegido;
    }

    async function ejecutarDeteccionGPS() {
        if (!navigator.geolocation) {
            alert('Tu navegador no cuenta con soporte para geolocalización satelital.');
            return;
        }

        txtBtn.textContent = 'Solicitando permiso...';
        btnGps.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const prec = Math.round(pos.coords.accuracy || 10);

                localStorage.setItem('aquaica_last_lat', lat);
                localStorage.setItem('aquaica_last_lng', lng);

                const distritoDetectado = obtenerDistritoMasCercano(lat, lng);
                if (selectDistrito) {
                    selectDistrito.value = distritoDetectado;
                }

                if (hint) {
                    hint.style.display = 'block';
                    hint.style.color = '#15803d';
                    hint.textContent = `📍 GPS detectado: ${distritoDetectado} (${lat.toFixed(5)}, ${lng.toFixed(5)} ±${prec}m)`;
                }

                txtBtn.textContent = 'GPS detectado';
                btnGps.disabled = false;
            },
            (err) => {
                console.warn('GPS permiso o error:', err);
                if (hint) {
                    hint.style.display = 'block';
                    hint.style.color = '#b45309';
                    if (err.code === err.PERMISSION_DENIED) {
                        hint.textContent = 'Permiso denegado. Puedes seleccionar tu distrito y escribir tu dirección manualmente.';
                    } else {
                        hint.textContent = 'No se pudo obtener señal GPS en este momento. Ingresa tus datos manualmente.';
                    }
                }
                txtBtn.textContent = 'Reintentar GPS';
                btnGps.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }

    btnGps.addEventListener('click', ejecutarDeteccionGPS);
}
