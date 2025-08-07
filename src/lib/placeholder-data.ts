
export type PartialId = 'p1' | 'p2' | 'p3';

export type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tutorName?: string;
  tutorPhone?: string;
  photo: string;
  riskLevel?: 'low' | 'medium' | 'high';
};

export type Group = {
  id: string;
  subject: string;
  students: Student[];
};

export type StudentObservation = {
    id: string;
    studentId: string;
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
  { id: 'S001', name: 'Ana Torres', email: 'ana.torres@example.com', phone: '555-0101', tutorName: 'Miguel Torres', tutorPhone: '555-0201', photo: 'https://placehold.co/100x100.png', riskLevel: 'high' },
  { id: 'S002', name: 'Luis García', email: 'luis.garcia@example.com', phone: '555-0102', tutorName: 'Elena García', tutorPhone: '555-0202', photo: 'https://placehold.co/100x100.png', riskLevel: 'low' },
  { id: 'S003', name: 'Carla Rojas', email: 'carla.rojas@example.com', phone: '555-0103', tutorName: 'Fernando Rojas', tutorPhone: '555-0203', photo: 'https://placehold.co/100x100.png', riskLevel: 'medium' },
  { id: 'S004', name: 'Diego Fernández', email: 'diego.fernandez@example.com', phone: '555-0104', tutorName: 'Sofia Fernández', tutorPhone: '555-0204', photo: 'https://placehold.co/100x100.png', riskLevel: 'low' },
  { id: 'S005', name: 'Mariana López', email: 'mariana.lopez@example.com', phone: '555-0105', tutorName: 'Javier López', tutorPhone: '555-0205', photo: 'https://placehold.co/100x100.png', riskLevel: 'low' },
  { id: 'S006', name: 'Jorge Pérez', email: 'jorge.perez@example.com', phone: '555-0106', tutorName: 'Isabel Pérez', tutorPhone: '555-0206', photo: 'https://placehold.co/100x100.png', riskLevel: 'high' },
];

export const groups: Group[] = [
  { id: 'G01', subject: 'Matemáticas Avanzadas', students: students.slice(0, 4) },
  { id: 'G02', subject: 'Historia del Arte', students: students.slice(2, 6) },
  { id: 'G03', subject: 'Programación I', students: students.slice(1, 5) },
];
