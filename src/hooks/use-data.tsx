

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
  setObservations: (observations: StudentObservation[]) => void;

  // Functions
  saveStudentObservation: (observation: StudentObservation) => void;
  deleteGroup: (groupId: string) => void;
  calculateFinalGrade: (studentId: string, criteria: EvaluationCriteria[], grades: Grades, participations: ParticipationRecord, activities: Activity[], activityRecords: ActivityRecord, studentObservations: StudentObservation[]) => number;
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
        const loadedStudents = loadFromLocalStorage('students', initialStudents);
        const loadedGroups = loadFromLocalStorage('groups', initialGroups);

        setAllStudentsState(loadedStudents);
        setGroupsState(loadedGroups);
        setSettings(loadFromLocalStorage('appSettings', defaultSettings));
        setActivePartials(loadFromLocalStorage('activePartials', {}));

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

        const storedActiveGroupId = localStorage.getItem('activeGroupId');
        setActiveGroupIdState(storedActiveGroupId);

    }, []);

    const calculateFinalGrade = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades, participations: ParticipationRecord, activities: Activity[], activityRecords: ActivityRecord, studentObservations: StudentObservation[]): number => {
        let finalGrade = 0;
        
        if (criteria && criteria.length > 0) {
            for (const criterion of criteria) {
                let performanceRatio = 0;
        
                if (criterion.name === 'Portafolio' && criterion.isAutomated) {
                    const totalActivities = activities.length;
                    if (totalActivities > 0) {
                        const deliveredActivities = Object.values(activityRecords[studentId] || {}).filter(Boolean).length;
                        performanceRatio = deliveredActivities / totalActivities;
                    }
                } else if (criterion.name === 'Actividades') {
                    const totalActivities = activities.length;
                    if (totalActivities > 0) {
                        const deliveredActivities = Object.values(activityRecords[studentId] || {}).filter(Boolean).length;
                        performanceRatio = deliveredActivities / totalActivities;
                    }
                } else if(criterion.name === 'Participación') {
                    const participationDates = Object.keys(participations);
                    if (participationDates.length > 0) {
                        const participatedClasses = participationDates.filter(date => participations[date]?.[studentId]).length;
                        performanceRatio = participatedClasses / participationDates.length;
                    }
                } else {
                    const gradeDetail = grades[studentId]?.[criterion.id];
                    const delivered = gradeDetail?.delivered ?? 0;
                    const expected = criterion.expectedValue;
                    if(expected > 0) {
                        performanceRatio = delivered / expected;
                    }
                }
                finalGrade += performanceRatio * criterion.weight;
            }
        }

        studentObservations.forEach(obs => {
            if (obs.type === 'Mérito') {
                finalGrade += 10;
            } else if (obs.type === 'Demérito') {
                finalGrade -= 10;
            }
        });

        if (finalGrade > 100) finalGrade = 100;
        if (finalGrade < 0) finalGrade = 0;

        return finalGrade;
    }, []);

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
        setAllActivities(prev => ({ ...prev, [activeGroupId]: { ...prev[activeGroupId], [activePartial]: newActivities } }));
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

    const setObservationsWrapper = (newObservations: StudentObservation[]) => {
        // This is complex because observations are per student. 
        // We'll use a dedicated save function instead.
    };
    
    const setActiveGroupId = (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        if (groupId) {
            localStorage.setItem('activeGroupId', groupId);
            const group = groups.find(g => g.id === groupId);
            if (group) {
                localStorage.setItem('activeGroupName', group.subject);
            }
        } else {
            localStorage.removeItem('activeGroupId');
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
        groups.forEach(group => {
            const partial = activePartials[group.id] || '1';
            const criteria = allCriteria[`criteria_${group.id}_${partial}`] || [];
            const grades = allGrades[group.id]?.[partial] || {};
            const attendance = allAttendances[group.id]?.[partial] || {};
            const participations = allParticipations[group.id]?.[partial] || {};
            const activities = allActivities[group.id]?.[partial] || [];
            const activityRecords = allActivityRecords[group.id]?.[partial] || {};

            group.students.forEach(student => {
                const studentObservations = allObservations[student.id] || [];
                const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations, activities, activityRecords, studentObservations);
                const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
                if (risk.level === 'high' || risk.level === 'medium') {
                    students.push({ ...student, calculatedRisk: risk });
                }
            });
        });
        return students.sort((a, b) => {
            if (a.calculatedRisk.level === 'high' && b.calculatedRisk.level !== 'high') return -1;
            if (a.calculatedRisk.level !== 'high' && b.calculatedRisk.level === 'high') return 1;
            return 0;
        });
    }, [groups, activePartials, allCriteria, allGrades, allAttendances, allParticipations, allActivities, allActivityRecords, allObservations, calculateFinalGrade, getStudentRiskLevel]);
    
    const groupStats = useMemo(() => {
        const allStats: {[groupId: string]: GroupStats} = {};
        for(const group of groups) {
            const partial = activePartials[group.id] || '1';
            const criteria = allCriteria[`criteria_${group.id}_${partial}`] || [];
            const grades = allGrades[group.id]?.[partial] || {};
            const participations = allParticipations[group.id]?.[partial] || {};
            const attendance = allAttendances[group.id]?.[partial] || {};
            const activities = allActivities[group.id]?.[partial] || [];
            const activityRecords = allActivityRecords[group.id]?.[partial] || {};

            const groupGrades = group.students.map(s => {
                const studentObservations = allObservations[s.id] || [];
                return calculateFinalGrade(s.id, criteria, grades, participations, activities, activityRecords, studentObservations);
            });

            const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;
            
            const highRiskStudents = group.students.filter(s => {
                const studentObservations = allObservations[s.id] || [];
                const finalGrade = calculateFinalGrade(s.id, criteria, grades, participations, activities, activityRecords, studentObservations);
                const risk = getStudentRiskLevel(finalGrade, attendance, s.id);
                return risk.level === 'high';
            }).length;
            
            allStats[group.id] = {
                average: groupAverage,
                highRiskCount: highRiskStudents
            };
        }
        return allStats;
    }, [groups, activePartials, allCriteria, allGrades, allParticipations, allAttendances, allActivities, allActivityRecords, allObservations, calculateFinalGrade, getStudentRiskLevel]);
    
    const groupAverages = useMemo(() => {
        const newGroupAverages: {[groupId: string]: number} = {};
        for(const group of groups) {
            const partial = activePartials[group.id] || '1';
            const criteria = allCriteria[`criteria_${group.id}_${partial}`] || [];
            const grades = allGrades[group.id]?.[partial] || {};
            const participations = allParticipations[group.id]?.[partial] || {};
            const activities = allActivities[group.id]?.[partial] || [];
            const activityRecords = allActivityRecords[group.id]?.[partial] || {};

            const groupGrades = group.students.map(s => {
                 const studentObservations = allObservations[s.id] || [];
                return calculateFinalGrade(s.id, criteria, grades, participations, activities, activityRecords, studentObservations);
            });
            const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a,b) => a + b, 0) / groupGrades.length : 0;
            newGroupAverages[group.id] = groupAverage;
        }
        return newGroupAverages;
    }, [groups, activePartials, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allObservations, calculateFinalGrade]);
    
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
            students: allStudents, groups, allStudents, activeStudentsInGroups, settings, activeGroup, activePartial, criteria, grades, attendance, participations, activities, activityRecords, observations,
            groupStats, atRiskStudents, overallAverageParticipation, groupAverages,
            allObservations, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances, activePartials,
            setStudents: setAllStudents, setGroups, setAllStudents, setSettings, setActiveGroupId, setActivePartialForGroup,
            setCriteria: setCriteriaWrapper, setGrades: setGradesWrapper, setAttendance: setAttendanceWrapper, setParticipations: setParticipationsWrapper, setActivities: setActivitiesWrapper, setActivityRecords: setActivityRecordsWrapper, setObservations: setObservationsWrapper,
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
