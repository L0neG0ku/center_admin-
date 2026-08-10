import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";

const ToastContext = createContext(() => {});

/** Confirmation messages for actions that would hit the API later. */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((current) => [...current, { id, message }]);
    setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className="toast">
            <Icon name="checkCircle" size={17} />
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
