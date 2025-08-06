
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
    [activityId: string]: boolean; // delivered or not
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

// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    // Core data
    const [allStudents, setAllStudentsState] = useState<Student[]>([]);
    const [groups, setGroupsState] = useState<Group[]>([]);
    const [settings, setSettings] = useState(defaultSettings);
    
    // Active state
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    
    // Data stores for all groups
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

        // Load all data into memory
        const criteriaStore: {[key: string]: EvaluationCriteria[]} = {};
        const gradesStore: {[key: string]: Grades} = {};
        const attendancesStore: {[key: string]: AttendanceRecord} = {};
        const participationsStore: {[key: string]: ParticipationRecord} = {};
        const activitiesStore: {[key: string]: Activity[]} = {};
        const activityRecordsStore: {[key: string]: ActivityRecord} = {};
        const observationsStore: {[studentId: string]: StudentObservation[]} = {};

        for (const group of loadedGroups) {
            criteriaStore[`criteria_${group.id}`] = loadFromLocalStorage(`criteria_${group.id}`, []);
            gradesStore[group.id] = loadFromLocalStorage(`grades_${group.id}`, {});
            attendancesStore[group.id] = loadFromLocalStorage(`attendance_${group.id}`, {});
            participationsStore[group.id] = loadFromLocalStorage(`participations_${group.id}`, {});
            activitiesStore[group.id] = loadFromLocalStorage(`activities_${group.id}`, []);
            activityRecordsStore[group.id] = loadFromLocalStorage(`activityRecords_${group.id}`, {});
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

                 if (criterion.name === 'Actividades' || (criterion.name === 'Portafolio' && criterion.isAutomated)) {
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
        
        const merits = studentObservations.filter(o => o.type === 'Mérito').length;
        const demerits = studentObservations.filter(o => o.type === 'Demérito').length;
        finalGrade += (merits * 10);
        finalGrade -= (demerits * 10);

        return Math.max(0, Math.min(100, finalGrade));
    }, []);

    // --- DERIVED STATE & MEMOS ---
    const activeGroup = useMemo(() => {
        return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const criteria = useMemo(() => {
        if (!activeGroupId) return [];
        return allCriteria[`criteria_${activeGroupId}`] || [];
    }, [activeGroupId, allCriteria]);

    const grades = useMemo(() => {
        if (!activeGroupId) return {};
        return allGrades[activeGroupId] || {};
    }, [activeGroupId, allGrades]);

    const attendance = useMemo(() => {
        if (!activeGroupId) return {};
        return allAttendances[activeGroupId] || {};
    }, [activeGroupId, allAttendances]);

    const participations = useMemo(() => {
        if (!activeGroupId) return {};
        return allParticipations[activeGroupId] || {};
    }, [activeGroupId, allParticipations]);
    
    const activities = useMemo(() => {
        if (!activeGroupId) return [];
        return allActivities[activeGroupId] || [];
    }, [activeGroupId, allActivities]);
    
    const activityRecords = useMemo(() => {
        if (!activeGroupId) return {};
        return allActivityRecords[activeGroupId] || {};
    }, [activeGroupId, allActivityRecords]);
    
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
        if (!activeGroupId) return;
        const key = `criteria_${activeGroupId}`;
        setAllCriteria(prev => ({...prev, [key]: newCriteria}));
        saveToLocalStorage(key, newCriteria);
    };

    const setGradesWrapper = (value: React.SetStateAction<Grades>) => {
        if (!activeGroupId) return;
        const key = `grades_${activeGroupId}`;
        setAllGrades(prev => {
            const currentGrades = prev[activeGroupId] || {};
            const newGrades = typeof value === 'function' ? value(currentGrades) : value;
            const updatedState = {...prev, [activeGroupId]: newGrades};
            saveToLocalStorage(key, newGrades);
            return updatedState;
        });
    }
    
    const setAttendanceWrapper = (value: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId) return;
        const key = `attendance_${activeGroupId}`;
        setAllAttendances(prev => {
            const currentAttendance = prev[activeGroupId] || {};
            const newAttendance = typeof value === 'function' ? value(currentAttendance) : value;
            const updatedState = {...prev, [activeGroupId]: newAttendance};
            saveToLocalStorage(key, newAttendance);
            return updatedState;
        });
    }

    const setParticipationsWrapper = (value: React.SetStateAction<ParticipationRecord>) => {
        if (!activeGroupId) return;
        const key = `participations_${activeGroupId}`;
        setAllParticipations(prev => {
            const currentParticipations = prev[activeGroupId] || {};
            const newParticipations = typeof value === 'function' ? value(currentParticipations) : value;
            const updatedState = {...prev, [activeGroupId]: newParticipations};
            saveToLocalStorage(key, newParticipations);
            return updatedState;
        });
    }
    
    const setActivitiesWrapper = (newActivities: Activity[]) => {
        if (!activeGroupId) return;
        const key = `activities_${activeGroupId}`;
        setAllActivities(prev => ({ ...prev, [activeGroupId]: newActivities }));
        saveToLocalStorage(key, newActivities);
    }

    const setActivityRecordsWrapper = (value: React.SetStateAction<ActivityRecord>) => {
        if (!activeGroupId) return;
        const key = `activityRecords_${activeGroupId}`;
        setAllActivityRecords(prev => {
             const currentRecords = prev[activeGroupId] || {};
             const newRecords = typeof value === 'function' ? value(currentRecords) : value;
             const updatedState = {...prev, [activeGroupId]: newRecords};
             saveToLocalStorage(key, newRecords);
             return updatedState;
        });
    }
    
    const setActiveGroupId = (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        saveToLocalStorage('activeGroupId', groupId);
        if (groupId) {
            const group = groups.find(g => g.id === groupId);
            if (group) {
                saveToLocalStorage('activeGroupName', group.subject);
            }
        } else {
            localStorage.removeItem('activeGroupName');
        }
        window.dispatchEvent(new Event('storage'));
    };

    const saveStudentObservation = (observation: StudentObservation) => {
        const key = `observations_${observation.studentId}`;
        setAllObservations(prev => {
            const studentObs = prev[observation.studentId] || [];
            const newStudentObs = [...studentObs, observation];
            saveToLocalStorage(key, newStudentObs);
            return {...prev, [observation.studentId]: newStudentObs };
        });
    };

    const deleteGroup = (groupId: string) => {
        const newGroups = groups.filter(g => g.id !== groupId);
        setGroups(newGroups);
        // clean up associated data
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
        
        return {level: 'low', reason };
    }, []);

    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
        const students: StudentWithRisk[] = [];
        const checkedStudentIds = new Set<string>();
        groups.forEach(group => {
            const groupCriteria = allCriteria[`criteria_${group.id}`] || [];
            const groupGrades = allGrades[group.id] || {};
            const groupParticipations = allParticipations[group.id] || {};
            const groupAttendance = allAttendances[group.id] || {};
            const groupActivities = allActivities[group.id] || [];
            const groupActivityRecords = allActivityRecords[group.id] || {};

            group.students.forEach(student => {
                if(checkedStudentIds.has(student.id)) return;

                const studentObservations = allObservations[student.id] || [];
                const finalGrade = calculateFinalGrade(student.id, groupCriteria, groupGrades, groupParticipations, groupActivities, groupActivityRecords, studentObservations);
                const risk = getStudentRiskLevel(finalGrade, groupAttendance, student.id);
                if (risk.level === 'high' || risk.level === 'medium') {
                    students.push({ ...student, calculatedRisk: risk });
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
        for(const group of groups) {
            const groupCriteria = allCriteria[`criteria_${group.id}`] || [];
            const groupGrades = allGrades[group.id] || {};
            const groupParticipations = allParticipations[group.id] || {};
            const groupAttendance = allAttendances[group.id] || {};
            const groupActivities = allActivities[group.id] || [];
            const groupActivityRecords = allActivityRecords[group.id] || {};

            const groupFinalGrades = group.students.map(s => {
                const studentObservations = allObservations[s.id] || [];
                return calculateFinalGrade(s.id, groupCriteria, groupGrades, groupParticipations, groupActivities, groupActivityRecords, studentObservations);
            });
            const groupAverage = groupFinalGrades.length > 0 ? groupFinalGrades.reduce((a, b) => a + b, 0) / groupFinalGrades.length : 0;
            
            const highRiskStudents = group.students.filter(s => {
                const studentObservations = allObservations[s.id] || [];
                const finalGrade = calculateFinalGrade(s.id, groupCriteria, groupGrades, groupParticipations, groupActivities, groupActivityRecords, studentObservations);
                const risk = getStudentRiskLevel(finalGrade, groupAttendance, s.id);
                return risk.level === 'high';
            }).length;
            
            allStats[group.id] = {
                average: groupAverage,
                highRiskCount: highRiskStudents
            };
        }
        return allStats;
    }, [groups, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances, allObservations, calculateFinalGrade, getStudentRiskLevel]);
    
    const groupAverages = useMemo(() => {
        const newGroupAverages: {[groupId: string]: number} = {};
        for(const group of groups) {
            const groupCriteria = allCriteria[`criteria_${group.id}`] || [];
            const groupGrades = allGrades[group.id] || {};
            const groupParticipations = allParticipations[group.id] || {};
            const groupActivities = allActivities[group.id] || [];
            const groupActivityRecords = allActivityRecords[group.id] || {};

            const groupFinalGrades = group.students.map(s => {
                const studentObservations = allObservations[s.id] || [];
                return calculateFinalGrade(s.id, groupCriteria, groupGrades, groupParticipations, groupActivities, groupActivityRecords, studentObservations);
            });
            const groupAverage = groupFinalGrades.length > 0 ? groupFinalGrades.reduce((a,b) => a + b, 0) / groupFinalGrades.length : 0;
            newGroupAverages[group.id] = groupAverage;
        }
        return newGroupAverages;
    }, [groups, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allObservations, calculateFinalGrade]);
    
    const overallAverageParticipation = useMemo(() => {
        let totalPossibleAttendance = 0;
        let totalPresents = 0;
        for(const groupId in allAttendances) {
          const groupAttendance = allAttendances[groupId];
          const group = groups.find(g => g.id === groupId);
          if(!group) continue;
          
          for(const date in groupAttendance){
            for(const studentId in groupAttendance[date]) {
               if (group.students.some(s => s.id === studentId)) {
                  totalPossibleAttendance++;
                  if (groupAttendance[date][studentId] === true) {
                    totalPresents++;
                  }
               }
            }
          }
        }
        return totalPossibleAttendance > 0 ? Math.round((totalPresents / totalPossibleAttendance) * 100) : 100;
    }, [allAttendances, groups]);


    return (
        <DataContext.Provider value={{
            students: allStudents, groups, allStudents, activeStudentsInGroups, settings, activeGroup, criteria, grades, attendance, participations, activities, activityRecords,
            observations,
            groupStats, atRiskStudents, overallAverageParticipation, groupAverages,
            allObservations, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances,
            setStudents: setAllStudents, setGroups, setAllStudents, setSettings, setActiveGroupId,
            setCriteria: setCriteriaWrapper, setGrades: setGradesWrapper, setAttendance: setAttendanceWrapper, setParticipations: setParticipationsWrapper, setActivities: setActivitiesWrapper, setActivityRecords: setActivityRecordsWrapper,
            saveStudentObservation, deleteGroup, calculateFinalGrade, getStudentRiskLevel,
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

    