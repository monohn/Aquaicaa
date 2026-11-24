
window.fillDemoCredentials = function(username, password) {
    const userInput = document.getElementById("username");
    const passInput = document.getElementById("password");
    if (userInput && passInput) {
        userInput.value = username;
        passInput.value = password;
        userInput.focus();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = loginForm.querySelector(".login-button");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        loginMessage.hidden = true;
        loginMessage.textContent = "";

        loginButton.disabled = true;
        loginButton.textContent = "Iniciando sesión...";

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Usuario o contraseña incorrectos."
                );
            }

            if (!data.token || !data.rol) {
                throw new Error("La respuesta del servidor está incompleta.");
            }

            // Guardar la sesión
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username || username);
            localStorage.setItem("rol", data.rol);

            if (data.personalId != null) {
                localStorage.setItem("personalId", data.personalId);
            } else {
                localStorage.removeItem("personalId");
            }

            if (data.clienteId != null) {
                localStorage.setItem("clienteId", data.clienteId);
            } else {
                localStorage.removeItem("clienteId");
            }

            console.log("Inicio de sesión exitoso:", data.rol);

            // Redirección estricta según el rol
            if (data.rol === "CIUDADANO") {
                // El ciudadano va directo a la vista principal tipo Facebook (Feed Comunitario)
                window.location.href = "index.html";
            } else if (data.rol === "TECNICO") {
                // El técnico va directo a su lista operativa de asignaciones de campo
                window.location.href = "asignaciones.html";
            } else if (["ADMIN", "SOPORTE"].includes(data.rol)) {
                // Solo administración y soporte ven el dashboard de métricas y KPIs
                window.location.href = "dashboard.html";
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                localStorage.removeItem("rol");
                localStorage.removeItem("personalId");
                localStorage.removeItem("clienteId");

                throw new Error("El rol de usuario no está reconocido.");
            }

        } catch (error) {
            console.error("Error de login:", error);
            loginMessage.textContent =
                error.message || "No se pudo iniciar sesión.";
            loginMessage.hidden = false;

        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Iniciar sesión";
        }
    });
});
