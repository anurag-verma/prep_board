import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isOfferStage } from '../lib/celebration';
import { createId } from '../lib/id';
import { generateSampleData } from '../lib/sampleData';
import { SCHEMA_VERSION } from '../lib/schema';
import type { Application, Round, Stage } from '../types/models';
import { DEFAULT_STAGES } from '../types/models';
import { sharedStorage } from './persistStorage';
import { useQuestionStore } from './useQuestionStore';
import { useUiStore } from './useUiStore';

export interface QuickAddInput {
  company: string;
  role: string;
  stageId?: string;
}

export interface StageInput {
  name?: string;
  color?: string;
  isTerminal?: boolean;
}

export const MIN_STAGES = 2;
export const MAX_STAGES = 8;

interface BoardState {
  schemaVersion: number;
  stages: Stage[];
  applications: Application[];
  /** Whether the first-visit onboarding banner has been dismissed. Sticky
   * across reloads and delete-all (only ever set true, never reset). */
  onboardingDismissed: boolean;

  addApplication: (input: QuickAddInput) => Application;
  updateApplication: (id: string, patch: Partial<Application>) => void;
  /** Moves a card to `toStageId`, appending a stage_change event if the stage
   * actually changes. `beforeId`, if given, positions the card immediately
   * before that application (within its new stage's array order); omitted,
   * the card goes to the end. Moving to the same stage with no `beforeId` is
   * a no-op. */
  moveCard: (id: string, toStageId: string, beforeId?: string) => void;
  addNote: (applicationId: string, label: string) => void;
  addRound: (applicationId: string, round: Omit<Round, 'id'>) => Round;
  updateRound: (applicationId: string, roundId: string, patch: Partial<Round>) => void;
  deleteRound: (applicationId: string, roundId: string) => void;
  archiveApplication: (id: string) => void;
  unarchiveApplication: (id: string) => void;
  deleteApplication: (id: string) => void;

  addStage: (input?: StageInput) => Stage | null;
  updateStage: (id: string, patch: Partial<Pick<Stage, 'name' | 'color' | 'isTerminal'>>) => void;
  reorderStages: (orderedIds: string[]) => void;
  /** Removes a stage and relocates its cards to `destinationStageId`,
   * logging a stage_change event on each. No-ops if it would leave fewer
   * than MIN_STAGES stages, or if the destination doesn't exist. */
  deleteStage: (id: string, destinationStageId: string) => void;

  dismissOnboarding: () => void;
  /** Replaces the board and question bank with a believable example
   * dataset. Overwrites any existing applications/questions. */
  loadSampleData: () => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      stages: DEFAULT_STAGES,
      onboardingDismissed: false,
      applications: [],

      addApplication: (input) => {
        const now = new Date().toISOString();
        const stageId = input.stageId ?? get().stages[0]?.id ?? DEFAULT_STAGES[0].id;
        const application: Application = {
          id: createId(),
          company: input.company,
          role: input.role,
          stageId,
          priority: false,
          tags: [],
          contacts: [],
          notes: '',
          rounds: [],
          events: [
            {
              id: createId(),
              type: 'created',
              at: now,
              label: 'Application created',
            },
          ],
          createdAt: now,
          archivedAt: null,
        };
        set((state) => ({ applications: [...state.applications, application] }));
        return application;
      },

      updateApplication: (id, patch) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, ...patch } : app,
          ),
        }));
      },

      moveCard: (id, toStageId, beforeId) => {
        let movedToOffer = false;

        set((state) => {
          const idx = state.applications.findIndex((a) => a.id === id);
          if (idx === -1) return state;

          const app = state.applications[idx];
          const stageChanged = app.stageId !== toStageId;
          if (!stageChanged && beforeId === undefined) return state;

          if (stageChanged && isOfferStage(state.stages.find((s) => s.id === toStageId))) {
            movedToOffer = true;
          }

          const updatedApp = stageChanged
            ? {
                ...app,
                stageId: toStageId,
                events: [
                  ...app.events,
                  {
                    id: createId(),
                    type: 'stage_change' as const,
                    at: new Date().toISOString(),
                    label: `Moved to ${state.stages.find((s) => s.id === toStageId)?.name ?? toStageId}`,
                    fromStageId: app.stageId,
                    toStageId,
                  },
                ],
              }
            : app;

          const withoutApp = [...state.applications.slice(0, idx), ...state.applications.slice(idx + 1)];
          const beforeIdx = beforeId ? withoutApp.findIndex((a) => a.id === beforeId) : -1;
          const insertAt = beforeIdx === -1 ? withoutApp.length : beforeIdx;

          return {
            applications: [
              ...withoutApp.slice(0, insertAt),
              updatedApp,
              ...withoutApp.slice(insertAt),
            ],
          };
        });

        if (movedToOffer) {
          useUiStore.getState().triggerCelebration();
        }
      },

      addNote: (applicationId, label) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  events: [
                    ...app.events,
                    {
                      id: createId(),
                      type: 'custom',
                      at: new Date().toISOString(),
                      label,
                    },
                  ],
                }
              : app,
          ),
        }));
      },

      addRound: (applicationId, roundInput) => {
        const round: Round = { ...roundInput, id: createId() };
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  rounds: [...app.rounds, round],
                  events: [
                    ...app.events,
                    {
                      id: createId(),
                      type: 'round_added',
                      at: new Date().toISOString(),
                      label: `Round added: ${round.type}`,
                    },
                  ],
                }
              : app,
          ),
        }));
        return round;
      },

      updateRound: (applicationId, roundId, patch) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  rounds: app.rounds.map((r) => (r.id === roundId ? { ...r, ...patch } : r)),
                }
              : app,
          ),
        }));
      },

      deleteRound: (applicationId, roundId) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === applicationId
              ? { ...app, rounds: app.rounds.filter((r) => r.id !== roundId) }
              : app,
          ),
        }));
      },

      archiveApplication: (id) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, archivedAt: new Date().toISOString() } : app,
          ),
        }));
      },

      unarchiveApplication: (id) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, archivedAt: null } : app,
          ),
        }));
      },

      deleteApplication: (id) => {
        set((state) => ({
          applications: state.applications.filter((app) => app.id !== id),
        }));
        useQuestionStore.getState().removeCompanyId(id);
      },

      addStage: (input) => {
        const state = get();
        if (state.stages.length >= MAX_STAGES) return null;

        const stage: Stage = {
          id: createId(),
          name: input?.name ?? 'New Stage',
          color: input?.color ?? '#8A8F98',
          isTerminal: input?.isTerminal ?? false,
        };
        set((s) => ({ stages: [...s.stages, stage] }));
        return stage;
      },

      updateStage: (id, patch) => {
        set((state) => ({
          stages: state.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));
      },

      reorderStages: (orderedIds) => {
        set((state) => {
          const byId = new Map(state.stages.map((s) => [s.id, s]));
          const reordered = orderedIds
            .map((id) => byId.get(id))
            .filter((s): s is Stage => s !== undefined);
          const missing = state.stages.filter((s) => !orderedIds.includes(s.id));
          return { stages: [...reordered, ...missing] };
        });
      },

      deleteStage: (id, destinationStageId) => {
        set((state) => {
          if (state.stages.length <= MIN_STAGES) return state;
          if (id === destinationStageId) return state;

          const destination = state.stages.find((s) => s.id === destinationStageId);
          if (!destination) return state;

          const now = new Date().toISOString();
          const applications = state.applications.map((app) => {
            if (app.stageId !== id) return app;
            return {
              ...app,
              stageId: destinationStageId,
              events: [
                ...app.events,
                {
                  id: createId(),
                  type: 'stage_change' as const,
                  at: now,
                  label: `Moved to ${destination.name} (previous stage was deleted)`,
                  fromStageId: id,
                  toStageId: destinationStageId,
                },
              ],
            };
          });

          return {
            stages: state.stages.filter((s) => s.id !== id),
            applications,
          };
        });
        useUiStore.getState().removeCollapsedStageId(id);
      },

      dismissOnboarding: () => {
        set({ onboardingDismissed: true });
      },

      loadSampleData: () => {
        const { stages, applications, questions } = generateSampleData();
        set({ stages, applications, onboardingDismissed: true });
        useQuestionStore.setState({ questions });
      },
    }),
    {
      name: 'board',
      storage: createJSONStorage(() => sharedStorage),
      version: SCHEMA_VERSION,
    },
  ),
);
