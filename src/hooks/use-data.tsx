
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

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

// CONTEXT TYPE
interface DataContextType {
  // State
  isLoading: boolean;
  error: Error | null;
  groups: Group[];
  allStudents: Student[];
  allObservations: {[studentId: string]: StudentObservation[]};
  settings: { institutionName: string; logo: string; theme: string };
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  activeStudentsInGroups: Student[];
  
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
    const { user, loading: authLoading } = useAuth();
    
    // Core data
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [groups, setGroups] = useState<Group[]>([]);
    const [settings, setSettingsState] = useState(defaultSettings);
    
    // Active state
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');
    
    // New centralized store for all partial data
    const [allPartialsData, setAllPartialsData] = useState<AllPartialsData>({});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (authLoading) {
            setIsLoading(true);
            return;
        }

        if (!user) {
            setGroups([]);
            setAllStudents([]);
            setAllObservations({});
            setAllPartialsData({});
            setActiveGroupIdState(null);
            setSettingsState(defaultSettings);
            setIsLoading(false);
            return;
        }
        
        const prefix = `users/${user.uid}`;

        const loadAndListen = async () => {
          try {
            // Load base data
            const groupsQuery = query(collection(db, `${prefix}/groups`));
            const groupsSnap = await getDocs(groupsQuery);
            const initialGroups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[];
            setGroups(initialGroups);

            // Load all partial data for all groups at once
            const partials: PartialId[] = ['p1', 'p2', 'p3'];
            const partialsDataPromises = initialGroups.map(async (group) => {
              const groupPartials: { [key in PartialId]?: PartialData } = {};
              for (const pId of partials) {
                const docRef = doc(db, `${prefix}/groups/${group.id}/partials/${pId}/data/content`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                  groupPartials[pId] = docSnap.data() as PartialData;
                }
              }
              return { groupId: group.id, data: groupPartials };
            });

            const allPartialsResults = await Promise.all(partialsDataPromises);
            const allPartialsMap = allPartialsResults.reduce((acc, curr) => {
                acc[curr.groupId] = curr.data;
                return acc;
            }, {} as AllPartialsData);
            setAllPartialsData(allPartialsMap);

            setIsLoading(false);
            
            // Set up listeners after initial load
            onSnapshot(groupsQuery, snapshot => {
              setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[]);
            });

            initialGroups.forEach(group => {
              partials.forEach(pId => {
                const docRef = doc(db, `${prefix}/groups/${group.id}/partials/${pId}/data/content`);
                onSnapshot(docRef, (docSnap) => {
                  setAllPartialsData(prev => ({
                    ...prev,
                    [group.id]: {
                      ...prev[group.id],
                      [pId]: docSnap.exists() ? (docSnap.data() as PartialData) : defaultPartialData
                    }
                  }));
                });
              });
            });

            // Listen to other collections
            onSnapshot(query(collection(db, `${prefix}/students`)), s => setAllStudents(s.docs.map(d => ({id:d.id, ...d.data()})) as Student[]));
            onSnapshot(doc(db, `${prefix}/settings`, 'app'), doc => setSettingsState(doc.exists() ? (doc.data() as typeof settings) : defaultSettings));
            onSnapshot(query(collection(db, `${prefix}/observations`)), snapshot => {
              const updatedObservations: { [key: string]: any[] } = {};
              snapshot.docs.forEach(doc => {
                  const item = { id: doc.id, ...doc.data() } as StudentObservation;
                  if (item.date && item.date instanceof Timestamp) item.date = item.date.toDate().toISOString();
                  item.followUpUpdates = (item.followUpUpdates || []).map(f => ({ ...f, date: f.date && f.date instanceof Timestamp ? f.date.toDate().toISOString() : f.date }));
                  const key = item.studentId;
                  if (key) {
                      if (!updatedObservations[key]) updatedObservations[key] = [];
                      updatedObservations[key].push(item);
                  }
              });
              setAllObservations(updatedObservations);
            });

          } catch (err: any) {
            console.error("Firebase data loading error:", err);
            setError(err);
            setIsLoading(false);
          }
        };

        loadAndListen();

        const storedGroupId = localStorage.getItem('activeGroupId_v1');
        if (storedGroupId) {
            setActiveGroupIdState(storedGroupId);
        }

    }, [user, authLoading]);
    
    // Get the current partial data based on active group/partial
    const partialData = useMemo(() => {
        if (!activeGroupId || !allPartialsData[activeGroupId]) return defaultPartialData;
        return allPartialsData[activeGroupId][activePartialId] || defaultPartialData;
    }, [activeGroupId, activePartialId, allPartialsData]);
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<PartialData | null> => {
        if (allPartialsData[groupId] && allPartialsData[groupId][partialId]) {
            return allPartialsData[groupId][partialId] as PartialData;
        }
        // Fallback to fetch if not in memory, though the new logic should prevent this.
        if (!user) return null;
        const docRef = doc(db, `users/${user.uid}/groups/${groupId}/partials/${partialId}/data/content`);
        try {
            const docSnap = await getDoc(docRef);
            if(docSnap.exists()){
                return docSnap.data() as PartialData;
            }
            return defaultPartialData;
        } catch (e) {
            console.error("Failed to fetch partial data:", e);
            return null;
        }
    }, [user, allPartialsData]);

    const getPartialDataDocRef = useCallback(() => {
        if (!activeGroupId || !user) return null;
        return doc(db, `users/${user.uid}/groups/${activeGroupId}/partials/${activePartialId}/data/content`);
    }, [activeGroupId, activePartialId, user]);


    const createSetter = useCallback((field: keyof PartialData) => async (setter: React.SetStateAction<any>) => {
        const docRef = getPartialDataDocRef();
        if (docRef) {
            const currentValue = partialData[field];
            const newValue = typeof setter === 'function' ? setter(currentValue) : setter;
            await setDoc(docRef, { [field]: newValue }, { merge: true });
        }
    }, [getPartialDataDocRef, partialData]);
    
    const setSettings = useCallback(async (newSettings: { institutionName: string; logo: string; theme: string }) => {
        if (!user) throw new Error("User not authenticated");
        await setDoc(doc(db, `users/${user.uid}/settings`, 'app'), newSettings);
    }, [user]);

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
        const data = forPartialData || partialData;
        return calculateDetailedFinalGrade(studentId, data).finalGrade;
    }, [calculateDetailedFinalGrade, partialData]);

    // Derived State
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
        const studentSet = new Set<string>();
        const uniqueStudents: Student[] = [];
        groups.forEach(group => {
            group.students.forEach(student => {
                const fullStudent = allStudents.find(s => s.id === student.id);
                if (fullStudent && !studentSet.has(student.id)) {
                    studentSet.add(student.id);
                    uniqueStudents.push(fullStudent);
                }
            });
        });
        return uniqueStudents;
    }, [groups, allStudents]);

    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        if (!user) return;
        const batch = writeBatch(db);
        const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
        
        batch.update(groupRef, {
            students: arrayUnion(...students)
        });

        for (const student of students) {
            const studentRef = doc(db, `users/${user.uid}/students`, student.id);
            batch.set(studentRef, student, { merge: true });
        }
        await batch.commit();
    }, [user]);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        if (!user) return;
        const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
        const groupDoc = await getDoc(groupRef);
        if (groupDoc.exists()) {
            const groupData = groupDoc.data() as Group;
            const studentToRemove = groupData.students.find(s => s.id === studentId);
            if (studentToRemove) {
                await updateDoc(groupRef, {
                    students: arrayRemove(studentToRemove)
                });
            }
        }
    }, [user]);
    
    const setActivePartialId = (partialId: PartialId) => {
        setActivePartialIdState(partialId);
    };

    const deleteGroup = useCallback(async (groupId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, `users/${user.uid}/groups`, groupId));
    }, [user]);

    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        if (!user) return;
        const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
        await updateDoc(groupRef, data);
    }, [user]);
    
    const addStudentObservation = useCallback(async (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        if (!user) return;
        
        const newDocRef = doc(collection(db, `users/${user.uid}/observations`));
        const newObservation = {
            ...observation,
            id: newDocRef.id,
            date: serverTimestamp(),
            followUpUpdates: [],
            isClosed: false,
        };
        await setDoc(newDocRef, newObservation);
    }, [user]);
    
    const updateStudentObservation = useCallback(async (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
      if (!user) return;
      const docRef = doc(db, `users/${user.uid}/observations`, observationId);
      const obsDoc = await getDoc(docRef);
      if (obsDoc.exists()) {
          const currentData = obsDoc.data() as StudentObservation;
          const newUpdate = { date: serverTimestamp(), update: updateText };
          const updatedUpdates = [...(currentData.followUpUpdates || []), newUpdate];
          await updateDoc(docRef, {
              followUpUpdates: updatedUpdates,
              isClosed: isClosing,
          });
      }
    }, [user]);
    
    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        if (!user) return;
        
        const studentRef = doc(db, `users/${user.uid}/students`, studentId);
        await updateDoc(studentRef, data);
        
        const batch = writeBatch(db);
        const userGroups = groups.filter(g => g.students.some(s => s.id === studentId));

        for(const group of userGroups) {
            const groupRef = doc(db, `users/${user.uid}/groups`, group.id);
            const updatedStudents = group.students.map(s => {
                if (s.id === studentId) {
                    return { ...s, ...data };
                }
                return s;
            });
            batch.update(groupRef, { students: updatedStudents });
        }
        await batch.commit();
    }, [user, groups]);


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
        if (!user) return;
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        const newAttendanceForDate = group.students.reduce((acc, student) => ({
            ...acc,
            [student.id]: true
        }), {} as {[studentId: string]: boolean});
        
        const docRef = getPartialDataDocRef();
        if (docRef) {
             await setDoc(docRef, { attendance: { [date]: newAttendanceForDate } }, { merge: true });
        }
    }, [user, groups, getPartialDataDocRef]);


    const contextValue: DataContextType = {
        isLoading,
        error,
        groups,
        allStudents,
        allObservations,
        settings,
        activeGroup,
        activePartialId,
        activeStudentsInGroups,
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
