        // Configuración de las opciones según tu pedido
        const opcionesWsp = [
            {
                nombre: "Eze",
                telefono: "3562412543",
                frases: [
                    "👋 Hola!",
                    "Soy Eze, de EU!",
                    "Gracias por visitar nuestra página.",
                    "Si tenés una idea o querés digitalizar tu negocio, contame un poco sobre tu proyecto.",
                    "Voy a responderte personalmente por WhatsApp."
                ]
            },
            {
                nombre: "Uli",
                telefono: "3562503465", 
                frases: [
                    "👋 Hola!",
                    "Soy Uli, de EU!",
                    "Gracias por visitar nuestra web.",
                    "Si estás buscando una Landing, un Sistema o una App, escribime y te asesoramos.",
                    "Te respondo personalmente por WhatsApp."
                ]
            }
        ];

        // Elección A/B aleatoria fija por sesión/carga
        const opcionSeleccionada = opcionesWsp[Math.floor(Math.random() * opcionesWsp.length)];
        
        let widgetAbiertoantes = false;

        function toggleWidget() {
            const widget = document.getElementById('wspWidget');
            const badge = document.getElementById('wspBadge');

            if (widget.style.display === 'flex') {
                widget.style.display = 'none';
            } else {
                widget.style.display = 'flex';
                badge.style.display = 'none'; // Borra el globo de notificación
                
                if (!widgetAbiertoantes) {
                    widgetAbiertoantes = true;
                    iniciarFlujoChat();
                }
            }
        }

        function iniciarFlujoChat() {
            const contentArea = document.getElementById('wspContentArea');
            
            // 1. Mostrar estado "Escribiendo..."
            contentArea.innerHTML = `
                <div class="wsp-typing-indicator" id="typingIndicator">
                    ${opcionSeleccionada.nombre} está escribiendo
                    <div class="wsp-typing-dots"><span></span><span></span><span></span></div>
                </div>
            `;

            // Espera 2 segundos simulando que la persona empieza a tipear
            setTimeout(() => {
                contentArea.innerHTML = `<span id="wspTypingText" class="typing-cursor"></span>`;
                escribirFrases(0);
            }, 2000);
        }

        function escribirFrases(fraseIndex) {
            const textoContenedor = document.getElementById('wspTypingText');
            const botonCta = document.getElementById('wspCtaBtn');
            
            // Si ya escribimos todas las frases
            if (fraseIndex >= opcionSeleccionada.frases.length) {
                textoContenedor.classList.remove('typing-cursor');
                
                // Configurar enlace de WhatsApp final
                const textoPlano = opcionSeleccionada.frases.join("\n");
                botonCta.href = `https://wa.me/${opcionSeleccionada.telefono}?text=${encodeURIComponent('¡Hola! Estuve viendo la web y me interesa armar un proyecto.')}`;
                botonCta.classList.add('show');
                return;
            }

            let fraseActual = opcionSeleccionada.frases[fraseIndex];
            let charIndex = 0;
            
            // Velocidad más tranquila (45ms por letra)
            const velocidadLetra = 45; 
            // Pausa humana al terminar la frase / presionar Enter (800ms)
            const pausaFinFrase = 800; 

            function tipearLetra() {
                if (charIndex < fraseActual.length) {
                    textoContenedor.innerHTML += fraseActual.charAt(charIndex);
                    charIndex++;
                    setTimeout(tipearLetra, velocidadLetra);
                } else {
                    // Terminó la frase actual: agregamos el "Enter" (salto de línea)
                    textoContenedor.innerHTML += '<br>';
                    
                    // Esperamos la pausa tranquila antes de saltar a la siguiente frase
                    setTimeout(() => {
                        escribirFrases(fraseIndex + 1);
                    }, pausaFinFrase);
                }
            }

            tipearLetra();
        }

        function wspPresupuesto() {
            const botones = document.querySelectorAll('.btn-primary');

            botones.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();

                    const urlWhatsApp = `https://wa.me/${opcionSeleccionada.telefono}?text=${encodeURIComponent('¡Hola! Me interesa solicitar un presupuesto para mi proyecto.')}`;

                    window.open(urlWhatsApp, '_blank');
                });
            });
        }

        wspPresupuesto();