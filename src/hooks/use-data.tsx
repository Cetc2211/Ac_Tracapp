

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation, SpecialNote } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { getPartialLabel } from '@/lib/utils';

// TYPE DEFINITIONS
export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
  isAutomated?: boolean;
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


export type GroupedActivities = {
  [dueDate: string]: Activity[];
};

export type GroupStats = {
  average: number;
  highRiskCount: number;
}

export type CalculatedRisk = {
    level: 'low' | 'medium' | 'high';
    reason: string;
}
export type StudentWithRisk = Student & { calculatedRisk: CalculatedRisk };

export type CriteriaDetail = {
    name: string;
    earned: number;
    weight: number;
}

export type StudentStats = {
    finalGrade: number;
    criteriaDetails: CriteriaDetail[];
    isRecovery: boolean;
    partialId: PartialId;
    attendance: { p: number; a: number; total: number; rate: number };
    observations: StudentObservation[];
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

export type AllPartialsDataForGroup = {
    [partialId in PartialId]?: PartialData;
};

export type AllPartialsData = {
  [groupId: string]: AllPartialsDataForGroup;
};


export type UserProfile = {
    name: string;
    email: string;
    photoURL: string;
}

const defaultSettings = {
    institutionName: "Mi Institución",
    logo: "",
    theme: "theme-candy",
    apiKey: "",
    signature: "",
    facilitatorName: "",
    scheduleImageUrl: "",
    teacherPhoto: ""
};

const defaultPartialData: PartialData = {
    grades: {},
    attendance: {},
    participations: {},
    activities: [],
    activityRecords: {},
    recoveryGrades: {},
    feedbacks: {},
    groupAnalysis: '',
};

// --- DATA CONTEXT & PROVIDER ---
interface DataContextType {
    // State
    isLoading: boolean;
    error: Error | null;
    groups: Group[];
    allStudents: Student[];
    activeStudentsInGroups: Student[];
    allObservations: { [studentId: string]: StudentObservation[] };
    specialNotes: SpecialNote[];
    settings: typeof defaultSettings;
    activeGroup: Group | null;
    activePartialId: PartialId;
    partialData: PartialData;
    allPartialsDataForActiveGroup: AllPartialsDataForGroup;
    groupAverages: { [groupId: string]: number };
    atRiskStudents: StudentWithRisk[];
    overallAverageAttendance: number;

    // State Setters
    setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
    setAllStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    setAllObservations: React.Dispatch<React.SetStateAction<{ [studentId: string]: StudentObservation[] }>>;
    setAllPartialsData: React.Dispatch<React.SetStateAction<AllPartialsData>>;
    setSpecialNotes: React.Dispatch<React.SetStateAction<SpecialNote[]>>;
    setSettings: (settings: typeof defaultSettings) => Promise<void>;
    setActiveGroupId: (groupId: string | null) => void;
    setActivePartialId: (partialId: PartialId) => void;

    // Derived Setters for PartialData
    setGrades: (setter: React.SetStateAction<Grades>) => Promise<void>;
    setAttendance: (setter: React.SetStateAction<AttendanceRecord>) => Promise<void>;
    setParticipations: (setter: React.SetStateAction<ParticipationRecord>) => Promise<void>;
    setActivities: (setter: React.SetStateAction<Activity[]>) => Promise<void>;
    setActivityRecords: (setter: React.SetStateAction<ActivityRecord>) => Promise<void>;
    setRecoveryGrades: (setter: React.SetStateAction<RecoveryGrades>) => Promise<void>;
    setStudentFeedback: (studentId: string, feedback: string) => Promise<void>;
    setGroupAnalysis: (analysis: string) => Promise<void>;

    // Core Actions
    addStudentsToGroup: (groupId: string, students: Student[]) => Promise<void>;
    removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;
    updateGroup: (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => Promise<void>;
    updateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
    updateGroupCriteria: (criteria: EvaluationCriteria[]) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
    updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
    takeAttendanceForDate: (groupId: string, date: string) => Promise<void>;
    deleteAttendanceDate: (date: string) => Promise<void>;
    resetAllData: () => Promise<void>;
    addSpecialNote: (note: Omit<SpecialNote, 'id'>) => Promise<void>;
    updateSpecialNote: (noteId: string, note: Partial<Omit<SpecialNote, 'id'>>) => Promise<void>;
    deleteSpecialNote: (noteId: string) => Promise<void>;


    // Calculation & Fetching
    calculateFinalGrade: (studentId: string) => number;
    calculateDetailedFinalGrade: (studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => { finalGrade: number; criteriaDetails: CriteriaDetail[]; isRecovery: boolean };
    getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
    fetchPartialData: (groupId: string, partialId: PartialId) => Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null>;
    
    // AI Features
    generateFeedbackWithAI: (student: Student, stats: StudentStats) => Promise<string>;
    generateGroupAnalysisWithAI: (group: Group, summary: any, recoverySummary: any, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        if (typeof window === 'undefined') return defaultValue;
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage`, error);
        return defaultValue;
    }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const [groups, setGroups] = useState<Group[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{ [studentId: string]: StudentObservation[] }>({});
    const [specialNotes, setSpecialNotes] = useState<SpecialNote[]>([]);
    const [allPartialsData, setAllPartialsData] = useState<AllPartialsData>({});
    const [settings, setSettingsState] = useState(defaultSettings);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');
    
    // --- HYDRATION & PERSISTENCE ---
    useEffect(() => {
        try {
            let storedGroups = loadFromStorage<Group[]>('app_groups', []);
            let storedStudents = loadFromStorage<Student[]>('app_students', []);
            let storedObservations = loadFromStorage<{ [studentId: string]: StudentObservation[] }>('app_observations', {});
            let storedPartialsData = loadFromStorage<AllPartialsData>('app_partialsData', {});
            let storedSettings = loadFromStorage('app_settings', defaultSettings);
            let storedActiveGroupId = loadFromStorage<string | null>('activeGroupId_v1', null);
            let storedSpecialNotes = loadFromStorage<SpecialNote[]>('app_specialNotes', []);

            // INJECT DEMO DATA IF EMPTY
            if (storedGroups.length === 0) {
              const { demoGroups, demoStudents, demoObservations, demoPartialsData } = generateDemoData();
              storedGroups = demoGroups;
              storedStudents = demoStudents;
              storedObservations = demoObservations;
              storedPartialsData = demoPartialsData;
              storedActiveGroupId = demoGroups[0].id;
            }


            setGroups(storedGroups);
            setAllStudents(storedStudents);
            setAllObservations(storedObservations);
            setSpecialNotes(storedSpecialNotes);
            setAllPartialsData(storedPartialsData);
            setSettingsState(storedSettings);

            if (storedActiveGroupId && storedGroups.some(g => g.id === storedActiveGroupId)) {
                setActiveGroupIdState(storedActiveGroupId);
            } else if (storedGroups.length > 0) {
                setActiveGroupIdState(storedGroups[0].id);
            }
        } catch (e) {
            setError(e instanceof Error ? e : new Error('An unknown error occurred during data hydration'));
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (isLoading) return;
        try {
            localStorage.setItem('app_groups', JSON.stringify(groups));
            localStorage.setItem('app_students', JSON.stringify(allStudents));
            localStorage.setItem('app_observations', JSON.stringify(allObservations));
            localStorage.setItem('app_specialNotes', JSON.stringify(specialNotes));
            localStorage.setItem('app_partialsData', JSON.stringify(allPartialsData));
            localStorage.setItem('app_settings', JSON.stringify(settings));
            localStorage.setItem('activeGroupId_v1', activeGroupId || '');
        } catch (e) {
            console.error("Failed to save non-settings data to localStorage", e);
        }
    }, [groups, allStudents, allObservations, allPartialsData, activeGroupId, isLoading, specialNotes, settings]);

    // --- MEMOIZED DERIVED STATE ---
    const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId) || null, [groups, activeGroupId]);
    const activeStudentsInGroups = useMemo(() => Array.from(new Map(groups.flatMap(g => g.students.map(s => [s.id, s]))).values()), [groups]);
    const allPartialsDataForActiveGroup = useMemo(() => allPartialsData[activeGroupId || ''] || {}, [allPartialsData, activeGroupId]);
    const partialData = useMemo(() => allPartialsDataForActiveGroup[activePartialId] || defaultPartialData, [allPartialsDataForActiveGroup, activePartialId]);

    // --- CORE FUNCTIONS / ACTIONS ---
    const setActiveGroupId = (groupId: string | null) => setActiveGroupIdState(groupId);
    const setActivePartialId = (partialId: PartialId) => setActivePartialIdState(partialId);

    const setSettings = useCallback(async (newSettings: typeof defaultSettings) => {
        setSettingsState(newSettings);
        // The useEffect will handle saving to localStorage
    }, []);

    const createSetter = useCallback((field: keyof PartialData) => async (setter: React.SetStateAction<any>) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const newValue = typeof setter === 'function' ? setter(pData[field]) : setter;
            return { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, [field]: newValue } } };
        });
    }, [activeGroupId, activePartialId]);
    
    const setGrades = createSetter('grades');
    const setAttendance = createSetter('attendance');
    const setParticipations = createSetter('participations');
    const setActivities = createSetter('activities');
    const setActivityRecords = createSetter('activityRecords');
    const setRecoveryGrades = createSetter('recoveryGrades');

    const setStudentFeedback = useCallback(async (studentId: string, feedback: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const newFeedbacks = { ...(pData.feedbacks || {}), [studentId]: feedback };
            return { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, feedbacks: newFeedbacks } } };
        });
    }, [activeGroupId, activePartialId]);

    const setGroupAnalysis = useCallback(async (analysis: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            return { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, groupAnalysis: analysis } } };
        });
    }, [activeGroupId, activePartialId]);

    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        setAllStudents(prev => [...prev, ...students.filter(s => !prev.some(ps => ps.id === s.id))]);
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, students: [...g.students, ...students] } : g));
    }, []);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, students: g.students.filter(s => s.id !== studentId) } : g));
    }, []);

    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
    }, []);

    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...data } : s));
        setGroups(prev => prev.map(g => ({ ...g, students: g.students.map(s => s.id === studentId ? { ...s, ...data } : s) })));
    }, []);

    const updateGroupCriteria = useCallback(async (criteria: EvaluationCriteria[]) => {
        if (!activeGroupId) return;
        setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, criteria } : g));
    }, [activeGroupId]);

    const deleteGroup = useCallback(async (groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if (activeGroupId === groupId) setActiveGroupIdState(null);
    }, [activeGroupId]);

    const addStudentObservation = useCallback(async (obs: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObs = { ...obs, id: `OBS-${Date.now()}`, date: new Date().toISOString(), followUpUpdates: [], isClosed: false };
        setAllObservations(prev => ({ ...prev, [obs.studentId]: [...(prev[obs.studentId] || []), newObs] }));
    }, []);

    const updateStudentObservation = useCallback(async (studentId: string, obsId: string, updateText: string, isClosing: boolean) => {
        setAllObservations(prev => ({
            ...prev,
            [studentId]: (prev[studentId] || []).map(obs => obs.id === obsId ? {
                ...obs,
                followUpUpdates: [...obs.followUpUpdates, { date: new Date().toISOString(), update: updateText }],
                isClosed: isClosing
            } : obs)
        }));
    }, []);

    const takeAttendanceForDate = useCallback(async (groupId: string, date: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        setAllPartialsData(prev => {
            const groupData = prev[groupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            if (pData.attendance[date]) return prev;
            const newAttendance = group.students.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
            return { ...prev, [groupId]: { ...groupData, [activePartialId]: { ...pData, attendance: { ...pData.attendance, [date]: newAttendance }, participations: { ...pData.participations, [date]: {} } } } };
        });
    }, [groups, activePartialId]);

    const deleteAttendanceDate = useCallback(async (date: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const { [date]: _, ...newAttendance } = pData.attendance;
            const { [date]: __, ...newParticipations } = pData.participations;
            return { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, attendance: newAttendance, participations: newParticipations } } };
        });
    }, [activeGroupId, activePartialId]);

    const resetAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            Object.keys(localStorage).forEach(key => { if (key.startsWith('app_')) localStorage.removeItem(key) });
            localStorage.removeItem('activeGroupId_v1');
            setGroups([]);
            setAllStudents([]);
            setAllObservations({});
            setSpecialNotes([]);
            setAllPartialsData({});
            setSettingsState(defaultSettings);
            setActiveGroupIdState(null);
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            setError(e as Error);
        }
    }, []);
    
    // Special Notes Actions
    const addSpecialNote = useCallback(async (note: Omit<SpecialNote, 'id'>) => {
        const newNote = { ...note, id: `NOTE-${Date.now()}` };
        setSpecialNotes(prev => [...prev, newNote]);
    }, []);

    const updateSpecialNote = useCallback(async (noteId: string, noteUpdate: Partial<Omit<SpecialNote, 'id'>>) => {
        setSpecialNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...noteUpdate } : n));
    }, []);

    const deleteSpecialNote = useCallback(async (noteId: string) => {
        setSpecialNotes(prev => prev.filter(n => n.id !== noteId));
    }, []);


    // --- CALCULATIONS & DERIVED DATA ---
    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData, criteria: EvaluationCriteria[]): { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean } => {
        const recoveryInfo = pData.recoveryGrades?.[studentId];
        if (recoveryInfo?.applied) {
            return { finalGrade: recoveryInfo.grade ?? 0, criteriaDetails: [{ name: 'Recuperación', earned: recoveryInfo.grade ?? 0, weight: 100 }], isRecovery: true };
        }
        if (!pData || !criteria || criteria.length === 0) return { finalGrade: 0, criteriaDetails: [], isRecovery: false };

        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        criteria.forEach(c => {
            let ratio = 0;
            if (c.name === 'Actividades' || c.name === 'Portafolio') {
                const total = pData.activities?.length ?? 0;
                if (total > 0) ratio = (Object.values(pData.activityRecords?.[studentId] || {}).filter(Boolean).length) / total;
            } else if (c.name === 'Participación') {
                const total = Object.keys(pData.participations || {}).length;
                if (total > 0) ratio = Object.values(pData.participations).filter(day => day[studentId]).length / total;
            } else {
                const delivered = pData.grades?.[studentId]?.[c.id]?.delivered ?? 0;
                if (c.expectedValue > 0) ratio = delivered / c.expectedValue;
            }
            const earned = ratio * c.weight;
            finalGrade += earned;
            criteriaDetails.push({ name: c.name, earned, weight: c.weight });
        });
        return { finalGrade: Math.max(0, Math.min(100, finalGrade)), criteriaDetails, isRecovery: false };
    }, []);

    const calculateFinalGrade = useCallback((studentId: string) => {
        if (!activeGroup) return 0;
        const data = allPartialsData[activeGroup.id]?.[activePartialId];
        return calculateDetailedFinalGrade(studentId, data || defaultPartialData, activeGroup?.criteria || []).finalGrade;
    }, [activeGroup, activePartialId, allPartialsData, calculateDetailedFinalGrade]);

    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        const days = Object.keys(pAttendance).filter(d => Object.prototype.hasOwnProperty.call(pAttendance[d], studentId));
        const attended = days.reduce((count, d) => pAttendance[d][studentId] === true ? count + 1 : count, 0);
        const attendanceRate = days.length > 0 ? (attended / days.length) * 100 : 100;
        
        let reason = [];
        if (finalGrade <= 59) {
            reason.push(`Calificación reprobatoria (${finalGrade.toFixed(0)}%).`);
        }
        if (attendanceRate < 80) {
            reason.push(`Asistencia baja (${attendanceRate.toFixed(0)}%).`);
        }
        
        if (reason.length > 0) {
            return { level: 'high', reason: reason.join(' ') };
        }
        
        if (finalGrade > 59 && finalGrade <= 70) {
            return { level: 'medium', reason: `Calificación baja (${finalGrade.toFixed(0)}%).` };
        }
        
        return { level: 'low', reason: 'Rendimiento adecuado' };
    }, []);

    const groupAverages = useMemo(() => {
        return groups.reduce((acc, group) => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) { acc[group.id] = 0; return acc; }
            const grades = group.students.map(s => calculateDetailedFinalGrade(s.id, data, group.criteria).finalGrade);
            acc[group.id] = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;
            return acc;
        }, {} as { [gid: string]: number });
    }, [groups, activePartialId, allPartialsData, calculateDetailedFinalGrade]);

    const atRiskStudents = useMemo(() => {
        return groups.flatMap(group => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) return [];
            return group.students.map(student => {
                const finalGrade = calculateDetailedFinalGrade(student.id, data, group.criteria).finalGrade;
                const risk = getStudentRiskLevel(finalGrade, data.attendance, student.id);
                return { ...student, calculatedRisk: risk };
            }).filter(s => s.calculatedRisk.level !== 'low');
        }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [groups, activePartialId, allPartialsData, calculateDetailedFinalGrade, getStudentRiskLevel]);

    const overallAverageAttendance = useMemo(() => {
        if (!activeGroup) return 100;
        let totalPossible = 0;
        let totalPresent = 0;
        
        const attendanceForPartial = partialData.attendance;

        activeGroup.students.forEach(student => {
            Object.keys(attendanceForPartial).forEach(date => {
                // Check if the student has a record for this date
                if (Object.prototype.hasOwnProperty.call(attendanceForPartial[date], student.id)) {
                    totalPossible++;
                    if (attendanceForPartial[date][student.id]) {
                        totalPresent++;
                    }
                }
            });
        });

        if (totalPossible === 0) return 100;
        return (totalPresent / totalPossible) * 100;
    }, [activeGroup, partialData.attendance]);

    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null> => {
        const group = groups.find(g => g.id === groupId);
        return group ? { ...(allPartialsData[groupId]?.[partialId] || defaultPartialData), criteria: group.criteria || [] } : null;
    }, [allPartialsData, groups]);
    
    // --- AI FEATURES ---
    const callGoogleAI = useCallback(async (prompt: string): Promise<string> => {
        if (!settings.apiKey) {
            throw new Error("No se ha configurado una clave API de Google AI. Ve a Ajustes para agregarla.");
        }
        
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/generateContent?key=${settings.apiKey}`;
        
        const requestBody = {
            model: 'gemini-pro', // Specify model in body
            contents: [{
                parts: [{ text: prompt }]
            }],
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_ONLY_HIGH"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_ONLY_HIGH",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ]
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("AI API Error Response:", errorData);
            throw new Error(`Error del servicio de IA: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!feedbackText) {
            console.error("Invalid AI response structure:", data);
            throw new Error("La respuesta de la IA no contiene texto.");
        }

        return feedbackText;
    }, [settings.apiKey]);


    const generateFeedbackWithAI = useCallback(async (student: Student, stats: StudentStats): Promise<string> => {
        const prompt = `Eres un asistente de docentes experto en pedagogía. Genera una retroalimentación constructiva y personalizada para ${student.name}.
        DATOS: Calificación: ${stats.finalGrade.toFixed(0)}%, Asistencia: ${stats.attendance.rate.toFixed(0)}%.
        Desglose: ${stats.criteriaDetails.map(c => `${c.name}: ${c.earned.toFixed(0)}%`).join(', ')}.
        Bitácora: ${stats.observations.length > 0 ? stats.observations.map(o => `${o.type}: ${o.details}`).join('; ') : "Sin observaciones."}
        INSTRUCCIONES: Inicia con fortalezas, luego áreas de oportunidad y finaliza con recomendaciones claras. Tono de apoyo. Sin despedidas.`;
        return callGoogleAI(prompt);
    }, [callGoogleAI]);

    const generateGroupAnalysisWithAI = useCallback(async (group: Group, summary: any, recoverySummary: any, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]): Promise<string> => {
        const prompt = `Actúa como analista educativo. Redacta un análisis narrativo profesional y objetivo para el grupo ${group.subject} en el ${getPartialLabel(activePartialId)}.
        DATOS: ${summary.totalStudents} estudiantes, promedio ${summary.groupAverage.toFixed(1)}%, aprobación ${(summary.approvedCount / summary.totalStudents * 100).toFixed(1)}%, asistencia ${summary.attendanceRate.toFixed(1)}%.
        RIESGO: ${atRisk.length} estudiantes en riesgo.
        BITÁCORA: ${observations.length} observaciones.
        RECUPERACIÓN: ${recoverySummary.recoveryStudentsCount} estudiantes la necesitaron.
        INSTRUCCIONES: Redacta en párrafos fluidos. Analiza el panorama general, correlaciones (asistencia/rendimiento), efectividad de la recuperación y finaliza con una recomendación formal a directivos y tutores para dar seguimiento a los casos de riesgo.`;
        return callGoogleAI(prompt);
    }, [callGoogleAI, activePartialId]);


    // --- CONTEXT VALUE ---
    const contextValue: DataContextType = {
        isLoading, error, groups, allStudents, activeStudentsInGroups, allObservations, specialNotes, settings, activeGroup, activePartialId, partialData, allPartialsDataForActiveGroup, groupAverages, atRiskStudents, overallAverageAttendance,
        setGroups, setAllStudents, setAllObservations, setSpecialNotes, setAllPartialsData, setSettings, setActiveGroupId, setActivePartialId,
        setGrades, setAttendance, setParticipations, setActivities, setActivityRecords, setRecoveryGrades, setStudentFeedback, setGroupAnalysis,
        addStudentsToGroup, removeStudentFromGroup, updateGroup, updateStudent, updateGroupCriteria, deleteGroup, addStudentObservation, updateStudentObservation, takeAttendanceForDate, deleteAttendanceDate, resetAllData, addSpecialNote, updateSpecialNote, deleteSpecialNote,
        calculateFinalGrade, calculateDetailedFinalGrade, getStudentRiskLevel, fetchPartialData,
        generateFeedbackWithAI, generateGroupAnalysisWithAI
    };

    return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// --- DEMO DATA GENERATION ---
const generateDemoData = () => {
    const studentsGroup1 = [
        { id: 'S1', name: 'Ana Sofía García', photo: 'https://placehold.co/100x100/FFC0CB/000000?text=AG' },
        { id: 'S2', name: 'Luis Fernando Martínez', photo: 'https://placehold.co/100x100/ADD8E6/000000?text=LM' },
        { id: 'S3', name: 'Carlos Alberto Rodríguez', photo: 'https://placehold.co/100x100/90EE90/000000?text=CR' },
        { id: 'S4', name: 'María Guadalupe Hernández', photo: 'https://placehold.co/100x100/FFD700/000000?text=MH' },
        { id: 'S5', name: 'Sofía Isabel López', photo: 'https://placehold.co/100x100/E6E6FA/000000?text=SL' },
    ];

    const studentsGroup2 = [
        { id: 'S6', name: 'Juan Carlos Pérez', photo: 'https://placehold.co/100x100/FFA07A/000000?text=JP' },
        { id: 'S7', name: 'Elena Ramírez', photo: 'https://placehold.co/100x100/20B2AA/FFFFFF?text=ER' },
        { id: 'S8', name: 'Pedro Antonio Flores', photo: 'https://placehold.co/100x100/778899/FFFFFF?text=PF' },
        { id: 'S9', name: 'Laura Patricia Gómez', photo: 'https://placehold.co/100x100/DB7093/FFFFFF?text=LG' },
    ];

    const criteriaG1 = [
        { id: 'C1G1', name: 'Examen', weight: 50, expectedValue: 100 },
        { id: 'C2G1', name: 'Actividades', weight: 30, expectedValue: 10 },
        { id: 'C3G1', name: 'Proyecto', weight: 20, expectedValue: 10 },
    ];

    const criteriaG2 = [
        { id: 'C1G2', name: 'Ensayo', weight: 40, expectedValue: 100 },
        { id: 'C2G2', name: 'Exposición', weight: 40, expectedValue: 100 },
        { id: 'C3G2', name: 'Participación', weight: 20, expectedValue: 5 },
    ];

    const demoGroups: Group[] = [
        { id: 'G1', subject: 'Matemáticas IV', students: studentsGroup1, criteria: criteriaG1, semester: 'Cuarto', facilitator: 'Dr. Alan Turing' },
        { id: 'G2', subject: 'Historia de México', students: studentsGroup2, criteria: criteriaG2, semester: 'Cuarto', facilitator: 'Dra. Ada Lovelace' },
    ];

    const demoStudents = [...studentsGroup1, ...studentsGroup2];

    const demoObservations = {
        'S3': [{ id: 'OBS1', studentId: 'S3', partialId: 'p1' as PartialId, date: '2024-03-15T10:00:00.000Z', type: 'Problema de conducta', details: 'Interrumpió la clase en repetidas ocasiones.', requiresCanalization: true, canalizationTarget: 'Tutor', requiresFollowUp: true, followUpUpdates: [], isClosed: false }],
        'S4': [{ id: 'OBS2', studentId: 'S4', partialId: 'p2' as PartialId, date: '2024-05-20T11:00:00.000Z', type: 'Mérito', details: 'Excelente participación y ayuda a sus compañeros.', requiresCanalization: false, requiresFollowUp: false, followUpUpdates: [], isClosed: true }],
    };

    const generatePartialData = (students: Student[], criteria: EvaluationCriteria[], partial: number): PartialData => {
        const grades: Grades = {};
        const activityRecords: ActivityRecord = {};
        students.forEach(s => {
            grades[s.id] = {
                [criteria[0].id]: { delivered: 60 + Math.random() * 40 - (partial * 5) },
                [criteria[1].id]: { delivered: 5 + Math.random() * 5 },
                [criteria[2].id]: { delivered: 7 + Math.random() * 3 },
            };
            activityRecords[s.id] = { 'ACT1': Math.random() > 0.2, 'ACT2': Math.random() > 0.3 };
        });

        return {
            grades,
            attendance: { '2024-03-10': students.reduce((acc, s) => ({ ...acc, [s.id]: Math.random() > 0.1 }), {}), '2024-03-12': students.reduce((acc, s) => ({ ...acc, [s.id]: Math.random() > 0.1 }), {}) },
            participations: { '2024-03-10': students.reduce((acc, s) => ({ ...acc, [s.id]: Math.random() > 0.5 }), {}) },
            activities: [{ id: 'ACT1', name: `Tarea ${partial}.1`, dueDate: `2024-03-1${partial}`, programmedDate: `2024-03-0${partial}` }, { id: 'ACT2', name: `Tarea ${partial}.2`, dueDate: `2024-03-2${partial}`, programmedDate: `2024-03-1${partial}` }],
            activityRecords,
            recoveryGrades: partial === 1 && criteria.length > 0 ? { [students[2].id]: { grade: 70, applied: false } } : {},
            feedbacks: {},
            groupAnalysis: '',
        };
    };

    const demoPartialsData: AllPartialsData = {
        'G1': {
            'p1': generatePartialData(studentsGroup1, criteriaG1, 1),
            'p2': generatePartialData(studentsGroup1, criteriaG1, 2),
            'p3': generatePartialData(studentsGroup1, criteriaG1, 3),
        },
        'G2': {
            'p1': generatePartialData(studentsGroup2, criteriaG2, 1),
            'p2': generatePartialData(studentsGroup2, criteriaG2, 2),
            'p3': generatePartialData(studentsGroup2, criteriaG2, 3),
        }
    };
    
    // Make one student in G1 fail P1 to test recovery
    if (demoPartialsData['G1']?.['p1']?.grades['S3']?.[criteriaG1[0].id]) {
      demoPartialsData['G1']!['p1']!.grades['S3'][criteriaG1[0].id].delivered = 40;
    }
    if (demoPartialsData['G1']?.['p1']) {
      demoPartialsData['G1']!['p1']!.recoveryGrades = { 'S3': { grade: 70, applied: true } };
    }


    return { demoGroups, demoStudents, demoObservations, demoPartialsData };
};
