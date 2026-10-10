import NotBuilt from "../../components/dash/NotBuilt.jsx";

/**
 * Caretakers post activities with photos, and parents see them — but there
 * is no owner-facing endpoint for them. `/caretaker/activities` is scoped to
 * the caretaker's own rooms, and nothing exposes them at centre level.
 *
 * That is a real gap rather than a deliberate omission: an owner should be
 * able to see what is being shared with their families. It needs a small
 * endpoint mirroring the caretaker one at centre scope.
 */
export default function Activities() {
  return (
    <NotBuilt
      icon="palette"
      title="Activities"
      sub="Seeing the photos and moments your caretakers post is not built yet."
      instead="open Daily Care, which shows every care log your team recorded
        today, room by room."
      when="Needs one endpoint at centre scope — the caretaker and parent
        sides already exist."
    />
  );
}
