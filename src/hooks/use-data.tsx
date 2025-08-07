
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, StudentObservation, students as initialStudents, groups as initialGroups, PartialId } from '@/lib/placeholder-data';

// TYPE DEFINITIONS
export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
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
  activePartial: PartialId | null;
  
  criteria: EvaluationCriteria[];
  grades: Grades;
  attendance: AttendanceRecord;
  participations: ParticipationRecord;
  activities: Activity[];
  activityRecords: ActivityRecord;
  observations: StudentObservation[];

  groupStats: {[groupId: string]: GroupStats};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;
  groupAverages: {[groupId: string]: number};

  allObservations: { [studentId: string]: StudentObservation[] };
  allCriteria: { [key: string]: EvaluationCriteria[] };
  allGrades: { [key: string]: Grades };
  allParticipations: { [key: string]: ParticipationRecord };
  allActivities: { [key: string]: Activity[] };
  allActivityRecords: { [key: string]: ActivityRecord };
  allAttendances: { [key: string]: AttendanceRecord };

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
  setActivePartialForGroup: (groupId: string, partial: PartialId) => void;
  togglePartialLock: (groupId: string, partial: PartialId) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// UTILITY FUNCTIONS
const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: "",
    theme: "theme-default"
};

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
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

const getPartialDataKey = (baseKey: string, groupId: string, partialId: PartialId) => {
    return `${baseKey}_${groupId}_${partialId}`;
}

// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    // Core data
    const [allStudents, setAllStudentsState] = useState<Student[]>([]);
    const [groups, setGroupsState] = useState<Group[]>([]);
    const [settings, setSettings] = useState(defaultSettings);
    
    // Active state
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    
    // Data stores for all groups and partials
    const [allCriteria, setAllCriteria] = useState<{[key: string]: EvaluationCriteria[]}>({});
    const [allGrades, setAllGrades] = useState<{[key: string]: Grades}>({});
    const [allAttendances, setAllAttendances] = useState<{[key: string]: AttendanceRecord}>({});
    const [allParticipations, setAllParticipations] = useState<{[key: string]: ParticipationRecord}>({});
    const [allActivities, setAllActivities] = useState<{[key: string]: Activity[]}>({});
    const [allActivityRecords, setAllActivityRecords] = useState<{[key: string]: ActivityRecord}>({});
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    
    // --- INITIAL DATA LOADING ---
    useEffect(() => {
        const loadedStudents = loadFromLocalStorage<Student[]>('students', initialStudents);
        const loadedGroups = loadFromLocalStorage<Group[]>('groups', initialGroups);
        const loadedSettings = loadFromLocalStorage('appSettings', defaultSettings);
        const storedActiveGroupId = loadFromLocalStorage<string | null>('activeGroupId', null);

        setAllStudentsState(loadedStudents);
        setGroupsState(loadedGroups);
        setSettings(loadedSettings);
        setActiveGroupIdState(storedActiveGroupId);

        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        const criteriaStore: {[key: string]: EvaluationCriteria[]} = {};
        const gradesStore: {[key: string]: Grades} = {};
        const attendancesStore: {[key: string]: AttendanceRecord} = {};
        const participationsStore: {[key: string]: ParticipationRecord} = {};
        const activitiesStore: {[key: string]: Activity[]} = {};
        const activityRecordsStore: {[key: string]: ActivityRecord} = {};
        const observationsStore: {[studentId: string]: StudentObservation[]} = {};

        for (const group of loadedGroups) {
          for (const partial of partials) {
            const criteriaKey = getPartialDataKey('criteria', group.id, partial);
            criteriaStore[criteriaKey] = loadFromLocalStorage(criteriaKey, []);

            const gradesKey = getPartialDataKey('grades', group.id, partial);
            gradesStore[gradesKey] = loadFromLocalStorage(gradesKey, {});
            
            const attendanceKey = getPartialDataKey('attendance', group.id, partial);
            attendancesStore[attendanceKey] = loadFromLocalStorage(attendanceKey, {});
            
            const participationsKey = getPartialDataKey('participations', group.id, partial);
            participationsStore[participationsKey] = loadFromLocalStorage(participationsKey, {});
            
            const activitiesKey = getPartialDataKey('activities', group.id, partial);
            activitiesStore[activitiesKey] = loadFromLocalStorage(activitiesKey, []);
            
            const activityRecordsKey = getPartialDataKey('activityRecords', group.id, partial);
            activityRecordsStore[activityRecordsKey] = loadFromLocalStorage(activityRecordsKey, {});
          }
        }
        setAllCriteria(criteriaStore);
        setAllGrades(gradesStore);
        setAllAttendances(attendancesStore);
        setAllParticipations(participationsStore);
        setAllActivities(activitiesStore);
        setAllActivityRecords(activityRecordsStore);
        
        for (const student of loadedStudents) {
            observationsStore[student.id] = loadFromLocalStorage(`observations_${student.id}`, []);
        }
        setAllObservations(observationsStore);

    }, []);

    const calculateFinalGrade = useCallback((
      studentId: string, 
      criteria: EvaluationCriteria[],
      grades: Grades,
      participations: ParticipationRecord,
      activities: Activity[],
      activityRecords: ActivityRecord,
      studentObservations: StudentObservation[]
    ): number => {
        let finalGrade = 0;
        
        if (criteria.length > 0) {
            for (const criterion of criteria) {
                let performanceRatio = 0;

                 if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                    const totalActivities = activities.length;
                    if (totalActivities > 0) {
                        const deliveredActivities = Object.values(activityRecords[studentId] || {}).filter(Boolean).length;
                        performanceRatio = deliveredActivities / totalActivities;
                    }
                } else if (criterion.name === 'Participación') {
                    const totalClasses = Object.keys(participations).length;
                    if (totalClasses > 0) {
                        const studentParticipations = Object.values(participations).filter(day => day[studentId]).length;
                        performanceRatio = studentParticipations / totalClasses;
                    }
                } else {
                    const delivered = grades[studentId]?.[criterion.id]?.delivered ?? 0;
                    const expected = criterion.expectedValue;
                    if (expected > 0) {
                        performanceRatio = delivered / expected;
                    }
                }
                finalGrade += (performanceRatio * criterion.weight);
            }
        }
        
        const safeStudentObservations = studentObservations || [];
        const merits = safeStudentObservations.filter(o => o.type === 'Mérito').length;
        const demerits = safeStudentObservations.filter(o => o.type === 'Demérito').length;
        finalGrade += (merits * 1);
        finalGrade -= (demerits * 1);

        return Math.max(0, Math.min(100, finalGrade));
    }, []);

    // --- DERIVED STATE & MEMOS ---
    const activeGroup = useMemo(() => {
        return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const activePartial = useMemo(() => {
        return activeGroup?.activePartial || null;
    }, [activeGroup]);

    const criteria = useMemo(() => {
        if (!activeGroupId || !activePartial) return [];
        return allCriteria[getPartialDataKey('criteria', activeGroupId, activePartial)] || [];
    }, [activeGroupId, activePartial, allCriteria]);

    const grades = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allGrades[getPartialDataKey('grades', activeGroupId, activePartial)] || {};
    }, [activeGroupId, activePartial, allGrades]);

    const attendance = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allAttendances[getPartialDataKey('attendance', activeGroupId, activePartial)] || {};
    }, [activeGroupId, activePartial, allAttendances]);

    const participations = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allParticipations[getPartialDataKey('participations', activeGroupId, activePartial)] || {};
    }, [activeGroupId, activePartial, allParticipations]);
    
    const activities = useMemo(() => {
        if (!activeGroupId || !activePartial) return [];
        return allActivities[getPartialDataKey('activities', activeGroupId, activePartial)] || [];
    }, [activeGroupId, activePartial, allActivities]);
    
    const activityRecords = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allActivityRecords[getPartialDataKey('activityRecords', activeGroupId, activePartial)] || {};
    }, [activeGroupId, activePartial, allActivityRecords]);
    
    const observations = useMemo(() => {
        return Object.values(allObservations).flat();
    }, [allObservations]);

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
    
    const setCriteriaWrapper = (newCriteria: EvaluationCriteria[]) => {
        if (!activeGroupId || !activePartial) return;
        const key = getPartialDataKey('criteria', activeGroupId, activePartial);
        setAllCriteria(prev => ({...prev, [key]: newCriteria}));
        saveToLocalStorage(key, newCriteria);
    };

    const setGradesWrapper = (value: React.SetStateAction<Grades>) => {
        if (!activeGroupId || !activePartial) return;
        const key = getPartialDataKey('grades', activeGroupId, activePartial);
        setAllGrades(prev => {
            const currentGrades = prev[key] || {};
            const newGrades = typeof value === 'function' ? value(currentGrades) : value;
            const updatedState = {...prev, [key]: newGrades};
            saveToLocalStorage(key, newGrades);
            return updatedState;
        });
    }
    
    const setAttendanceWrapper = (value: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId || !activePartial) return;
        const key = getPartialDataKey('attendance', activeGroupId, activePartial);
        setAllAttendances(prev => {
            const currentAttendance = prev[key] || {};
            const newAttendance = typeof value === 'function' ? value(currentAttendance) : value;
            const updatedState = {...prev, [key]: newAttendance};
            saveToLocalStorage(key, newAttendance);
            return updatedState;
        });
    }

    const setParticipationsWrapper = (value: React.SetStateAction<ParticipationRecord>) => {
        if (!activeGroupId || !activePartial) return;
        const key = getPartialDataKey('participations', activeGroupId, activePartial);
        setAllParticipations(prev => {
            const currentParticipations = prev[key] || {};
            const newParticipations = typeof value === 'function' ? value(currentParticipations) : value;
            const updatedState = {...prev, [key]: newParticipations};
            saveToLocalStorage(key, newParticipations);
            return updatedState;
        });
    }
    
    const setActivitiesWrapper = (newActivities: Activity[]) => {
        if (!activeGroupId || !activePartial) return;
        const key = getPartialDataKey('activities', activeGroupId, activePartial);
        setAllActivities(prev => ({ ...prev, [key]: newActivities }));
        saveToLocalStorage(key, newActivities);
    }

    const setActivityRecordsWrapper = (value: React.SetStateAction<ActivityRecord>) => {
        if (!activeGroupId || !activePartial) return;
        const key = getPartialDataKey('activityRecords', activeGroupId, activePartial);
        setAllActivityRecords(prev => {
             const currentRecords = prev[key] || {};
             const newRecords = typeof value === 'function' ? value(currentRecords) : value;
             const updatedState = {...prev, [key]: newRecords};
             saveToLocalStorage(key, newRecords);
             return updatedState;
        });
    }
    
    const setActiveGroupId = (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        saveToLocalStorage('activeGroupId', groupId);
        window.dispatchEvent(new Event('storage'));
    };

    const setActivePartialForGroup = useCallback((groupId: string, partial: PartialId) => {
        setGroupsState(prevGroups => {
            const newGroups = prevGroups.map(g => {
                if (g.id === groupId) {
                    return { ...g, activePartial: partial };
                }
                return g;
            });
            saveToLocalStorage('groups', newGroups);
            return newGroups;
        });
    }, []);

    const togglePartialLock = useCallback((groupId: string, partial: PartialId) => {
        setGroupsState(prevGroups => {
            const newGroups = prevGroups.map(g => {
                if (g.id === groupId) {
                    const currentClosed = g.closedPartials || [];
                    const isClosed = currentClosed.includes(partial);
                    const newClosedPartials = isClosed
                        ? currentClosed.filter(p => p !== partial)
                        : [...currentClosed, partial];
                    return { ...g, closedPartials: newClosedPartials };
                }
                return g;
            });
            saveToLocalStorage('groups', newGroups);
            return newGroups;
        });
    }, []);


    const saveStudentObservation = (observation: StudentObservation) => {
        const key = `observations_${observation.studentId}`;
        setAllObservations(prev => {
            const studentObs = prev[observation.studentId] || [];
            const newStudentObs = [...studentObs, observation];
            saveToLocalStorage(key, newStudentObs);
            return {...prev, [observation.studentId]: newStudentObs };
        });
    };

    const updateStudentObservation = (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
        const key = `observations_${studentId}`;
        setAllObservations(prev => {
            const studentObs = prev[studentId] || [];
            const newStudentObs = studentObs.map(obs => {
                if (obs.id === observationId) {
                    const newUpdates = [...obs.followUpUpdates, { date: new Date().toISOString(), update: updateText }];
                    return { ...obs, followUpUpdates: newUpdates, isClosed: isClosing };
                }
                return obs;
            });
            saveToLocalStorage(key, newStudentObs);
            return { ...prev, [studentId]: newStudentObs };
        });
    }

    const deleteGroup = (groupId: string) => {
        const newGroups = groups.filter(g => g.id !== groupId);
        setGroups(newGroups);
        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        for(const partial of partials) {
            localStorage.removeItem(getPartialDataKey('criteria', groupId, partial));
            localStorage.removeItem(getPartialDataKey('grades', groupId, partial));
            localStorage.removeItem(getPartialDataKey('attendance', groupId, partial));
            localStorage.removeItem(getPartialDataKey('participations', groupId, partial));
            localStorage.removeItem(getPartialDataKey('activities', groupId, partial));
            localStorage.removeItem(getPartialDataKey('activityRecords', groupId, partial));
        }
        if (activeGroupId === groupId) {
            setActiveGroupId(null);
        }
    }

    // --- GLOBAL CALCULATIONS ---
    const getStudentRiskLevel = useCallback((finalGrade: number, attendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        let absences = 0;
        const totalDays = Object.keys(attendance).filter(date => attendance[date].hasOwnProperty(studentId)).length;
        
        if (totalDays > 0) {
            Object.keys(attendance).forEach(date => {
                if (attendance[date][studentId] === false) {
                    absences++;
                }
            });
        }
        
        const absencePercentage = totalDays > 0 ? (absences / totalDays) * 100 : 0;
        const reason = `Promedio de ${finalGrade.toFixed(0)}% y ${absencePercentage.toFixed(0)}% de ausencias.`;

        if (finalGrade < 70 || absencePercentage > 20) {
            return {level: 'high', reason };
        }
        if (finalGrade < 80 || absencePercentage > 10) {
           return {level: 'medium', reason };
        }
        
        return {level: 'low', reason: 'Sin riesgo detectado' };
    }, []);

    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
        const students: StudentWithRisk[] = [];
        const checkedStudentIds = new Set<string>();
        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        
        groups.forEach(group => {
            group.students.forEach(student => {
                if(checkedStudentIds.has(student.id)) return;

                for(const partial of partials) {
                    const groupCriteria = allCriteria[getPartialDataKey('criteria', group.id, partial)] || [];
                    const groupGrades = allGrades[getPartialDataKey('grades', group.id, partial)] || {};
                    const groupParticipations = allParticipations[getPartialDataKey('participations', group.id, partial)] || {};
                    const groupAttendance = allAttendances[getPartialDataKey('attendance', group.id, partial)] || {};
                    const groupActivities = allActivities[getPartialDataKey('activities', group.id, partial)] || [];
                    const groupActivityRecords = allActivityRecords[getPartialDataKey('activityRecords', group.id, partial)] || {};
                    const studentObservations = allObservations[student.id] || [];
                    const finalGrade = calculateFinalGrade(student.id, groupCriteria, groupGrades, groupParticipations, groupActivities, groupActivityRecords, studentObservations);
                    const risk = getStudentRiskLevel(finalGrade, groupAttendance, student.id);
                    if (risk.level === 'high' || risk.level === 'medium') {
                        students.push({ ...student, calculatedRisk: risk });
                        checkedStudentIds.add(student.id);
                        return; // Found risk in one partial, move to next student
                    }
                }
                 checkedStudentIds.add(student.id);
            });
        });
        return students.sort((a, b) => {
            if (a.calculatedRisk.level === 'high' && b.calculatedRisk.level !== 'high') return -1;
            if (a.calculatedRisk.level !== 'high' && b.calculatedRisk.level === 'high') return 1;
            return 0;
        });
    }, [groups, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances, allObservations, calculateFinalGrade, getStudentRiskLevel]);
    
    const groupStats = useMemo(() => {
        const allStats: {[groupId: string]: GroupStats} = {};
        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        for(const group of groups) {
            let totalGradeSum = 0;
            let partialsWithData = 0;
            let highRiskStudents = new Set<string>();

            for (const partial of partials) {
                const groupCriteria = allCriteria[getPartialDataKey('criteria', group.id, partial)] || [];
                const groupGrades = allGrades[getPartialDataKey('grades', group.id, partial)] || {};
                
                if (groupCriteria.length === 0 && Object.keys(groupGrades).length === 0) continue;
                
                const groupParticipations = allParticipations[getPartialDataKey('participations', group.id, partial)] || {};
                const groupAttendance = allAttendances[getPartialDataKey('attendance', group.id, partial)] || {};
                const groupActivities = allActivities[getPartialDataKey('activities', group.id, partial)] || [];
                const groupActivityRecords = allActivityRecords[getPartialDataKey('activityRecords', group.id, partial)] || {};

                const groupFinalGrades = group.students.map(s => {
                    const studentObservations = allObservations[s.id] || [];
                    const finalGrade = calculateFinalGrade(s.id, groupCriteria, groupGrades, groupParticipations, groupActivities, groupActivityRecords, studentObservations);
                     const risk = getStudentRiskLevel(finalGrade, groupAttendance, s.id);
                    if (risk.level === 'high') {
                        highRiskStudents.add(s.id);
                    }
                    return finalGrade;
                });
                
                if (groupFinalGrades.length > 0) {
                    totalGradeSum += groupFinalGrades.reduce((a, b) => a + b, 0) / groupFinalGrades.length;
                    partialsWithData++;
                }
            }
            
            allStats[group.id] = {
                average: partialsWithData > 0 ? totalGradeSum / partialsWithData : 0,
                highRiskCount: highRiskStudents.size
            };
        }
        return allStats;
    }, [groups, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances, allObservations, calculateFinalGrade, getStudentRiskLevel]);
    
    const groupAverages = useMemo(() => {
        return Object.fromEntries(Object.entries(groupStats).map(([groupId, stats]) => [groupId, stats.average]));
    }, [groupStats]);
    
    const overallAverageParticipation = useMemo(() => {
        let totalPossibleAttendance = 0;
        let totalPresents = 0;
        for(const key in allAttendances) {
          const groupAttendance = allAttendances[key];
          for(const date in groupAttendance){
            totalPossibleAttendance += Object.keys(groupAttendance[date]).length;
            totalPresents += Object.values(groupAttendance[date]).filter(Boolean).length;
          }
        }
        return totalPossibleAttendance > 0 ? Math.round((totalPresents / totalPossibleAttendance) * 100) : 100;
    }, [allAttendances]);


    return (
        <DataContext.Provider value={{
            students: allStudents, groups, allStudents, activeStudentsInGroups, settings, activeGroup, activePartial, criteria, grades, attendance, participations, activities, activityRecords,
            observations,
            groupStats, atRiskStudents, overallAverageParticipation, groupAverages,
            allObservations, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances,
            setStudents: setAllStudents, setGroups, setAllStudents, setSettings, setActiveGroupId,
            setCriteria: setCriteriaWrapper, setGrades: setGradesWrapper, setAttendance: setAttendanceWrapper, setParticipations: setParticipationsWrapper, setActivities: setActivitiesWrapper, setActivityRecords: setActivityRecordsWrapper,
            saveStudentObservation, updateStudentObservation, deleteGroup, calculateFinalGrade, getStudentRiskLevel, setActivePartialForGroup, togglePartialLock
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
