import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  StatCard,
  Tabs,
  Tag,
} from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * Badges: the list your centre celebrates from, and what has been given.
 *
 * **This is not a rewards programme and must not become one.** The parent
 * screen it replaced showed a child with 1,250 points, a progress bar to
 * level 4, and the rank "Super Star", with badges priced at 100 to 300 points
 * each. A number against a two-year-old's name invites comparison — with a
 * sibling, with the room, with another parent's child at the gate — and the
 * centre becomes the apparent author of a verdict no caretaker made.
 *
 * So a badge has a name, a picture and a description, and nothing else. There
 * is no points column in the database and no total in any response a parent
 * can reach.
 *
 * Two structural rules show up in this UI:
 *
 *  1. **The catalogue is separate from the awards**, so renaming "Good Eater"
 *     to "Adventurous Eater" fixes every badge already given rather than
 *     leaving a term of stale wording in children's histories.
 *  2. **A badge children already have cannot be deleted** — `409
 *     BADGE_IN_USE`. Retiring it stops it being offered while everyone who
 *     earned it keeps it.
 */

const ICONS = [
  "star", "heart", "smile", "sparkle", "leaf", "book", "brush", "music",
  "ball", "puzzle", "sun", "helping-hand", "utensils", "shoe", "cloud",
  "flower",
];

/* The console's own icon set does not have a one-to-one match for every badge
   icon the apps draw, so these are the nearest equivalents. The apps are
   where a parent actually sees them. */
const ICON_GLYPH = {
  star: "star",
  heart: "heart",
  smile: "smile",
  sparkle: "sparkle",
  leaf: "bulb",
  book: "bookOpen",
  brush: "palette",
  music: "zap",
  ball: "activity",
  puzzle: "layers",
  sun: "sun",
  "helping-hand": "users",
  utensils: "utensils",
  shoe: "activity",
  cloud: "cloudUpload",
  flower: "sparkle",
};

/* Starters a centre can accept rather than face an empty page. Phrased as
   moments, never as merit: "tried something new", not "best eater". */
const SUGGESTIONS = [
  { name: "Adventurous Eater", icon: "utensils", description: "Tried something new at mealtime." },
  { name: "Kind Helper", icon: "helping-hand", description: "Helped a friend or a grown-up without being asked." },
  { name: "Big Feelings", icon: "heart", description: "Handled something difficult in their own way." },
  { name: "Maker", icon: "brush", description: "Made something they were proud of." },
  { name: "Explorer", icon: "leaf", description: "Tried an activity they usually avoid." },
  { name: "Good Listener", icon: "book", description: "Really listened at story time." },
];

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default function Badges() {
  const toast = useToast();
  const [tab, setTab] = useState("catalogue");
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  const badgesCall = useResource((signal) => api.listBadges({ signal }), []);
  const awardsCall = useResource(
    (signal) => api.listBadgeAwards({ limit: 200 }, { signal }),
    []
  );

  const save = useAction((id, payload) =>
    id ? api.updateBadge(id, payload) : api.createBadge(payload)
  );
  const remove = useAction((id) => api.deleteBadge(id));
  const unaward = useAction((id) => api.removeBadgeAward(id));

  const badges = useMemo(() => badgesCall.data || [], [badgesCall.data]);
  const awards = useMemo(() => awardsCall.data || [], [awardsCall.data]);

  const active = useMemo(() => badges.filter((b) => b.is_active), [badges]);

  /* Children who have been given at least one. Deliberately NOT "how many
     each child has" — that is the scoreboard, and counting it here is how it
     creeps back in. */
  const childrenReached = useMemo(
    () => new Set(awards.map((a) => a.child_id)).size,
    [awards]
  );

  const unused = useMemo(
    () => active.filter((b) => !b.times_awarded),
    [active]
  );

  async function handleSave(payload) {
    try {
      await save.run(editing?.id, payload);
      setEditing(null);
      badgesCall.reload();
      toast.show(editing?.id ? "Saved." : "Badge added.");
    } catch (error) {
      toast.show(error?.message || "Could not save that.", "error");
    }
  }

  async function handleDelete() {
    try {
      await remove.run(removing.id);
      setRemoving(null);
      badgesCall.reload();
      toast.show("Deleted.");
    } catch (error) {
      toast.show(error?.message || "Could not delete that.", "error");
    }
  }

  async function addSuggestion(suggestion) {
    try {
      await save.run(null, { ...suggestion, position: badges.length });
      badgesCall.reload();
      toast.show(`${suggestion.name} added.`);
    } catch (error) {
      toast.show(error?.message || "Could not add that.", "error");
    }
  }

  return (
    <>
      <PageHead
        title="Badges"
        sub="Moments your rooms can mark. No points, no levels — a badge is a note home, not a score."
      >
        <Btn icon="plus" onClick={() => setEditing({})}>
          Add a badge
        </Btn>
      </PageHead>

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard icon="sparkle" tone="brand" label="Badges you offer" value={active.length} />
        <StatCard icon="checkCircle" tone="green" label="Given" value={awards.length} />
        <StatCard icon="baby" tone="blue" label="Children given one" value={childrenReached} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "catalogue", label: "Your list", count: badges.length },
          { id: "given", label: "Given", count: awards.length },
        ]}
      />

      {tab === "catalogue" ? (
        <>
          {badges.length > 0 && unused.length > 0 && (
            <p className="note-box" style={{ marginBottom: 16 }}>
              <Icon name="bulb" size={15} />{" "}
              {unused.length === 1
                ? `"${unused[0].name}" has never been given.`
                : `${unused.length} badges have never been given.`}{" "}
              Either they do not fit how your rooms work, or nobody knows they
              are there. Worth a word at handover.
            </p>
          )}

          <Panel title="Your list" sub="Caretakers award from this. Drag-free: use the order field.">
            {badgesCall.loading ? (
              <p className="note-box">Loading…</p>
            ) : badgesCall.error ? (
              <p className="note-box" style={{ borderColor: "var(--danger)" }}>
                {badgesCall.error.message}{" "}
                <button type="button" onClick={badgesCall.reload}>
                  Try again
                </button>
              </p>
            ) : badges.length === 0 ? (
              <Empty
                icon="sparkle"
                title="No badges yet"
                body="Add your own, or start from the suggestions below. Until you add one, your caretakers have nothing to give."
              />
            ) : (
              <div className="annlist">
                {badges.map((badge) => (
                  <BadgeRow
                    key={badge.id}
                    badge={badge}
                    onEdit={() => setEditing(badge)}
                    onDelete={() => setRemoving(badge)}
                    onToggle={() =>
                      handleSaveToggle(badge, save, badgesCall, toast)
                    }
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Suggestions"
            sub="Phrased as moments rather than merit. Edit the wording after adding — it is yours."
          >
            <div className="annlist">
              {SUGGESTIONS.filter(
                (s) =>
                  !badges.some(
                    (b) => b.name.toLowerCase() === s.name.toLowerCase()
                  )
              ).map((suggestion) => (
                <div className="annrow" key={suggestion.name}>
                  <Icon name={ICON_GLYPH[suggestion.icon] || "star"} size={18} />
                  <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                    <strong>{suggestion.name}</strong>
                    <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                      {suggestion.description}
                    </p>
                  </div>
                  <Btn
                    variant="outline"
                    size="sm"
                    icon="plus"
                    onClick={() => addSuggestion(suggestion)}
                  >
                    Add
                  </Btn>
                </div>
              ))}
            </div>
          </Panel>
        </>
      ) : (
        <Panel title="Given" sub="Newest first. Families see these with whatever the caretaker wrote.">
          {awardsCall.loading ? (
            <p className="note-box">Loading…</p>
          ) : awardsCall.error ? (
            <p className="note-box" style={{ borderColor: "var(--danger)" }}>
              {awardsCall.error.message}{" "}
              <button type="button" onClick={awardsCall.reload}>
                Try again
              </button>
            </p>
          ) : awards.length === 0 ? (
            <Empty
              icon="sparkle"
              title="None given yet"
              body="Caretakers give these from the app when something happens."
            />
          ) : (
            <div className="annlist">
              {awards.map((award) => (
                <AwardRow
                  key={award.id}
                  award={award}
                  busy={unaward.running}
                  onRemove={async () => {
                    try {
                      await unaward.run(award.id);
                      awardsCall.reload();
                      toast.show("Taken back.");
                    } catch (error) {
                      toast.show(error?.message || "Could not do that.", "error");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      {editing && (
        <BadgeModal
          badge={editing}
          busy={save.running}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {removing && (
        <Modal
          title={`Delete "${removing.name}"?`}
          onClose={() => setRemoving(null)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setRemoving(null)}>
                Cancel
              </Btn>
              <Btn variant="danger" disabled={remove.running} onClick={handleDelete}>
                {remove.running ? "Deleting…" : "Delete"}
              </Btn>
            </>
          }
        >
          {removing.times_awarded > 0 ? (
            <p className="note-box" style={{ borderColor: "var(--warning)" }}>
              <Icon name="alertCircle" size={14} /> This has been given{" "}
              {removing.times_awarded}{" "}
              {removing.times_awarded === 1 ? "time" : "times"}. Deleting is
              refused, because it would empty those children&rsquo;s histories.
              Turn it off instead — it stops being offered and everyone who
              earned it keeps it.
            </p>
          ) : (
            <p>Nobody has been given this one, so nothing is lost.</p>
          )}
        </Modal>
      )}
    </>
  );
}

async function handleSaveToggle(badge, save, call, toast) {
  try {
    await save.run(badge.id, { is_active: !badge.is_active });
    call.reload();
    toast.show(badge.is_active ? "Turned off." : "Turned back on.");
  } catch (error) {
    toast.show(error?.message || "Could not change that.", "error");
  }
}

function BadgeRow({ badge, onEdit, onDelete, onToggle }) {
  return (
    <div className="annrow" style={badge.is_active ? undefined : { opacity: 0.6 }}>
      <Icon name={ICON_GLYPH[badge.icon] || "star"} size={20} />
      <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{badge.name}</strong>
          {!badge.is_active && <Tag tone="grey">Turned off</Tag>}
        </div>
        {badge.description && (
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
            {badge.description}
          </p>
        )}
        <p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>
          {/* About the badge, never about a child. */}
          {badge.times_awarded
            ? `Given ${badge.times_awarded} ${badge.times_awarded === 1 ? "time" : "times"}`
            : "Never given"}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Btn variant="outline" size="sm" onClick={onToggle}>
          {badge.is_active ? "Turn off" : "Turn on"}
        </Btn>
        <Btn variant="outline" size="sm" icon="pencil" onClick={onEdit}>
          Edit
        </Btn>
        <Btn variant="outline" size="sm" icon="trash" onClick={onDelete}>
          Delete
        </Btn>
      </div>
    </div>
  );
}

function AwardRow({ award, busy, onRemove }) {
  return (
    <div className="annrow">
      <Icon name={ICON_GLYPH[award.badge_icon] || "star"} size={20} />
      <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{award.child_name || "A child"}</strong>
          <span className="muted" style={{ fontSize: 13 }}>
            {award.badge_name}
          </span>
          {award.classroom_name && (
            <span className="muted" style={{ fontSize: 12 }}>
              {award.classroom_name}
            </span>
          )}
        </div>
        {award.note && <p style={{ margin: "4px 0 0" }}>{award.note}</p>}
        <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
          {when(award.awarded_at)}
          {award.awarded_by?.name ? ` · ${award.awarded_by.name}` : ""}
        </p>
      </div>
      <Btn variant="outline" size="sm" disabled={busy} onClick={onRemove}>
        Take back
      </Btn>
    </div>
  );
}

function BadgeModal({ badge, busy, onClose, onSave }) {
  const [name, setName] = useState(badge.name || "");
  const [description, setDescription] = useState(badge.description || "");
  const [icon, setIcon] = useState(badge.icon || "star");
  const [position, setPosition] = useState(badge.position ?? 0);

  const ready = name.trim().length >= 2;
  const editingExisting = Boolean(badge.id);

  return (
    <Modal
      title={editingExisting ? `Edit "${badge.name}"` : "Add a badge"}
      sub={
        editingExisting
          ? "Renaming updates every badge already given, so nothing goes stale."
          : "A moment worth marking. Not a reward for being best at something."
      }
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={!ready || busy}
            onClick={() =>
              onSave({
                name: name.trim(),
                description: description.trim() || null,
                icon,
                position: Number(position) || 0,
              })
            }
          >
            {busy ? "Saving…" : "Save"}
          </Btn>
        </>
      }
    >
      <label className="dfield">
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adventurous Eater"
          maxLength={60}
        />
      </label>

      <label className="dfield">
        <span>What earns it</span>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tried something new at mealtime."
          maxLength={500}
        />
        <small className="muted">
          {/* Both sides read this, which is why it is worth filling. */}
          Your caretakers see this when choosing, and families see it on the
          badge. Describe the moment, not the child.
        </small>
      </label>

      <label className="dfield">
        <span>Picture</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ICONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              title={key}
              style={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                borderRadius: 10,
                background: icon === key ? "var(--brand-50)" : "transparent",
                border: `1px solid ${icon === key ? "var(--brand-600)" : "var(--line)"}`,
              }}
            >
              <Icon name={ICON_GLYPH[key] || "star"} size={18} />
            </button>
          ))}
        </div>
        <small className="muted">
          {/* Why it is a fixed set rather than an upload. */}
          A fixed set, so every badge draws correctly in both apps.
        </small>
      </label>

      <label className="dfield">
        <span>Order</span>
        <input
          type="number"
          min={0}
          max={999}
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
        <small className="muted">
          Lower comes first in the caretaker&rsquo;s list. Put the common ones
          at the top.
        </small>
      </label>
    </Modal>
  );
}
