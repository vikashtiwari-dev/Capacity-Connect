import { create } from 'zustand';
import type { Assessment, Attempt } from '../types';
import { generateId, initialAssessments } from '../data/seed';
import { dbService } from '../services/db';

interface AssessmentsState {
  assessments: Assessment[];
  attempts: Attempt[];
  load: () => void;
  addAssessment: (a: Omit<Assessment, 'id' | 'createdAt'>) => void;
  updateAssessment: (id: string, updates: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  submitAttempt: (attempt: Omit<Attempt, 'id'>) => void;
  getAttemptsByTrainee: (traineeId: string) => Attempt[];
  getAttemptsByAssessment: (assessmentId: string) => Attempt[];
  hasAttempted: (assessmentId: string, traineeId: string) => boolean;
  getTrainerAssessments: (trainerId: string) => Assessment[];
}

export const useAssessmentsStore = create<AssessmentsState>((set, get) => {
  const refreshAssessments = async () => {
    try {
      const [serverAssessments, serverAttempts] = await Promise.all([
        dbService.getAll<Assessment>('assessments'),
        dbService.getAll<any>('assessment_results').then(res => {
          if (!res || !Array.isArray(res)) return [];
          return res.map((r: any) => ({
            id: r.id,
            assessmentId: r.assessmentId || r.assessment_id,
            traineeId: r.traineeId || r.user_id,
            score: r.score ?? 0,
            submittedAt: r.submittedAt || r.submitted_at || new Date().toISOString(),
            answers: r.answers || [],
            totalPoints: r.totalPoints || 100,
            percentage: r.percentage ?? r.score ?? 0,
            passed: r.passed ?? ((r.score ?? 0) >= 40),
            timeTakenSeconds: r.timeTakenSeconds || 0
          }));
        }).catch(() => [])
      ]);

      const validAssessments = (serverAssessments && serverAssessments.length > 0 && (serverAssessments[0] as any).questions)
        ? serverAssessments
        : initialAssessments;

      set({
        assessments: validAssessments,
        attempts: serverAttempts || []
      });
    } catch (e) {
      console.warn('Could not sync assessments from central db:', e);
    }
  };

  // Subscribe to real-time changes across devices
  try {
    dbService.subscribe('assessments', () => {
      refreshAssessments();
    });
    dbService.subscribe('assessment_results', () => {
      refreshAssessments();
    });
    // Initial fetch on module load
    refreshAssessments();
  } catch (e) {
    // SSR or offline safe
  }

  return {
    assessments: initialAssessments,
    attempts: [],

    load: () => {
      refreshAssessments();
    },

    addAssessment: (a) => {
      const { assessments } = get();
      const newA: Assessment = { ...a, id: generateId('assess'), createdAt: new Date().toISOString() };
      const updated = [newA, ...assessments];
      set({ assessments: updated });
      dbService.create('assessments', newA).catch(() => {});
    },

    updateAssessment: (id, updates) => {
      const { assessments } = get();
      const updated = assessments.map(a => a.id === id ? { ...a, ...updates } : a);
      set({ assessments: updated });
      dbService.update('assessments', id, updates).catch(() => {});
    },

    deleteAssessment: (id) => {
      const { assessments } = get();
      const updated = assessments.filter(a => a.id !== id);
      set({ assessments: updated });
      dbService.remove('assessments', id).catch(() => {});
    },

    submitAttempt: (attempt) => {
      const { attempts } = get();
      const newAttempt: Attempt = { ...attempt, id: generateId('att') };
      const updated = [...attempts, newAttempt];
      set({ attempts: updated });
      dbService.create('assessment_results', newAttempt).catch(() => {});
    },

    getAttemptsByTrainee: (traineeId) => get().attempts.filter(a => a.traineeId === traineeId),
    getAttemptsByAssessment: (assessmentId) => get().attempts.filter(a => a.assessmentId === assessmentId),
    hasAttempted: (assessmentId, traineeId) => get().attempts.some(a => a.assessmentId === assessmentId && a.traineeId === traineeId),
    getTrainerAssessments: (trainerId) => {
      return get().assessments.filter((a) =>
        a.createdBy === trainerId ||
        a.createdBy === "Dr. Marcus Vance" ||
        a.createdBy === "Faculty Trainer"
      );
    },
  };
});
