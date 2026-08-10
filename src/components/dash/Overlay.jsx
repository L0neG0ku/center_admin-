import { useEffect } from "react";
import Icon from "../../icons/Icon.jsx";

function useEscape(onClose) {
  useEffect(() => {
    const handle = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [onClose]);
}

/** Right-hand slide-over, used for every "details" view. */
export function Drawer({ title, sub, onClose, children, footer, wide = false }) {
  useEscape(onClose);

  return (
    <>
      <div className="drawer__scrim" onClick={onClose} />
      <aside
        className={`drawer ${wide ? "drawer--wide" : ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="drawer__head">
          <div>
            <h2>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={19} />
          </button>
        </header>

        <div className="drawer__body">{children}</div>

        {footer ? <footer className="drawer__foot">{footer}</footer> : null}
      </aside>
    </>
  );
}

/** Centred dialog for create/edit forms and confirmations. */
export function Modal({ title, sub, onClose, children, footer, size }) {
  useEscape(onClose);

  return (
    <div className="modal__scrim" onClick={onClose}>
      <div
        className={`modal ${size === "lg" ? "modal--lg" : ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <div>
            <h2>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={19} />
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}
