

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';


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
  addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => void;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => void;
  calculateFinalGrade: (studentId: string, forGroupId: string, forPartialId: PartialId) => number;
  calculateDetailedFinalGrade: (studentId: string, forGroupId: string, forPartialId: PartialId) => { finalGrade: number, criteriaDetails: CriteriaDetail[] };
  getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
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
    if (item === null) return defaultValue;
    if ((key.includes('activePartialId') || key.includes('activeGroupId')) && !item.startsWith('{') && !item.startsWith('[')) {
        return item as T;
    }
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    const item = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, item);
  } catch (error) {
    console.warn(`Error writing to localStorage key “${key}”:`, error);
  }
};


// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Auth state
    const [user, setUser] = useState<FirebaseUser | null>(null);

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

     useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const userKey = (key: string) => `${key}_${firebaseUser.uid}`;
                setAllStudentsState(loadFromLocalStorage(userKey('students'), []));
                setAllObservations(loadFromLocalStorage(userKey('allObservations'), {}));
                setGroupsState(loadFromLocalStorage(userKey('groups'), []));
                setSettings(loadFromLocalStorage(userKey('appSettings'), defaultSettings));
                setActiveGroupIdState(loadFromLocalStorage(userKey('activeGroupId'), null));
                setActivePartialIdState(loadFromLocalStorage(userKey('activePartialId'), 'p1'));
            } else {
                setAllStudentsState([]);
                setAllObservations({});
                setGroupsState([]);
                setSettings(defaultSettings);
                setActiveGroupIdState(null);
                setActivePartialIdState('p1');
            }
            setIsInitialized(true);
        });
        return () => unsubscribe();
    }, []);
    
    const userKey = useCallback((key: string) => {
        if (!user) return key;
        return `${key}_${user.uid}`;
    }, [user]);

    const loadPartialData = useCallback(() => {
        if (activeGroupId && user) {
            const keySuffix = `${activeGroupId}_${activePartialId}`;
            setPartialData({
                criteria: loadFromLocalStorage(userKey(`criteria_${keySuffix}`), []),
                grades: loadFromLocalStorage(userKey(`grades_${keySuffix}`), {}),
                attendance: loadFromLocalStorage(userKey(`attendance_${keySuffix}`), {}),
                participations: loadFromLocalStorage(userKey(`participations_${keySuffix}`), {}),
                activities: loadFromLocalStorage(userKey(`activities_${keySuffix}`), []),
                activityRecords: loadFromLocalStorage(userKey(`activityRecords_${keySuffix}`), {}),
            });
        } else {
             setPartialData({
                criteria: [], grades: {}, attendance: {},
                participations: {}, activities: [], activityRecords: {},
            });
        }
    }, [activeGroupId, activePartialId, user, userKey]);


    useEffect(() => {
        if(isInitialized) {
            loadPartialData();
        }
    }, [isInitialized, dataVersion, activeGroupId, activePartialId, loadPartialData]);

    const calculateDetailedFinalGrade = useCallback((studentId: string, forGroupId: string, forPartialId: PartialId): { finalGrade: number, criteriaDetails: CriteriaDetail[] } => {
        const keySuffix = `${forGroupId}_${forPartialId}`;
        const pCriteria = loadFromLocalStorage<EvaluationCriteria[]>(userKey(`criteria_${keySuffix}`), []);
        
        if (!pCriteria || pCriteria.length === 0) return { finalGrade: 0, criteriaDetails: [] };
        
        const pGrades = loadFromLocalStorage<Grades>(userKey(`grades_${keySuffix}`), {});
        const pParticipations = loadFromLocalStorage<ParticipationRecord>(userKey(`participations_${keySuffix}`), {});
        const pActivities = loadFromLocalStorage<Activity[]>(userKey(`activities_${keySuffix}`), []);
        const pActivityRecords = loadFromLocalStorage<ActivityRecord>(userKey(`activityRecords_${keySuffix}`), {});

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
    }, [userKey]);

    const calculateFinalGrade = useCallback((studentId: string, forGroupId: string, forPartialId: PartialId): number => {
        return calculateDetailedFinalGrade(studentId, forGroupId, forPartialId).finalGrade;
    }, [calculateDetailedFinalGrade]);

    // Derived State
    const setActiveGroupId = useCallback((groupId: string | null) => {
        saveToLocalStorage(userKey('activeGroupId'), groupId);
        setActiveGroupIdState(groupId);
    }, [userKey]);
    
    useEffect(() => {
        if (isInitialized) {
            const groupExists = groups.some(g => g.id === activeGroupId);
            if (activeGroupId && !groupExists) {
                setActiveGroupId(groups.length > 0 ? groups[0].id : null);
            } else if (!activeGroupId && groups.length > 0) {
                setActiveGroupId(groups[0].id)
            }
        }
    }, [groups, activeGroupId, isInitialized, setActiveGroupId]);


    const activeGroup = useMemo(() => {
        if (!activeGroupId) return null;
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

    const setGroups = (newGroups: Group[]) => {
        saveToLocalStorage(userKey('groups'), newGroups);
        setGroupsState(newGroups);
    };

    const setAllStudents = (newStudents: Student[]) => {
        saveToLocalStorage(userKey('students'), newStudents);
        setAllStudentsState(newStudents);
    };
    
    const setCriteria = (newCriteria: EvaluationCriteria[]) => {
        if (!activeGroupId) return;
        const key = userKey(`criteria_${activeGroupId}_${activePartialId}`);
        saveToLocalStorage(key, newCriteria);
        setDataVersion(v => v + 1);
    };

    const setGrades = (value: React.SetStateAction<Grades>) => {
        if (!activeGroupId) return;
        const key = userKey(`grades_${activeGroupId}_${activePartialId}`);
        const newGrades = typeof value === 'function' ? value(partialData.grades) : value;
        saveToLocalStorage(key, newGrades);
        setDataVersion(v => v + 1);
    }
    
    const setAttendance = (value: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId) return;
        const key = userKey(`attendance_${activeGroupId}_${activePartialId}`);
        const newAttendance = typeof value === 'function' ? value(partialData.attendance) : value;
        saveToLocalStorage(key, newAttendance);
        setDataVersion(v => v + 1);
    }

    const setParticipations = (value: React.SetStateAction<ParticipationRecord>) => {
        if (!activeGroupId) return;
        const key = userKey(`participations_${activeGroupId}_${activePartialId}`);
        const newParticipations = typeof value === 'function' ? value(partialData.participations) : value;
        saveToLocalStorage(key, newParticipations);
        setDataVersion(v => v + 1);
    }
    
    const setActivities = (newActivities: Activity[]) => {
        if (!activeGroupId) return;
        const key = userKey(`activities_${activeGroupId}_${activePartialId}`);
        saveToLocalStorage(key, newActivities);
        setDataVersion(v => v + 1);
    }

    const setActivityRecords = (value: React.SetStateAction<ActivityRecord>) => {
        if (!activeGroupId) return;
        const key = userKey(`activityRecords_${activeGroupId}_${activePartialId}`);
        const newRecords = typeof value === 'function' ? value(partialData.activityRecords) : value;
        saveToLocalStorage(key, newRecords);
        setDataVersion(v => v + 1);
    }
    
    const setActivePartialId = (partialId: PartialId) => {
        setActivePartialIdState(partialId);
        saveToLocalStorage(userKey('activePartialId'), partialId);
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
                localStorage.removeItem(userKey(`${k}_${groupId}_${p}`));
            });
        });

        if (activeGroupId === groupId) {
            setActiveGroupId(newGroups.length > 0 ? newGroups[0].id : null);
        }
    }
    
    const addStudentObservation = (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObservation: StudentObservation = {
            ...observation,
            id: `OBS-${Date.now()}`,
            date: new Date().toISOString(),
            followUpUpdates: [],
            isClosed: false,
        };
        
        setAllObservations(prev => {
            const studentObservations = prev[newObservation.studentId] || [];
            const newState = { ...prev, [newObservation.studentId]: [...studentObservations, newObservation] };
            saveToLocalStorage(userKey('allObservations'), newState);
            return newState;
        });
    };
    
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
            saveToLocalStorage(userKey('allObservations'), newState);
            return newState;
        });
    }

    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        const safeAttendance = pAttendance || {};
        const studentAttendanceDays = Object.keys(safeAttendance).filter(date => Object.prototype.hasOwnProperty.call(safeAttendance[date], studentId));
        const totalDaysForStudent = studentAttendanceDays.length;

        let absences = 0;
        if (totalDaysForStudent > 0) {
            absences = studentAttendanceDays.reduce((count, date) => {
                return safeAttendance[date][studentId] === false ? count + 1 : count;
            }, 0);
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
            const groupGrades = group.students.map(s => calculateFinalGrade(s.id, group.id, activePartialId));
            const total = groupGrades.reduce((sum, grade) => sum + grade, 0);
            averages[group.id] = groupGrades.length > 0 ? total / groupGrades.length : 0;
        });
        return averages;
    }, [groups, activePartialId, calculateFinalGrade]);
    
    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
        const studentsAtRiskInPartial = new Map<string, StudentWithRisk>();

        groups.forEach(group => {
            const pAttendance = loadFromLocalStorage<AttendanceRecord>(userKey(`attendance_${group.id}_${activePartialId}`), {});
            group.students.forEach(student => {
                const finalGrade = calculateFinalGrade(student.id, group.id, activePartialId);
                const risk = getStudentRiskLevel(finalGrade, pAttendance, student.id);

                if (risk.level === 'high' || risk.level === 'medium') {
                    studentsAtRiskInPartial.set(student.id, { ...student, calculatedRisk: risk });
                }
            });
        });

        return Array.from(studentsAtRiskInPartial.values());
    }, [groups, activePartialId, getStudentRiskLevel, calculateFinalGrade, userKey]);
    
    
    const overallAverageParticipation = useMemo(() => {
        let totalPossibleAttendance = 0;
        let totalPresents = 0;
        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        
        groups.forEach(group => {
            partials.forEach(p => {
                const groupAttendance = loadFromLocalStorage<AttendanceRecord>(userKey(`attendance_${group.id}_${p}`), {});
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
    }, [groups, userKey]);


    if (!isInitialized) {
        return <div className="flex h-screen w-full items-center justify-center">Cargando...</div>;
    }

    const contextValue: DataContextType = {
        students: allStudents, groups, allStudents, allObservations, activeStudentsInGroups, settings, activeGroup, activePartialId,
        partialData,
        groupAverages, atRiskStudents, overallAverageParticipation,
        setStudents: setAllStudents, setGroups, setAllStudents, setAllObservations, setSettings, setActiveGroupId, setActivePartialId,
        setCriteria, setGrades, setAttendance, setParticipations, setActivities, setActivityRecords,
        deleteGroup, addStudentObservation, updateStudentObservation,
        calculateFinalGrade, getStudentRiskLevel, calculateDetailedFinalGrade,
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
