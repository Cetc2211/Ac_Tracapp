

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, students as initialStudents, groups as initialGroups, StudentObservation } from '@/lib/placeholder-data';

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
    averageGrade: number;
    attendance: {
        p: number;
        a: number;
        total: number;
    };
    gradesByGroup: {
        group: string;
        grade: number;
        criteriaDetails: CriteriaDetail[];
        groupInfo: {
            subject: string;
            semester: string;
            groupName: string;
        };
    }[];
};

type PartialData = {
    criteria: EvaluationCriteria[];
    grades: Grades;
    attendance: AttendanceRecord;
    participations: ParticipationRecord;
    activities: Activity[];
    activityRecords: ActivityRecord;
};


// CONTEXT TYPE
interface DataContextType {
  // State
  students: Student[];
  groups: Group[];
  allStudents: Student[];
  allObservations: {[studentId: string]: StudentObservation[]};
  activeStudentsInGroups: Student[];
  settings: { institutionName: string; logo: string; theme: string };
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  
  partialData: PartialData;

  groupAverages: {[groupId: string]: number};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;

  // Setters
  setStudents: (students: Student[]) => void;
  setGroups: (groups: Group[]) => void;
  setAllStudents: (students: Student[]) => void;
  setAllObservations: React.Dispatch<React.SetStateAction<{[studentId: string]: StudentObservation[]}>>;
  setSettings: React.Dispatch<React.SetStateAction<{ institutionName: string; logo: string; theme: string; }>>;
  
  setActiveGroupId: (groupId: string | null) => void;
  setActivePartialId: (partialId: PartialId) => void;
  
  setCriteria: (criteria: EvaluationCriteria[]) => void;
  setGrades: (grades: React.SetStateAction<Grades>) => void;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord>>;
  setParticipations: React.Dispatch<React.SetStateAction<ParticipationRecord>>;
  setActivities: (activities: Activity[]) => void;
  setActivityRecords: React.Dispatch<React.SetStateAction<ActivityRecord>>;

  // Functions
  deleteGroup: (groupId: string) => void;
  calculateFinalGrade: (studentId: string, forPartialId?: PartialId, pCriteria?: EvaluationCriteria[], pGrades?: Grades, pParticipations?: ParticipationRecord, pActivities?: Activity[], pActivityRecords?: ActivityRecord) => number;
  calculateDetailedFinalGrade: (studentId: string, forGroupId?: string, forPartialId?: PartialId) => { finalGrade: number, criteriaDetails: CriteriaDetail[] };
  getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// UTILITY FUNCTIONS
const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: "",
    theme: "theme-default"
};

export const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    const item = JSON.stringify(value);
    window.localStorage.setItem(key, item);
  } catch (error) {
    console.warn(`Error writing to localStorage key “${key}”:`, error);
  }
};


// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    // Core data
    const [allStudents, setAllStudentsState] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [groups, setGroupsState] = useState<Group[]>([]);
    const [settings, setSettings] = useState(defaultSettings);
    
    // Active state
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');
    const [dataVersion, setDataVersion] = useState(0);
    
    // Data stores for active group
    const [partialData, setPartialData] = useState<PartialData>({
        criteria: [],
        grades: {},
        attendance: {},
        participations: {},
        activities: [],
        activityRecords: {},
    });
    
    // --- INITIAL DATA LOADING ---
    useEffect(() => {
        setAllStudentsState(loadFromLocalStorage<Student[]>('students', initialStudents));
        const loadedGroups = loadFromLocalStorage<Group[]>('groups', initialGroups);
        setGroupsState(loadedGroups);
        setAllObservations(loadFromLocalStorage<{[studentId: string]: StudentObservation[]}>('allObservations', {}));
        
        const storedActiveGroupId = loadFromLocalStorage<string | null>('activeGroupId', null);
        const activeGroupExists = loadedGroups.some(g => g.id === storedActiveGroupId);
        
        if (storedActiveGroupId && activeGroupExists) {
            setActiveGroupIdState(storedActiveGroupId);
        } else if (loadedGroups.length > 0) {
            const newActiveGroupId = loadedGroups[0].id;
            setActiveGroupIdState(newActiveGroupId);
            saveToLocalStorage('activeGroupId', newActiveGroupId);
        } else {
            setActiveGroupIdState(null);
        }
        
        const storedPartialId = loadFromLocalStorage<PartialId>('activePartialId', 'p1');
        setActivePartialIdState(storedPartialId);

        setSettings(loadFromLocalStorage('appSettings', defaultSettings));
        setDataVersion(v => v + 1); // Trigger initial data load for memos
    }, []);
    
    const loadPartialData = useCallback(() => {
        if(activeGroupId) {
            const keySuffix = `${activeGroupId}_${activePartialId}`;
            setPartialData({
                criteria: loadFromLocalStorage(`criteria_${keySuffix}`, []),
                grades: loadFromLocalStorage(`grades_${keySuffix}`, {}),
                attendance: loadFromLocalStorage(`attendance_${keySuffix}`, {}),
                participations: loadFromLocalStorage(`participations_${keySuffix}`, {}),
                activities: loadFromLocalStorage(`activities_${keySuffix}`, []),
                activityRecords: loadFromLocalStorage(`activityRecords_${keySuffix}`, {}),
            });
        } else {
            // Clear data if no group is active
            setPartialData({
                criteria: [], grades: {}, attendance: {},
                participations: {}, activities: [], activityRecords: {},
            });
        }
    }, [activeGroupId, activePartialId]);

    useEffect(() => {
        loadPartialData();
    }, [dataVersion, loadPartialData]);

    const calculateDetailedFinalGrade = useCallback((studentId: string, forGroupId?: string, forPartialId?: PartialId): { finalGrade: number, criteriaDetails: CriteriaDetail[] } => {
        const groupId = forGroupId || activeGroupId;
        const partialId = forPartialId || activePartialId;
        if (!groupId || !partialId) return { finalGrade: 0, criteriaDetails: [] };

        const keySuffix = `${groupId}_${partialId}`;
        const pCriteria = loadFromLocalStorage<EvaluationCriteria[]>(`criteria_${keySuffix}`, []);
        
        if (!pCriteria || pCriteria.length === 0) return { finalGrade: 0, criteriaDetails: [] };
        
        const pGrades = loadFromLocalStorage<Grades>(`grades_${keySuffix}`, {});
        const pParticipations = loadFromLocalStorage<ParticipationRecord>(`participations_${keySuffix}`, {});
        const pActivities = loadFromLocalStorage<Activity[]>(`activities_${keySuffix}`, []);
        const pActivityRecords = loadFromLocalStorage<ActivityRecord>(`activityRecords_${keySuffix}`, {});

        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        
        for (const criterion of pCriteria) {
            let performanceRatio = 0;

             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = pActivities.length;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(pActivityRecords[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                const participationDates = Object.keys(pParticipations);
                const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(pParticipations[date], studentId)).length;
                if (studentParticipationOpportunities > 0) {
                    const studentParticipations = Object.values(pParticipations).filter(p => p[studentId]).length;
                    performanceRatio = studentParticipations / studentParticipationOpportunities;
                }
            } else {
                const delivered = pGrades[studentId]?.[criterion.id]?.delivered ?? 0;
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
        return { finalGrade: grade, criteriaDetails: criteriaDetails };
    }, [activeGroupId, activePartialId]);

    const calculateFinalGrade = useCallback((studentId: string, forPartialId?: PartialId, pCriteria?: EvaluationCriteria[], pGrades?: Grades, pParticipations?: ParticipationRecord, pActivities?: Activity[], pActivityRecords?: ActivityRecord): number => {
        const partialId = forPartialId || activePartialId;
        
        let criteria, grades, participations, activities, activityRecords;

        if (pCriteria) {
            criteria = pCriteria;
            grades = pGrades || {};
            participations = pParticipations || {};
            activities = pActivities || [];
            activityRecords = pActivityRecords || {};
        } else if(partialId === activePartialId) {
            ({ criteria, grades, participations, activities, activityRecords } = partialData);
        } else if(activeGroupId) {
             const keySuffix = `${activeGroupId}_${partialId}`;
            criteria = loadFromLocalStorage(`criteria_${keySuffix}`, []);
            grades = loadFromLocalStorage(`grades_${keySuffix}`, {});
            participations = loadFromLocalStorage(`participations_${keySuffix}`, {});
            activities = loadFromLocalStorage(`activities_${keySuffix}`, []);
            activityRecords = loadFromLocalStorage(`activityRecords_${keySuffix}`, {});
        } else {
            return 0;
        }
        
        if (!criteria || criteria.length === 0) return 0;
        
        let finalGrade = 0;
        for (const criterion of criteria) {
            let performanceRatio = 0;
             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = activities.length;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(activityRecords[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                const participationDates = Object.keys(participations);
                const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(participations[date], studentId)).length;
                if (studentParticipationOpportunities > 0) {
                    const studentParticipations = Object.values(participations).filter(p => p[studentId]).length;
                    performanceRatio = studentParticipations / studentParticipationOpportunities;
                }
            } else {
                const delivered = grades[studentId]?.[criterion.id]?.delivered ?? 0;
                const expected = criterion.expectedValue;
                if (expected > 0) {
                    performanceRatio = delivered / expected;
                }
            }
            finalGrade += performanceRatio * criterion.weight;
        }

        return Math.max(0, Math.min(100, finalGrade));
    }, [activeGroupId, activePartialId, partialData]);

    // --- DERIVED STATE & MEMOS ---
    const activeGroup = useMemo(() => {
        return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const activeStudentsInGroups = useMemo(() => {
        const studentSet = new Set<Student>();
        const studentIdSet = new Set<string>();
        groups.forEach(group => {
            group.students.forEach(student => {
                if (!studentIdSet.has(student.id)) {
                    studentSet.add(student);
                    studentIdSet.add(student.id);
                }
            });
        });
        return Array.from(studentSet);
    }, [groups]);

    // --- WRAPPERS FOR STATE SETTERS TO PERSIST TO LOCALSTORAGE ---
    const setGroups = (newGroups: Group[]) => {
        setGroupsState(newGroups);
        saveToLocalStorage('groups', newGroups);
        setDataVersion(v => v + 1);
    };

    const setAllStudents = (newStudents: Student[]) => {
        setAllStudentsState(newStudents);
        saveToLocalStorage('students', newStudents);
        setDataVersion(v => v + 1);
    };
    
    const setCriteria = (newCriteria: EvaluationCriteria[]) => {
        if (!activeGroupId) return;
        const key = `criteria_${activeGroupId}_${activePartialId}`;
        saveToLocalStorage(key, newCriteria);
        setDataVersion(v => v + 1);
    };

    const setGrades = (value: React.SetStateAction<Grades>) => {
        if (!activeGroupId) return;
        const key = `grades_${activeGroupId}_${activePartialId}`;
        const newGrades = typeof value === 'function' ? value(partialData.grades) : value;
        saveToLocalStorage(key, newGrades);
        setDataVersion(v => v + 1);
    }
    
    const setAttendance = (value: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId) return;
        const key = `attendance_${activeGroupId}_${activePartialId}`;
        const newAttendance = typeof value === 'function' ? value(partialData.attendance) : value;
        saveToLocalStorage(key, newAttendance);
        setDataVersion(v => v + 1);
    }

    const setParticipations = (value: React.SetStateAction<ParticipationRecord>) => {
        if (!activeGroupId) return;
        const key = `participations_${activeGroupId}_${activePartialId}`;
        const newParticipations = typeof value === 'function' ? value(partialData.participations) : value;
        saveToLocalStorage(key, newParticipations);
        setDataVersion(v => v + 1);
    }
    
    const setActivities = (newActivities: Activity[]) => {
        if (!activeGroupId) return;
        const key = `activities_${activeGroupId}_${activePartialId}`;
        saveToLocalStorage(key, newActivities);
        setDataVersion(v => v + 1);
    }

    const setActivityRecords = (value: React.SetStateAction<ActivityRecord>) => {
        if (!activeGroupId) return;
        const key = `activityRecords_${activeGroupId}_${activePartialId}`;
        const newRecords = typeof value === 'function' ? value(partialData.activityRecords) : value;
        saveToLocalStorage(key, newRecords);
        setDataVersion(v => v + 1);
    }
    
    const setActiveGroupId = (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        saveToLocalStorage('activeGroupId', groupId);
        window.dispatchEvent(new Event('storage'));
        setDataVersion(v => v+1);
    };

    const setActivePartialId = (partialId: PartialId) => {
        setActivePartialIdState(partialId);
        saveToLocalStorage('activePartialId', partialId);
        setDataVersion(v => v+1);
    };

    const deleteGroup = (groupId: string) => {
        const newGroups = groups.filter(g => g.id !== groupId);
        setGroups(newGroups);
        
        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        const keysToRemove = [
            'criteria', 'grades', 'attendance', 'participations', 'activities', 'activityRecords'
        ];
        partials.forEach(p => {
            keysToRemove.forEach(k => {
                localStorage.removeItem(`${k}_${groupId}_${p}`);
            });
        });

        if (activeGroupId === groupId) {
            setActiveGroupId(null);
        }
    }
    
    const updateStudentObservation = (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
        setAllObservations(prev => {
            const studentObservations = prev[studentId] || [];
            const newObservations = studentObservations.map(obs => {
                if (obs.id === observationId) {
                    const newUpdate = { date: new Date().toISOString(), update: updateText };
                    return {
                        ...obs,
                        followUpUpdates: [...obs.followUpUpdates, newUpdate],
                        isClosed: isClosing,
                    };
                }
                return obs;
            });
            const newState = { ...prev, [studentId]: newObservations };
            saveToLocalStorage('allObservations', newState);
            return newState;
        });
    }

    // --- GLOBAL CALCULATIONS ---
    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        const safeAttendance = pAttendance || {};
        let absences = 0;
        const totalDaysForStudent = Object.keys(safeAttendance).filter(date => safeAttendance[date].hasOwnProperty(studentId)).length;
        
        if (totalDaysForStudent > 0) {
            Object.keys(safeAttendance).forEach(date => {
                if (safeAttendance[date]?.[studentId] === false) {
                    absences++;
                }
            });
        }
        
        const absencePercentage = totalDaysForStudent > 0 ? (absences / totalDaysForStudent) * 100 : 0;
        const reason = `Promedio de ${finalGrade.toFixed(0)}% y ${absencePercentage.toFixed(0)}% de ausencias.`;

        if (finalGrade < 70 || absencePercentage > 20) {
            return {level: 'high', reason };
        }
        if (finalGrade < 80 || absencePercentage > 10) {
           return {level: 'medium', reason };
        }
        
        return {level: 'low', reason: 'Sin riesgo detectado' };
    }, []);
    
    const groupAverages = useMemo(() => {
        const averages: { [groupId: string]: number } = {};
        groups.forEach(group => {
            const keySuffix = `${group.id}_${activePartialId}`;
            const pCriteria = loadFromLocalStorage<EvaluationCriteria[]>(`criteria_${keySuffix}`, []);
            if (pCriteria.length === 0) {
                averages[group.id] = 0;
                return;
            }
            const pGrades = loadFromLocalStorage<Grades>(`grades_${keySuffix}`, {});
            const pParticipations = loadFromLocalStorage<ParticipationRecord>(`participations_${keySuffix}`, {});
            const pActivities = loadFromLocalStorage<Activity[]>(`activities_${keySuffix}`, []);
            const pActivityRecords = loadFromLocalStorage<ActivityRecord>(`activityRecords_${keySuffix}`, {});
            
            const groupGrades = group.students.map(s => calculateFinalGrade(s.id, activePartialId, pCriteria, pGrades, pParticipations, pActivities, pActivityRecords));

            const total = groupGrades.reduce((sum, grade) => sum + grade, 0);
            averages[group.id] = groupGrades.length > 0 ? total / groupGrades.length : 0;
        });
        return averages;
    }, [groups, activePartialId, dataVersion, calculateFinalGrade]);
    

    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
        const studentsAtRiskInPartial = new Map<string, StudentWithRisk>();

        groups.forEach(group => {
            const keySuffix = `${group.id}_${activePartialId}`;
            const pCriteria = loadFromLocalStorage<EvaluationCriteria[]>(`criteria_${keySuffix}`, []);
            // If no criteria for this partial, no students can be at risk based on grades
            if (pCriteria.length === 0 && !Object.keys(loadFromLocalStorage<AttendanceRecord>(`attendance_${keySuffix}`, {})).length) return;

            const pGrades = loadFromLocalStorage<Grades>(`grades_${keySuffix}`, {});
            const pParticipations = loadFromLocalStorage<ParticipationRecord>(`participations_${keySuffix}`, {});
            const pActivities = loadFromLocalStorage<Activity[]>(`activities_${keySuffix}`, []);
            const pActivityRecords = loadFromLocalStorage<ActivityRecord>(`activityRecords_${keySuffix}`, {});
            const pAttendance = loadFromLocalStorage<AttendanceRecord>(`attendance_${keySuffix}`, {});

            group.students.forEach(student => {
                const finalGrade = calculateFinalGrade(student.id, activePartialId, pCriteria, pGrades, pParticipations, pActivities, pActivityRecords);
                const risk = getStudentRiskLevel(finalGrade, pAttendance, student.id);

                if (risk.level === 'high' || risk.level === 'medium') {
                    studentsAtRiskInPartial.set(student.id, { ...student, calculatedRisk: risk });
                }
            });
        });

        return Array.from(studentsAtRiskInPartial.values());
    }, [groups, activePartialId, getStudentRiskLevel, dataVersion, calculateFinalGrade]);
    
    
    const overallAverageParticipation = useMemo(() => {
        let totalPossibleAttendance = 0;
        let totalPresents = 0;
        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        
        groups.forEach(group => {
            partials.forEach(p => {
                const groupAttendance = loadFromLocalStorage<AttendanceRecord>(`attendance_${group.id}_${p}`, {});
                group.students.forEach(student => {
                    Object.keys(groupAttendance).forEach(date => {
                        if (groupAttendance[date]?.[student.id] !== undefined) {
                            totalPossibleAttendance++;
                            if (groupAttendance[date][student.id]) {
                                totalPresents++;
                            }
                        }
                    });
                });
            });
        });
        return totalPossibleAttendance > 0 ? Math.round((totalPresents / totalPossibleAttendance) * 100) : 100;
    }, [groups, dataVersion]);


    return (
        <DataContext.Provider value={{
            students: allStudents, groups, allStudents, allObservations, activeStudentsInGroups, settings, activeGroup, activePartialId,
            partialData,
            groupAverages, atRiskStudents, overallAverageParticipation,
            setStudents: setAllStudents, setGroups, setAllStudents, setAllObservations, setSettings, setActiveGroupId, setActivePartialId,
            setCriteria, setGrades, setAttendance, setParticipations, setActivities, setActivityRecords,
            deleteGroup, calculateFinalGrade, getStudentRiskLevel, calculateDetailedFinalGrade, updateStudentObservation
        }}>
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
