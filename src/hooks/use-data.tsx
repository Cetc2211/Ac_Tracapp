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

export type PartialData = {
    criteria: EvaluationCriteria[];
    grades: Grades;
    attendance: AttendanceRecord;
    participations: ParticipationRecord;
    activities: Activity[];
    activityRecords: ActivityRecord;
};

export type AllPartialsData = {
  [groupId: string]: {
    [partialId in PartialId]?: PartialData;
  };
};

export type UserProfile = {
    name: string;
    email: string;
    photoURL: string;
}

const defaultSettings = {
    institutionName: "Mi Institución",
    logo: "",
    theme: "theme-mint"
};

const defaultPartialData: PartialData = {
    criteria: [],
    grades: {},
    attendance: {},
    participations: {},
    activities: [],
    activityRecords: {},
};

// Helper function to load data from localStorage safely
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    // This function will only run on the client, so we can safely use window
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage`, error);
        return defaultValue;
    }
};


// CONTEXT TYPE
interface DataContextType {
  // State
  isLoading: boolean;
  error: Error | null;
  groups: Group[];
  allStudents: Student[];
  activeStudentsInGroups: Student[];
  allObservations: {[studentId: string]: StudentObservation[]};
  settings: { institutionName: string; logo: string; theme: string };
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  
  partialData: PartialData;

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
  setSettings: (settings: { institutionName: string; logo: string; theme: string }) => Promise<void>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  resetAllData: () => Promise<void>;


  // Functions
  deleteGroup: (groupId: string) => Promise<void>;
  addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
  calculateFinalGrade: (studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData) => number;
  calculateDetailedFinalGrade: (studentId: string, pData: PartialData) => { finalGrade: number, criteriaDetails: CriteriaDetail[] };
  getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
  fetchPartialData: (groupId: string, partialId: PartialId) => Promise<PartialData | null>;
  takeAttendanceForDate: (groupId: string, date: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
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
        // This effect runs only once on the client to hydrate the state
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

            // Crucially, validate the active group ID against the just-loaded groups
            if (storedActiveGroupId && storedGroups.some(g => g.id === storedActiveGroupId)) {
                setActiveGroupIdState(storedActiveGroupId);
            } else {
                // If the stored ID is invalid or doesn't exist, clear it.
                setActiveGroupIdState(null);
            }
        } catch (e) {
            console.error("Error hydrating data from localStorage", e);
            setError(e instanceof Error ? e : new Error('An unknown error occurred during data hydration'));
        } finally {
            // Once all data is loaded from localStorage, set loading to false.
            setIsLoading(false);
        }
    }, []);

    // This useEffect persists any state changes back to localStorage
    useEffect(() => {
        // Don't save during the initial load, only after hydration is complete
        if (isLoading) return;
        
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
    }, [groups, allStudents, allObservations, allPartialsData, settings, activeGroupId, isLoading]);

    const partialData = useMemo(() => {
        if (!activeGroupId || !allPartialsData[activeGroupId]) return defaultPartialData;
        return allPartialsData[activeGroupId][activePartialId] || defaultPartialData;
    }, [activeGroupId, activePartialId, allPartialsData]);
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<PartialData | null> => {
        if (allPartialsData[groupId] && allPartialsData[groupId][partialId]) {
            return allPartialsData[groupId][partialId] as PartialData;
        }
        return defaultPartialData;
    }, [allPartialsData]);

    const setPartialDataState = (groupId: string, partialId: PartialId, newPartialData: PartialData) => {
        setAllPartialsData(prev => ({
            ...prev,
            [groupId]: {
                ...(prev[groupId] || {}),
                [partialId]: newPartialData,
            }
        }));
    };

    const createSetter = useCallback((field: keyof PartialData) => async (setter: React.SetStateAction<any>) => {
        if (!activeGroupId) return;
        const currentData = allPartialsData[activeGroupId]?.[activePartialId] || defaultPartialData;
        const newValue = typeof setter === 'function' ? setter(currentData[field]) : setter(newValue);
        const newPartialData = { ...currentData, [field]: newValue };
        setPartialDataState(activeGroupId, activePartialId, newPartialData);

    }, [activeGroupId, activePartialId, allPartialsData]);
    
    const setSettings = useCallback(async (newSettings: { institutionName: string; logo: string; theme: string }) => {
        setSettingsState(newSettings);
    }, []);

    const setCriteria = createSetter('criteria');
    const setGrades = createSetter('grades');
    const setAttendance = createSetter('attendance');
    const setParticipations = createSetter('participations');
    const setActivities = createSetter('activities');
    const setActivityRecords = createSetter('activityRecords');


    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData): { finalGrade: number, criteriaDetails: CriteriaDetail[] } => {
        if (!pData || !pData.criteria) return { finalGrade: 0, criteriaDetails: [] };
        
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
        return { finalGrade: grade, criteriaDetails: criteriaDetails };
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
    }, [groups, activePartialId, calculateFinalGrade, allPartialsData]);
    
    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
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
    }, [groups, activePartialId, getStudentRiskLevel, calculateFinalGrade, allPartialsData]);
    
    const overallAverageParticipation = useMemo(() => {
        if (!activeGroup) return 100;
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

    }, [activeGroup, partialData.participations]);

    const takeAttendanceForDate = useCallback(async (groupId: string, date: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        const newAttendanceForDate = group.students.reduce((acc, student) => ({
            ...acc,
            [student.id]: true
        }), {} as {[studentId: string]: boolean});
        
        if (activeGroupId) {
            const currentData = allPartialsData[activeGroupId]?.[activePartialId] || defaultPartialData;
            const newPartialData = { ...currentData, attendance: { ...currentData.attendance, [date]: newAttendanceForDate } };
            setPartialDataState(activeGroupId, activePartialId, newPartialData);
        }
        
    }, [groups, activeGroupId, activePartialId, allPartialsData]);

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

    