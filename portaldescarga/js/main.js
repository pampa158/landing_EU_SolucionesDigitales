/**
 * =========================================================================
 * EU!-Commerce - Portal de Descarga Oficial
 * Lógica JavaScript Vanilla (100% Dinámico sin valores hardcodeados)
 * =========================================================================
 */

'use strict';

/**
 * CONFIGURACIÓN DE ENLACES Y RECURSOS
 */
const CONFIG = {
    // Carpeta relativa donde se alojan los instaladores (funciona tanto en local como en tu VPS)
    VERSIONS_DIR: '/updates/versions/',

    // Estado dinámico: se puebla ÚNICAMENTE con los datos leídos del servidor
    CURRENT_VERSION: null,
    CURRENT_FILENAME: null,
    INSTALLER_URL: null,

    // Enlaces de recursos adicionales
    VIDEO_TUTORIAL_URL: '#', // Ej: 'https://youtu.be/...' o './tutorial.html'
    MANUAL_USO_URL: '#',     // Ej: './manual.html' o enlace a PDF
    
    // Configuración de WhatsApp con soporte alternado
    WHATSAPP_NUMBERS: [
        '5493562412543', // Número WhatsApp 1 (formato internacional sin +)
        '5493562503465'  // Número WhatsApp 2 (formato internacional sin +)
    ],
    WHATSAPP_MESSAGE: 'Hola EU Soluciones Digitales, necesito ayuda con la descarga de EU!-Commerce'
};

// Estado interno de la interfaz
let descargaEnCurso = false;
let toastTimeout = null;

/**
 * Inicialización al cargar el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    initLucideIcons();
    initCurrentYear();
    initResourceLinks();
    detectarUltimaVersion();
});

/**
 * =========================================================================
 * DETECCIÓN Y COMPARACIÓN DE VERSIONES EN EL SERVIDOR
 * =========================================================================
 */

/**
 * Extrae el número de versión desde un nombre de archivo
 * Formato esperado: "EU!-Commerce Setup X.Y.Z.exe"
 * Soporta versiones con 2, 3 o más bloques (ej: 1.0.2, 1.10.0, 2.0.0.1)
 * @param {string} nombreArchivo
 * @returns {string|null}
 */
function extraerVersion(nombreArchivo) {
    if (!nombreArchivo) return null;
    const decodificado = decodeURIComponent(nombreArchivo);
    const match = decodificado.match(/EU!-Commerce(?:\s+|%20)Setup(?:\s+|%20)([0-9]+(?:\.[0-9]+)+)\.exe/i);
    return match ? match[1] : null;
}

/**
 * Compara dos versiones semánticas numéricamente (ej: "1.10.0" vs "1.2.0")
 * @param {string} v1
 * @param {string} v2
 * @returns {number} > 0 si v1 > v2, < 0 si v1 < v2, 0 si son iguales
 */
function compararVersiones(v1, v2) {
    const partes1 = v1.split('.').map(n => parseInt(n, 10) || 0);
    const partes2 = v2.split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(partes1.length, partes2.length);

    for (let i = 0; i < maxLen; i++) {
        const num1 = partes1[i] || 0;
        const num2 = partes2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

/**
 * Consulta la carpeta de versiones en el servidor, analiza los archivos disponibles,
 * compara las versiones existentes y selecciona la versión mayor.
 */
async function detectarUltimaVersion() {
    try {
        const dirNormalizado = CONFIG.VERSIONS_DIR.endsWith('/') ? CONFIG.VERSIONS_DIR : `${CONFIG.VERSIONS_DIR}/`;
        const urlConsulta = `${dirNormalizado}?t=${Date.now()}`;

        const response = await fetch(urlConsulta, {
            cache: 'no-cache',
            headers: {
                'Accept': 'text/html,application/json,*/*'
            }
        });

        if (!response.ok) {
            console.warn(`No se pudo leer la carpeta ${CONFIG.VERSIONS_DIR} (Status: ${response.status}).`);
            resetearEstadoVersion();
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        let listaArchivos = [];

        if (contentType.includes('application/json')) {
            // Caso: El servidor responde con JSON (ej: Nginx autoindex_format json o versions.json)
            const data = await response.json();
            if (Array.isArray(data)) {
                listaArchivos = data.map(item => (typeof item === 'string' ? item : item.name || ''));
            }
        } else {
            // Caso estándar: autoindex HTML (Nginx, Apache, servidor de desarrollo local)
            const htmlTexto = await response.text();
            const textoDecodificado = decodeURIComponent(htmlTexto);

            // Extraer todas las coincidencias del formato "EU!-Commerce Setup X.Y.Z.exe"
            const regex = /EU!-Commerce Setup ([0-9]+(?:\.[0-9]+)+)\.exe/gi;
            const encontrados = new Set();
            let coincidencia;

            while ((coincidencia = regex.exec(textoDecodificado)) !== null) {
                encontrados.add(coincidencia[0]);
            }

            listaArchivos = Array.from(encontrados);
        }

        if (listaArchivos.length === 0) {
            console.info(`No se encontraron instaladores con el formato "EU!-Commerce Setup X.Y.Z.exe" en ${CONFIG.VERSIONS_DIR}`);
            resetearEstadoVersion();
            return null;
        }

        // Encontrar la versión mayor numéricamente
        let mayorVersion = null;
        let archivoMayor = null;

        for (const archivo of listaArchivos) {
            const version = extraerVersion(archivo);
            if (!version) continue;

            if (!mayorVersion || compararVersiones(version, mayorVersion) > 0) {
                mayorVersion = version;
                archivoMayor = archivo;
            }
        }

        if (mayorVersion && archivoMayor) {
            const urlFinal = `${dirNormalizado}${encodeURIComponent(archivoMayor)}`;

            CONFIG.CURRENT_VERSION = mayorVersion;
            CONFIG.CURRENT_FILENAME = archivoMayor;
            CONFIG.INSTALLER_URL = urlFinal;

            actualizarUIConVersion(mayorVersion, archivoMayor);
            return { version: mayorVersion, archivo: archivoMayor, url: urlFinal };
        } else {
            resetearEstadoVersion();
            return null;
        }
    } catch (error) {
        console.warn('Error al verificar las versiones:', error.message);
        resetearEstadoVersion();
        return null;
    }
}

/**
 * Resetea el estado visual si no hay versiones encontradas (sin inventar datos)
 */
function resetearEstadoVersion() {
    CONFIG.CURRENT_VERSION = null;
    CONFIG.CURRENT_FILENAME = null;
    CONFIG.INSTALLER_URL = null;

    const btnText = document.getElementById('btnText');
    if (btnText && !descargaEnCurso) {
        btnText.textContent = 'Descargar EU!-Commerce';
    }

    const versionTag = document.getElementById('versionTag');
    if (versionTag) {
        versionTag.classList.add('hidden');
        versionTag.textContent = '';
    }

    const completeFileName = document.getElementById('completeFileName');
    if (completeFileName) {
        completeFileName.textContent = '';
    }
}

/**
 * Actualiza los textos de la interfaz con la versión encontrada
 * sin alterar iconos de Lucide ni elementos visuales.
 * @param {string} version
 * @param {string} nombreArchivo
 */
function actualizarUIConVersion(version, nombreArchivo) {
    // 1. Botón principal: añade la versión sin tocar el elemento del ícono
    const btnText = document.getElementById('btnText');
    if (btnText && !descargaEnCurso) {
        btnText.textContent = `Descargar EU!-Commerce (v${version})`;
    }

    // 2. Badge de versión junto al indicador de seguridad
    const versionTag = document.getElementById('versionTag');
    if (versionTag) {
        versionTag.textContent = `v${version}`;
        versionTag.classList.remove('hidden');
    }

    // 3. Texto informativo en la confirmación de descarga
    const completeFileName = document.getElementById('completeFileName');
    if (completeFileName && nombreArchivo) {
        completeFileName.textContent = ` (${nombreArchivo})`;
    }
}

/**
 * =========================================================================
 * INICIALIZACIÓN Y FUNCIONES DE SOPORTE
 * =========================================================================
 */

/**
 * Inicialización segura de los íconos de Lucide
 */
function initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    } else {
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js';
        fallbackScript.onload = () => {
            if (window.lucide) window.lucide.createIcons();
        };
        document.head.appendChild(fallbackScript);
    }
}

/**
 * Actualiza el año actual en el footer
 */
function initCurrentYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

/**
 * Configura los enlaces de los recursos si tienen URL asignada
 */
function initResourceLinks() {
    const videoLinkEl = document.getElementById('videoTutorialLink');
    const manualLinkEl = document.getElementById('manualUsoLink');

    if (videoLinkEl && CONFIG.VIDEO_TUTORIAL_URL && CONFIG.VIDEO_TUTORIAL_URL !== '#') {
        videoLinkEl.href = CONFIG.VIDEO_TUTORIAL_URL;
    }

    if (manualLinkEl && CONFIG.MANUAL_USO_URL && CONFIG.MANUAL_USO_URL !== '#') {
        manualLinkEl.href = CONFIG.MANUAL_USO_URL;
    }
}

/**
 * Alterna la visibilidad del desplegable de ayuda de Windows SmartScreen
 */
function toggleSmartScreenHelp() {
    const dropdown = document.getElementById('smartScreenDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');
}

/**
 * Flujo interactivo de descarga oficial con barra de progreso simulada
 * @param {boolean} esReintento - Indica si el usuario hizo clic en reintentar
 */
async function iniciarDescarga(esReintento = false) {
    if (descargaEnCurso && !esReintento) return;

    // Si aún no se resolvió la URL de descarga, intentar una búsqueda inmediata
    if (!CONFIG.INSTALLER_URL) {
        const resultado = await detectarUltimaVersion();
        if (!resultado) {
            mostrarToast('No se encontró ningún instalador en la carpeta /updates/versions/');
            return;
        }
    }

    descargaEnCurso = true;

    const btn = document.getElementById('downloadBtn');
    const btnText = document.getElementById('btnText');
    const feedbackBox = document.getElementById('downloadFeedback');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const statusTitle = document.getElementById('statusTitle');
    const statusSpinner = document.getElementById('statusSpinner');
    const statusCheck = document.getElementById('statusCheck');
    const downloadCompleteMsg = document.getElementById('downloadCompleteMsg');

    if (!feedbackBox || !progressBar || !progressPercent) return;

    // Estado inicial de la animación
    feedbackBox.classList.remove('hidden');
    downloadCompleteMsg.classList.add('hidden');
    statusSpinner.classList.remove('hidden');
    statusCheck.classList.add('hidden');
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    statusTitle.textContent = 'Preparando descarga oficial...';

    if (btn) {
        btn.disabled = true;
        btn.classList.add('btn-disabled');
    }
    if (btnText) {
        btnText.textContent = 'Iniciando descarga...';
    }

    let progreso = 0;
    const intervalo = setInterval(() => {
        const salto = Math.floor(Math.random() * 20) + 15;
        progreso = Math.min(progreso + salto, 100);

        progressBar.style.width = progreso + '%';
        progressPercent.textContent = progreso + '%';

        if (progreso >= 50 && progreso < 100) {
            statusTitle.textContent = 'Conectando con servidor seguro...';
        }

        if (progreso >= 100) {
            clearInterval(intervalo);
            finalizarDescarga();
        }
    }, 200);

    function finalizarDescarga() {
        statusSpinner.classList.add('hidden');
        statusCheck.classList.remove('hidden');
        statusTitle.textContent = '¡Instalador listo!';
        downloadCompleteMsg.classList.remove('hidden');

        if (btn) {
            btn.disabled = false;
            btn.classList.remove('btn-disabled');
        }
        if (btnText) {
            const ver = CONFIG.CURRENT_VERSION ? ` (v${CONFIG.CURRENT_VERSION})` : '';
            btnText.textContent = `Descargar nuevamente${ver}`;
        }
        descargaEnCurso = false;

        // Disparo de descarga directa en el navegador del archivo real encontrado
        try {
            const link = document.createElement('a');
            link.href = CONFIG.INSTALLER_URL;
            if (CONFIG.CURRENT_FILENAME) {
                link.setAttribute('download', CONFIG.CURRENT_FILENAME);
            } else {
                link.setAttribute('download', '');
            }
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.warn('Error al disparar la descarga directa:', e);
        }
    }
}

/**
 * Manejo inteligente de los enlaces a Guías y Recursos
 * @param {Event} event
 * @param {'video'|'manual'} tipo
 */
function abrirRecurso(event, tipo) {
    const urlDestino = tipo === 'video' ? CONFIG.VIDEO_TUTORIAL_URL : CONFIG.MANUAL_USO_URL;

    if (!urlDestino || urlDestino === '#') {
        event.preventDefault();
        const nombreRecurso = tipo === 'video' ? 'El video tutorial' : 'El manual de uso';
        mostrarToast(`${nombreRecurso} estará disponible próximamente.`);
        return;
    }

    if (urlDestino.startsWith('http')) {
        event.preventDefault();
        window.open(urlDestino, '_blank', 'noopener,noreferrer');
    }
}

/**
 * Muestra una notificación emergente (Toast)
 * @param {string} mensaje
 */
function mostrarToast(mensaje) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = mensaje;
    toast.classList.add('toast-visible');

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
        toast.classList.remove('toast-visible');
    }, 3200);
}

/**
 * Alterna entre números de WhatsApp equitativamente con persistencia en localStorage
 * @param {Event} event
 */
function abrirSoporteWhatsApp(event) {
    event.preventDefault();
    try {
        const ultimoIndice = parseInt(localStorage.getItem('eu_wsp_index') || '0', 10);
        const indiceActual = isNaN(ultimoIndice) ? 0 : ultimoIndice % CONFIG.WHATSAPP_NUMBERS.length;
        const numeroElegido = CONFIG.WHATSAPP_NUMBERS[indiceActual];

        // Guardar siguiente índice
        localStorage.setItem('eu_wsp_index', ((indiceActual + 1) % CONFIG.WHATSAPP_NUMBERS.length).toString());

        const url = `https://wa.me/${numeroElegido}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
        // Fallback en caso de que localStorage esté deshabilitado en navegación privada
        const numeroFallback = CONFIG.WHATSAPP_NUMBERS[Math.floor(Math.random() * CONFIG.WHATSAPP_NUMBERS.length)];
        const url = `https://wa.me/${numeroFallback}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
