import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type UIState = {
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Modal state
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      set => ({
        // Sidebar
        sidebarOpen: true,
        setSidebarOpen: open => set({ sidebarOpen: open }),
        toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

        // Modal
        activeModal: null,
        openModal: modalId => set({ activeModal: modalId }),
        closeModal: () => set({ activeModal: null }),

        // Loading
        isLoading: false,
        setLoading: loading => set({ isLoading: loading }),
      }),
      {
        name: 'ui-storage',
        partialize: state => ({
          sidebarOpen: state.sidebarOpen,
        }),
      },
    ),
    { name: 'UIStore' },
  ),
);
