import { create } from 'zustand';

interface HeaderState {
  title: string;
  helpText?: string;
  setHeader: (title: string, helpText?: string) => void;
  clearHeader: () => void;
}

const useHeaderStore = create<HeaderState>((set) => ({
  title: '',
  helpText: '',
  setHeader: (title, helpText) => set({ title, helpText }),
  clearHeader: () => set({ title: '', helpText: '' }),
}));

export default useHeaderStore;
