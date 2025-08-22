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
  calculateDetailedFinalGrade: (studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData) => { finalGrade: number, criteriaDetails: CriteriaDetail[] };
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
    
    // Data stores for active group
    const [partialData, setPartialData] = useState<PartialData>(defaultPartialData);

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
            setActiveGroupIdState(null);
            setSettingsState(defaultSettings);
            setPartialData(defaultPartialData);
            setIsLoading(false);
            return;
        }
        
        const prefix = `users/${user.uid}`;

        const loadInitialData = async () => {
          try {
            setIsLoading(true);

            // Fetch initial data first to ensure availability
            const groupsQuery = query(collection(db, `${prefix}/groups`));
            const studentsQuery = query(collection(db, `${prefix}/students`));
            const observationsQuery = query(collection(db, `${prefix}/observations`));
            const settingsDocRef = doc(db, `${prefix}/settings`, 'app');

            const [groupsSnapshot, studentsSnapshot, observationsSnapshot, settingsDoc] = await Promise.all([
              getDocs(groupsQuery),
              getDocs(studentsQuery),
              getDocs(observationsQuery),
              getDoc(settingsDocRef)
            ]);
            
            setGroups(groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[]);
            setAllStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[]);
            
            const initialObservations: { [key: string]: any[] } = {};
            observationsSnapshot.docs.forEach(doc => {
                const item = { id: doc.id, ...doc.data() } as StudentObservation;
                if (item.date && item.date instanceof Timestamp) item.date = item.date.toDate().toISOString();
                item.followUpUpdates = (item.followUpUpdates || []).map(f => ({
                    ...f,
                    date: f.date && f.date instanceof Timestamp ? f.date.toDate().toISOString() : f.date
                }));
                const key = item.studentId;
                if (key) {
                    if (!initialObservations[key]) initialObservations[key] = [];
                    initialObservations[key].push(item);
                }
            });
            setAllObservations(initialObservations);

            setSettingsState(settingsDoc.exists() ? (settingsDoc.data() as typeof settings) : defaultSettings);
            
            setIsLoading(false);

          } catch (err: any) {
            console.error("Firebase data loading error:", err);
            setError(err);
            setIsLoading(false);
          }
        };

        loadInitialData();

        // Now, set up listeners for real-time updates
        const listeners: (() => void)[] = [];
        listeners.push(onSnapshot(query(collection(db, `${prefix}/groups`)), snapshot => setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[]), (e) => {console.error("groups listener error", e); setError(e);}));
        listeners.push(onSnapshot(query(collection(db, `${prefix}/students`)), snapshot => setAllStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[]), (e) => {console.error("students listener error", e); setError(e);}));
        listeners.push(onSnapshot(query(collection(db, `${prefix}/observations`)), snapshot => {
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
        }, (e) => {console.error("observations listener error", e); setError(e);}));
        listeners.push(onSnapshot(doc(db, `${prefix}/settings`, 'app'), doc => setSettingsState(doc.exists() ? (doc.data() as typeof settings) : defaultSettings), (e) => {console.error("settings listener error", e); setError(e);}));


        const storedGroupId = localStorage.getItem('activeGroupId_v1');
        if (storedGroupId) {
            setActiveGroupIdState(storedGroupId);
        }

        return () => {
            listeners.forEach(unsub => unsub());
        };
    }, [user, authLoading]);
    
    useEffect(() => {
        if(activeGroupId && activePartialId && user && !isLoading) {
            const docPath = `users/${user.uid}/groups/${activeGroupId}/partials/${activePartialId}/data/content`;
            const unsub = onSnapshot(doc(db, docPath), (docSnap) => {
                const data = docSnap.exists() ? docSnap.data() as PartialData : null;
                setPartialData({
                    criteria: data?.criteria || [],
                    grades: data?.grades || {},
                    attendance: data?.attendance || {},
                    participations: data?.participations || {},
                    activities: data?.activities || [],
                    activityRecords: data?.activityRecords || {},
                });
            }, (error) => {
                console.error(`Error fetching partial data for ${activeGroupId}/${activePartialId}:`, error);
                setError(error);
            });
            return () => unsub();
        } else {
             setPartialData(defaultPartialData);
        }
    }, [activeGroupId, activePartialId, user, isLoading]);
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<PartialData | null> => {
        if (!user) return null;
        const docRef = doc(db, `users/${user.uid}/groups/${groupId}/partials/${partialId}/data/content`);
        try {
            const docSnap = await getDoc(docRef);
            if(docSnap.exists()){
                const data = docSnap.data();
                // Ensure all keys of PartialData are present
                return {
                    criteria: data.criteria || [],
                    grades: data.grades || {},
                    attendance: data.attendance || {},
                    participations: data.participations || {},
                    activities: data.activities || [],
                    activityRecords: data.activityRecords || {},
                };
            }
            return null;
        } catch (e) {
            console.error("Failed to fetch partial data:", e);
            return null;
        }
    }, [user]);

    const getPartialDataDocRef = useCallback(() => {
        if (!activeGroupId || !user) return null;
        return doc(db, `users/${user.uid}/groups/${activeGroupId}/partials/${activePartialId}/data/content`);
    }, [activeGroupId, activePartialId, user]);


    const createSetter = useCallback((field: keyof PartialData) => async (setter: React.SetStateAction<any>) => {
        const docRef = getPartialDataDocRef();
        if (docRef) {
            const currentValue = (partialData as any)[field];
            const newValue = typeof setter === 'function' ? (setter as (prevState: any) => any)(currentValue) : setter;
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


    const calculateDetailedFinalGrade = useCallback((studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData): { finalGrade: number, criteriaDetails: CriteriaDetail[] } => {
        const data = forPartialData || partialData;
        const groupId = forGroupId || activeGroupId;
        if (!groupId || !data || !data.criteria) return { finalGrade: 0, criteriaDetails: [] };
        
        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        
        for (const criterion of data.criteria) {
            let performanceRatio = 0;

             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = data.activities.length;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(data.activityRecords?.[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                const participationDates = Object.keys(data.participations || {});
                const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(data.participations?.[date], studentId)).length;
                if (studentParticipationOpportunities > 0) {
                    const studentParticipations = Object.values(data.participations || {}).filter(p => p[studentId]).length;
                    performanceRatio = studentParticipations / studentParticipationOpportunities;
                }
            } else {
                const delivered = data.grades?.[studentId]?.[criterion.id]?.delivered ?? 0;
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
    }, [partialData, activeGroupId]);

    const calculateFinalGrade = useCallback((studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData): number => {
        return calculateDetailedFinalGrade(studentId, forGroupId, forPartialId, forPartialData).finalGrade;
    }, [calculateDetailedFinalGrade]);

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
            const groupGrades = group.students.map(s => calculateFinalGrade(s.id, group.id, activePartialId));
            const total = groupGrades.reduce((sum, grade) => sum + grade, 0);
            averages[group.id] = groupGrades.length > 0 ? total / groupGrades.length : 0;
        });
        return averages;
    }, [groups, activePartialId, calculateFinalGrade]);
    
    const atRiskStudents: StudentWithRisk[] = useMemo(() => {
        const studentsAtRiskInPartial = new Map<string, StudentWithRisk>();
        groups.forEach(group => {
            group.students.forEach(student => {
                const finalGrade = calculateFinalGrade(student.id, group.id, activePartialId);
                const risk = getStudentRiskLevel(finalGrade, partialData.attendance, student.id);

                if (risk.level === 'high' || risk.level === 'medium') {
                    studentsAtRiskInPartial.set(student.id, { ...student, calculatedRisk: risk });
                }
            });
        });

        return Array.from(studentsAtRiskInPartial.values());
    }, [groups, activePartialId, getStudentRiskLevel, calculateFinalGrade, partialData.attendance]);
    
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
    