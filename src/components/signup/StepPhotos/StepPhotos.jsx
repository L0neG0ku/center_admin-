import { useRef } from "react";
import Icon from "../../../icons/Icon.jsx";
import FormSection from "../FormSection/FormSection.jsx";
import { photoCategories } from "../../../data/signup.js";
import "./StepPhotos.css";

function PhotoSlot({ category, photos, onAdd, onRemove }) {
  const inputRef = useRef(null);

  return (
    <li className="photos__slot">
      <header>
        <h4>{category.label}</h4>
        <button type="button" onClick={() => inputRef.current?.click()}>
          <Icon name="cloudUpload" size={15} />
          Add
        </button>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          onAdd(category.id, Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />

      {photos.length === 0 ? (
        <button type="button" className="photos__empty" onClick={() => inputRef.current?.click()}>
          <Icon name="image" size={22} />
          <span>No photo yet</span>
        </button>
      ) : (
        <ul className="photos__thumbs">
          {photos.map((photo) => (
            <li key={photo.id}>
              <img src={photo.url} alt={photo.name} />
              <button type="button" onClick={() => onRemove(category.id, photo.id)} aria-label={`Remove ${photo.name}`}>
                <Icon name="close" size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function StepPhotos({ values, errors, onAdd, onRemove }) {
  const isDaycare = values.centreType === "Daycare" || values.centreType === "Both";
  const categories = photoCategories.filter((category) => category.onlyIf !== "daycare" || isDaycare);
  const total = Object.values(values.photos).reduce((sum, list) => sum + list.length, 0);

  return (
    <FormSection
      title="Photos"
      description="This is what parents will see on your listing. One photo is enough to move forward — you can add the rest later."
    >
      <div className="is-wide">
        <p className={`photos__count ${errors.photos ? "has-error" : ""}`.trim()}>
          <Icon name={total > 0 ? "checkCircle" : "image"} size={16} />
          {total > 0
            ? `${total} photo${total === 1 ? "" : "s"} added`
            : "Add at least one photo to continue"}
        </p>

        <ul className="photos__grid">
          {categories.map((category) => (
            <PhotoSlot
              key={category.id}
              category={category}
              photos={values.photos[category.id] || []}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </div>
    </FormSection>
  );
}
