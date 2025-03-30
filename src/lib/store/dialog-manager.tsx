import { create } from "zustand";

type DialogManagerStore = {
  open: boolean;
  content: React.JSX.Element;

  showDialog: (content: React.JSX.Element) => void;
  closeDialog: () => void;

  _onChangeOpen: (open: boolean) => void;
};

const useDialog = create<DialogManagerStore>()((set, get) => ({
  open: false,
  content: <></>,

  showDialog: (content) => {
    set((state) => ({
      ...state,
      content,
      open: true,
    }));
  },
  closeDialog: () => {
    set((state) => ({
      ...state,
      open: false,
    }));
  },

  _onChangeOpen: (open) => {
    if (!open) {
      get().closeDialog();
    }
  },
}));

export default useDialog;
