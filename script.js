const samplePatients = [
    { id: 1, name: "Juan Pérez López", age: 45, gender: "M", registerTime: "08:30", triage: "2", service: "Traumatología", diagnosis: "Fractura de tibia", destination: "Imagen", cubicle: "1", stayTime: "02:15", status: "activo", registerDateTime: new Date(new Date().setHours(8,30,0,0)), dischargeDateTime: null,
      trazabilidad: [{time:"08:30",desc:"Registro en urgencias"},{time:"08:45",desc:"Evaluación de triage - Nivel 2"},{time:"09:00",desc:"Asignado a cubículo 1"},{time:"09:15",desc:"Evaluación médica inicial"},{time:"09:30",desc:"Enviado a Imagen para radiografía"}] },
    { id: 2, name: "María García Ruiz", age: 32, gender: "F", registerTime: "09:15", triage: "3", service: "Medicina General", diagnosis: "Infección respiratoria", destination: "Observación", cubicle: "2", stayTime: "01:45", status: "activo", registerDateTime: new Date(new Date().setHours(9,15,0,0)), dischargeDateTime: null,
      trazabilidad: [{time:"09:15",desc:"Registro en urgencias"},{time:"09:25",desc:"Evaluación de triage - Nivel 3"},{time:"09:40",desc:"Asignado a cubículo 2"},{time:"10:00",desc:"Evaluación médica"}] },
    { id: 3, name: "Carlos Rodríguez Méndez", age: 67, gender: "M", registerTime: "10:05", triage: "1", service: "Traumatología", diagnosis: "Traumatismo craneoencefálico", destination: "Hospitalización", cubicle: "Sala de Choque", stayTime: "03:30", status: "alta", registerDateTime: new Date(new Date().setHours(10,5,0,0)), dischargeDateTime: new Date(new Date().setHours(13,35,0,0)),
      trazabilidad: [{time:"10:05",desc:"Registro en urgencias - Paciente crítico"},{time:"10:07",desc:"Evaluación de triage - Nivel 1"},{time:"10:10",desc:"Trasladado a Sala de Choque"},{time:"10:20",desc:"Equipo de resucitación activado"},{time:"10:45",desc:"Estabilización inicial completada"},{time:"11:30",desc:"Preparado para hospitalización"},{time:"13:35",desc:"Alta médica - Trasladado a hospitalización"}] }
];

let patients = [...samplePatients];
let currentPage = 1;
const patientsPerPage = 10;
let editingPatientId = null;
let timerInterval;

const patientsTableBody = document.getElementById('patientsTableBody');
const statsTableBody = document.getElementById('statsTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const triageFilter = document.getElementById('triageFilter');
const serviceFilter = document.getElementById('serviceFilter');
const addPatientBtn = document.getElementById('addPatientBtn');
const patientModal = document.getElementById('patientModal');
const trazabilidadModal = document.getElementById('trazabilidadModal');
const modalTitle = document.getElementById('modalTitle');
const trazabilidadTitle = document.getElementById('trazabilidadTitle');
const trazabilidadContent = document.getElementById('trazabilidadContent');
const patientForm = document.getElementById('patientForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeModalBtn = document.querySelectorAll('.close-modal');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const birthDateInput = document.getElementById('birthDate');
const ageInput = document.getElementById('age');
const registerTimeInput = document.getElementById('registerTime');
const destinationSelect = document.getElementById('destination');

const navRegistro = document.getElementById('nav-registro');
const navEstadisticas = document.getElementById('nav-estadisticas');
const registroSection = document.getElementById('registro-section');
const estadisticasSection = document.getElementById('estadisticas-section');
const totalPacientes = document.getElementById('totalPacientes');
const pacientesActivos = document.getElementById('pacientesActivos');
const pacientesAlta = document.getElementById('pacientesAlta');
const tiempoPromedio = document.getElementById('tiempoPromedio');
const exportStatsBtn = document.getElementById('exportStatsBtn');

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function formatTimeDiff(start, end = new Date()) {
    const diff = end - start;
    const h = Math.floor(diff / 3600000).toString().padStart(2,'0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2,'0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2,'0');
    return `${h}:${m}:${s}`;
}

function getCurrentTime() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function getDestinationDescription(dest) {
    const desc = {
        "Imagen": "Enviado a Imagen para estudios radiológicos",
        "Laboratorio": "Enviado a Laboratorio para análisis",
        "Observación": "Trasladado a área de Observación",
        "Alta": "Alta médica - Paciente dado de alta",
        "Hospitalización": "Trasladado a Hospitalización",
        "Solicitud de Interconsulta": "Solicitud de interconsulta realizada",
        "Respuesta de Interconsulta": "Respuesta de interconsulta recibida",
        "Entrega de Resultados de Laboratorio": "Resultados de laboratorio entregados",
        "Entrega de Resultado de Imagen": "Resultado de imagen entregado",
        "Entrega de Expediente a Admisión": "Expediente entregado a Admisión",
        "Entrega de Papelería de Admisión": "Papelería de admisión entregada"
    };
    return desc[dest] || `Destino cambiado a: ${dest}`;
}

function renderPatientsTable() {
    patientsTableBody.innerHTML = '';
    let filtered = patients.slice();
    if (statusFilter.value) filtered = filtered.filter(p => p.status === statusFilter.value);
    if (triageFilter.value) filtered = filtered.filter(p => p.triage === triageFilter.value);
    if (serviceFilter.value) filtered = filtered.filter(p => p.service === serviceFilter.value);

    const start = (currentPage-1)*patientsPerPage;
    const end = start + patientsPerPage;
    const pagePatients = filtered.slice(start, end);

    if (pagePatients.length === 0) {
        patientsTableBody.innerHTML = '<tr><td colspan="12" style="text-align:center;">No se encontraron pacientes</td></tr>';
        return;
    }

    pagePatients.forEach(p => {
        const stay = p.status === 'activo' ? formatTimeDiff(p.registerDateTime) : p.stayTime;
        const estado = p.status === 'activo' ? '<span class="status-pending">Activo</span>' : '<span class="status-discharged">Alta</span>';
        const rowClass = p.status === 'alta' ? 'patient-discharged' : `triage-${p.triage}`;
        const timerClass = p.status === 'activo' ? 'timer-active' : '';

        const tr = document.createElement('tr');
        tr.className = rowClass;
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.age} años</td>
            <td>${p.gender === 'M' ? 'Masculino' : 'Femenino'}</td>
            <td>${p.registerTime}</td>
            <td>Nivel ${p.triage}</td>
            <td>${p.service}</td>
            <td>${p.diagnosis}</td>
            <td>${p.destination}</td>
            <td>${p.cubicle}</td>
            <td class="${timerClass}">${stay}</td>
            <td>${estado}</td>
            <td>
                <button class="edit-btn" data-id="${p.id}">Editar</button>
                <button class="delete-btn" data-id="${p.id}">Eliminar</button>
                <button class="trazabilidad-btn" data-id="${p.id}">Trazabilidad</button>
                ${p.status === 'activo' ? `<button class="discharge-btn" data-id="${p.id}">Dar Alta</button>` : ''}
            </td>`;
        patientsTableBody.appendChild(tr);
    });

    const totalPages = Math.ceil(filtered.length / patientsPerPage);
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    document.querySelectorAll('.edit-btn').forEach(b => b.onclick = e => { editingPatientId = +e.target.dataset.id; openEditModal(); });
    document.querySelectorAll('.delete-btn').forEach(b => b.onclick = e => handleDelete(+e.target.dataset.id));
    document.querySelectorAll('.discharge-btn').forEach(b => b.onclick = e => handleDischarge(+e.target.dataset.id));
    document.querySelectorAll('.trazabilidad-btn').forEach(b => b.onclick = e => showTrazabilidad(+e.target.dataset.id));
}

function openEditModal() {
    const p = patients.find(x => x.id === editingPatientId);
    if (!p) return;
    modalTitle.textContent = 'Editar Paciente';
    document.getElementById('patientName').value = p.name;
    const birth = new Date(); birth.setFullYear(birth.getFullYear() - p.age);
    document.getElementById('birthDate').value = birth.toISOString().split('T')[0];
    ageInput.value = p.age;
    document.getElementById('gender').value = p.gender;
    document.getElementById('registerTime').value = p.registerTime;
    document.getElementById('triageLevel').value = p.triage;
    document.getElementById('service').value = p.service;
    document.getElementById('diagnosis').value = p.diagnosis;
    document.getElementById('destination').value = p.destination;
    document.getElementById('cubicle').value = p.cubicle;
    patientModal.style.display = 'flex';
}

function handleDelete(id) {
    if (confirm('¿Eliminar este registro?')) {
        patients = patients.filter(p => p.id !== id);
        renderPatientsTable();
        renderStatistics();
    }
}

function handleDischarge(id) {
    const p = patients.find(x => x.id === id);
    if (p && p.status === 'activo') {
        p.status = 'alta';
        p.dischargeDateTime = new Date();
        p.stayTime = formatTimeDiff(p.registerDateTime, p.dischargeDateTime);
        if (!p.trazabilidad) p.trazabilidad = [];
        p.trazabilidad.push({ time: getCurrentTime(), desc: "Alta médica - Paciente dado de alta" });
        renderPatientsTable();
        renderStatistics();
        alert(`Paciente ${p.name} dado de alta`);
    }
}

function showTrazabilidad(id) {
    const p = patients.find(x => x.id === id);
    trazabilidadTitle.textContent = `Trazabilidad - ${p.name}`;
    trazabilidadContent.innerHTML = p.trazabilidad && p.trazabilidad.length 
        ? p.trazabilidad.map(t => `<div class="trazabilidad-item"><div class="trazabilidad-time">${t.time}</div><div class="trazabilidad-desc">${t.desc}</div></div>`).join('')
        : '<p>No hay trazabilidad disponible</p>';
    trazabilidadModal.style.display = 'flex';
}

function renderStatistics() {
    totalPacientes.textContent = patients.length;
    pacientesActivos.textContent = patients.filter(p => p.status === 'activo').length;
    pacientesAlta.textContent = patients.filter(p => p.status === 'alta').length;

    const altas = patients.filter(p => p.status === 'alta' && p.dischargeDateTime);
    if (altas.length) {
        const avg = altas.reduce((a, p) => a + (p.dischargeDateTime - p.registerDateTime), 0) / altas.length;
        const h = Math.floor(avg / 3600000).toString().padStart(2,'0');
        const m = Math.floor((avg % 3600000) / 60000).toString().padStart(2,'0');
        tiempoPromedio.textContent = `${h}:${m}`;
    }

    statsTableBody.innerHTML = '';
    altas.forEach(p => {
        const tr = document.createElement('tr');
        const altaHora = p.dischargeDateTime.toTimeString().slice(0,5);
        tr.innerHTML = `<td>${p.name}</td><td>${p.age}</td><td>Nivel ${p.triage}</td><td>${p.service}</td><td>${p.diagnosis}</td><td>${p.registerTime}</td><td>${altaHora}</td><td>${formatTimeDiff(p.registerDateTime, p.dischargeDateTime)}</td><td>${p.destination}</td>`;
        statsTableBody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    birthDateInput.max = new Date().toISOString().split('T')[0];
    birthDateInput.addEventListener('change', () => ageInput.value = calculateAge(birthDateInput.value));
    registerTimeInput.value = new Date().toTimeString().slice(0,5);

    addPatientBtn.onclick = () => { editingPatientId = null; modalTitle.textContent = 'Nuevo Paciente'; patientForm.reset(); registerTimeInput.value = getCurrentTime(); patientModal.style.display = 'flex'; };
    patientForm.onsubmit = e => {
        e.preventDefault();
        const data = {
            name: document.getElementById('patientName').value.trim(),
            age: birthDateInput.value ? calculateAge(birthDateInput.value) : +ageInput.value,
            gender: document.getElementById('gender').value,
            registerTime: registerTimeInput.value,
            triage: document.getElementById('triageLevel').value,
            service: document.getElementById('service').value,
            diagnosis: document.getElementById('diagnosis').value,
            destination: destinationSelect.value,
            cubicle: document.getElementById('cubicle').value,
            registerDateTime: new Date(),
            status: 'activo',
            trazabilidad: [{ time: registerTimeInput.value, desc: "Registro en urgencias" }]
        };
        const [h,m] = data.registerTime.split(':');
        data.registerDateTime.setHours(+h, +m, 0, 0);

        if (editingPatientId) {
            const idx = patients.findIndex(p => p.id === editingPatientId);
            if (data.destination && data.destination !== patients[idx].destination) {
                patients[idx].trazabilidad.push({ time: getCurrentTime(), desc: getDestinationDescription(data.destination) });
            }
            patients[idx] = { ...patients[idx], ...data };
        } else {
            data.id = patients.length ? Math.max(...patients.map(p=>p.id)) + 1 : 1;
            if (data.destination) data.trazabilidad.push({ time: getCurrentTime(), desc: getDestinationDescription(data.destination) });
            patients.push(data);
        }
        patientModal.style.display = 'none';
        renderPatientsTable();
    };

    cancelBtn.onclick = () => patientModal.style.display = 'none';
    closeModalBtn.forEach(b => b.onclick = () => { patientModal.style.display = 'none'; trazabilidadModal.style.display = 'none'; });
    window.onclick = e => { if (e.target === patientModal || e.target === trazabilidadModal) e.target.style.display = 'none'; };

    document.getElementById('searchBtn').onclick = () => { renderPatientsTable(); };
    statusFilter.onchange = triageFilter.onchange = serviceFilter.onchange = () => { currentPage = 1; renderPatientsTable(); };
    prevPageBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderPatientsTable(); } };
    nextPageBtn.onclick = () => { currentPage++; renderPatientsTable(); };

    navRegistro.onclick = e => { e.preventDefault(); registroSection.style.display = 'block'; estadisticasSection.style.display = 'none'; navRegistro.classList.add('active'); navEstadisticas.classList.remove('active'); renderPatientsTable(); };
    navEstadisticas.onclick = e => { e.preventDefault(); registroSection.style.display = 'none'; estadisticasSection.style.display = 'block'; navRegistro.classList.remove('active'); navEstadisticas.classList.add('active'); renderStatistics(); };

    exportStatsBtn.onclick = () => {
        let csv = "Paciente,Edad,Triage,Servicio,Diagnóstico,Hora Registro,Hora Alta,Tiempo Total,Destino Final\n";
        patients.filter(p => p.status === 'alta').forEach(p => {
            const alta = p.dischargeDateTime ? p.dischargeDateTime.toTimeString().slice(0,5) : '';
            csv += `"${p.name}",${p.age},"Nivel ${p.triage}","${p.service}","${p.diagnosis}","${p.registerTime}","${alta}","${formatTimeDiff(p.registerDateTime, p.dischargeDateTime)}","${p.destination}"\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'estadisticas_pacientes.csv'; a.click();
    };

    renderPatientsTable();
    timerInterval = setInterval(() => { if (registroSection.style.display !== 'none') renderPatientsTable(); }, 1000);
});