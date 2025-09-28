

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

export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
  isAutomated?: boolean;
};

export type Group = {
  id: string;
  subject: string;
  students: Student[];
  criteria: EvaluationCriteria[];
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

export type SpecialNote = {
  id: string;
  text: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
};


export type GradeDetail = {
  delivered: number | null;
};

export type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

export type RecoveryGrade = {
    grade: number | null;
    applied: boolean;
};

export type RecoveryGrades = {
    [studentId: string]: RecoveryGrade;
};

export type AttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type Activity = {
  id: string;
  name: string;
  dueDate: string; // YYYY-MM-DD
  programmedDate: string; // YYYY-MM-DD
};

export type ActivityRecord = {
    [studentId: string]: {
        [activityId: string]: boolean;
    };
};

export type PartialData = {
    grades: Grades;
    attendance: AttendanceRecord;
    participations: ParticipationRecord;
    activities: Activity[];
    activityRecords: ActivityRecord;
    recoveryGrades: RecoveryGrades;
    feedbacks: { [studentId: string]: string };
    groupAnalysis?: string;
};
