
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Student, Group, PartialId, StudentObservation, SpecialNote, EvaluationCriteria, PartialData, GradeDetail, Grades, RecoveryGrade, RecoveryGrades, AttendanceRecord, ParticipationRecord, Activity, ActivityRecord, CalculatedRisk, StudentWithRisk, CriteriaDetail, StudentStats, GroupedActivities } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { getPartialLabel } from '@/lib/utils';

// TYPE DEFINITIONS
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
    activeGroupId: string | null;
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
            if (activeGroupId !== undefined) {
              localStorage.setItem('activeGroupId_v1', activeGroupId || '');
            }
        } catch (e) {
            console.error("Failed to save non-settings data to localStorage", e);
        }
    }, [groups, allStudents, allObservations, allPartialsData, activeGroupId, isLoading, specialNotes, settings]);

    // --- MEMOIZED DERIVED STATE ---
    const activeGroup = useMemo(() => {
      if (!activeGroupId) return null;
      return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const activeStudentsInGroups = useMemo(() => Array.from(new Map(groups.flatMap(g => g.students.map(s => [s.id, s]))).values()), [groups]);
    const allPartialsDataForActiveGroup = useMemo(() => allPartialsData[activeGroupId || ''] || {}, [allPartialsData, activeGroupId]);
    const partialData = useMemo(() => allPartialsDataForActiveGroup[activePartialId] || defaultPartialData, [allPartialsDataForActiveGroup, activePartialId]);

    // --- CORE FUNCTIONS / ACTIONS ---
    const setActiveGroupId = (groupId: string | null) => {
        if (groupId === undefined) {
            console.warn("Attempted to set activeGroupId to undefined. Setting to null instead.");
            setActiveGroupIdState(null);
        } else {
            setActiveGroupIdState(groupId);
        }
    };
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
        
        const model = 'gemini-1.5-flash-latest';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
             safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_ONLY_HIGH"
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
        INSTRUCCIONES: Inicia con fortalezas, luego áreas de oportunidad y finaliza con recomendaciones claras. Tono de apoyo. Sin despedidas. **Bajo ninguna circunstancia utilices asteriscos (*) para dar formato o enfatizar texto.** La redacción debe ser en prosa natural.`;
        return callGoogleAI(prompt);
    }, [callGoogleAI]);

    const generateGroupAnalysisWithAI = useCallback(async (group: Group, summary: any, recoverySummary: any, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]) => {
        const prompt = `Actúa como analista educativo. Redacta un análisis narrativo profesional y objetivo para el grupo ${group.subject} en el ${getPartialLabel(activePartialId)}.
        DATOS: ${summary.totalStudents} estudiantes, promedio ${summary.groupAverage.toFixed(1)}%, aprobación ${(summary.approvedCount / summary.totalStudents * 100).toFixed(1)}%, asistencia ${summary.attendanceRate.toFixed(1)}%.
        RIESGO: ${atRisk.length} estudiantes en riesgo.
        BITÁCORA: ${observations.length} observaciones.
        RECUPERACIÓN: ${recoverySummary.recoveryStudentsCount} estudiantes la necesitaron.
        INSTRUCCIONES: Redacta en párrafos fluidos. Analiza el panorama general, correlaciones (asistencia/rendimiento), efectividad de la recuperación y finaliza con una recomendación formal a directivos y tutores para dar seguimiento a los casos de riesgo. **Bajo ninguna circunstancia utilices asteriscos (*) para dar formato o enfatizar texto.** La redacción debe ser en prosa natural.`;
        return callGoogleAI(prompt);
    }, [callGoogleAI, activePartialId]);


    // --- CONTEXT VALUE ---
    const contextValue: DataContextType = {
        isLoading, error, groups, allStudents, activeStudentsInGroups, allObservations, specialNotes, settings, activeGroup, activeGroupId, activePartialId, partialData, allPartialsDataForActiveGroup, groupAverages, atRiskStudents, overallAverageAttendance,
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
        { id: 'S1', name: 'Ana Sofía García', photo: 'https://placehold.co/100x100/FFC0CB/000000?text=AG', email: 'ana.garcia@example.com', tutorName: 'Ricardo García' },
        { id: 'S2', name: 'Luis Fernando Martínez', photo: 'https://placehold.co/100x100/ADD8E6/000000?text=LM', email: 'luis.martinez@example.com', tutorName: 'Elena Martínez' },
        { id: 'S3', name: 'Carlos Alberto Rodríguez', photo: 'https://placehold.co/100x100/90EE90/000000?text=CR', email: 'carlos.rodriguez@example.com', tutorName: 'Fernando Rodríguez' },
        { id: 'S4', name: 'María Guadalupe Hernández', photo: 'https://placehold.co/100x100/FFD700/000000?text=MH', email: 'maria.hernandez@example.com', tutorName: 'Guadalupe Pérez' },
        { id: 'S5', name: 'Sofía Isabel López', photo: 'https://placehold.co/100x100/E6E6FA/000000?text=SL', email: 'sofia.lopez@example.com', tutorName: 'Isabel Torres' },
    ];

    const studentsGroup2 = [
        { id: 'S6', name: 'Juan Carlos Pérez', photo: 'https://placehold.co/100x100/FFA07A/000000?text=JP', email: 'juan.perez@example.com', tutorName: 'Juan Morales' },
        { id: 'S7', name: 'Elena Ramírez', photo: 'https://placehold.co/100x100/20B2AA/FFFFFF?text=ER', email: 'elena.ramirez@example.com', tutorName: 'Laura Ramírez' },
        { id: 'S8', name: 'Pedro Antonio Flores', photo: 'https://placehold.co/100x100/778899/FFFFFF?text=PF', email: 'pedro.flores@example.com', tutorName: 'Antonio Chavez' },
        { id: 'S9', name: 'Laura Patricia Gómez', photo: 'https://placehold.co/100x100/DB7093/FFFFFF?text=LG', email: 'laura.gomez@example.com', tutorName: 'Patricia Díaz' },
    ];

    const criteriaG1: EvaluationCriteria[] = [
        { id: 'C1G1', name: 'Examen', weight: 40, expectedValue: 100 },
        { id: 'C2G1', name: 'Actividades', weight: 40, expectedValue: 0, isAutomated: true },
        { id: 'C3G1', name: 'Participación', weight: 20, expectedValue: 0, isAutomated: true },
    ];

    const criteriaG2: EvaluationCriteria[] = [
        { id: 'C1G2', name: 'Ensayo', weight: 50, expectedValue: 100 },
        { id: 'C2G2', name: 'Exposición', weight: 30, expectedValue: 100 },
        { id: 'C3G2', name: 'Actividades', weight: 20, expectedValue: 0, isAutomated: true },
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

    const generatePartialData = (students: Student[], criteria: EvaluationCriteria[], partialIndex: number): PartialData => {
        const grades: Grades = {};
        const activityRecords: ActivityRecord = {};
        const attendance: AttendanceRecord = {};
        const participations: ParticipationRecord = {};

        const activities: Activity[] = [
            { id: `ACT${partialIndex}-1`, name: `Resumen Cap. ${partialIndex}`, dueDate: `2024-0${2+partialIndex}-10`, programmedDate: `2024-0${2+partialIndex}-03` },
            { id: `ACT${partialIndex}-2`, name: `Ejercicios ${partialIndex}`, dueDate: `2024-0${2+partialIndex}-20`, programmedDate: `2024-0${2+partialIndex}-13` },
            { id: `ACT${partialIndex}-3`, name: `Mapa Mental ${partialIndex}`, dueDate: `2024-0${2+partialIndex}-28`, programmedDate: `2024-0${2+partialIndex}-21` },
        ];

        for (let i = 1; i <= 8; i++) {
            const date = `2024-0${2+partialIndex}-${i < 10 ? '0' : ''}${i}`;
            attendance[date] = {};
            participations[date] = {};
            students.forEach(s => {
                attendance[date][s.id] = Math.random() > (0.1 + (s.id === 'S3' ? 0.3 : 0)); // S3 has lower attendance
                if(attendance[date][s.id]) {
                  participations[date][s.id] = Math.random() > 0.5;
                }
            });
        }
        
        students.forEach((s, studentIndex) => {
            grades[s.id] = {};
            activityRecords[s.id] = {};
            
            criteria.forEach(c => {
                if (!c.isAutomated) {
                    let baseScore = 75 - (partialIndex * 5) + (studentIndex * 2);
                    if (s.id === 'S3') baseScore -= 20; // S3 has lower manual grades
                    grades[s.id][c.id] = { delivered: Math.max(40, Math.min(100, baseScore + Math.random() * 10)) };
                }
            });

            activities.forEach(act => {
                 activityRecords[s.id][act.id] = Math.random() > (0.2 + (s.id === 'S3' ? 0.4 : 0));
            });
        });

        return {
            grades, attendance, participations, activities, activityRecords,
            recoveryGrades: {}, feedbacks: {}, groupAnalysis: '',
        };
    };

    const demoPartialsData: AllPartialsData = { 'G1': {}, 'G2': {} };
    ['p1', 'p2', 'p3'].forEach((pId, index) => {
        demoPartialsData['G1']![pId as PartialId] = generatePartialData(studentsGroup1, criteriaG1, index + 1);
        demoPartialsData['G2']![pId as PartialId] = generatePartialData(studentsGroup2, criteriaG2, index + 1);
    });

    return { demoGroups, demoStudents, demoObservations, demoPartialsData };
};
