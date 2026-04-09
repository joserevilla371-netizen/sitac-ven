// CONFIGURACIÓN DE FIREBASE (Puente a la Nube)
const firebaseConfig = { 
    apiKey: "AIzaSyCb6lLwjUlRVRPq8ZGoh6Un6c_RBAsXEDE", 
    databaseURL:  "https://sitac-ven-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();


function sendToCloud(latlng, config) {
    db.ref('mision_activa/puntos').push({
        lat: latlng.lat,
        lng: latlng.lng,
        info: config
    });
}




const map = L.map('map', { zoomControl: false }).setView([10.4806, -66.8983], 7);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let userRole = "usuario"; 
let currentConfig = { faction: '', component: '', asset: '', symbol: '' };
const assetsAliados = ["Tropas", "Tanques", "Aviones", "Barcos", "Drones", "Unidad Médica"];
const assetsEnemigos = ["Tropas", "Tanques", "Terrorista", "Enfrentamiento"];
const symbols = { "Tropas": "👥", "Tanques": "🚜", "Aviones": "✈️", "Barcos": "🚢", "Drones": "🛸", "Terrorista": "☣️", "Enfrentamiento": "💥" };

// GESTIÓN DE ACCESO
function handleRegistro() {
    const cedula = document.getElementById('reg-cedula').value;
    const datos = {
        nombre: document.getElementById('reg-nombre').value,
        grado: document.getElementById('reg-grado').value,
        pass: document.getElementById('reg-pass').value,
        role: "usuario"
    };
    localStorage.setItem('USER_' + cedula, JSON.stringify(datos));
    alert("REGISTRO EXITOSO");
    closeModals();
}

function handleLogin() {
    const cedula = document.getElementById('log-cedula').value;
    const pass = document.getElementById('log-pass').value;
    const grado = document.getElementById('log-grado').value;

    // Login Maestro para Admin
    if(cedula === "0000" && pass === "admin123") {
        iniciarApp("ADMINISTRADOR SUPREMO", "admin");
        return;
    }

    const savedUser = JSON.parse(localStorage.getItem('USER_' + cedula));
    if(savedUser && savedUser.pass === pass) {
        iniciarApp(grado, "usuario");
    } else {
        alert("DATOS INCORRECTOS");
    }
}

function iniciarApp(rango, rol) {
    userRole = rol;
    document.getElementById('landing-page').style.display = "none";
    document.getElementById('navbar').style.display = "none";
    document.getElementById('app-container').style.display = "flex";
    document.getElementById('user-display-rank').innerText = rango;

    if(rol === "admin") {
        document.getElementById('admin-panel').style.display = "block";
    }

    map.invalidateSize();
    addLog("SISTEMA SINCRONIZADO. MODO: " + rol.toUpperCase());
    
    // Aquí el usuario cargaría los puntos de Firebase automáticamente
    // listenToCloud(); 
}

// LÓGICA DE ACTIVOS (ADMIN)
function showAssets(comp) {
    currentConfig.faction = 'ALIADO'; currentConfig.component = comp;
    const container = document.getElementById('asset-selector-aliado');
    container.innerHTML = '';
    assetsAliados.forEach(a => {
        let btn = document.createElement('button');
        btn.className = 'btn-asset-select'; btn.innerText = a;
        btn.onclick = () => { currentConfig.asset = a; currentConfig.symbol = symbols[a] || "📍"; closeModals(); };
        container.appendChild(btn);
    });
}

(function initEnemigos() {
    const container = document.getElementById('asset-selector-enemigo');
    assetsEnemigos.forEach(a => {
        let btn = document.createElement('button');
        btn.className = 'btn-asset-select'; btn.innerText = a;
        btn.onclick = () => { 
            currentConfig.faction = 'ENEMIGO'; currentConfig.component = 'HOSTIL';
            currentConfig.asset = a; currentConfig.symbol = symbols[a] || "📍"; closeModals();
        };
        container.appendChild(btn);
    });
})();

map.on('click', function(e) {
    if (userRole !== "admin" || !currentConfig.asset) return;
    createMarker(e.latlng, currentConfig);
    // Enviar a Firebase: db.ref('mision').push({latlng: e.latlng, config: currentConfig});
});

function createMarker(latlng, config) {
    const color = config.faction === 'ALIADO' ? '#4ade80' : '#ef4444';
    const icon = L.divIcon({
        html: `<div style="background:${color}; color:white; width:30px; height:30px; border-radius:3px; display:flex; align-items:center; justify-content:center; border:1px solid #fff;">${config.symbol}</div>`,
        className: 'custom-icon', iconSize: [30, 30]
    });
    const marker = L.marker(latlng, { icon: icon }).addTo(map);
    marker.bindPopup(`<b>${config.faction}</b><br>${config.asset}<br>LAT: ${latlng.lat.toFixed(4)}`);
    addLog(`DESPLEGADO: ${config.asset}`);
}

// FUNCIONES GENERALES
function openModal(id) { document.getElementById(id).style.display = "block"; }
function closeModals() { document.querySelectorAll('.modal').forEach(m => m.style.display = "none"); }
function addLog(msg) {
    const b = document.getElementById('console-body');
    b.innerHTML += `<div>> ${new Date().toLocaleTimeString()} | ${msg}</div>`;
    b.scrollTop = b.scrollHeight;
}

async function exportTacticalPDF() {
    const canvas = await html2canvas(document.getElementById('map'));
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.text("SITAC VEN - REPORTE DE INTELIGENCIA", 10, 10);
    pdf.addImage(imgData, 'PNG', 10, 20, 260, 150);
    pdf.save("REPORTE_SITAC.pdf");
}