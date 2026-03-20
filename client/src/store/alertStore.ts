import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface AppAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  onConfirm?: () => void;
  // If cancel is provided, a secondary button appears
  cancelText?: string;
  onCancel?: () => void;
  sound?: boolean;
}

interface AlertState {
  alerts: AppAlert[];
  addAlert: (alert: Omit<AppAlert, 'id'>) => string;
  removeAlert: (id: string) => void;
}

const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  addAlert: (alert) => {
    const id = uuidv4();
    set((state) => ({ alerts: [...state.alerts, { ...alert, id }] }));
    return id;
  },
  removeAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
}));

export default useAlertStore;
