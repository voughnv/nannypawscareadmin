import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import ConfirmationModal from "../components/common/ConfirmationModal";

const ConfirmationContext = createContext(null);

const DEFAULT_OPTIONS = {
  title: "Confirm action",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "primary",
};

export function ConfirmationProvider({ children }) {
  const resolverRef = useRef(null);
  const [confirmation, setConfirmation] = useState({
    open: false,
    ...DEFAULT_OPTIONS,
  });

  const closeConfirmation = useCallback((result) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;

    setConfirmation((previous) => ({
      ...previous,
      open: false,
    }));

    resolver?.(result);
  }, []);

  const requestConfirmation = useCallback((options = {}) => {
    // Resolve an older unresolved request before displaying a new one.
    resolverRef.current?.(false);

    setConfirmation({
      open: true,
      ...DEFAULT_OPTIONS,
      ...options,
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  return (
    <ConfirmationContext.Provider value={requestConfirmation}>
      {children}

      <ConfirmationModal
        {...confirmation}
        onConfirm={() => closeConfirmation(true)}
        onCancel={() => closeConfirmation(false)}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);

  if (!context) {
    throw new Error(
      "useConfirmation must be used inside ConfirmationProvider."
    );
  }

  return context;
}