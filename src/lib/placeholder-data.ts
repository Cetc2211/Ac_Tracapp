
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
