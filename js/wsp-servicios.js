const telefonos = [
    "5493562412543",
    "5493562503465"
];

const servicios = {
    btnSistema: "¡Hola! 👋 Me interesa conocer más sobre el Sistema de Gestión y Punto de Venta. ¿Podrían brindarme información?",
    btnLanding: "¡Hola! 👋 Me interesa desarrollar una Landing Page para mi negocio. ¿Podrían brindarme información?",
    btnWeb: "¡Hola! 👋 Me interesa desarrollar una Aplicación Web. ¿Podrían brindarme información?",
};

function obtenerTelefono() {

    let indice = Number(localStorage.getItem("indiceWhatsApp")) || 0;

    const telefono = telefonos[indice];

    indice = (indice + 1) % telefonos.length;

    localStorage.setItem("indiceWhatsApp", indice);

    return telefono;
}

Object.keys(servicios).forEach(id => {

    const boton = document.getElementById(id);

    if (!boton) return;

    boton.addEventListener("click", () => {

        const telefono = obtenerTelefono();

        window.open(
            `https://wa.me/${telefono}?text=${encodeURIComponent(servicios[id])}`,
            "_blank"
        );

    });

});