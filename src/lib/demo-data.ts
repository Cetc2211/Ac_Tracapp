/**
 * ============================================
 * DATOS DE DEMOSTRACIÓN - ACADEMIC TRACKER
 * ============================================
 * 
 * Este archivo contiene datos de ejemplo para probar la aplicación
 * sin necesidad de conexión a Firebase.
 * 
 * Para activar el modo demo, establece:
 * NEXT_PUBLIC_DEMO_MODE=true en tu archivo .env.local
 */

import type { 
  Group, 
  Student, 
  OfficialGroup, 
  EvaluationCriteria, 
  StudentObservation,
  Announcement,
  StudentJustification,
  AppSettings,
  PartialData,
  AllPartialsData,
  SpecialNote
} from './definitions';

// ============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================
export const demoSettings: AppSettings = {
  institutionName: "Instituto Educativo Demo",
  logo: "",
  theme: "theme-mint",
  apiKey: "",
  signature: "",
  facilitatorName: "Prof. María García López",
  scheduleImageUrl: "",
  teacherPhoto: "",
  whatsappContactNumber: "+52 123 456 7890",
  aiModel: "gemini-1.5-flash",
  prefectName: "Lic. Juan Pérez Martínez",
  prefectTitle: "Prefecto General",
};

// ============================================
// GRUPOS OFICIALES (Institucionales)
// ============================================
export const demoOfficialGroups: OfficialGroup[] = [
  {
    id: "og-101",
    name: "1° Semestre - Grupo A",
    createdAt: "2025-01-15T10:00:00Z",
    tutorEmail: "tutor1@demo.edu"
  },
  {
    id: "og-102",
    name: "2° Semestre - Grupo A",
    createdAt: "2025-01-15T10:00:00Z",
    tutorEmail: "tutor2@demo.edu"
  },
  {
    id: "og-103",
    name: "3° Semestre - Grupo A",
    createdAt: "2025-01-15T10:00:00Z",
    tutorEmail: "tutor3@demo.edu"
  },
  {
    id: "og-104",
    name: "4° Semestre - Grupo A",
    createdAt: "2025-01-15T10:00:00Z",
    tutorEmail: "tutor4@demo.edu"
  },
  {
    id: "og-105",
    name: "5° Semestre - Grupo A",
    createdAt: "2025-01-15T10:00:00Z",
    tutorEmail: "tutor5@demo.edu"
  },
  {
    id: "og-106",
    name: "6° Semestre - Grupo A",
    createdAt: "2025-01-15T10:00:00Z",
    tutorEmail: "tutor6@demo.edu"
  }
];

// ============================================
// ESTUDIANTES DE DEMOSTRACIÓN
// ============================================
export const demoStudents: Student[] = [
  // 1° Semestre
  { id: "s001", name: "Ana María González Pérez", photo: "", tutorName: "Sra. Pérez", tutorPhone: "555-0101" },
  { id: "s002", name: "Carlos Hernández López", photo: "", tutorName: "Sr. Hernández", tutorPhone: "555-0102" },
  { id: "s003", name: "Beatriz Martínez Ruiz", photo: "", tutorName: "Sra. Martínez", tutorPhone: "555-0103" },
  { id: "s004", name: "Diego Ramírez Cruz", photo: "", tutorName: "Sr. Ramírez", tutorPhone: "555-0104" },
  { id: "s005", name: "Elena Sánchez Torres", photo: "", tutorName: "Sra. Sánchez", tutorPhone: "555-0105" },
  
  // 2° Semestre
  { id: "s006", name: "Fernando Díaz Morales", photo: "", tutorName: "Sr. Díaz", tutorPhone: "555-0106" },
  { id: "s007", name: "Gabriela Flores Jiménez", photo: "", tutorName: "Sra. Flores", tutorPhone: "555-0107" },
  { id: "s008", name: "Hugo Mendoza Vargas", photo: "", tutorName: "Sr. Mendoza", tutorPhone: "555-0108" },
  { id: "s009", name: "Isabel Reyes Castro", photo: "", tutorName: "Sra. Reyes", tutorPhone: "555-0109" },
  { id: "s010", name: "Jorge Ortega Medina", photo: "", tutorName: "Sr. Ortega", tutorPhone: "555-0110" },
  
  // 3° Semestre
  { id: "s011", name: "Karla Núñez Ríos", photo: "", tutorName: "Sra. Núñez", tutorPhone: "555-0111" },
  { id: "s012", name: "Luis Aguilar Vera", photo: "", tutorName: "Sr. Aguilar", tutorPhone: "555-0112" },
  { id: "s013", name: "María José Luna Paredes", photo: "", tutorName: "Sra. Luna", tutorPhone: "555-0113" },
  { id: "s014", name: "Nicolás Soto Guerrero", photo: "", tutorName: "Sr. Soto", tutorPhone: "555-0114" },
  { id: "s015", name: "Olivia Domínguez León", photo: "", tutorName: "Sra. Domínguez", tutorPhone: "555-0115" },
  
  // 4° Semestre
  { id: "s016", name: "Pablo Ríos Fuentes", photo: "", tutorName: "Sr. Ríos", tutorPhone: "555-0116" },
  { id: "s017", name: "Quetzali Vargas Mena", photo: "", tutorName: "Sra. Vargas", tutorPhone: "555-0117" },
  { id: "s018", name: "Roberto Contreras Paz", photo: "", tutorName: "Sr. Contreras", tutorPhone: "555-0118" },
  { id: "s019", name: "Sofía Delgado Naranjo", photo: "", tutorName: "Sra. Delgado", tutorPhone: "555-0119" },
  { id: "s020", name: "Tomás Herrera Silva", photo: "", tutorName: "Sr. Herrera", tutorPhone: "555-0120" },
  
  // 5° Semestre
  { id: "s021", name: "Ursula Maldonado Vega", photo: "", tutorName: "Sra. Maldonado", tutorPhone: "555-0121" },
  { id: "s022", name: "Víctor Alarcón Pino", photo: "", tutorName: "Sr. Alarcón", tutorPhone: "555-0122" },
  { id: "s023", name: "Wendy Carrillo Luna", photo: "", tutorName: "Sra. Carrillo", tutorPhone: "555-0123" },
  { id: "s024", name: "Ximena Avila Solís", photo: "", tutorName: "Sra. Avila", tutorPhone: "555-0124" },
  { id: "s025", name: "Yahir Zapata Rangel", photo: "", tutorName: "Sr. Zapata", tutorPhone: "555-0125" },
  
  // 6° Semestre
  { id: "s026", name: "Zaira Molina Ocampo", photo: "", tutorName: "Sra. Molina", tutorPhone: "555-0126" },
  { id: "s027", name: "Andrés Espinosa Blanco", photo: "", tutorName: "Sr. Espinosa", tutorPhone: "555-0127" },
  { id: "s028", name: "Brenda Cervantes Lira", photo: "", tutorName: "Sra. Cervantes", tutorPhone: "555-0128" },
  { id: "s029", name: "César Pacheco Sosa", photo: "", tutorName: "Sr. Pacheco", tutorPhone: "555-0129" },
  { id: "s030", name: "Diana Quintero Enríquez", photo: "", tutorName: "Sra. Quintero", tutorPhone: "555-0130" }
];

// ============================================
// CRITERIOS DE EVALUACIÓN (Ejemplo estándar)
// ============================================
export const defaultCriteria: EvaluationCriteria[] = [
  { id: "c1", name: "Exámenes", weight: 30, expectedValue: 10, isActive: true },
  { id: "c2", name: "Tareas", weight: 20, expectedValue: 10, isActive: true },
  { id: "c3", name: "Proyectos", weight: 25, expectedValue: 10, isActive: true },
  { id: "c4", name: "Participación", weight: 15, expectedValue: 10, isActive: true },
  { id: "c5", name: "Asistencia", weight: 10, expectedValue: 10, isActive: true, isAutomated: true }
];

// ============================================
// GRUPOS DE MATERIAS (Docentes)
// ============================================
export const demoGroups: Group[] = [
  {
    id: "g001",
    officialGroupId: "og-101",
    subject: "Matemáticas I",
    groupName: "1° Semestre - Grupo A - Matemáticas I",
    semester: "1",
    students: demoStudents.filter(s => ["s001", "s002", "s003", "s004", "s005"].includes(s.id)),
    criteria: defaultCriteria,
    facilitator: "Prof. María García López",
    status: "active"
  },
  {
    id: "g002",
    officialGroupId: "og-102",
    subject: "Matemáticas II",
    groupName: "2° Semestre - Grupo A - Matemáticas II",
    semester: "2",
    students: demoStudents.filter(s => ["s006", "s007", "s008", "s009", "s010"].includes(s.id)),
    criteria: defaultCriteria,
    facilitator: "Prof. María García López",
    status: "active"
  },
  {
    id: "g003",
    officialGroupId: "og-103",
    subject: "Estadística",
    groupName: "3° Semestre - Grupo A - Estadística",
    semester: "3",
    students: demoStudents.filter(s => ["s011", "s012", "s013", "s014", "s015"].includes(s.id)),
    criteria: defaultCriteria,
    facilitator: "Prof. María García López",
    status: "active"
  },
  {
    id: "g004",
    officialGroupId: "og-104",
    subject: "Cálculo Diferencial",
    groupName: "4° Semestre - Grupo A - Cálculo Diferencial",
    semester: "4",
    students: demoStudents.filter(s => ["s016", "s017", "s018", "s019", "s020"].includes(s.id)),
    criteria: defaultCriteria,
    facilitator: "Prof. María García López",
    status: "active"
  },
  {
    id: "g005",
    officialGroupId: "og-105",
    subject: "Cálculo Integral",
    groupName: "5° Semestre - Grupo A - Cálculo Integral",
    semester: "5",
    students: demoStudents.filter(s => ["s021", "s022", "s023", "s024", "s025"].includes(s.id)),
    criteria: defaultCriteria,
    facilitator: "Prof. María García López",
    status: "active"
  },
  {
    id: "g006",
    officialGroupId: "og-106",
    subject: "Matemáticas Avanzadas",
    groupName: "6° Semestre - Grupo A - Matemáticas Avanzadas",
    semester: "6",
    students: demoStudents.filter(s => ["s026", "s027", "s028", "s029", "s030"].includes(s.id)),
    criteria: defaultCriteria,
    facilitator: "Prof. María García López",
    status: "active"
  }
];

// ============================================
// DATOS DE PARCIALES (Calificaciones, Asistencia, etc.)
// ============================================
export const demoPartialsData: AllPartialsData = {
  "g001": {
    "p1": {
      grades: {
        "s001": { "c1": { delivered: 9 }, "c2": { delivered: 8 }, "c3": { delivered: 9.5 }, "c4": { delivered: 10 }, "c5": { delivered: 10 } },
        "s002": { "c1": { delivered: 7 }, "c2": { delivered: 6 }, "c3": { delivered: 8 }, "c4": { delivered: 7 }, "c5": { delivered: 9 } },
        "s003": { "c1": { delivered: 10 }, "c2": { delivered: 10 }, "c3": { delivered: 10 }, "c4": { delivered: 10 }, "c5": { delivered: 10 } },
        "s004": { "c1": { delivered: 6 }, "c2": { delivered: 5 }, "c3": { delivered: 7 }, "c4": { delivered: 6 }, "c5": { delivered: 8 } },
        "s005": { "c1": { delivered: 8.5 }, "c2": { delivered: 9 }, "c3": { delivered: 8 }, "c4": { delivered: 9 }, "c5": { delivered: 10 } }
      },
      attendance: {
        "2025-02-03": { "s001": true, "s002": true, "s003": true, "s004": false, "s005": true },
        "2025-02-04": { "s001": true, "s002": true, "s003": true, "s004": true, "s005": true },
        "2025-02-05": { "s001": true, "s002": false, "s003": true, "s004": true, "s005": true },
        "2025-02-06": { "s001": true, "s002": true, "s003": true, "s004": true, "s005": true },
        "2025-02-07": { "s001": true, "s002": true, "s003": true, "s004": false, "s005": true }
      },
      participations: {
        "2025-02-03": { "s001": true, "s002": false, "s003": true, "s004": false, "s005": true },
        "2025-02-05": { "s001": false, "s002": true, "s003": true, "s004": false, "s005": true }
      },
      activities: [
        { id: "a1", name: "Tarea 1: Ecuaciones Lineales", dueDate: "2025-02-10", programmedDate: "2025-02-03" },
        { id: "a2", name: "Proyecto 1: Resolución de Problemas", dueDate: "2025-02-20", programmedDate: "2025-02-05" },
        { id: "a3", name: "Examen Parcial 1", dueDate: "2025-02-28", programmedDate: "2025-02-28" }
      ],
      activityRecords: {
        "s001": { "a1": true, "a2": true, "a3": true },
        "s002": { "a1": true, "a2": false, "a3": true },
        "s003": { "a1": true, "a2": true, "a3": true },
        "s004": { "a1": false, "a2": false, "a3": false },
        "s005": { "a1": true, "a2": true, "a3": true }
      },
      recoveryGrades: {},
      meritGrades: {
        "s003": { grade: 1, applied: true, reason: "Mejor promedio del parcial" }
      },
      feedbacks: {
        "s001": "Excelente desempeño, continúa así.",
        "s002": "Necesita mejorar en la entrega de tareas.",
        "s004": "Requiere apoyo adicional en matemáticas."
      },
      groupAnalysis: "El grupo muestra buen rendimiento general. Se recomienda atención especial para el estudiante s004."
    }
  }
};

// ============================================
// OBSERVACIONES DE ESTUDIANTES
// ============================================
export const demoObservations: { [studentId: string]: StudentObservation[] } = {
  "s004": [
    {
      id: "obs001",
      studentId: "s004",
      partialId: "p1",
      date: "2025-02-15T14:30:00Z",
      type: "Problema de conducta",
      details: "El estudiante mostró falta de atención durante la clase. Se le llamó la atención en múltiples ocasiones.",
      requiresCanalization: true,
      canalizationTarget: "Tutor",
      requiresFollowUp: true,
      followUpUpdates: [
        { date: "2025-02-16T10:00:00Z", update: "Se notificó al tutor por teléfono." }
      ],
      isClosed: false
    }
  ],
  "s003": [
    {
      id: "obs002",
      studentId: "s003",
      partialId: "p1",
      date: "2025-02-10T12:00:00Z",
      type: "Mérito",
      details: "Participación destacada en el proyecto de resolución de problemas matemáticos.",
      requiresCanalization: false,
      requiresFollowUp: false,
      followUpUpdates: [],
      isClosed: true
    }
  ]
};

// ============================================
// ANUNCIOS
// ============================================
export const demoAnnouncements: Announcement[] = [
  {
    id: "ann001",
    type: "info",
    title: "Inicio de Semestre",
    message: "Bienvenidos al semestre Enero-Junio 2025. Les deseamos mucho éxito en sus estudios.",
    createdAt: "2025-01-20T08:00:00Z",
    isActive: true
  },
  {
    id: "ann002",
    type: "urgent",
    title: "Cambio de Horario",
    message: "Se informa que a partir del próximo lunes, las clases de Matemáticas se trasladan al salón B-5.",
    createdAt: "2025-02-01T10:30:00Z",
    isActive: true
  },
  {
    id: "ann003",
    type: "justification",
    title: "Justificaciones de Inasistencia",
    message: "Recuerden que las justificaciones de inasistencia deben tramitarse dentro de los 3 días hábiles siguientes a la falta.",
    createdAt: "2025-02-05T09:00:00Z",
    isActive: true
  }
];

// ============================================
// JUSTIFICACIONES
// ============================================
export const demoJustifications: StudentJustification[] = [
  {
    id: "jus001",
    studentId: "s004",
    date: "2025-02-04",
    category: "Salud",
    reason: "Consulta médica por enfermedad respiratoria",
    adminEmail: "admin@demo.edu",
    timestamp: "2025-02-04T15:00:00Z"
  },
  {
    id: "jus002",
    studentId: "s002",
    date: "2025-02-05",
    category: "Familiar",
    reason: "Trámite familiar urgente",
    adminEmail: "admin@demo.edu",
    timestamp: "2025-02-06T09:00:00Z"
  }
];

// ============================================
// NOTAS ESPECIALES
// ============================================
export const demoSpecialNotes: SpecialNote[] = [
  {
    id: "sn001",
    text: "Reunión de padres de familia el día 15 de febrero",
    startDate: "2025-02-10T00:00:00Z",
    endDate: "2025-02-16T00:00:00Z"
  },
  {
    id: "sn002",
    text: "Período de exámenes parciales: 24-28 de febrero",
    startDate: "2025-02-20T00:00:00Z",
    endDate: "2025-03-01T00:00:00Z"
  }
];

// ============================================
// USUARIO DEMO
// ============================================
export const demoUser = {
  uid: "demo-user-001",
  email: "demo@academic-tracker.com",
  displayName: "Prof. Demo",
  photoURL: ""
};

// ============================================
// EXPORTACIÓN COMPLETA
// ============================================
export const demoExportData = {
  version: "2.0-demo",
  groups: demoGroups,
  students: demoStudents,
  observations: demoObservations,
  specialNotes: demoSpecialNotes,
  settings: demoSettings,
  partialsData: demoPartialsData
};
