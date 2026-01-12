import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURACIÓN FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyB5AO9mkc3qs3KZT0ZsqxcEIdHrrG7jPMw",
    authDomain: "studiosync-71756.firebaseapp.com",
    projectId: "studiosync-71756",
    storageBucket: "studiosync-71756.firebasestorage.app",
    messagingSenderId: "484459543444",
    appId: "1:484459543444:web:dbdb8af70d1ca7a6fe6d81",
    measurementId: "G-B8Q67D0SVR"
};

console.log("Iniciando Firebase...");

let app, db;
const TEAM_DOC_ID = "main_team";

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase inicializado correctamente.");
} catch (error) {
    console.error("Error crítico inicializando Firebase:", error);
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('error-container').innerText = "Error cargando sistema: " + error.message;
    document.getElementById('error-container').style.display = 'block';
}


// Datos por defecto
const defaultTeam = [
    {
        id: "h1", name: "Homero", role: "Diseñador Industrial", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Homero",
        project: "Colección Sillas 2025", phase: "Bocetaje", client: "Muebles MX", deadline: "2025-12-30", pending: ["Stand Expo", "Lámpara V3"]
    },
    {
        id: "m1", name: "Maite", role: "Diseñador Ind.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maitei",
        project: "Carcasa Médica", phase: "Modelado 3D", client: "MedTech", deadline: "2026-01-15", pending: ["Empaque Eco"]
    },
    {
        id: "x1", name: "Michelle", role: "Diseñadora 3D", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michelle",
        project: "Render Campaña", phase: "Texturizado", client: "Agencia Beta", deadline: "2025-12-29", pending: ["Animación", "Recorrido"]
    }
];

let team = [];

if (db) {
    // 3. CONEXIÓN EN TIEMPO REAL
    onSnapshot(doc(db, "studiosync", TEAM_DOC_ID), (docSnap) => {
        document.getElementById('loading-message').style.display = 'none'; // Ocultar loading

        if (docSnap.exists()) {
            console.log("Datos recibidos:", docSnap.data());
            team = docSnap.data().members || [];
            if (team.length === 0) {
                console.log("Array vacío, restaurando defaults...");
                saveToCloud(defaultTeam);
            } else {
                renderApp();
            }
        } else {
            console.log("Base de datos nueva. Creando registros...");
            saveToCloud(defaultTeam);
        }
    }, (error) => {
        console.error("Error de conexión:", error);
        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('error-container').innerText = "Error de conexión: " + error.message;
        document.getElementById('error-container').style.display = 'block';
    });
}

// Función para guardar
async function saveToCloud(newData) {
    try {
        await setDoc(doc(db, "studiosync", TEAM_DOC_ID), { members: newData });
    } catch (e) {
        console.error("Error guardando: ", e);
        showToast("Error al guardar en la nube", true);
    }
}

// 4. LÓGICA DE UI
function renderApp() {
    const grid = document.getElementById('designerGrid');
    if (!grid) return;
    grid.innerHTML = '';

    team.forEach(member => {
        const diff = new Date(member.deadline) - new Date().setHours(0, 0, 0, 0);
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        let status = { color: 'alert-green', text: `${days} días`, icon: 'fa-regular fa-clock' };
        if (days < 0) status = { color: 'alert-red', text: 'ATRASADO', icon: 'fa-solid fa-triangle-exclamation' };
        else if (days === 0) status = { color: 'alert-red', text: 'HOY', icon: 'fa-solid fa-fire' };
        else if (days <= 2) status = { color: 'alert-yellow', text: 'URGENTE', icon: 'fa-solid fa-hourglass-half' };

        // Safe pending handling
        const pending = Array.isArray(member.pending) ? member.pending : [];
        const pendingHtml = pending.map(p => `
            <li class="pending-item"><span>${p}</span> <span class="tag-next">Prox</span></li>
        `).join('');

        // VACATION LOGIC (NUEVO)
        let vacationHtml = '';
        if (member.vacationStart && member.vacationEnd) {
            const start = new Date(member.vacationStart + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const end = new Date(member.vacationEnd + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            vacationHtml = `
             <div style="margin-top: 16px; padding: 10px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #93c5fd;">
                 <i class="fa-solid fa-plane"></i>
                 <span><strong>Vacaciones:</strong> ${start} al ${end}</span>
             </div>`;
        }

        const card = `
        <article class="designer-card">
            <div class="card-header-flex">
                <div class="user-info-group">
                    <img src="${member.avatar || 'https://api.dicebear.com/7.x/avataaars/svg'}" class="avatar">
                    <div class="user-text">
                        <h2>${member.name}</h2>
                        <p>${member.role}</p>
                    </div>
                </div>
                <!-- GLOBAL WINDOW FUNCTION CLICK -->
                <button class="edit-btn" onclick="window.openModal('${member.id}')">
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
            </div>

            <div class="work-box">
                <span class="section-label">Proyecto Actual</span>
                <span class="project-title">${member.project}</span>
                <div style="margin-bottom:8px;">
                    <span class="pill pill-blue">${member.phase || 'N/A'}</span>
                </div>
                <span class="client-name">${member.client}</span>

                <table class="info-table">
                    <tr>
                        <td width="40%"><span class="section-label" style="margin:0">Entrega</span></td>
                        <td><div class="alert-badge ${status.color}"><i class="${status.icon}"></i> ${status.text}</div></td>
                    </tr>
                </table>
            </div>

            <div>
                <span class="section-label">Pendientes</span>
                <ul class="pending-list">${pendingHtml || '<li class="pending-item" style="opacity:0.5">Nada pendiente</li>'}</ul>
            </div>
            
            ${vacationHtml}
        </article>
        `;
        grid.innerHTML += card;
    });
}

// 5. FUNCIONES GLOBALES EXPLICITAS
window.openModal = function (id) {
    console.log("Abriendo modal para", id);
    const member = team.find(m => m.id === id);
    if (!member) return;

    document.getElementById('editId').value = member.id;
    document.getElementById('editProject').value = member.project;
    document.getElementById('editPhase').value = member.phase || '';
    document.getElementById('editClient').value = member.client;
    document.getElementById('editDate').value = member.deadline;

    // Set Vacation inputs
    document.getElementById('editVacationStart').value = member.vacationStart || '';
    document.getElementById('editVacationEnd').value = member.vacationEnd || '';

    document.getElementById('editPending').value = (member.pending || []).join(', ');
    document.getElementById('editPhoto').value = "";

    const modal = document.getElementById('editModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

window.closeModal = function () {
    const modal = document.getElementById('editModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

window.handleSave = async function (e) {
    e.preventDefault();
    showToast("Conectando con la nube...", false);

    const id = document.getElementById('editId').value;
    const idx = team.findIndex(m => m.id === id);

    if (idx > -1) {
        const newTeam = [...team];
        const member = { ...newTeam[idx] };

        member.project = document.getElementById('editProject').value;
        member.phase = document.getElementById('editPhase').value;
        member.client = document.getElementById('editClient').value;
        member.deadline = document.getElementById('editDate').value;

        // Save Vacation logic
        member.vacationStart = document.getElementById('editVacationStart').value;
        member.vacationEnd = document.getElementById('editVacationEnd').value;

        // Fix split bug
        const pendingStr = document.getElementById('editPending').value;
        member.pending = pendingStr ? pendingStr.split(',').map(s => s.trim()).filter(Boolean) : [];

        const fileInput = document.getElementById('editPhoto');
        if (fileInput.files && fileInput.files[0]) {
            try {
                // REDIMENSIONAR IMAGEN (NUEVO)
                const resizedBase64 = await resizeImage(fileInput.files[0], 250);
                member.avatar = resizedBase64;
            } catch (err) {
                console.error("Error foto", err);
                showToast("Error: Imagen muy pesada", true);
                return;
            }
        }

        newTeam[idx] = member;
        await saveToCloud(newTeam);

        closeModal();
        showToast('¡Guardado!');
    }
}

// NUEVA FUNCIÓN DE REDIMENSIONAMIENTO
const resizeImage = (file, maxWidth) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Comprimir a JPEG calidad 80%
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
});

function showToast(msg, isError = false) {
    const area = document.getElementById('notification-area');
    const note = document.createElement('div');
    note.className = 'toast';
    if (isError) note.style.background = '#ef4444';
    note.innerText = msg;
    area.appendChild(note);
    setTimeout(() => note.remove(), 3000);
}
