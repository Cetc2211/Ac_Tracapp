
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, StudentObservation, students as initialStudents, groups as initialGroups } from '@/lib/placeholder-data';
import { parseISO, startOfDay, isWithinInterval, getMonth } from 'date-fns';


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

export type AllGrades = {
    [partial: string]: Grades;
}

export type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type AllParticipations = {
    [partial: string]: ParticipationRecord;
}

export type AttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type AllAttendances = {
    [partial: string]: AttendanceRecord;
}

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

export type AllActivityRecords = {
    [partial: string]: ActivityRecord
}

export type AllActivities = {
    [partial: string]: Activity[]
}

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
  activePartial: string | null;
  
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
  allGrades: { [key: string]: AllGrades };
  allParticipations: { [key: string]: AllParticipations };
  allActivities: { [key: string]: AllActivities };
  allActivityRecords: { [key: string]: AllActivityRecords };
  allAttendances: { [key: string]: AllAttendances };
  activePartials: { [groupId: string]: string };

  // Setters
  setStudents: (students: Student[]) => void;
  setGroups: (groups: Group[]) => void;
  setAllStudents: (students: Student[]) => void;
  setSettings: React.Dispatch<React.SetStateAction<{ institutionName: string; logo: string; theme: string; }>>;
  
  setActiveGroupId: (groupId: string | null) => void;
  setActivePartialForGroup: (groupId: string, partial: string) => void;
  
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
    partial: string, 
    groupId: string
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
    const [activePartials, setActivePartials] = useState<{[groupId: string]: string}>({});
    
    // Data stores for all groups & partials
    const [allCriteria, setAllCriteria] = useState<{[key: string]: EvaluationCriteria[]}>({});
    const [allGrades, setAllGrades] = useState<{[key: string]: AllGrades}>({});
    const [allAttendances, setAllAttendances] = useState<{[key: string]: AllAttendances}>({});
    const [allParticipations, setAllParticipations] = useState<{[key: string]: AllParticipations}>({});
    const [allActivities, setAllActivities] = useState<{[key: string]: AllActivities}>({});
    const [allActivityRecords, setAllActivityRecords] = useState<{[key: string]: AllActivityRecords}>({});
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    
    // --- INITIAL DATA LOADING ---
    useEffect(() => {
        const loadedStudents = loadFromLocalStorage<Student[]>('students', initialStudents);
        const loadedGroups = loadFromLocalStorage<Group[]>('groups', initialGroups);
        const loadedSettings = loadFromLocalStorage('appSettings', defaultSettings);
        const loadedActivePartials = loadFromLocalStorage<{[groupId: string]: string}>('activePartials', {});
        const storedActiveGroupId = loadFromLocalStorage<string | null>('activeGroupId', null);

        setAllStudentsState(loadedStudents);
        setGroupsState(loadedGroups);
        setSettings(loadedSettings);
        setActivePartials(loadedActivePartials);
        setActiveGroupIdState(storedActiveGroupId);

        // Load all data into memory
        const criteriaStore: {[key: string]: EvaluationCriteria[]} = {};
        const gradesStore: {[key: string]: AllGrades} = {};
        const attendancesStore: {[key: string]: AllAttendances} = {};
        const participationsStore: {[key: string]: AllParticipations} = {};
        const activitiesStore: {[key: string]: AllActivities} = {};
        const activityRecordsStore: {[key: string]: AllActivityRecords} = {};
        const observationsStore: {[studentId: string]: StudentObservation[]} = {};

        for (const group of loadedGroups) {
            for (let i = 1; i <= 3; i++) {
                const partial = i.toString();
                const criteriaKey = `criteria_${group.id}_${partial}`;
                criteriaStore[criteriaKey] = loadFromLocalStorage(criteriaKey, []);

                const gradesKey = `grades_${group.id}_${partial}`;
                if (!gradesStore[group.id]) gradesStore[group.id] = {};
                gradesStore[group.id][partial] = loadFromLocalStorage(gradesKey, {});
                
                const attendanceKey = `attendance_${group.id}_${partial}`;
                if (!attendancesStore[group.id]) attendancesStore[group.id] = {};
                attendancesStore[group.id][partial] = loadFromLocalStorage(attendanceKey, {});

                const participationKey = `participations_${group.id}_${partial}`;
                if(!participationsStore[group.id]) participationsStore[group.id] = {};
                participationsStore[group.id][partial] = loadFromLocalStorage(participationKey, {});

                const activityKey = `activities_${group.id}_${partial}`;
                if(!activitiesStore[group.id]) activitiesStore[group.id] = {};
                activitiesStore[group.id][partial] = loadFromLocalStorage(activityKey, []);

                const activityRecordKey = `activityRecords_${group.id}_${partial}`;
                if(!activityRecordsStore[group.id]) activityRecordsStore[group.id] = {};
                activityRecordsStore[group.id][partial] = loadFromLocalStorage(activityRecordKey, {});
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
    
    const getPartialDateRanges = useCallback((groupId: string, partial: string) => {
        const groupAttendances = allAttendances[groupId];
        if (!groupAttendances) return null;

        const partialAttendance = groupAttendances[partial];
        if (!partialAttendance || Object.keys(partialAttendance).length === 0) return null;
        
        const partialDates = Object.keys(partialAttendance).map(d => parseISO(d)).sort((a,b) => a.getTime() - b.getTime());
        
        if (partialDates.length === 0) return null;

        return { start: partialDates[0], end: partialDates[partialDates.length - 1] };

    }, [allAttendances]);

    const calculateFinalGrade = useCallback((studentId: string, partial: string, groupId: string): number => {
        const partialCriteria = allCriteria[`criteria_${groupId}_${partial}`] || [];
        const partialGrades = allGrades[groupId]?.[partial] || {};
        const partialParticipations = allParticipations[groupId]?.[partial] || {};
        const partialActivities = allActivities[groupId]?.[partial] || [];
        const partialActivityRecords = allActivityRecords[groupId]?.[partial] || {};
        const partialAttendance = allAttendances[groupId]?.[partial] || {};
        const studentObservations = allObservations[studentId] || [];

        let finalGrade = 0;

        if (partialCriteria.length > 0) {
            for (const criterion of partialCriteria) {
                let performanceRatio = 0;

                if (criterion.isAutomated) {
                    if (criterion.name === 'Actividades') {
                        const totalActivities = partialActivities.length;
                        if (totalActivities > 0) {
                            const deliveredActivities = Object.values(partialActivityRecords[studentId] || {}).filter(Boolean).length;
                            performanceRatio = deliveredActivities / totalActivities;
                        }
                    } else if (criterion.name === 'Portafolio') {
                        const totalActivities = partialActivities.length;
                        if (totalActivities > 0) {
                             const delivered = partialGrades[studentId]?.[criterion.id]?.delivered ?? 0;
                            performanceRatio = delivered / totalActivities;
                        }
                    } else if (criterion.name === 'Participación') {
                        const totalAttendanceDays = Object.keys(partialAttendance).length;
                        if (totalAttendanceDays > 0) {
                            const studentParticipations = Object.values(partialParticipations).filter(day => day[studentId]).length;
                            performanceRatio = studentParticipations / totalAttendanceDays;
                        }
                    }
                } else { 
                    const delivered = partialGrades[studentId]?.[criterion.id]?.delivered ?? 0;
                    const expected = criterion.expectedValue;
                    if (expected > 0) {
                        performanceRatio = delivered / expected;
                    }
                }
                finalGrade += (performanceRatio * criterion.weight);
            }
        }
        
        const currentPartialRange = getPartialDateRanges(groupId, partial);
        
        let merits = 0;
        let demerits = 0;

        if (currentPartialRange && studentObservations) {
            const observationsForPartial = studentObservations.filter(o => {
                const obsDate = startOfDay(parseISO(o.date));
                return isWithinInterval(obsDate, currentPartialRange);
            });
            merits = observationsForPartial.filter(o => o.type === 'Mérito').length;
            demerits = observationsForPartial.filter(o => o.type === 'Demérito').length;
        }

        finalGrade += (merits * 10);
        finalGrade -= (demerits * 10);

        return Math.max(0, Math.min(100, finalGrade));
    }, [allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances, allObservations, getPartialDateRanges]);

    // --- DERIVED STATE & MEMOS ---
    const activePartial = useMemo(() => {
        if (!activeGroupId) return null;
        return activePartials[activeGroupId] || '1';
    }, [activeGroupId, activePartials]);

    const activeGroup = useMemo(() => {
        return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const criteria = useMemo(() => {
        if (!activeGroupId || !activePartial) return [];
        return allCriteria[`criteria_${activeGroupId}_${activePartial}`] || [];
    }, [activeGroupId, activePartial, allCriteria]);

    const grades = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allGrades[activeGroupId]?.[activePartial] || {};
    }, [activeGroupId, activePartial, allGrades]);

    const attendance = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allAttendances[activeGroupId]?.[activePartial] || {};
    }, [activeGroupId, activePartial, allAttendances]);

    const participations = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allParticipations[activeGroupId]?.[activePartial] || {};
    }, [activeGroupId, activePartial, allParticipations]);
    
    const activities = useMemo(() => {
        if (!activeGroupId || !activePartial) return [];
        return allActivities[activeGroupId]?.[activePartial] || [];
    }, [activeGroupId, activePartial, allActivities]);
    
    const activityRecords = useMemo(() => {
        if (!activeGroupId || !activePartial) return {};
        return allActivityRecords[activeGroupId]?.[activePartial] || {};
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
        const key = `criteria_${activeGroupId}_${activePartial}`;
        setAllCriteria(prev => ({...prev, [key]: newCriteria}));
        saveToLocalStorage(key, newCriteria);
    };

    const setGradesWrapper = (value: React.SetStateAction<Grades>) => {
        if (!activeGroupId || !activePartial) return;
        const key = `grades_${activeGroupId}_${activePartial}`;
        setAllGrades(prev => {
            const currentGrades = prev[activeGroupId]?.[activePartial] || {};
            const newGrades = typeof value === 'function' ? value(currentGrades) : value;
            const updatedState = {...prev, [activeGroupId]: { ...prev[activeGroupId], [activePartial]: newGrades}};
            saveToLocalStorage(key, newGrades);
            return updatedState;
        });
    }
    
    const setAttendanceWrapper = (value: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId || !activePartial) return;
        const key = `attendance_${activeGroupId}_${activePartial}`;
        setAllAttendances(prev => {
            const currentAttendance = prev[activeGroupId]?.[activePartial] || {};
            const newAttendance = typeof value === 'function' ? value(currentAttendance) : value;
            const updatedState = {...prev, [activeGroupId]: {...prev[activeGroupId], [activePartial]: newAttendance}};
            saveToLocalStorage(key, newAttendance);
            return updatedState;
        });
    }

    const setParticipationsWrapper = (value: React.SetStateAction<ParticipationRecord>) => {
        if (!activeGroupId || !activePartial) return;
        const key = `participations_${activeGroupId}_${activePartial}`;
        setAllParticipations(prev => {
            const currentParticipations = prev[activeGroupId]?.[activePartial] || {};
            const newParticipations = typeof value === 'function' ? value(currentParticipations) : value;
            const updatedState = {...prev, [activeGroupId]: {...prev[activeGroupId], [activePartial]: newParticipations}};
            saveToLocalStorage(key, newParticipations);
            return updatedState;
        });
    }
    
    const setActivitiesWrapper = (newActivities: Activity[]) => {
        if (!activeGroupId || !activePartial) return;
        const key = `activities_${activeGroupId}_${activePartial}`;
        const currentGroupActivities = allActivities[activeGroupId] || {};
        const updatedGroupActivities = { ...currentGroupActivities, [activePartial]: newActivities };
        setAllActivities(prev => ({ ...prev, [activeGroupId]: updatedGroupActivities }));
        saveToLocalStorage(key, newActivities);
    }

    const setActivityRecordsWrapper = (value: React.SetStateAction<ActivityRecord>) => {
        if (!activeGroupId || !activePartial) return;
        const key = `activityRecords_${activeGroupId}_${activePartial}`;
        setAllActivityRecords(prev => {
             const currentRecords = prev[activeGroupId]?.[activePartial] || {};
             const newRecords = typeof value === 'function' ? value(currentRecords) : value;
             const updatedState = {...prev, [activeGroupId]: {...prev[activeGroupId], [activePartial]: newRecords}};
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
    
    const setActivePartialForGroup = (groupId: string, partial: string) => {
        const newActivePartials = {...activePartials, [groupId]: partial };
        setActivePartials(newActivePartials);
        saveToLocalStorage('activePartials', newActivePartials);
    };

    const deleteGroup = (groupId: string) => {
        const newGroups = groups.filter(g => g.id !== groupId);
        setGroups(newGroups);
        // clean up associated data
        const newActivePartials = {...activePartials};
        delete newActivePartials[groupId];
        setActivePartials(newActivePartials);
        saveToLocalStorage('activePartials', newActivePartials);

        if (activeGroupId === groupId) {
            setActiveGroupId(null);
        }
        for(let i=1; i<=3; i++) {
            localStorage.removeItem(`criteria_${groupId}_${i}`);
            localStorage.removeItem(`grades_${groupId}_${i}`);
            localStorage.removeItem(`attendance_${groupId}_${i}`);
            localStorage.removeItem(`participations_${groupId}_${i}`);
            localStorage.removeItem(`activities_${groupId}_${i}`);
            localStorage.removeItem(`activityRecords_${groupId}_${i}`);
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
            const partial = activePartials[group.id] || '1';
            const attendanceForPartial = allAttendances[group.id]?.[partial] || {};

            group.students.forEach(student => {
                if(checkedStudentIds.has(student.id)) return;

                const finalGrade = calculateFinalGrade(student.id, partial, group.id);
                const risk = getStudentRiskLevel(finalGrade, attendanceForPartial, student.id);
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
    }, [groups, activePartials, allAttendances, calculateFinalGrade, getStudentRiskLevel]);
    
    const groupStats = useMemo(() => {
        const allStats: {[groupId: string]: GroupStats} = {};
        for(const group of groups) {
            const partial = activePartials[group.id] || '1';
            const attendance = allAttendances[group.id]?.[partial] || {};

            const groupGrades = group.students.map(s => calculateFinalGrade(s.id, partial, group.id));
            const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;
            
            const highRiskStudents = group.students.filter(s => {
                const finalGrade = calculateFinalGrade(s.id, partial, group.id);
                const risk = getStudentRiskLevel(finalGrade, attendance, s.id);
                return risk.level === 'high';
            }).length;
            
            allStats[group.id] = {
                average: groupAverage,
                highRiskCount: highRiskStudents
            };
        }
        return allStats;
    }, [groups, activePartials, allAttendances, calculateFinalGrade, getStudentRiskLevel]);
    
    const groupAverages = useMemo(() => {
        const newGroupAverages: {[groupId: string]: number} = {};
        for(const group of groups) {
            const partial = activePartials[group.id] || '1';
            const groupGrades = group.students.map(s => calculateFinalGrade(s.id, partial, group.id));
            const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a,b) => a + b, 0) / groupGrades.length : 0;
            newGroupAverages[group.id] = groupAverage;
        }
        return newGroupAverages;
    }, [groups, activePartials, calculateFinalGrade]);
    
    const overallAverageParticipation = useMemo(() => {
        let totalPossibleAttendance = 0;
        let totalPresents = 0;
        for(const groupId in allAttendances) {
          const groupAttendanceByPartial = allAttendances[groupId];
          const group = groups.find(g => g.id === groupId);
          if(!group) continue;
          
          for(const partial in groupAttendanceByPartial) {
            const attendanceRecord = groupAttendanceByPartial[partial];
            for(const date in attendanceRecord){
              for(const studentId in attendanceRecord[date]) {
                 if (group.students.some(s => s.id === studentId)) {
                    totalPossibleAttendance++;
                    if (attendanceRecord[date][studentId] === true) {
                      totalPresents++;
                    }
                 }
              }
            }
          }
        }
        return totalPossibleAttendance > 0 ? Math.round((totalPresents / totalPossibleAttendance) * 100) : 100;
    }, [allAttendances, groups]);


    return (
        <DataContext.Provider value={{
            students: allStudents, groups, allStudents, activeStudentsInGroups, settings, activeGroup, activePartial, criteria, grades, attendance, participations, activities, activityRecords,
            observations: Object.values(allObservations).flat(),
            groupStats, atRiskStudents, overallAverageParticipation, groupAverages,
            allObservations, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances, activePartials,
            setStudents: setAllStudents, setGroups, setAllStudents, setSettings, setActiveGroupId, setActivePartialForGroup,
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

    