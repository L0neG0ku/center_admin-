import { useRef, useState } from "react";
import Icon from "../../../icons/Icon.jsx";
import "./FileDrop.css";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Click-or-drag upload control. There's no backend yet, so the file is held
 * in memory — swap `onSelect` for the upload call when the API exists.
 */
export default function FileDrop({
  id,
  file,
  onSelect,
  onRemove,
  accept = ".pdf,.jpg,.jpeg,.png",
  hint = "PDF, JPG or PNG (max 5MB)",
  error,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const take = (list) => {
    const picked = list?.[0];
    if (picked) onSelect(picked);
  };

  if (file) {
    return (
      <div className={`filedrop filedrop--filled ${error ? "has-error" : ""}`.trim()}>
        <span className="filedrop__badge">
          <Icon name="fileCheck" size={18} />
        </span>
        <span className="filedrop__meta">
          <strong>{file.name}</strong>
          <small>{formatSize(file.size)}</small>
        </span>
        <button type="button" className="filedrop__remove" onClick={onRemove} aria-label={`Remove ${file.name}`}>
          <Icon name="trash" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`filedrop ${dragging ? "is-dragging" : ""} ${error ? "has-error" : ""}`.trim()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        take(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => take(event.target.files)}
        hidden
      />

      <Icon name="cloudUpload" size={26} />
      <p>
        <button type="button" onClick={() => inputRef.current?.click()}>
          Click to upload
        </button>{" "}
        or drag and drop
      </p>
      <small>{hint}</small>
    </div>
  );
}
