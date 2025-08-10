
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, StudentObservation, students as initialStudents, groups as initialGroups } from '@/lib/placeholder-data';

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
        criteriaDetails: {
            name: string;
            earned: number;
            weight: number;
        }[];
    }[];
};


// CONTEXT TYPE
interface DataContextType {
  // State
  students: Student[];
  groups: Group[];
  allStudents: Student[];
  activeStudentsInGroups: Student[];
  settings: { institutionName: string; logo: string; theme: string };
  
  activeGroup: Group | null;
  
  criteria: EvaluationCriteria[];
  grades: Grades;
  attendance: AttendanceRecord;
  participations: ParticipationRecord;
  activities: Activity[];
  activityRecords: ActivityRecord;
  allObservations: { [studentId: string]: StudentObservation[] };

  groupAverages: {[groupId: string]: number};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;

  // Setters
  setStudents: (students: Student[]) => void;
  setGroups: (groups: Group[]) => void;
  setAllStudents: (students: Student[]) => void;
  setSettings: React.Dispatch<React.SetStateAction<{ institutionName: string; logo: string; theme: string; }>>;
  
  setActiveGroupId: (groupId: string | null) => void;
  
  setCriteria: (criteria: EvaluationCriteria[]) => void;
  setGrades: (grades: React.SetStateAction<Grades>) => void;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord>>;
  setParticipations: React.Dispatch<React.SetStateAction<ParticipationRecord>>;
  setActivities: (activities: Activity[]) => void;
  setActivityRecords: React.Dispatch<React.SetStateAction<ActivityRecord>>;

  // Functions
  saveStudentObservation: (observation: StudentObservation) => void;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => void;
  deleteGroup: (groupId: string) => void;
  calculateFinalGrade: (
    studentId: string, 
    criteria: EvaluationCriteria[],
    grades: Grades,
    participations: ParticipationRecord,
    activities: Activity[],
    activityRecords: ActivityRecord,
    studentObservations: StudentObservation[]
  ) => number;
  getStudentRiskLevel: (finalGrade: number, attendance: AttendanceRecord, studentId: string) => CalculatedRisk;
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
    const [groups, setGroupsState] = useState<Group[]>([]);
    const [settings, setSettings] = useState(defaultSettings);
    
    // Active state
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    
    // Data stores for active group
    const [criteria, setCriteriaState] = useState<EvaluationCriteria[]>([]);
    const [grades, setGradesState] = useState<Grades>({});
    const [attendance, setAttendanceState] = useState<AttendanceRecord>({});
    const [participations, setParticipationsState] = useState<ParticipationRecord>({});
    const [activities, setActivitiesState] = useState<Activity[]>([]);
    const [activityRecords, setActivityRecordsState] = useState<ActivityRecord>({});
    const [allObservations, setAllObservations] = useState<{ [studentId: string]: StudentObservation[] }>({});
    
    // --- INITIAL DATA LOADING ---
    useEffect(() => {
        setAllStudentsState(loadFromLocalStorage<Student[]>('students', initialStudents));
        const loadedGroups = loadFromLocalStorage<Group[]>('groups', initialGroups);
        setGroupsState(loadedGroups);
        
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

        setSettings(loadFromLocalStorage('appSettings', defaultSettings));
        setAllObservations(loadFromLocalStorage('allObservations', {}));
    }, []);
    
    // --- ACTIVE GROUP DATA LOADING ---
    useEffect(() => {
        if(activeGroupId) {
            setCriteriaState(loadFromLocalStorage(`criteria_${activeGroupId}`, []));
            setGradesState(loadFromLocalStorage(`grades_${activeGroupId}`, {}));
            setAttendanceState(loadFromLocalStorage(`attendance_${activeGroupId}`, {}));
            setParticipationsState(loadFromLocalStorage(`participations_${activeGroupId}`, {}));
            setActivitiesState(loadFromLocalStorage(`activities_${activeGroupId}`, []));
            setActivityRecordsState(loadFromLocalStorage(`activityRecords_${activeGroupId}`, {}));
        } else {
            // Clear data if no group is active
            setCriteriaState([]);
            setGradesState({});
            setAttendanceState({});
            setParticipationsState({});
            setActivitiesState([]);
            setActivityRecordsState({});
        }
    }, [activeGroupId]);


    const calculateFinalGrade = useCallback((
      studentId: string, 
      pCriteria: EvaluationCriteria[],
      pGrades: Grades,
      pParticipations: ParticipationRecord,
      pActivities: Activity[],
      pActivityRecords: ActivityRecord,
      pStudentObservations: StudentObservation[]
    ): number => {
        if (!pCriteria || pCriteria.length === 0) return 0;
        
        let finalGrade = 0;
        
        for (const criterion of pCriteria) {
            let performanceRatio = 0;

             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = pActivities.length;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(pActivityRecords[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                const totalClasses = Object.keys(pParticipations).length;
                if (totalClasses > 0) {
                    const studentParticipations = Object.values(pParticipations).filter(day => day[studentId]).length;
                    performanceRatio = studentParticipations / totalClasses;
                }
            } else {
                const delivered = pGrades[studentId]?.[criterion.id]?.delivered ?? 0;
                const expected = criterion.expectedValue;
                if (expected > 0) {
                    performanceRatio = delivered / expected;
                }
            }
            finalGrade += (performanceRatio * criterion.weight);
        }
        
        const merits = pStudentObservations.filter(o => o.type === 'Mérito').length;
        const demerits = pStudentObservations.filter(o => o.type === 'Demérito').length;
        finalGrade += merits;
        finalGrade -= demerits;

        return Math.max(0, Math.min(100, finalGrade));
    }, []);

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
    };

    const setAllStudents = (newStudents: Student[]) => {
        setAllStudentsState(newStudents);
        saveToLocalStorage('students', newStudents);
    };
    
    const setCriteria = (newCriteria: EvaluationCriteria[]) => {
        if (!activeGroupId) return;
        setCriteriaState(newCriteria);
        saveToLocalStorage(`criteria_${activeGroupId}`, newCriteria);
    };

    const setGrades = (value: React.SetStateAction<Grades>) => {
        if (!activeGroupId) return;
        setGradesState(prev => {
            const newGrades = typeof value === 'function' ? value(prev) : value;
            saveToLocalStorage(`grades_${activeGroupId}`, newGrades);
            return newGrades;
        });
    }
    
    const setAttendance = (value: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId) return;
        setAttendanceState(prev => {
            const newAttendance = typeof value === 'function' ? value(prev) : value;
            saveToLocalStorage(`attendance_${activeGroupId}`, newAttendance);
            return newAttendance;
        });
    }

    const setParticipations = (value: React.SetStateAction<ParticipationRecord>) => {
        if (!activeGroupId) return;
        setParticipationsState(prev => {
            const newParticipations = typeof value === 'function' ? value(prev) : value;
            saveToLocalStorage(`participations_${activeGroupId}`, newParticipations);
            return newParticipations;
        });
    }
    
    const setActivities = (newActivities: Activity[]) => {
        if (!activeGroupId) return;
        setActivitiesState(newActivities);
        saveToLocalStorage(`activities_${activeGroupId}`, newActivities);
    }

    const setActivityRecords = (value: React.SetStateAction<ActivityRecord>) => {
        if (!activeGroupId) return;
        setActivityRecordsState(prev => {
             const newRecords = typeof value === 'function' ? value(prev) : value;
             saveToLocalStorage(`activityRecords_${activeGroupId}`, newRecords);
             return newRecords;
        });
    }
    
    const setActiveGroupId = (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        saveToLocalStorage('activeGroupId', groupId);
        window.dispatchEvent(new Event('storage'));
    };

    const saveStudentObservation = (observation: StudentObservation) => {
        setAllObservations(prev => {
            const studentObs = prev[observation.studentId] || [];
            const newStudentObs = [...studentObs, observation];
            const newState = {...prev, [observation.studentId]: newStudentObs };
            saveToLocalStorage('allObservations', newState);
            return newState;
        });
    };

    const updateStudentObservation = (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
        setAllObservations(prev => {
            const studentObs = prev[studentId] || [];
            const newStudentObs = studentObs.map(obs => {
                if (obs.id === observationId) {
                    const newUpdates = [...obs.followUpUpdates, { date: new Date().toISOString(), update: updateText }];
                    return { ...obs, followUpUpdates: newUpdates, isClosed: isClosing };
                }
                return obs;
            });
            const newState = { ...prev, [studentId]: newStudentObs };
            saveToLocalStorage('allObservations', newState);
            return newState;
        });
    }

    const deleteGroup = (groupId: string) => {
        const newGroups = groups.filter(g => g.id !== groupId);
        setGroups(newGroups);
        localStorage.removeItem(`criteria_${groupId}`);
        localStorage.removeItem(`grades_${groupId}`);
        localStorage.removeItem(`attendance_${groupId}`);
        localStorage.removeItem(`participations_${groupId}`);
        localStorage.removeItem(`activities_${groupId}`);
        localStorage.removeItem(`activityRecords_${groupId}`);

        if (activeGroupId === groupId) {
            setActiveGroupId(null);
        }
    }

    // --- GLOBAL CALCULATIONS ---
    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        let absences = 0;
        const totalDaysForStudent = Object.keys(pAttendance).filter(date => pAttendance[date].hasOwnProperty(studentId)).length;
        
        if (totalDaysForStudent > 0) {
            Object.keys(pAttendance).forEach(date => {
                if (pAttendance[date]?.[studentId] === false) {
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
            const pCriteria = loadFromLocalStorage<EvaluationCriteria[]>(`criteria_${group.id}`, []);
            if (pCriteria.length === 0) {
                averages[group.id] = 0;
                return;
            }
            const pGrades = loadFromLocalStorage<Grades>(`grades_${group.id}`, {});
            const pParticipations = loadFromLocalStorage<ParticipationRecord>(`participations_${group.id}`, {});
            const pActivities = loadFromLocalStorage<Activity[]>(`activities_${group.id}`, []);
            const pActivityRecords = loadFromLocalStorage<ActivityRecord>(`activityRecords_${group.id}`, {});
            const studentObservations = Object.entries(allObservations).reduce((acc, [studentId, observations]) => {
                if(group.students.some(s => s.id === studentId)) {
                    acc[studentId] = observations;
                }
                return acc;
            }, {} as {[studentId: string]: StudentObservation[]});
            
            const groupGrades = group.students.map(s => {
                return calculateFinalGrade(s.id, pCriteria, pGrades, pParticipations, pActivities, pActivityRecords, studentObservations[s.id] || []);
            });

            const total = groupGrades.reduce((sum, grade) => sum + grade, 0);
            averages[group.id] = groupGrades.length > 0 ? total / groupGrades.length : 0;
        });
        return averages;
    }, [groups, allObservations, calculateFinalGrade]);
    

    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
        if (!activeGroup) return [];

        const pCriteria = criteria;
        if (pCriteria.length === 0) return [];
        
        return activeGroup.students.map(student => {
            const studentObs = allObservations[student.id] || [];
            const finalGrade = calculateFinalGrade(student.id, pCriteria, grades, participations, activities, activityRecords, studentObs);
            const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
            return { ...student, calculatedRisk: risk };
        }).filter(student => student.calculatedRisk.level === 'high' || student.calculatedRisk.level === 'medium');

    }, [activeGroup, criteria, grades, participations, activities, activityRecords, attendance, allObservations, calculateFinalGrade, getStudentRiskLevel]);
    
    
    const overallAverageParticipation = useMemo(() => {
        let totalPossibleAttendance = 0;
        let totalPresents = 0;
        groups.forEach(group => {
            const groupAttendance = loadFromLocalStorage<AttendanceRecord>(`attendance_${group.id}`, {});
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
        return totalPossibleAttendance > 0 ? Math.round((totalPresents / totalPossibleAttendance) * 100) : 100;
    }, [groups]);


    return (
        <DataContext.Provider value={{
            students: allStudents, groups, allStudents, activeStudentsInGroups, settings, activeGroup,
            criteria, grades, attendance, participations, activities, activityRecords, allObservations,
            groupAverages, atRiskStudents, overallAverageParticipation,
            setStudents: setAllStudents, setGroups, setAllStudents, setSettings, setActiveGroupId,
            setCriteria, setGrades, setAttendance, setParticipations, setActivities, setActivityRecords,
            saveStudentObservation, updateStudentObservation, deleteGroup, calculateFinalGrade, getStudentRiskLevel
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
