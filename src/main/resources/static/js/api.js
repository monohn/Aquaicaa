// ============================================================
// AquaIca - Configuración dinámica y cliente de API
// Soporta despliegue unificado (Spring Boot) o desacoplado (Vercel Frontend + Render Backend)
// ============================================================

(function() {
    // 1. Detección de URL de Backend Render / Cloud
    // Puede configurarse via window.AQUAICA_BACKEND_URL o localStorage.getItem("AQUAICA_BACKEND_URL")
    const customBackend = window.AQUAICA_BACKEND_URL || localStorage.getItem("AQUAICA_BACKEND_URL");
    const backendUrl = (customBackend || "").replace(/\/+$/, "");

    // Si hay una URL de backend externa definida, interceptamos fetch globalmente
    // para que todas las llamadas a /api/ o /uploads/ se dirijan de forma transparente a Render
    if (backendUrl) {
        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
            if (typeof input === "string") {
                if (input.startsWith("/api/") || input.startsWith("/uploads/")) {
                    input = backendUrl + input;
                }
            } else if (input instanceof Request) {
                const urlObj = new URL(input.url, window.location.origin);
                if (urlObj.pathname.startsWith("/api/") || urlObj.pathname.startsWith("/uploads/")) {
                    input = new Request(backendUrl + urlObj.pathname + urlObj.search, init || input);
                }
            }
            return originalFetch.call(this, input, init);
        };
        console.log("🔌 [AquaIca API] Conectado a backend Render:", backendUrl);
    }

    // Helper global para conectar o cambiar el backend fácilmente desde la consola:
    // setBackendUrl('https://mi-aquaica.onrender.com')
    window.setBackendUrl = function(url) {
        if (!url) {
            localStorage.removeItem("AQUAICA_BACKEND_URL");
            console.log("Backend externo removido. Usando rutas relativas locales.");
        } else {
            const cleaned = url.trim().replace(/\/+$/, "");
            localStorage.setItem("AQUAICA_BACKEND_URL", cleaned);
            console.log("Backend externo configurado:", cleaned);
        }
        window.location.reload();
    };
})();

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: headers
    });

    if (response.status === 401) {
        ["token", "username", "rol", "personalId", "clienteId"].forEach(c => localStorage.removeItem(c));
        window.location.href = "login.html";
        throw new Error("Sesión expirada. Redirigiendo a inicio de sesión...");
    }

    if (response.status === 403) {
        throw new Error("No tienes permisos suficientes para realizar esta acción");
    }

    if (!response.ok) {
        let mensaje = "Error en la solicitud";
        try {
            const errorData = await response.json();
            if (errorData.message) {
                mensaje = errorData.message;
            }
        } catch (error) {
            // Ignorar error de parsing json
        }
        throw new Error(mensaje);
    }

    if (response.status === 204) {
        return null;
    }

    return await response.json();
}
