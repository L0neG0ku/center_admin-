import { Link } from "react-router-dom";
import Icon from "../../../icons/Icon.jsx";
import "./Button.css";

/**
 * variant: primary | outline | ghost
 * Renders a <Link> when `to` is given, otherwise a <button>.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  icon,
  className = "",
  ...rest
}) {
  const classes = `btn btn--${variant} btn--${size} ${className}`.trim();
  const content = (
    <>
      {icon ? <Icon name={icon} size={size === "lg" ? 19 : 17} /> : null}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
