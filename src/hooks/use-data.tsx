
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
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
  addDoc,
  serverTimestamp,
  Timestamp
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

// CONTEXT TYPE
interface DataContextType {
  // State
  isLoading: boolean;
  groups: Group[];
  allStudents: Student[];
  allObservations: {[studentId: string]: StudentObservation[]};
  activeStudentsInGroups: Student[];
  settings: { institutionName: string; logo: string; theme: string };
  userProfile: UserProfile | null;
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  
  partialData: PartialData;

  groupAverages: {[groupId: string]: number};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;

  // Setters
  setGroups: (groups: Group[]) => Promise<void>;
  setAllStudents: (students: Student[]) => Promise<void>;
  addStudentToGroup: (student: Omit<Student, 'id' | 'photo'>) => Promise<void>;
  updateStudentInGroup: (studentId: string, studentData: Partial<Student>) => Promise<void>;
  removeStudentFromGroup: (studentId: string) => Promise<void>;
  
  setActiveGroupId: (groupId: string | null) => void;
  setActivePartialId: (partialId: PartialId) => void;
  
  setCriteria: (setter: React.SetStateAction<EvaluationCriteria[]>) => Promise<void>;
  setGrades: (setter: React.SetStateAction<Grades>) => Promise<void>;
  setAttendance: (setter: React.SetStateAction<AttendanceRecord>) => Promise<void>;
  setParticipations: (setter: React.SetStateAction<ParticipationRecord>) => Promise<void>;
  setActivities: (setter: React.SetStateAction<Activity[]>) => Promise<void>;
  setActivityRecords: (setter: React.SetStateAction<ActivityRecord>) => Promise<void>;


  // Functions
  deleteGroup: (groupId: string) => Promise<void>;
  addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
  calculateFinalGrade: (studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData) => number;
  calculateDetailedFinalGrade: (studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData) => { finalGrade: number, criteriaDetails: CriteriaDetail[] };
  getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
  fetchPartialData: (groupId: string, partialId: PartialId) => Promise<PartialData>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// UTILITY FUNCTIONS
const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: "",
    theme: "theme-default"
};
const defaultProfile = {
    name: "Usuario",
    email: "",
    photoURL: ""
};


// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(true);
    
    // Core data
    const [allStudents, setAllStudentsState] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [groups, setGroupsState] = useState<Group[]>([]);
    const [settings, setSettingsState] = useState(defaultSettings);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    
    // Active state
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');
    
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
            setIsAuthLoading(false);
            if (!firebaseUser) {
              // Reset state on logout
              setGroupsState([]);
              setAllStudentsState([]);
              setAllObservations({});
              setActiveGroupIdState(null);
              setSettingsState(defaultSettings);
              setUserProfile(null);
              setIsDataLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            setIsDataLoading(true);
            const prefix = `users/${user.uid}`;
    
            const unsubscribers = [
                onSnapshot(collection(db, `${prefix}/groups`), (snapshot) => {
                    const fetchedGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
                    setGroupsState(fetchedGroups);
                    if (!activeGroupId && fetchedGroups.length > 0) {
                        setActiveGroupIdState(fetchedGroups[0].id);
                    } else if (activeGroupId && !fetchedGroups.some(g => g.id === activeGroupId)) {
                        setActiveGroupIdState(fetchedGroups.length > 0 ? fetchedGroups[0].id : null);
                    }
                }),
                onSnapshot(collection(db, `${prefix}/students`), (snapshot) => {
                    const fetchedStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
                    setAllStudentsState(fetchedStudents);
                }),
                onSnapshot(collection(db, `${prefix}/observations`), (snapshot) => {
                    const fetchedObservations: {[studentId: string]: StudentObservation[]} = {};
                    snapshot.docs.forEach(doc => {
                        const obs = { id: doc.id, ...doc.data() } as StudentObservation;
                        if (obs.studentId) {
                            if (!fetchedObservations[obs.studentId]) {
                                fetchedObservations[obs.studentId] = [];
                            }
                            obs.date = (obs.date as unknown as Timestamp).toDate().toISOString();
                            obs.followUpUpdates = (obs.followUpUpdates || []).map(f => ({...f, date: (f.date as unknown as Timestamp).toDate().toISOString()}));
                            fetchedObservations[obs.studentId].push(obs);
                        }
                    });
                    setAllObservations(fetchedObservations);
                }),
                onSnapshot(doc(db, `${prefix}/settings`, 'app'), (doc) => {
                    setSettingsState(doc.exists() ? (doc.data() as typeof settings) : defaultSettings);
                }),
                onSnapshot(doc(db, `${prefix}/profile`, 'info'), (doc) => {
                    setUserProfile(doc.exists() ? (doc.data() as UserProfile) : { ...defaultProfile, email: user.email || '' });
                }),
            ];
            
            // This will handle the loading state more gracefully
            Promise.all([
              getDoc(doc(db, `${prefix}/profile`, 'info')),
              getDoc(doc(db, `${prefix}/settings`, 'app')),
            ]).then(() => {
                setIsDataLoading(false);
            });
    
            return () => unsubscribers.forEach(unsub => unsub());
        }
    }, [user, activeGroupId]);
    
    useEffect(() => {
        if(user && activeGroupId && activePartialId) {
            const prefix = `users/${user.uid}/groups/${activeGroupId}/partials/${activePartialId}`;
            const unsub = onSnapshot(doc(db, prefix, 'data'), (doc) => {
                const data = doc.data() as Omit<PartialData, 'students'> | undefined;
                setPartialData(prev => ({
                    ...prev,
                    criteria: data?.criteria || [],
                    grades: data?.grades || {},
                    attendance: data?.attendance || {},
                    participations: data?.participations || {},
                    activities: data?.activities || [],
                    activityRecords: data?.activityRecords || {},
                }));
            });
            return () => unsub();
        } else {
             setPartialData({
                criteria: [], grades: {}, attendance: {},
                participations: {}, activities: [], activityRecords: {},
            });
        }
    }, [user, activeGroupId, activePartialId]);
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<PartialData> => {
        if (!user) return { criteria: [], grades: {}, attendance: {}, participations: {}, activities: [], activityRecords: {} };
        const docRef = doc(db, `users/${user.uid}/groups/${groupId}/partials/${partialId}`, 'data');
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
            return docSnap.data() as PartialData;
        }
        return { criteria: [], grades: {}, attendance: {}, participations: {}, activities: [], activityRecords: {} };
    }, [user]);

    const getPartialDataDocRef = useCallback(() => {
        if (!user || !activeGroupId) return null;
        return doc(db, `users/${user.uid}/groups/${activeGroupId}/partials/${activePartialId}`, 'data');
    }, [user, activeGroupId, activePartialId]);


    const createSetter = <T,>(field: keyof PartialData) => async (setter: React.SetStateAction<T>) => {
        const docRef = getPartialDataDocRef();
        if (docRef) {
            const currentValue = (partialData as any)[field];
            const newValue = typeof setter === 'function' ? (setter as (prevState: T) => T)(currentValue) : setter;
            await setDoc(docRef, { [field]: newValue }, { merge: true });
        }
    };
    
    const setCriteria = createSetter<EvaluationCriteria[]>('criteria');
    const setGrades = createSetter<Grades>('grades');
    const setAttendance = createSetter<AttendanceRecord>('attendance');
    const setParticipations = createSetter<ParticipationRecord>('participations');
    const setActivities = createSetter<Activity[]>('activities');
    const setActivityRecords = createSetter<ActivityRecord>('activityRecords');


    const calculateDetailedFinalGrade = useCallback((studentId: string, forGroupId?: string, forPartialId?: PartialId, forPartialData?: PartialData): { finalGrade: number, criteriaDetails: CriteriaDetail[] } => {
        const data = forPartialData || partialData;
        const groupId = forGroupId || activeGroupId;
        if (!groupId) return { finalGrade: 0, criteriaDetails: [] };
        
        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        
        for (const criterion of data.criteria) {
            let performanceRatio = 0;

             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = data.activities.length;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(data.activityRecords[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                const participationDates = Object.keys(data.participations);
                const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(data.participations[date], studentId)).length;
                if (studentParticipationOpportunities > 0) {
                    const studentParticipations = Object.values(data.participations).filter(p => p[studentId]).length;
                    performanceRatio = studentParticipations / studentParticipationOpportunities;
                }
            } else {
                const delivered = data.grades[studentId]?.[criterion.id]?.delivered ?? 0;
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
        setActiveGroupIdState(groupId);
    };

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

    const setGroups = async (newGroups: Group[]) => {
       if (!user) return;
        const batch = writeBatch(db);
        const collectionRef = collection(db, `users/${user.uid}/groups`);
        
        const currentGroupsSnapshot = await getDocs(collectionRef);
        currentGroupsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        
        newGroups.forEach(group => {
            const docRef = doc(collectionRef, group.id);
            batch.set(docRef, group);
        });
        await batch.commit();
    };

    const setAllStudents = async (newStudents: Student[]) => {
       if (!user) return;
        const batch = writeBatch(db);
        const collectionRef = collection(db, `users/${user.uid}/students`);
        
        const currentStudentsSnapshot = await getDocs(collectionRef);
        currentStudentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        newStudents.forEach(student => {
            const docRef = doc(collectionRef, student.id);
            batch.set(docRef, student);
        });
        await batch.commit();
    };
    
    const addStudentToGroup = async (studentData: Omit<Student, 'id' | 'photo'>) => {};
    const updateStudentInGroup = async (studentId: string, studentData: Partial<Student>) => {};
    const removeStudentFromGroup = async (studentId: string) => {};
    
    const setActivePartialId = (partialId: PartialId) => {
        setActivePartialIdState(partialId);
    };

    const deleteGroup = async (groupId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, `users/${user.uid}/groups`, groupId));
        // Note: Deleting subcollections (partials) needs a more complex implementation, often a cloud function.
        // For now, we only delete the group doc.
    }
    
    const addStudentObservation = async (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
       if (!user) return;
        const newObservation = {
            ...observation,
            date: serverTimestamp(),
            followUpUpdates: [],
            isClosed: false,
        };
        await addDoc(collection(db, `users/${user.uid}/observations`), newObservation);
    };
    
    const updateStudentObservation = async (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
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
        // This is now complex to calculate across all partials efficiently on the client.
        // We will return a placeholder for now.
        return 100;
    }, []);


    const contextValue: DataContextType = {
        isLoading: isAuthLoading || isDataLoading,
        groups, allStudents, allObservations, activeStudentsInGroups, settings, userProfile, activeGroup, activePartialId,
        partialData,
        groupAverages, atRiskStudents, overallAverageParticipation,
        setGroups, setAllStudents, addStudentToGroup, updateStudentInGroup, removeStudentFromGroup, setActiveGroupId, setActivePartialId,
        setCriteria, setGrades, setAttendance, setParticipations, setActivities, setActivityRecords,
        deleteGroup, addStudentObservation, updateStudentObservation,
        calculateFinalGrade, getStudentRiskLevel, calculateDetailedFinalGrade,
        fetchPartialData,
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
