
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
  addDoc,
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
  activeStudentsInGroups: Student[];
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
  fetchPartialData: (groupId: string, partialId: PartialId) => Promise<PartialData>;
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
        const unsubscribers: (() => void)[] = [];
        
        const setupListeners = () => {
            setIsLoading(true);
            try {
                const groupsQuery = query(collection(db, `${prefix}/groups`));
                unsubscribers.push(
                    onSnapshot(groupsQuery, (snapshot) => {
                        setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group)));
                        // This is the key: only set loading to false after the first batch of essential data has arrived.
                        setIsLoading(false);
                    }, (err) => {
                        console.error("Error in groups listener:", err);
                        setError(err);
                        setIsLoading(false);
                    })
                );
                
                const studentsQuery = query(collection(db, `${prefix}/students`));
                unsubscribers.push(
                    onSnapshot(studentsQuery, (snapshot) => {
                        setAllStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
                    }, (err) => console.error("Error in students listener:", err))
                );

                const observationsQuery = query(collection(db, `${prefix}/observations`));
                unsubscribers.push(
                    onSnapshot(observationsQuery, (snapshot) => {
                        const obsData: { [studentId: string]: StudentObservation[] } = {};
                        snapshot.docs.forEach(doc => {
                            const obs = { id: doc.id, ...doc.data() } as StudentObservation;
                            if (obs.studentId) {
                                if (!obsData[obs.studentId]) obsData[obs.studentId] = [];
                                if (obs.date && obs.date instanceof Timestamp) obs.date = obs.date.toDate().toISOString();
                                obs.followUpUpdates = (obs.followUpUpdates || []).map(f => ({
                                    ...f,
                                    date: f.date && f.date instanceof Timestamp ? f.date.toDate().toISOString() : f.date
                                }));
                                obsData[obs.studentId].push(obs);
                            }
                        });
                        setAllObservations(obsData);
                    }, (err) => console.error("Error in observations listener:", err))
                );

                const settingsDoc = doc(db, `${prefix}/settings`, 'app');
                unsubscribers.push(
                    onSnapshot(settingsDoc, (doc) => {
                        setSettingsState(doc.exists() ? (doc.data() as typeof settings) : defaultSettings);
                    }, (err) => console.error("Error in settings listener:", err))
                );
            } catch (err: any) {
                console.error("Error setting up Firestore listeners:", err);
                setError(err);
                setIsLoading(false);
            }
        };
        
        setupListeners();
        
        const storedGroupId = localStorage.getItem('activeGroupId_v1');
        if (storedGroupId) {
            setActiveGroupIdState(storedGroupId);
        }

        return () => {
            unsubscribers.forEach(unsub => unsub());
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
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<PartialData> => {
        if (!user) return defaultPartialData;
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
        } catch (e) {
            console.error("Failed to fetch partial data:", e);
        }
        return defaultPartialData;
    }, [user]);

    const getPartialDataDocRef = useCallback(() => {
        if (!activeGroupId || !user) return null;
        return doc(db, `users/${user.uid}/groups/${activeGroupId}/partials/${activePartialId}/data/content`);
    }, [activeGroupId, activePartialId, user]);


    const createSetter = <T,>(field: keyof PartialData) => async (setter: React.SetStateAction<T>) => {
        const docRef = getPartialDataDocRef();
        if (docRef) {
            const currentValue = (partialData as any)[field];
            const newValue = typeof setter === 'function' ? (setter as (prevState: T) => T)(currentValue) : setter;
            await setDoc(docRef, { [field]: newValue }, { merge: true });
        }
    };
    
    const setSettings = async (newSettings: { institutionName: string; logo: string; theme: string }) => {
        if (!user) throw new Error("User not authenticated");
        if (isLoading) return;
        await setDoc(doc(db, `users/${user.uid}/settings`, 'app'), newSettings);
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

    const addStudentsToGroup = async (groupId: string, students: Student[]) => {
        if (!user) return;
        const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
        // Use arrayUnion to add new students without overwriting existing ones.
        await updateDoc(groupRef, {
            students: arrayUnion(...students)
        });

        // Also add students to the global student list if they are not there
        const batch = writeBatch(db);
        const studentsCollectionRef = collection(db, `users/${user.uid}/students`);
        for (const student of students) {
            const studentRef = doc(studentsCollectionRef, student.id);
            batch.set(studentRef, student, { merge: true });
        }
        await batch.commit();
    };

    const removeStudentFromGroup = async (groupId: string, studentId: string) => {
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
    };
    
    const setActivePartialId = (partialId: PartialId) => {
        setActivePartialIdState(partialId);
    };

    const deleteGroup = async (groupId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, `users/${user.uid}/groups`, groupId));
        // Note: Deleting subcollections (partials) needs a more complex implementation, often a cloud function.
        // For now, we only delete the group doc.
    }

    const updateGroup = async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        if (!user) return;
        const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
        await updateDoc(groupRef, data);
    };
    
    const addStudentObservation = async (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
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
    
    const updateStudent = async (studentId: string, data: Partial<Student>) => {
        if (!user) return;
        
        // Update in the master student list
        const studentRef = doc(db, `users/${user.uid}/students`, studentId);
        await updateDoc(studentRef, data);
        
        // Update in all groups the student belongs to
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
    };


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

    const takeAttendanceForDate = async (groupId: string, date: string) => {
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
    };


    const contextValue: DataContextType = {
        isLoading: isLoading,
        error,
        groups, allStudents, allObservations, activeStudentsInGroups, settings,
        activeGroup, activePartialId,
        partialData,
        groupAverages, atRiskStudents, overallAverageParticipation,
        addStudentsToGroup, removeStudentFromGroup, updateGroup, updateStudent,
        setActiveGroupId, setActivePartialId,
        setCriteria, setGrades, setAttendance, setParticipations, setActivities, setActivityRecords,
        setSettings,
        deleteGroup, addStudentObservation, updateStudentObservation,
        calculateFinalGrade, getStudentRiskLevel, calculateDetailedFinalGrade,
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
```
<change>
    <file>src/app/students/[studentId]/page.tsx</file>
    <content>
        'use client';

        import * as React from 'react';
        import {
          Card,
          CardContent,
          CardDescription,
          CardHeader,
          CardTitle,
          CardFooter,
        } from '@/components/ui/card';
        import { Button } from '@/components/ui/button';
        import { notFound, useParams } from 'next/navigation';
        import Image from 'next/image';
        import Link from 'next/link';
        import { ArrowLeft, Download, User, Mail, Phone, Wand2, Loader2, MessageSquare, BookText, Edit, Save } from 'lucide-react';
        import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
        import { useToast } from '@/hooks/use-toast';
        import jsPDF from 'jspdf';
        import html2canvas from 'html2canvas';
        import { useData } from '@/hooks/use-data';
        import { Badge } from '@/components/ui/badge';
        import { getPartialLabel } from '@/lib/utils';
        import type { PartialId, StudentObservation, PartialData } from '@/hooks/use-data';
        import { StudentObservationLogDialog } from '@/components/student-observation-log-dialog';
        import { WhatsAppDialog } from '@/components/whatsapp-dialog';
        import { generateStudentFeedback } from '@/ai/flows/student-feedback';
        import type { StudentFeedbackInput, StudentFeedbackOutput } from '@/ai/flows/student-feedback';
        import { Separator } from '@/components/ui/separator';
        import { Textarea } from '@/components/ui/textarea';
        import { Label } from '@/components/ui/label';
        
        type StudentStats = ReturnType<typeof useData>['calculateDetailedFinalGrade'] & {
          partialId: PartialId;
          attendance: { p: number; a: number; total: number; rate: number };
          observations: StudentObservation[];
        };
        
        export default function StudentProfilePage() {
          const params = useParams();
          const studentId = params.studentId as string;
        
          const {
            allStudents,
            groups,
            calculateDetailedFinalGrade,
            allObservations,
            isLoading,
            fetchPartialData,
            error: dataError,
          } = useData();
        
          const [isLogOpen, setIsLogOpen] = useState(false);
          const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
          const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
          const [generatedFeedback, setGeneratedFeedback] = useState<StudentFeedbackOutput | null>(null);
          const [isEditingFeedback, setIsEditingFeedback] = useState(false);
          const [editedFeedback, setEditedFeedback] = useState<{ feedback: string; recommendations: string }>({
            feedback: '',
            recommendations: '',
          });
          const [studentStatsByPartial, setStudentStatsByPartial] = useState<StudentStats[]>([]);
          const [isCalculatingStats, setIsCalculatingStats] = useState(true);
          const [error, setError] = useState<string | null>(null);
        
          const reportRef = useRef<HTMLDivElement>(null);
          const { toast } = useToast();
        
          const student = useMemo(() => allStudents.find((s) => s.id === studentId), [allStudents, studentId]);
        
          const studentGroups = useMemo(() => {
            return groups.filter((g) => g.students.some((s) => s.id === studentId));
          }, [groups, studentId]);
        
          const calculateStats = useCallback(async () => {
            if (!student || studentGroups.length === 0) {
              setError('Estudiante no encontrado o no está asignado a ningún grupo.');
              setIsCalculatingStats(false);
              return;
            }
        
            const primaryGroupId = studentGroups[0]?.id;
            if (!primaryGroupId) {
              setError('No se encontró un grupo principal para el estudiante.');
              setIsCalculatingStats(false);
              return;
            }
        
            setIsCalculatingStats(true);
            setError(null);
            try {
              const partials: PartialId[] = ['p1', 'p2', 'p3'];
              const allStats: StudentStats[] = [];
        
              for (const pId of partials) {
                try {
                  const partialData = await fetchPartialData(primaryGroupId, pId);
        
                  if (!partialData || !partialData.criteria) {
                    console.warn(`No valid data for partial ${pId} in group ${primaryGroupId}`);
                    continue;
                  }
        
                  const gradeDetails = calculateDetailedFinalGrade(student.id, primaryGroupId, pId, partialData);
        
                  let p = 0,
                    a = 0,
                    total = 0;
                  const safeAttendance = partialData.attendance || {};
                  Object.keys(safeAttendance).forEach((date) => {
                    if (safeAttendance[date]?.[studentId] !== undefined) {
                      total++;
                      if (safeAttendance[date][studentId]) p++;
                      else a++;
                    }
                  });
        
                  const partialObservations = (allObservations[studentId] || []).filter((obs) => obs.partialId === pId);
        
                  allStats.push({
                    ...gradeDetails,
                    partialId: pId,
                    attendance: { p, a, total, rate: total > 0 ? (p / total) * 100 : 100 },
                    observations: partialObservations,
                  });
                } catch (e) {
                  console.error(`Error processing partial ${pId}:`, e);
                  toast({
                    variant: 'destructive',
                    title: `Error al cargar datos del parcial ${getPartialLabel(pId)}`,
                    description: 'No se pudieron cargar los datos. Inténtalo de nuevo.',
                  });
                }
              }
        
              setStudentStatsByPartial(allStats);
            } catch (e) {
              console.error('Error calculating stats:', e);
              setError('Error al calcular las estadísticas del estudiante.');
              toast({
                variant: 'destructive',
                title: 'Error al cargar estadísticas',
                description: 'No se pudieron calcular las estadísticas del estudiante.',
              });
            } finally {
              setIsCalculatingStats(false);
            }
          }, [student, studentGroups, calculateDetailedFinalGrade, allObservations, studentId, fetchPartialData, toast]);
        
          useEffect(() => {
            if (isLoading) {
              setIsCalculatingStats(true);
              return;
            }
            if (student && studentGroups.length > 0) {
              calculateStats();
            } else if (!isLoading) {
                 setIsCalculatingStats(false);
                if (!student) {
                    setError('Estudiante no encontrado.');
                } else if (studentGroups.length === 0) {
                    setError('El estudiante no está asignado a ningún grupo.');
                }
            }
          }, [isLoading, student, studentGroups, calculateStats]);
        
          const semesterAverage = useMemo(() => {
            if (studentStatsByPartial.length === 0) return 0;
            const partialsWithGrades = studentStatsByPartial.filter((s) => s.criteriaDetails.length > 0);
            if (partialsWithGrades.length === 0) return 0;
            const total = partialsWithGrades.reduce((sum, stats) => sum + stats.finalGrade, 0);
            return total / partialsWithGrades.length;
          }, [studentStatsByPartial]);
        
          const handleDownloadPdf = async () => {
            const reportElement = reportRef.current;
            if (!reportElement) return;
        
            const idsToHide = ['interactive-buttons-header', 'interactive-buttons-card', 'feedback-buttons-container'];
            const elementsToHide: HTMLElement[] = idsToHide
              .map((id) => document.getElementById(id))
              .filter(Boolean) as HTMLElement[];
            const originalDisplays = new Map<HTMLElement, string>();
        
            toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });
        
            elementsToHide.forEach((el) => {
              originalDisplays.set(el, el.style.display);
              el.style.display = 'none';
            });
        
            try {
              const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              const canvasWidth = canvas.width;
              const canvasHeight = canvas.height;
              const ratio = canvasWidth / canvasHeight;
        
              let imgWidth = pdfWidth - 20;
              let imgHeight = imgWidth / ratio;
        
              if (imgHeight > pdfHeight - 20) {
                imgHeight = pdfHeight - 20;
                imgWidth = imgHeight * ratio;
              }
        
              const x = (pdfWidth - imgWidth) / 2;
              const y = 10;
        
              pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
              pdf.save(`informe_${student?.name.replace(/\s+/g, '_') || 'estudiante'}.pdf`);
            } catch (error) {
              console.error('Error generating PDF:', error);
              toast({
                variant: 'destructive',
                title: 'Error al generar PDF',
                description: 'No se pudo crear el archivo. Inténtalo de nuevo.',
              });
            } finally {
              elementsToHide.forEach((el) => {
                el.style.display = originalDisplays.get(el) || '';
              });
            }
          };
        
          const handleGenerateFeedback = async () => {
            if (!student) return;
        
            const partialsWithData = studentStatsByPartial
              .filter((s) => s.criteriaDetails.length > 0)
              .sort((a, b) => parseInt(b.partialId.slice(1)) - parseInt(a.partialId.slice(1)));
        
            const dataToUse = partialsWithData.length > 0 ? partialsWithData[0] : null;
        
            if (!dataToUse) {
              toast({
                variant: 'destructive',
                title: 'Sin datos',
                description: 'No hay datos de ningún parcial para generar feedback.',
              });
              return;
            }
        
            toast({ title: `Generando feedback...`, description: `Usando datos de: ${getPartialLabel(dataToUse.partialId)}` });
            setIsGeneratingFeedback(true);
            setGeneratedFeedback(null);
            try {
              const inputData: StudentFeedbackInput = {
                studentName: student.name,
                gradesByGroup: [
                  {
                    group: studentGroups.find((g) => g.students.some((s) => s.id === studentId))?.subject || 'Clase',
                    grade: dataToUse.finalGrade,
                  },
                ],
                attendance: dataToUse.attendance,
                observations: dataToUse.observations.map((obs) => ({ type: obs.type, details: obs.details })),
              };
        
              const feedback = await generateStudentFeedback(inputData);
              setGeneratedFeedback(feedback);
            } catch (error) {
              console.error('Error generating feedback:', error);
              toast({ variant: 'destructive', title: 'Error de IA', description: 'No se pudo generar el feedback.' });
            } finally {
              setIsGeneratingFeedback(false);
            }
          };
        
          const handleEditFeedback = () => {
            if (generatedFeedback) {
              setEditedFeedback({
                feedback: generatedFeedback.feedback,
                recommendations: generatedFeedback.recommendations.join('\n'),
              });
              setIsEditingFeedback(true);
            }
          };
        
          const handleSaveFeedback = () => {
            if (generatedFeedback) {
              setGeneratedFeedback({
                feedback: editedFeedback.feedback,
                recommendations: editedFeedback.recommendations.split('\n').filter((r) => r.trim() !== ''),
              });
              setIsEditingFeedback(false);
              toast({ title: 'Feedback actualizado' });
            }
          };
        
          if (isLoading || isCalculatingStats) {
            return (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando perfil del estudiante...</span>
              </div>
            );
          }
        
          if (!student) {
            return notFound();
          }
        
          if (error || dataError) {
            return (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <p className="text-lg font-semibold text-destructive">Error al cargar el perfil del estudiante</p>
                <p className="text-muted-foreground mt-2">{error || dataError?.message || 'Ocurrió un error inesperado.'}</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">Volver al Dashboard</Link>
                </Button>
              </div>
            );
          }
        
          const allSemesterObservations = Object.values(allObservations)
            .flat()
            .filter((obs) => obs.studentId === studentId);
          const facilitatorName = studentGroups[0]?.facilitator || 'Docente';
          const hasAnyDataForFeedback = studentStatsByPartial.some((s) => s.criteriaDetails.length > 0);
        
          return (
            <>
              <StudentObservationLogDialog student={student} open={isLogOpen} onOpenChange={setIsLogOpen} />
              <WhatsAppDialog studentName={student.name} open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />
        
              <div className="flex flex-col gap-6">
                <div id="interactive-buttons-header" className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                      <Link href="/dashboard">
                        <ArrowLeft />
                        <span className="sr-only">Volver</span>
                      </Link>
                    </Button>
                    <div>
                      <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
                      <p className="text-muted-foreground">Información detallada de {student.name}.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadPdf}>
                      <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                  </div>
                </div>
        
                <div ref={reportRef} className="p-2">
                  <Card>
                    <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                      <Image
                        src={student.photo}
                        alt={student.name}
                        width={128}
                        height={128}
                        className="rounded-full border-4 border-primary"
                        data-ai-hint="student photo"
                      />
                      <div className="w-full">
                        <CardTitle className="text-3xl">{student.name}</CardTitle>
                        <p className="text-lg text-muted-foreground font-semibold">
                          Asignatura: {studentGroups[0]?.subject || 'No asignada'}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" /> {student.email || 'No registrado'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" /> {student.phone || 'No registrado'}
                          </p>
                          <p className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Tutor: {student.tutorName || 'No registrado'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" /> Tel. Tutor: {student.tutorPhone || 'No registrado'}
                          </p>
                        </div>
                        <div id="interactive-buttons-card" className="mt-4 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsLogOpen(true)}>
                            <MessageSquare className="mr-2" /> Ver Bitácora
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setIsWhatsAppOpen(true)}>
                            Enviar informe vía WhatsApp
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
        
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      {studentStatsByPartial.map(
                        (stats, index) =>
                          stats.criteriaDetails.length > 0 && (
                            <Card key={stats.partialId}>
                              <CardHeader>
                                <CardTitle>{getPartialLabel(stats.partialId)}</CardTitle>
                                <CardDescription>
                                  Calificación Final:{' '}
                                  <Badge className={stats.finalGrade >= 60 ? 'bg-green-500' : 'bg-destructive'}>
                                    {stats.finalGrade.toFixed(1)}%
                                  </Badge>{' '}
                                  | Asistencia: <Badge variant="secondary">{stats.attendance.rate.toFixed(1)}%</Badge>
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <h4 className="font-semibold mb-2 text-sm">Desglose de Criterios:</h4>
                                <div className="space-y-1 text-sm p-3 bg-muted/30 rounded-md">
                                  {stats.criteriaDetails.map((c) => (
                                    <div key={c.name} className="flex justify-between">
                                      <span>
                                        {c.name} <span className="text-xs text-muted-foreground">({c.weight}%)</span>
                                      </span>
                                      <span className="font-medium">{c.earned.toFixed(1)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )
                      )}
                      {studentStatsByPartial.filter((s) => s.criteriaDetails.length > 0).length === 0 && (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold">Sin datos de rendimiento</h3>
                            <p className="text-muted-foreground mt-1">
                              No hay información de calificaciones registrada para este estudiante en ningún parcial.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
        
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <BookText className="h-5 w-5" /> Bitácora del Semestre
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {allSemesterObservations.length > 0 ? (
                            <div className="space-y-3 text-sm max-h-64 overflow-y-auto pr-2">
                              {allSemesterObservations.map((obs) => (
                                <div key={obs.id} className="p-2 bg-muted/50 rounded-md">
                                  <div className="flex justify-between items-center">
                                    <p className="font-semibold">{obs.type}</p>
                                    <Badge variant="outline" className="text-xs">
                                      {getPartialLabel(obs.partialId)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs mt-1">{obs.details}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay observaciones.</p>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base text-center">Calificación Final Semestral</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <p
                            className="text-5xl font-bold"
                            style={{ color: semesterAverage >= 60 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))' }}
                          >
                            {semesterAverage.toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
        
                  <Card className="mt-6">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Recomendaciones y retroalimentación</CardTitle>
                          <CardDescription>Resumen personalizado del rendimiento del estudiante.</CardDescription>
                        </div>
                        <div id="feedback-buttons-container" className="flex gap-2">
                          <Button
                            onClick={handleGenerateFeedback}
                            disabled={isGeneratingFeedback || isEditingFeedback || !hasAnyDataForFeedback}
                          >
                            {isGeneratingFeedback ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            {isGeneratingFeedback ? 'Generando...' : 'Generar Feedback'}
                          </Button>
                          {generatedFeedback && !isEditingFeedback && (
                            <Button variant="secondary" onClick={handleEditFeedback}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {generatedFeedback ? (
                      <CardContent>
                        {isEditingFeedback ? (
                          <div className="p-4 border rounded-md space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="editedFeedback" className="font-bold">
                                Feedback General:
                              </Label>
                              <Textarea
                                id="editedFeedback"
                                value={editedFeedback.feedback}
                                onChange={(e) => setEditedFeedback((prev) => ({ ...prev, feedback: e.target.value }))}
                                rows={4}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editedRecommendations" className="font-bold">
                                Recomendaciones:
                              </Label>
                              <Textarea
                                id="editedRecommendations"
                                value={editedFeedback.recommendations}
                                onChange={(e) => setEditedFeedback((prev) => ({ ...prev, recommendations: e.target.value }))}
                                rows={5}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsEditingFeedback(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleSaveFeedback}>
                                <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-r-md space-y-4">
                            <div>
                              <h4 className="font-bold">Feedback General:</h4>
                              <p className="text-sm">{generatedFeedback.feedback}</p>
                            </div>
                            <div>
                              <h4 className="font-bold">Recomendaciones:</h4>
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                {generatedFeedback.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    ) : (
                      !hasAnyDataForFeedback && (
                        <CardContent>
                          <div className="text-center text-sm text-destructive bg-destructive/10 p-4 rounded-md">
                            <p className="font-bold">Sin datos</p>
                            <p>No hay datos para generar feedback en el.</p>
                          </div>
                        </CardContent>
                      )
                    )}
                    <CardFooter>
                      <div className="w-full mt-12 pt-12 text-center text-sm">
                        <div className="inline-block">
                          <div className="border-t border-foreground w-48 mx-auto"></div>
                          <p className="mt-2 font-semibold">{facilitatorName}</p>
                          <p className="text-muted-foreground">Firma del Docente</p>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </>
          );
        }
    </content>
</change>
```