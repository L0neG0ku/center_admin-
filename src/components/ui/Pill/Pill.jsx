import Icon from "../../../icons/Icon.jsx";
import "./Pill.css";

export default function Pill({ children, icon, className = "" }) {
  return (
    <span className={`pill ${className}`.trim()}>
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </span>
  );
}
