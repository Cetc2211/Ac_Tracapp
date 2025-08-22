
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

// --- START OF MOCK DATA ---
const mockStudents: Student[] = [
    { id: 'S1', name: 'Ana García Pérez', email: 'ana.garcia@example.com', phone: '555-0101', tutorName: 'Ricardo García', tutorPhone: '555-0201', photo: 'https://placehold.co/100x100.png?text=AG' },
    { id: 'S2', name: 'Luis Martínez Hernández', email: 'luis.martinez@example.com', phone: '555-0102', tutorName: 'Elena Hernández', tutorPhone: '555-0202', photo: 'https://placehold.co/100x100.png?text=LM' },
    { id: 'S3', name: 'Sofía Rodríguez López', email: 'sofia.rodriguez@example.com', phone: '555-0103', tutorName: 'Javier Rodríguez', tutorPhone: '555-0203', photo: 'https://placehold.co/100x100.png?text=SR' },
    { id: 'S4', name: 'Carlos González Sánchez', email: 'carlos.gonzalez@example.com', phone: '555-0104', tutorName: 'Marta Sánchez', tutorPhone: '555-0204', photo: 'https://placehold.co/100x100.png?text=CG' },
    { id: 'S5', name: 'Valeria Gómez Ramírez', email: 'valeria.gomez@example.com', phone: '555-0105', tutorName: 'David Gómez', tutorPhone: '555-0205', photo: 'https://placehold.co/100x100.png?text=VG' },
];

const mockGroups: Group[] = [
    {
        id: 'G1',
        subject: 'Historia del Arte',
        semester: 'Cuarto',
        groupName: '401A',
        facilitator: 'Prof. Angélica Rosas',
        students: mockStudents,
    }
];
// --- END OF MOCK DATA ---


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
    // Core data
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [groups, setGroups] = useState<Group[]>([]);
    const [settings, setSettingsState] = useState(defaultSettings);
    
    // Active state
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');
    
    const [allPartialsData, setAllPartialsData] = useState<AllPartialsData>({});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadData = () => {
          try {
            // Load from localStorage or use initial data
            const storedGroups = localStorage.getItem('app_groups');
            const storedStudents = localStorage.getItem('app_students');
            const storedObservations = localStorage.getItem('app_observations');
            const storedPartials = localStorage.getItem('app_partialsData');
            const storedSettings = localStorage.getItem('app_settings');
            
            setGroups(storedGroups ? JSON.parse(storedGroups) : mockGroups);
            setAllStudents(storedStudents ? JSON.parse(storedStudents) : mockStudents);

            if (storedObservations) setAllObservations(JSON.parse(storedObservations));
            if (storedPartials) setAllPartialsData(JSON.parse(storedPartials));
            if (storedSettings) setSettingsState(JSON.parse(storedSettings));
            
            const storedGroupId = localStorage.getItem('activeGroupId_v1');
            if (storedGroupId) {
                setActiveGroupIdState(storedGroupId);
            }
          } catch (e) {
            console.error("Failed to load data from localStorage", e);
            // Fallback to empty state if localStorage is corrupt
          } finally {
            setIsLoading(false);
          }
        };
        loadData();
    }, []);
    
    // Save to localStorage whenever data changes
    useEffect(() => {
        try {
          if(!isLoading) {
            localStorage.setItem('app_groups', JSON.stringify(groups));
            localStorage.setItem('app_students', JSON.stringify(allStudents));
            localStorage.setItem('app_observations', JSON.stringify(allObservations));
            localStorage.setItem('app_partialsData', JSON.stringify(allPartialsData));
            localStorage.setItem('app_settings', JSON.stringify(settings));
          }
        } catch (e) {
          console.error("Failed to save data to localStorage", e);
        }
    }, [groups, allStudents, allObservations, allPartialsData, settings, isLoading]);

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
        const newValue = typeof setter === 'function' ? setter(currentData[field]) : setter;
        const newPartialData = { ...currentData, [field]: newValue };
        setPartialDataState(activeGroupId, activePartialId, newPartialData);

    }, [activeGroupId, activePartialId, allPartialsData]);
    
    const setSettings = useCallback(async (newSettings: { institutionName: string; logo: string; theme: string }) => {
        setSettingsState(newSettings);
    }, []);

    const setCriteria = useMemo(() => createSetter('criteria'), [createSetter]);
    const setGrades = useMemo(() => createSetter('grades'), [createSetter]);
    const setAttendance = useMemo(() => createSetter('attendance'), [createSetter]);
    const setParticipations = useMemo(() => createSetter('participations'), [createSetter]);
    const setActivities = useMemo(() => createSetter('activities'), [createSetter]);
    const setActivityRecords = useMemo(() => createSetter('activityRecords'), [createSetter]);


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
                const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(pData.participations?.[date], studentId)).length;
                if (studentParticipationOpportunities > 0) {
                    const studentParticipations = Object.values(pData.participations || {}).filter(p => p[studentId]).length;
                    performanceRatio = studentParticipations / studentParticipationOpportunities;
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
        const data = forPartialData || (gId ? allPartialsData[gId]?.[pId] : undefined) || partialData;
        return calculateDetailedFinalGrade(studentId, data).finalGrade;
    }, [calculateDetailedFinalGrade, partialData, activeGroupId, activePartialId, allPartialsData]);

    const setActiveGroupId = (groupId: string | null) => {
        if(groupId !== activeGroupId) {
            setActiveGroupIdState(groupId);
            try {
                if (groupId) {
                    localStorage.setItem('activeGroupId_v1', groupId);
                } else {
                    localStorage.removeItem('activeGroupId_v1');
                }
            } catch(e) {
                console.warn("Could not access localStorage to set active group ID.")
            }
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
        setAllStudents(prev => [...prev, ...students]);
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
        if(activeGroupId === groupId) setActiveGroupId(null);
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
        deleteGroup,
        addStudentObservation,
        updateStudentObservation,
        calculateFinalGrade,
        getStudentRiskLevel,
        calculateDetailedFinalGrade,
        fetchPartialData,
        takeAttendanceForDate,
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

    