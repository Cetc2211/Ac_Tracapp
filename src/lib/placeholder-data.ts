
export type PartialId = 'p1' | 'p2' | 'p3';

export type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tutorName?: string;
  tutorPhone?: string;
  photo: string;
};

export type Group = {
  id: string;
  subject: string;
  students: Student[];
  semester?: string;
  groupName?: string;
  facilitator?: string;
};

export type StudentObservation = {
    id: string;
    studentId: string;
    partialId: PartialId;
    date: string; // ISO date string
    type: 'Problema de conducta' | 'Episodio emocional' | 'Mérito' | 'Demérito' | 'Asesoría académica' | 'Otros' | string;
    details: string;
    requiresCanalization: boolean;
    canalizationTarget?: 'Tutor' | 'Atención psicológica' | 'Directivo' | 'Padre/Madre/Tutor legal' | 'Otros' | string;
    requiresFollowUp: boolean;
    followUpUpdates: { date: string; update: string }[];
    isClosed: boolean;
};

export const students: Student[] = [
  { id: 'S001', name: 'Ana Torres', email: 'ana.torres@example.com', phone: '555-0101', tutorName: 'Miguel Torres', tutorPhone: '555-0201', photo: 'https://placehold.co/100x100.png' },
  { id: 'S002', name: 'Luis García', email: 'luis.garcia@example.com', phone: '555-0102', tutorName: 'Elena García', tutorPhone: '555-0202', photo: 'https://placehold.co/100x100.png' },
  { id: 'S003', name: 'Carla Rojas', email: 'carla.rojas@example.com', phone: '555-0103', tutorName: 'Fernando Rojas', tutorPhone: '555-0203', photo: 'https://placehold.co/100x100.png' },
  { id: 'S004', name: 'Diego Fernández', email: 'diego.fernandez@example.com', phone: '555-0104', tutorName: 'Sofia Fernández', tutorPhone: '555-0204', photo: 'https://placehold.co/100x100.png' },
  { id: 'S005', name: 'Mariana López', email: 'mariana.lopez@example.com', phone: '555-0105', tutorName: 'Javier López', tutorPhone: '555-0205', photo: 'https://placehold.co/100x100.png' },
  { id: 'S006', name: 'Jorge Pérez', email: 'jorge.perez@example.com', phone: '555-0106', tutorName: 'Isabel Pérez', tutorPhone: '555-0206', photo: 'https://placehold.co/100x100.png' },
  { id: 'S007', name: 'Rojas Hernández Isaac Esaú', email: 'isaac.rojas@example.com', phone: '555-0107', tutorName: 'Laura Hernández', tutorPhone: '555-0207', photo: 'https://placehold.co/100x100.png' },
  { id: 'S008', name: 'Gómez Salas Jimena', email: 'jimena.gomez@example.com', phone: '555-0108', tutorName: 'Roberto Gómez', tutorPhone: '555-0208', photo: 'https://placehold.co/100x100.png' },
];

const socialSciencesStudents = [
    { id: 'S007', name: 'Rojas Hernández Isaac Esaú', email: 'isaac.rojas@example.com', phone: '555-0107', tutorName: 'Laura Hernández', tutorPhone: '555-0207', photo: 'https://placehold.co/100x100.png' },
    { id: 'S008', name: 'Gómez Salas Jimena', email: 'jimena.gomez@example.com', phone: '555-0108', tutorName: 'Roberto Gómez', tutorPhone: '555-0208', photo: 'https://placehold.co/100x100.png' },
];


export const groups: Group[] = [
  { id: 'G01', subject: 'Matemáticas Avanzadas', students: students.slice(0, 4), semester: 'Tercero', groupName: 'TSPP', facilitator: 'Dr. Alberto Rodriguez' },
  { id: 'G02', subject: 'Historia del Arte', students: students.slice(2, 6), semester: 'Primero', groupName: 'TAEA', facilitator: 'Dra. María Hernandez' },
  { id: 'G03', subject: 'Programación I', students: students.slice(1, 5), semester: 'Primero', groupName: 'TSPA', facilitator: 'Ing. Carlos Sanchez' },
  { id: 'G04', subject: 'Ciencias Sociales', students: socialSciencesStudents, semester: 'Quinto', groupName: 'TSPC', facilitator: 'Lic. Gabriela Mistral' },
];

// DATA GENERATION
const generatePartialData = (group: Group, partialId: PartialId) => {
    let criteria, grades = {}, attendance = {}, participations = {}, activities = [], activityRecords = {};
    
    switch(partialId) {
        case 'p1':
            criteria = [
                { id: 'C1', name: 'Examen', weight: 40, expectedValue: 10 },
                { id: 'C2', name: 'Actividades', weight: 30, expectedValue: 0 },
                { id: 'C3', name: 'Participación', weight: 30, expectedValue: 0 },
            ];
            activities = [
                {id: 'A1', name: 'Tarea 1', dueDate: '2024-02-15', programmedDate: '2024-02-01'},
                {id: 'A2', name: 'Tarea 2', dueDate: '2024-03-01', programmedDate: '2024-02-20'},
            ];
            attendance = {
                '2024-02-10': group.students.reduce((acc, s) => ({...acc, [s.id]: Math.random() > 0.1}), {}),
                '2024-02-17': group.students.reduce((acc, s) => ({...acc, [s.id]: Math.random() > 0.2}), {}),
            };
            participations = {
                '2024-02-10': group.students.reduce((acc, s) => ({...acc, [s.id]: Math.random() > 0.5}), {}),
            };
            activityRecords = group.students.reduce((acc, s) => ({...acc, [s.id]: {'A1': Math.random() > 0.2, 'A2': Math.random() > 0.3 }}), {});
            grades = group.students.reduce((acc, s) => ({...acc, [s.id]: {'C1': { delivered: Math.floor(Math.random() * 5) + 5 }} }), {});
            break;
        case 'p2':
            criteria = [
                { id: 'C4', name: 'Proyecto', weight: 50, expectedValue: 100 },
                { id: 'C5', name: 'Actividades', weight: 30, expectedValue: 0 },
                { id: 'C6', name: 'Portafolio', weight: 20, expectedValue: 0 },
            ];
             activities = [
                {id: 'A3', name: 'Avance Proyecto', dueDate: '2024-04-10', programmedDate: '2024-04-01'},
            ];
            attendance = {
                '2024-04-05': group.students.reduce((acc, s) => ({...acc, [s.id]: Math.random() > 0.1}), {}),
                '2024-04-12': group.students.reduce((acc, s) => ({...acc, [s.id]: Math.random() > 0.1}), {}),
            };
            participations = {
                '2024-04-12': group.students.reduce((acc, s) => ({...acc, [s.id]: Math.random() > 0.6}), {}),
            };
            activityRecords = group.students.reduce((acc, s) => ({...acc, [s.id]: {'A3': Math.random() > 0.1 }}), {});
            grades = group.students.reduce((acc, s) => ({...acc, [s.id]: {'C4': { delivered: Math.floor(Math.random() * 20) + 75 }} }), {});
            break;
        case 'p3':
            criteria = [
                { id: 'C7', name: 'Examen Final', weight: 60, expectedValue: 10 },
                { id: 'C8', name: 'Proyecto Final', weight: 40, expectedValue: 100 },
            ];
            activities = [];
             attendance = {
                '2024-06-01': group.students.reduce((acc, s) => ({...acc, [s.id]: true }), {}),
                '2024-06-08': group.students.reduce((acc, s) => ({...acc, [s.id]: Math.random() > 0.05 }), {}),
            };
            grades = group.students.reduce((acc, s) => ({...acc, [s.id]: {
                'C7': { delivered: Math.floor(Math.random() * 6) + 4 },
                'C8': { delivered: Math.floor(Math.random() * 15) + 85 },
            }}), {});
            break;
    }
    return { criteria, grades, attendance, participations, activities, activityRecords };
}

export const generateInitialData = () => {
    const data: {[key: string]: any} = {
        groups: groups,
        students: students,
        allObservations: {},
        appSettings: {
            institutionName: "Academic Tracker",
            logo: "",
            theme: "theme-default"
        },
        activeGroupId: groups.length > 0 ? groups[0].id : null,
        activePartialId: 'p1',
    };

    const partials: PartialId[] = ['p1', 'p2', 'p3'];
    groups.forEach(group => {
        partials.forEach(pId => {
            const { criteria, grades, attendance, participations, activities, activityRecords } = generatePartialData(group, pId);
            const keySuffix = `${group.id}_${pId}`;
            data[`criteria_${keySuffix}`] = criteria;
            data[`grades_${keySuffix}`] = grades;
            data[`attendance_${keySuffix}`] = attendance;
            data[`participations_${keySuffix}`] = participations;
            data[`activities_${keySuffix}`] = activities;
            data[`activityRecords_${keySuffix}`] = activityRecords;
        });
    });

    return data;
}
