import { create } from 'zustand';
import { didRecoverFromCorruptData } from './persistStorage';

interface UiState {
  searchText: string;
  priorityOnly: boolean;
  selectedTags: string[];
  showArchived: boolean;
  selectedApplicationId: string | null;
  /** Set once at startup if localStorage held corrupt JSON and we fell back to a fresh start. */
  corruptDataRecovered: boolean;
  /** Stage ids currently shown collapsed on the board (Rejected, by default). */
  collapsedStageIds: string[];
  stageEditorOpen: boolean;
  settingsMenuOpen: boolean;
  deleteAllDataModalOpen: boolean;
  privacyModalOpen: boolean;
  aboutModalOpen: boolean;
  /** Incremented each time a card moves to the Offer stage — a component
   * watches for a change (not the value itself) to fire a one-shot burst. */
  celebration: number;

  setSearchText: (text: string) => void;
  togglePriorityOnly: () => void;
  setSelectedTags: (tags: string[]) => void;
  toggleShowArchived: () => void;
  clearFilters: () => void;
  openDetail: (applicationId: string) => void;
  closeDetail: () => void;
  dismissCorruptDataNotice: () => void;
  toggleStageCollapsed: (stageId: string) => void;
  removeCollapsedStageId: (stageId: string) => void;
  openStageEditor: () => void;
  closeStageEditor: () => void;
  setSettingsMenuOpen: (open: boolean) => void;
  openDeleteAllDataModal: () => void;
  closeDeleteAllDataModal: () => void;
  triggerCelebration: () => void;
  openPrivacyModal: () => void;
  closePrivacyModal: () => void;
  openAboutModal: () => void;
  closeAboutModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  searchText: '',
  priorityOnly: false,
  selectedTags: [],
  showArchived: false,
  selectedApplicationId: null,
  corruptDataRecovered: didRecoverFromCorruptData(),
  collapsedStageIds: ['rejected'],
  stageEditorOpen: false,
  settingsMenuOpen: false,
  deleteAllDataModalOpen: false,
  privacyModalOpen: false,
  aboutModalOpen: false,
  celebration: 0,

  setSearchText: (text) => set({ searchText: text }),
  togglePriorityOnly: () => set((state) => ({ priorityOnly: !state.priorityOnly })),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  toggleShowArchived: () => set((state) => ({ showArchived: !state.showArchived })),
  clearFilters: () =>
    set({ searchText: '', priorityOnly: false, selectedTags: [], showArchived: false }),
  openDetail: (applicationId) => set({ selectedApplicationId: applicationId }),
  closeDetail: () => set({ selectedApplicationId: null }),
  dismissCorruptDataNotice: () => set({ corruptDataRecovered: false }),
  toggleStageCollapsed: (stageId) =>
    set((state) => ({
      collapsedStageIds: state.collapsedStageIds.includes(stageId)
        ? state.collapsedStageIds.filter((id) => id !== stageId)
        : [...state.collapsedStageIds, stageId],
    })),
  removeCollapsedStageId: (stageId) =>
    set((state) => ({
      collapsedStageIds: state.collapsedStageIds.filter((id) => id !== stageId),
    })),
  openStageEditor: () => set({ stageEditorOpen: true }),
  closeStageEditor: () => set({ stageEditorOpen: false }),
  setSettingsMenuOpen: (open) => set({ settingsMenuOpen: open }),
  openDeleteAllDataModal: () => set({ settingsMenuOpen: false, deleteAllDataModalOpen: true }),
  closeDeleteAllDataModal: () => set({ deleteAllDataModalOpen: false }),
  triggerCelebration: () => set((state) => ({ celebration: state.celebration + 1 })),
  openPrivacyModal: () => set({ settingsMenuOpen: false, privacyModalOpen: true }),
  closePrivacyModal: () => set({ privacyModalOpen: false }),
  openAboutModal: () => set({ settingsMenuOpen: false, aboutModalOpen: true }),
  closeAboutModal: () => set({ aboutModalOpen: false }),
}));
