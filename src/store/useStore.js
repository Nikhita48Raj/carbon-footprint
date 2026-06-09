import { create } from 'zustand';

/**
 * Global application state managed by Zustand.
 * Provides shared access to dashboard data, activities, goals, and UI state
 * across all pages without prop-drilling.
 */
const useStore = create((set, get) => ({

  // ── Dashboard Data ───────────────────────────────────────
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,

  fetchDashboard: async () => {
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const data = await res.json();
      set({ dashboardData: data, dashboardLoading: false });
    } catch (err) {
      set({ dashboardError: err.message, dashboardLoading: false });
    }
  },

  // ── Activities ────────────────────────────────────────────
  activities: [],
  activitiesLoading: false,

  fetchActivities: async (period = 'month') => {
    set({ activitiesLoading: true });
    try {
      const res = await fetch(`/api/activities?period=${period}`);
      const data = await res.json();
      set({ activities: data.activities ?? [], activitiesLoading: false });
    } catch {
      set({ activitiesLoading: false });
    }
  },

  logActivity: async (payload) => {
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Failed to log activity');
    }

    const data = await res.json();

    // Prepend to local state optimistically
    set((state) => ({
      activities: [data.activity, ...state.activities],
    }));

    // Re-fetch dashboard to update totals
    get().fetchDashboard();

    return data;
  },

  // ── Goals ─────────────────────────────────────────────────
  goals: [],
  goalsLoading: false,

  fetchGoals: async () => {
    set({ goalsLoading: true });
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      set({ goals: data.goals ?? [], goalsLoading: false });
    } catch {
      set({ goalsLoading: false });
    }
  },

  createGoal: async (payload) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Failed to create goal');
    }

    const data = await res.json();
    set((state) => ({ goals: [data.goal, ...state.goals] }));
    return data.goal;
  },

  // ── Real-Time Meter ────────────────────────────────────────
  realtimeKgCO2e: 0,
  setRealtimeKgCO2e: (val) => set({ realtimeKgCO2e: val }),

  // ── UI Notifications ───────────────────────────────────────
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3500);
  },
}));

export default useStore;
