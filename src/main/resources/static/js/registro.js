
const registroForm = document.getElementById("registroForm");
const registroMessage = document.getElementById("registroMessage");
const registroButton = document.getElementById("registroButton");
const dniInputReg = document.getElementById("dni");
const nombreInputReg = document.getElementById("nombreCompleto");
const dniHintReg = document.getElementById("dniLookupHint");

if (dniInputReg) {
    dniInputReg.addEventListener("input", async () => {
        dniInputReg.value = dniInputReg.value.replace(/\D/g, "").slice(0, 8);
        const val = dniInputReg.value;
        if (val.length === 8) {
            if (dniHintReg) {
                dniHintReg.textContent = "Validando DNI en padrón / RENIEC...";
                dniHintReg.style.color = "#0369a1";
            }
            try {
                const resp = await fetch(`/api/public/validar-identidad/${encodeURIComponent(val)}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.encontrado && data.nombreCompleto) {
                        if (nombreInputReg) nombreInputReg.value = data.nombreCompleto;
                        if (dniHintReg) {
                            dniHintReg.textContent = `Identidad verificada (${data.fuente === "RENIEC" ? "RENIEC" : "Padrón"}): ${data.nombreCompleto}`;
                            dniHintReg.style.color = "#059669";
                        }
                        return;
                    }
                }
                if (dniHintReg) {
                    dniHintReg.textContent = "No encontrado automáticamente; ingresa tu nombre completo.";
                    dniHintReg.style.color = "#b45309";
                }
            } catch (e) {
                if (dniHintReg) {
                    dniHintReg.textContent = "Ingresa tu nombre completo tal como figura en tu DNI.";
                    dniHintReg.style.color = "#486581";
                }
            }
        } else if (dniHintReg) {
            dniHintReg.textContent = "Al ingresar tus 8 dígitos validaremos tu nombre automáticamente.";
            dniHintReg.style.color = "#486581";
        }
    });
}

registroForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const dni = document.getElementById("dni").value.trim();
    const nombreCompleto = document.getElementById("nombreCompleto").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!/^\d{8}$/.test(dni)) {
        mostrarMensaje("El DNI debe contener exactamente 8 números.");
        return;
    }

    if (password !== confirmPassword) {
        mostrarMensaje("Las contraseñas no coinciden.");
        return;
    }

    if (password.length < 6 || password.length > 72) {
        mostrarMensaje("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    registroButton.disabled = true;
    registroButton.textContent = "Creando cuenta...";

    try {
        const respuesta = await fetch("/api/auth/registro-ciudadano", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                dni,
                nombreCompleto,
                telefono,
                email,
                username,
                password
            })
        });

        const mensaje = await respuesta.text();

        if (!respuesta.ok) {
            throw new Error(mensaje || "No se pudo crear la cuenta.");
        }

        registroMessage.hidden = false;
        registroMessage.classList.add("registro-exito");
        registroMessage.textContent =
            "¡Cuenta creada correctamente! Ahora puedes iniciar sesión.";

        registroForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1800);

    } catch (error) {
        mostrarMensaje(error.message || "Error de conexión con el servidor.");
    } finally {
        registroButton.disabled = false;
        registroButton.textContent = "Crear cuenta ciudadana";
    }
});

function mostrarMensaje(mensaje) {
    registroMessage.hidden = false;
    registroMessage.classList.remove("registro-exito");
    registroMessage.textContent = mensaje;
}
