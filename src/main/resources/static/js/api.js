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
        throw new Error(
            "No tienes permisos suficientes para realizar esta acción"
        );
    }

    if (!response.ok) {

        let mensaje = "Error en la solicitud";

        try {
            const errorData = await response.json();

            if (errorData.message) {
                mensaje = errorData.message;
            }

        } catch (error) {

        }

        throw new Error(mensaje);
    }

    if (response.status === 204) {
        return null;
    }

    return await response.json();
}