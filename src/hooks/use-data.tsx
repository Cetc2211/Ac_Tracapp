

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { format } from 'date-fns';

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
    grade: number;
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
    criteria: EvaluationCriteria[];
    grades: Grades;
    attendance: AttendanceRecord;
    participations: ParticipationRecord;
    activities: Activity[];
    activityRecords: ActivityRecord;
    recoveryGrades: RecoveryGrades;
    feedbacks: { [studentId: string]: string };
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
    theme: "theme-mint",
    apiKey: ""
};

const defaultPartialData: PartialData = {
    criteria: [],
    grades: {},
    attendance: {},
    participations: {},
    activities: [],
    activityRecords: {},
    recoveryGrades: {},
    feedbacks: {},
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage`, error);
        return defaultValue;
    }
};

type GroupReportSummary = {
    totalStudents: number;
    approvedCount: number;
    failedCount: number;
    groupAverage: number;
    attendanceRate: number;
    participationRate: number;
}

type RecoverySummary = {
    recoveryStudentsCount: number;
    approvedOnRecovery: number;
    failedOnRecovery: number;
}


// CONTEXT TYPE
interface DataContextType {
  // State
  isLoading: boolean;
  error: Error | null;
  groups: Group[];
  allStudents: Student[];
  activeStudentsInGroups: Student[];
  allObservations: {[studentId: string]: StudentObservation[]};
  settings: { institutionName: string; logo: string; theme: string; apiKey: string };
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  
  partialData: PartialData;
  allPartialsDataForActiveGroup: AllPartialsDataForGroup;


  groupAverages: {[groupId: string]: number};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;

  // Setters / Updaters
  addStudentsToGroup: (groupId: string, students: Student[]) => Promise<void>;
  removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;
  updateGroup: (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => Promise<void>;
  updateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
  
  setActiveGroupId: (groupId: string | null) => void;
  setActivePartialId: (partialId: PartialId) => void;
  
  setCriteria: (setter: React.SetStateAction<EvaluationCriteria[]>) => Promise<void>;
  setGrades: (setter: React.SetStateAction<Grades>) => Promise<void>;
  setAttendance: (setter: React.SetStateAction<AttendanceRecord>) => Promise<void>;
  setParticipations: (setter: React.SetStateAction<ParticipationRecord>) => Promise<void>;
  setActivities: (setter: React.SetStateAction<Activity[]>) => Promise<void>;
  setActivityRecords: (setter: React.SetStateAction<ActivityRecord>) => Promise<void>;
  setRecoveryGrades: (setter: React.SetStateAction<RecoveryGrades>) => Promise<void>;
  setStudentFeedback: (studentId: string, feedback: string) => Promise<void>;
  setSettings: (settings: { institutionName: string; logo: string; theme: string; apiKey: string }) => Promise<void>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  resetAllData: () => Promise<void>;


  // Functions
  deleteGroup: (groupId: string) => Promise<void>;
  addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
  calculateFinalGrade: (studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData) => number;
  calculateDetailedFinalGrade: (studentId: string, pData: PartialData) => { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean };
  getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
  fetchPartialData: (groupId: string, partialId: PartialId) => Promise<PartialData>;
  takeAttendanceForDate: (groupId: string, date: string) => Promise<void>;
  generateFeedbackWithAI: (student: Student, stats: StudentStats) => Promise<string>;
  generateGroupAnalysisWithAI: (group: Group, summary: GroupReportSummary, recoverySummary: RecoverySummary, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const [groups, setGroups] = useState<Group[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [allPartialsData, setAllPartialsData] = useState<AllPartialsData>({});
    const [settings, setSettingsState] = useState(defaultSettings);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');

    useEffect(() => {
        setIsClient(true);
        try {
            const storedGroups = loadFromStorage<Group[]>('app_groups', []);
            const storedStudents = loadFromStorage<Student[]>('app_students', []);
            const storedObservations = loadFromStorage<{[studentId: string]: StudentObservation[]}>('app_observations', {});
            const storedPartialsData = loadFromStorage<AllPartialsData>('app_partialsData', {});
            const storedSettings = loadFromStorage('app_settings', defaultSettings);
            const storedActiveGroupId = loadFromStorage<string | null>('activeGroupId_v1', null);

            setGroups(storedGroups);
            setAllStudents(storedStudents);
            setAllObservations(storedObservations);
            setAllPartialsData(storedPartialsData);
            setSettingsState(storedSettings);

            if (storedActiveGroupId && storedGroups.some(g => g.id === storedActiveGroupId)) {
                setActiveGroupIdState(storedActiveGroupId);
            } else if (storedGroups.length > 0) {
                 setActiveGroupIdState(storedGroups[0].id);
            }

        } catch (e) {
            console.error("Error hydrating data from localStorage", e);
            setError(e instanceof Error ? e : new Error('An unknown error occurred during data hydration'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLoading || !isClient) return;
        
        try {
            localStorage.setItem('app_groups', JSON.stringify(groups));
            localStorage.setItem('app_students', JSON.stringify(allStudents));
            localStorage.setItem('app_observations', JSON.stringify(allObservations));
            localStorage.setItem('app_partialsData', JSON.stringify(allPartialsData));
            localStorage.setItem('app_settings', JSON.stringify(settings));
            if (activeGroupId) {
                localStorage.setItem('activeGroupId_v1', activeGroupId);
            } else {
                localStorage.removeItem('activeGroupId_v1');
            }
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    }, [groups, allStudents, allObservations, allPartialsData, settings, activeGroupId, isLoading, isClient]);
    
    const allPartialsDataForActiveGroup = useMemo(() => {
        if (!activeGroupId) return {};
        return allPartialsData[activeGroupId] || {};
    }, [activeGroupId, allPartialsData]);

    const partialData = useMemo(() => {
        return allPartialsDataForActiveGroup[activePartialId] || defaultPartialData;
    }, [allPartialsDataForActiveGroup, activePartialId]);
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<PartialData> => {
        return allPartialsData[groupId]?.[partialId] || defaultPartialData;
    }, [allPartialsData]);

    const createSetter = useCallback((field: keyof PartialData) => {
        return async (setter: React.SetStateAction<any>) => {
            if (!activeGroupId) return Promise.resolve();

            setAllPartialsData(prevAllData => {
                const currentGroupData = prevAllData[activeGroupId] || {};
                const currentPartialData = currentGroupData[activePartialId] || defaultPartialData;
                
                const newValue = typeof setter === 'function' ? setter(currentPartialData[field]) : setter;

                const newPartialData = { ...currentPartialData, [field]: newValue };

                return {
                    ...prevAllData,
                    [activeGroupId]: {
                        ...currentGroupData,
                        [activePartialId]: newPartialData,
                    }
                };
            });
            return Promise.resolve();
        };
    }, [activeGroupId, activePartialId]);
    
    const setSettings = useCallback(async (newSettings: { institutionName: string; logo: string; theme: string; apiKey: string }) => {
        setSettingsState(newSettings);
    }, []);

    const setCriteria = createSetter('criteria');
    const setGrades = createSetter('grades');
    const setAttendance = createSetter('attendance');
    const setParticipations = createSetter('participations');
    const setActivities = createSetter('activities');
    const setActivityRecords = createSetter('activityRecords');
    const setRecoveryGrades = createSetter('recoveryGrades');
    
    const setStudentFeedback = useCallback(async (studentId: string, feedback: string) => {
        if (!activeGroupId) return;

        setAllPartialsData(prevAllData => {
            const groupData = prevAllData[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            
            const newFeedbacks = { ...(pData.feedbacks || {}), [studentId]: feedback };
            const newPartialData = { ...pData, feedbacks: newFeedbacks };

            return {
                ...prevAllData,
                [activeGroupId]: {
                    ...groupData,
                    [activePartialId]: newPartialData,
                },
            };
        });
    }, [activeGroupId, activePartialId]);


    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData): { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean } => {
        if (!pData || !pData.criteria) return { finalGrade: 0, criteriaDetails: [], isRecovery: false };

        const recoveryInfo = pData.recoveryGrades?.[studentId];
        if (recoveryInfo?.applied) {
            return {
                finalGrade: recoveryInfo.grade,
                criteriaDetails: [{ name: 'Recuperación', earned: recoveryInfo.grade, weight: 100 }],
                isRecovery: true,
            };
        }
        
        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        
        for (const criterion of pData.criteria) {
            let performanceRatio = 0;

             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = pData.activities?.length ?? 0;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(pData.activityRecords?.[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                 const participationDates = Object.keys(pData.participations || {});
                 const studentAttendedDates = Object.keys(pData.attendance || {}).filter(date => pData.attendance?.[date]?.[studentId] === true);
                 const studentParticipationOpportunities = participationDates.filter(date => studentAttendedDates.includes(date)).length;

                if (studentParticipationOpportunities > 0) {
                    const studentParticipations = participationDates.reduce((count, date) => {
                        return count + (pData.participations?.[date]?.[studentId] ? 1 : 0);
                    }, 0);
                    performanceRatio = studentParticipations / studentParticipationOpportunities;
                } else {
                    performanceRatio = 1; // If no opportunities while present, grant full points to not penalize
                }
            } else {
                const delivered = pData.grades?.[studentId]?.[criterion.id]?.delivered ?? 0;
                const expected = criterion.expectedValue;
                if (expected > 0) {
                    performanceRatio = delivered / expected;
                }
            }
            const earnedPercentage = performanceRatio * criterion.weight;
            finalGrade += earnedPercentage;
            criteriaDetails.push({ name: criterion.name, earned: earnedPercentage, weight: criterion.weight });
        }
        
        const grade = Math.max(0, Math.min(100, finalGrade));
        return { finalGrade: grade, criteriaDetails: criteriaDetails, isRecovery: false };
    }, []);

    const calculateFinalGrade = useCallback((studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData): number => {
        const gId = forGroupId || activeGroupId;
        const pId = forPartialId || activePartialId;
        const data = forPartialData || (gId ? allPartialsData[gId]?.[pId] : undefined);
        if (!data) return 0;
        return calculateDetailedFinalGrade(studentId, data).finalGrade;
    }, [calculateDetailedFinalGrade, activeGroupId, activePartialId, allPartialsData]);

    const setActiveGroupId = (groupId: string | null) => {
        if(groupId !== activeGroupId) {
            setActiveGroupIdState(groupId);
        }
    };

    const activeGroup = useMemo(() => {
        if (!activeGroupId) return null;
        return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const activeStudentsInGroups = useMemo(() => {
      const studentSet = new Map<string, Student>();
      groups.forEach(group => {
        (group.students || []).forEach(student => {
          if (student && student.id) {
            studentSet.set(student.id, student);
          }
        });
      });
      return Array.from(studentSet.values());
    }, [groups]);
    
    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        const newStudentIds = new Set(students.map(s => s.id));
        setAllStudents(prev => [...prev.filter(s => !newStudentIds.has(s.id)), ...students]);
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: [...g.students, ...students]} : g));
    }, []);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: g.students.filter(s => s.id !== studentId)} : g));
    }, []);
    
    const setActivePartialId = (partialId: PartialId) => {
        setActivePartialIdState(partialId);
    };

    const deleteGroup = useCallback(async (groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if(activeGroupId === groupId) setActiveGroupIdState(null);
    }, [activeGroupId]);

    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
    }, []);
    
    const addStudentObservation = useCallback(async (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObservation: StudentObservation = {
            ...observation,
            id: `OBS-${Date.now()}`,
            date: new Date().toISOString(),
            followUpUpdates: [],
            isClosed: false,
        };
        setAllObservations(prev => ({
            ...prev,
            [observation.studentId]: [...(prev[observation.studentId] || []), newObservation],
        }));
    }, []);
    
    const updateStudentObservation = useCallback(async (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
      setAllObservations(prev => {
          const studentObs = (prev[studentId] || []).map(obs => {
              if (obs.id === observationId) {
                  const newUpdate = { date: new Date().toISOString(), update: updateText };
                  return {
                      ...obs,
                      followUpUpdates: [...obs.followUpUpdates, newUpdate],
                      isClosed: isClosing
                  };
              }
              return obs;
          });
          return { ...prev, [studentId]: studentObs };
      });
    }, []);
    
    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        setAllStudents(prev => prev.map(s => s.id === studentId ? {...s, ...data} : s));
        setGroups(prev => prev.map(g => ({
            ...g,
            students: g.students.map(s => s.id === studentId ? { ...s, ...data } : s),
        })));
    }, []);


    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        const safeAttendance = pAttendance || {};
        const studentAttendanceDays = Object.keys(safeAttendance).filter(date => Object.prototype.hasOwnProperty.call(safeAttendance[date], studentId));
        const totalDaysForStudent = studentAttendanceDays.length;

        const absences = studentAttendanceDays.reduce((count, date) => {
            return safeAttendance[date][studentId] === false ? count + 1 : count;
        }, 0);
        
        if (absences > 3) {
            return {
                level: 'high',
                reason: `Ausentismo crítico (${absences} faltas). Requiere atención independientemente del promedio.`
            };
        }

        if (finalGrade < 50 && absences >= 2) {
             return {
                level: 'high',
                reason: `Promedio de ${finalGrade.toFixed(0)}% y ${absences} faltas.`
            };
        }
        
        if (finalGrade <= 70 && absences >= 2) {
            return {
                level: 'medium',
                reason: `Promedio de ${finalGrade.toFixed(0)}% y ${absences} faltas.`
            };
        }
        
        return {level: 'low', reason: 'Sin riesgo detectado' };
    }, []);
    
    const groupAverages = useMemo(() => {
        if (!isClient) return {};
        const averages: { [groupId: string]: number } = {};
        groups.forEach(group => {
            const groupData = allPartialsData[group.id]?.[activePartialId];
            if (!groupData) {
                averages[group.id] = 0;
                return;
            }
            const groupGrades = group.students.map(s => calculateFinalGrade(s.id, group.id, activePartialId, groupData));
            const total = groupGrades.reduce((sum, grade) => sum + grade, 0);
            averages[group.id] = groupGrades.length > 0 ? total / groupGrades.length : 0;
        });
        return averages;
    }, [groups, activePartialId, calculateFinalGrade, allPartialsData, isClient]);
    
    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
        if (!isClient) return [];
        const studentsAtRiskInPartial = new Map<string, StudentWithRisk>();
        groups.forEach(group => {
            const groupPartialData = allPartialsData[group.id]?.[activePartialId];
            if (!groupPartialData) return;

            group.students.forEach(student => {
                const finalGrade = calculateFinalGrade(student.id, group.id, activePartialId, groupPartialData);
                const risk = getStudentRiskLevel(finalGrade, groupPartialData.attendance, student.id);

                if (risk.level === 'high' || risk.level === 'medium') {
                    studentsAtRiskInPartial.set(student.id, { ...student, calculatedRisk: risk });
                }
            });
        });

        return Array.from(studentsAtRiskInPartial.values());
    }, [groups, activePartialId, getStudentRiskLevel, calculateFinalGrade, allPartialsData, isClient]);
    
    const overallAverageParticipation = useMemo(() => {
        if (!activeGroup || !isClient) return 100;
        let totalRatio = 0;
        let studentsWithOpportunities = 0;

        activeGroup.students.forEach(student => {
            const participationDates = Object.keys(partialData.participations);
            const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(partialData.participations[date], student.id)).length;

            if (studentParticipationOpportunities > 0) {
                 const studentParticipations = Object.values(partialData.participations).filter(p => p[student.id]).length;
                 totalRatio += studentParticipations / studentParticipationOpportunities;
                 studentsWithOpportunities++;
            }
        });
        if (studentsWithOpportunities === 0) return 100;
        return (totalRatio / studentsWithOpportunities) * 100;

    }, [activeGroup, partialData.participations, isClient]);

    const takeAttendanceForDate = useCallback(async (groupId: string, date: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        const newAttendanceForDate = group.students.reduce((acc, student) => ({
            ...acc,
            [student.id]: true
        }), {} as {[studentId: string]: boolean});
        
        if (activeGroupId) {
            setAllPartialsData(prevAllData => {
                const currentGroupData = prevAllData[activeGroupId] || {};
                const currentPartialData = currentGroupData[activePartialId] || defaultPartialData;
                const newPartialData = { ...currentPartialData, attendance: { ...currentPartialData.attendance, [date]: newAttendanceForDate } };
                return {
                    ...prevAllData,
                    [activeGroupId]: {
                        ...currentGroupData,
                        [activePartialId]: newPartialData,
                    }
                };
            });
        }
        
    }, [groups, activeGroupId, activePartialId]);

    const resetAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            localStorage.removeItem('app_groups');
            localStorage.removeItem('app_students');
            localStorage.removeItem('app_observations');
            localStorage.removeItem('app_partialsData');
            localStorage.removeItem('app_settings');
            localStorage.removeItem('activeGroupId_v1');
            
            setGroups([]);
            setAllStudents([]);
            setAllObservations({});
            setAllPartialsData({});
            setSettingsState(defaultSettings);
            setActiveGroupIdState(null);
            
        } catch (e) {
            console.error("Failed to reset data", e);
            setError(e as Error);
        } finally {
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    }, []);

    const callGoogleAI = useCallback(async (prompt: string): Promise<string> => {
        if (!settings.apiKey) {
            throw new Error("No se ha configurado una clave API de Google AI. Ve a Ajustes para agregarla.");
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${settings.apiKey}`;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("AI API Error:", errorData);
                throw new Error(`Error del servicio de IA: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const feedbackText = data.candidates[0]?.content?.parts[0]?.text;
            
            if (!feedbackText) {
                throw new Error("La respuesta de la IA no contiene texto.");
            }

            return feedbackText;

        } catch (error) {
            console.error("Failed to call Google AI:", error);
            if (error instanceof Error) {
                 throw new Error(error.message);
            }
            throw new Error("Ocurrió un error desconocido al conectar con el servicio de IA.");
        }
    }, [settings.apiKey]);


    const generateFeedbackWithAI = useCallback(async (student: Student, stats: StudentStats): Promise<string> => {
        const criteriaSummary = stats.criteriaDetails.map(c => `- ${c.name}: ${c.earned.toFixed(0)}% de ${c.weight}%`).join('\n');
        const prompt = `
            Eres un asistente de docentes experto en pedagogía y comunicación asertiva.
            Tu tarea es generar una retroalimentación constructiva, profesional y personalizada para un estudiante, basada en sus datos de rendimiento.
            La retroalimentación debe ser balanceada, iniciando con fortalezas, luego áreas de oportunidad y finalizando con recomendaciones claras y accionables.
            Usa un tono de apoyo y motivador. No inventes información.

            DATOS DEL ESTUDIANTE:
            - Nombre: ${student.name}
            - Calificación final del parcial: ${stats.finalGrade.toFixed(0)}%
            - Tasa de asistencia: ${stats.attendance.rate.toFixed(0)}%
            - Desglose de calificación:
            ${criteriaSummary}

            Por favor, redacta la retroalimentación para ${student.name}.
        `;
        return callGoogleAI(prompt);
    }, [callGoogleAI]);

    const generateGroupAnalysisWithAI = useCallback(async (group: Group, summary: GroupReportSummary, recoverySummary: RecoverySummary, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]): Promise<string> => {
        const atRiskSummary = atRisk.length > 0
            ? `Se han identificado ${atRisk.length} estudiantes en riesgo (${atRisk.filter(s=>s.calculatedRisk.level==='high').length} en riesgo alto y ${atRisk.filter(s=>s.calculatedRisk.level==='medium').length} en riesgo medio).`
            : "No se han identificado estudiantes en riesgo significativo en este parcial.";

        const observationsSummary = observations.length > 0
            ? `Se han registrado ${observations.length} observaciones notables en la bitácora durante este periodo. Las más comunes son sobre: ${[...new Set(observations.map(o => o.type.toLowerCase()))].join(', ')}.`
            : "No se han registrado observaciones significativas en la bitácora para este grupo en el parcial.";
            
        const recoveryContext = recoverySummary.recoveryStudentsCount > 0 
            ? `Un total de ${recoverySummary.recoveryStudentsCount} estudiantes requirieron calificación de recuperación. De ellos, ${recoverySummary.approvedOnRecovery} lograron aprobar gracias a esta medida, mientras que ${recoverySummary.failedOnRecovery} no alcanzaron la calificación aprobatoria. Esto indica que la estrategia de recuperación fue parcialmente exitosa.`
            : `No hubo estudiantes que requirieran calificación de recuperación en este parcial, lo cual es un indicador positivo.`;

        const prompt = `
            Actúa como un analista educativo experto redactando un informe para un docente. Tu tarea es generar un análisis narrativo profesional, objetivo y fluido sobre el rendimiento de un grupo de estudiantes.
            Sintetiza los datos cuantitativos y cualitativos proporcionados en un texto coherente. La redacción debe ser formal, directa y constructiva, como si la hubiera escrito el propio docente para sus archivos o para un directivo.
            Evita frases como "según los datos" o "el análisis muestra". Integra los hallazgos de forma natural en la prosa.
            
            IMPORTANTE: No utilices asteriscos (*) para listas o para dar énfasis. Si necesitas resaltar algo, intégralo en la redacción de forma natural. No uses "lenguaje de IA" o formatos típicos de chatbot.

            DATOS DEL GRUPO A ANALIZAR:
            - Asignatura: ${group.subject}
            - Número de estudiantes: ${summary.totalStudents}
            - Promedio general del grupo: ${summary.groupAverage.toFixed(1)}%
            - Tasa de aprobación (incluyendo recuperación): ${(summary.approvedCount / summary.totalStudents * 100).toFixed(1)}% (${summary.approvedCount} de ${summary.totalStudents} estudiantes)
            - Tasa de asistencia general: ${summary.attendanceRate.toFixed(1)}%
            - Resumen de estudiantes en riesgo: ${atRiskSummary}
            - Resumen de la bitácora: ${observationsSummary}
            - Análisis de recuperación: ${recoveryContext}

            Basado en estos datos, redacta el análisis cualitativo. Enfócate en:
            1. Un párrafo inicial con el panorama general del rendimiento del grupo, mencionando el promedio y la tasa de aprobación.
            2. Un segundo párrafo analizando las posibles causas o correlaciones (ej. relación entre asistencia, observaciones de bitácora y rendimiento).
            3. Un tercer párrafo enfocado en la estrategia de recuperación, comentando su efectividad y sugiriendo acciones para los estudiantes que no lograron aprobar ni con esta medida.
            4. Un párrafo final con recomendaciones generales o siguientes pasos a considerar para el grupo.
        `;

        return callGoogleAI(prompt);
    }, [callGoogleAI]);


    const contextValue: DataContextType = {
        isLoading,
        error,
        groups,
        allStudents,
        activeStudentsInGroups,
        allObservations,
        settings,
        activeGroup,
        activePartialId,
        partialData,
        allPartialsDataForActiveGroup,
        groupAverages,
        atRiskStudents,
        overallAverageParticipation,
        addStudentsToGroup,
        removeStudentFromGroup,
        updateGroup,
        updateStudent,
        setActiveGroupId,
        setActivePartialId,
        setCriteria,
        setGrades,
        setAttendance,
        setParticipations,
        setActivities,
        setActivityRecords,
        setRecoveryGrades,
        setStudentFeedback,
        setSettings,
        setGroups,
        deleteGroup,
        addStudentObservation,
        updateStudentObservation,
        calculateFinalGrade,
        getStudentRiskLevel,
        calculateDetailedFinalGrade,
        fetchPartialData,
        takeAttendanceForDate,
        resetAllData,
        generateFeedbackWithAI,
        generateGroupAnalysisWithAI,
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

