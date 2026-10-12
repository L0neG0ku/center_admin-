import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Select,
  StatCard,
  Tabs,
  Tag,
} from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * Activity planning: the library, and the week drawn from it.
 *
 * This page was a `NotBuilt` placeholder. Two things live here now and they
 * are deliberately separate:
 *
 *  - **Library** — what the centre runs often, written once, with the
 *    materials needed. The owner builds this and it changes rarely.
 *  - **This week** — room by room, day by day, in order.
 *
 * Three rules from the API shape the page:
 *
 *  1. **A plan keeps its own wording.** Editing a library entry does not
 *     rewrite plans already made — an instruction given for a specific day
 *     must not change under the room that was given it. The library modal
 *     says so, because an owner who expects otherwise would be surprised.
 *  2. **A delivered plan is frozen** (`409 PLAN_ALREADY_DELIVERED`). So a
 *     card that has been run offers no edit or remove.
 *  3. **An unticked plan is not a failure.** A busy room forgetting to record
 *     is the normal case, so nothing here counts "missed" or shows a
 *     completion rate. Skipped — with a reason the caretaker gave — is the
 *     only negative state, because somebody said it.
 */

const AREAS = [
  { value: "PHYSICAL", label: "Moving and physical play" },
  { value: "LANGUAGE", label: "Talking and listening" },
  { value: "COGNITIVE", label: "Thinking and problem solving" },
  { value: "SOCIAL_EMOTIONAL", label: "Feelings and friendships" },
  { value: "CREATIVE", label: "Making and imagining" },
  { value: "SELF_HELP", label: "Doing things for themselves" },
];
const AREA_SHORT = {
  PHYSICAL: "Physical",
  LANGUAGE: "Language",
  COGNITIVE: "Thinking",
  SOCIAL_EMOTIONAL: "Feelings",
  CREATIVE: "Creative",
  SELF_HELP: "Independence",
};

const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/** Monday of the week containing `d`. Indian nurseries plan Monday to Friday. */
function mondayOf(d) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  return copy;
}

function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

const DAY_LABEL = (d) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export default function Activities() {
  const toast = useToast();
  const [tab, setTab] = useState("week");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [room, setRoom] = useState("");

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [planningOn, setPlanningOn] = useState(null);

  const from = isoDate(weekStart);
  const to = isoDate(addDays(weekStart, 6));

  const roomsCall = useResource((signal) => api.listClassrooms({ signal }), []);
  const templatesCall = useResource(
    (signal) => api.listActivityTemplates({ signal }),
    []
  );
  const planCall = useResource(
    (signal) =>
      api.getActivityPlan(
        { from_date: from, to_date: to, classroom_id: room || undefined },
        { signal }
      ),
    [from, to, room]
  );

  const saveTemplate = useAction((id, payload) =>
    id ? api.updateActivityTemplate(id, payload) : api.createActivityTemplate(payload)
  );
  const removeTemplate = useAction((id) => api.deleteActivityTemplate(id));
  const addPlan = useAction((payload) => api.planActivity(payload));
  const dropPlan = useAction((id) => api.removePlannedActivity(id));

  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);
  const templates = useMemo(() => templatesCall.data || [], [templatesCall.data]);
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.is_active),
    [templates]
  );
  const items = useMemo(() => planCall.data?.items || [], [planCall.data]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const byDay = useMemo(() => {
    const map = {};
    for (const day of days) map[isoDate(day)] = [];
    for (const item of items) {
      (map[item.scheduled_date] ||= []).push(item);
    }
    return map;
  }, [items, days]);

  const counts = useMemo(() => {
    const done = items.filter((i) => i.delivered_activity_id).length;
    const skipped = items.filter((i) => i.skipped_at && !i.delivered_activity_id).length;
    return { planned: items.length, done, skipped };
  }, [items]);

  const unused = useMemo(
    () => activeTemplates.filter((t) => !t.times_planned),
    [activeTemplates]
  );

  async function run(label, fn, reload) {
    try {
      await fn();
      reload();
      toast.show(label);
    } catch (error) {
      toast.show(error?.message || "That did not go through.", "error");
    }
  }

  return (
    <>
      <PageHead
        title="Activities"
        sub="What your rooms are doing, and the library you plan from."
      >
        {tab === "library" ? (
          <Btn icon="plus" onClick={() => setEditingTemplate({})}>
            Add to library
          </Btn>
        ) : (
          <Btn
            icon="plus"
            disabled={activeTemplates.length === 0 && templates.length > 0}
            onClick={() => setPlanningOn(isoDate(new Date()))}
          >
            Plan an activity
          </Btn>
        )}
      </PageHead>

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard icon="calendar" tone="brand" label="Planned this week" value={counts.planned} />
        <StatCard icon="checkCircle" tone="green" label="Recorded as done" value={counts.done} />
        {/* Not "missed". An unticked plan means nobody wrote it down. */}
        <StatCard
          icon="minusCircle"
          tone={counts.skipped ? "amber" : "grey"}
          label="Not run, with a reason"
          value={counts.skipped}
        />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "week", label: "This week", count: counts.planned },
          { id: "library", label: "Library", count: templates.length },
        ]}
      />

      {tab === "week" ? (
        <Panel
          title={`${DAY_LABEL(weekStart)} — ${DAY_LABEL(addDays(weekStart, 6))}`}
          tools={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
              >
                ← Previous
              </Btn>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(mondayOf(new Date()))}
              >
                This week
              </Btn>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                Next →
              </Btn>
              <Select
                value={room}
                onChange={setRoom}
                placeholder="Every room"
                options={[
                  { value: "", label: "Every room" },
                  ...rooms.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </div>
          }
        >
          {planCall.loading ? (
            <p className="note-box">Loading the week…</p>
          ) : planCall.error ? (
            <p className="note-box" style={{ borderColor: "var(--danger)" }}>
              {planCall.error.message}{" "}
              <button type="button" onClick={planCall.reload}>
                Try again
              </button>
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {/* Every day is drawn, including empty ones — the response
                  carries the range so a blank day is not silently skipped. */}
              {days.map((day) => {
                const key = isoDate(day);
                const rows = byDay[key] || [];
                return (
                  <div key={key} className="note-box" style={{ padding: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: rows.length ? 8 : 0,
                      }}
                    >
                      <strong>{DAY_LABEL(day)}</strong>
                      <Btn
                        variant="outline"
                        size="sm"
                        icon="plus"
                        onClick={() => setPlanningOn(key)}
                      >
                        Add
                      </Btn>
                    </div>
                    {rows.length === 0 ? (
                      <span className="muted" style={{ fontSize: 13 }}>
                        Nothing planned.
                      </span>
                    ) : (
                      <div className="annlist">
                        {rows.map((item) => (
                          <PlanRow
                            key={item.id}
                            item={item}
                            showRoom={!room}
                            onRemove={() =>
                              run(
                                "Taken off the plan.",
                                () => dropPlan.run(item.id),
                                planCall.reload
                              )
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      ) : (
        <>
          {unused.length > 0 && templates.length > 0 && (
            <p className="note-box" style={{ marginBottom: 16 }}>
              <Icon name="bulb" size={15} />{" "}
              {unused.length === 1
                ? `"${unused[0].title}" has never been planned.`
                : `${unused.length} activities have never been planned.`}{" "}
              Either they do not suit your rooms, or nobody remembers they are
              there.
            </p>
          )}

          <Panel
            title="Library"
            sub="Written once, planned many times. Editing one here does not change plans already made."
          >
            {templatesCall.loading ? (
              <p className="note-box">Loading…</p>
            ) : templatesCall.error ? (
              <p className="note-box" style={{ borderColor: "var(--danger)" }}>
                {templatesCall.error.message}{" "}
                <button type="button" onClick={templatesCall.reload}>
                  Try again
                </button>
              </p>
            ) : templates.length === 0 ? (
              <Empty
                icon="palette"
                title="Nothing in the library yet"
                body="Add the things your rooms run often — water play, story circle, the autumn walk. You only write each one once."
              />
            ) : (
              <div className="annlist">
                {templates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onEdit={() => setEditingTemplate(template)}
                    onDelete={() => setDeletingTemplate(template)}
                    onToggle={() =>
                      run(
                        template.is_active ? "Turned off." : "Turned back on.",
                        () =>
                          saveTemplate.run(template.id, {
                            is_active: !template.is_active,
                          }),
                        templatesCall.reload
                      )
                    }
                  />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {editingTemplate && (
        <TemplateModal
          template={editingTemplate}
          busy={saveTemplate.running}
          onClose={() => setEditingTemplate(null)}
          onSave={async (payload) => {
            await run(
              editingTemplate.id ? "Saved." : "Added to your library.",
              () => saveTemplate.run(editingTemplate.id, payload),
              templatesCall.reload
            );
            setEditingTemplate(null);
          }}
        />
      )}

      {deletingTemplate && (
        <Modal
          title={`Delete "${deletingTemplate.title}"?`}
          onClose={() => setDeletingTemplate(null)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setDeletingTemplate(null)}>
                Cancel
              </Btn>
              <Btn
                variant="danger"
                disabled={removeTemplate.running}
                onClick={async () => {
                  await run(
                    "Deleted.",
                    () => removeTemplate.run(deletingTemplate.id),
                    templatesCall.reload
                  );
                  setDeletingTemplate(null);
                }}
              >
                {removeTemplate.running ? "Deleting…" : "Delete"}
              </Btn>
            </>
          }
        >
          {deletingTemplate.times_planned > 0 ? (
            <p className="note-box" style={{ borderColor: "var(--warning)" }}>
              <Icon name="alertCircle" size={14} /> This is on your plan{" "}
              {deletingTemplate.times_planned}{" "}
              {deletingTemplate.times_planned === 1 ? "time" : "times"}.
              Deleting is refused so the plan still makes sense — turn it off
              instead and it stops being offered.
            </p>
          ) : (
            <p>It has never been planned, so nothing is lost.</p>
          )}
        </Modal>
      )}

      {planningOn && (
        <PlanModal
          date={planningOn}
          rooms={rooms}
          templates={activeTemplates}
          busy={addPlan.running}
          onClose={() => setPlanningOn(null)}
          onSave={async (payload) => {
            await run("Added to the plan.", () => addPlan.run(payload), planCall.reload);
            setPlanningOn(null);
          }}
        />
      )}
    </>
  );
}

function PlanRow({ item, showRoom, onRemove }) {
  const done = Boolean(item.delivered_activity_id);
  const skipped = Boolean(item.skipped_at) && !done;

  return (
    <div className="annrow">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{item.title}</strong>
          {showRoom && item.classroom_name && (
            <span className="muted" style={{ fontSize: 12 }}>
              {item.classroom_name}
            </span>
          )}
          {done && <Tag tone="green" dot>Done</Tag>}
          {skipped && <Tag tone="amber" dot>Not run</Tag>}
        </div>

        {item.description && (
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
            {item.description}
          </p>
        )}
        {item.materials && (
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            <Icon name="layers" size={13} /> {item.materials}
          </p>
        )}
        {item.note && (
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
            {item.note}
          </p>
        )}
        {skipped && item.skipped_reason && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--warning)" }}>
            {item.skipped_reason}
          </p>
        )}

        {item.areas?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {item.areas.map((a) => (
              <Tag key={a} tone="grey">
                {AREA_SHORT[a] || a}
              </Tag>
            ))}
          </div>
        )}
      </div>

      {/* A delivered plan is frozen — the API refuses an edit, so nothing
          here offers one. */}
      {!done && (
        <Btn variant="outline" size="sm" icon="trash" onClick={onRemove}>
          Remove
        </Btn>
      )}
    </div>
  );
}

function TemplateRow({ template, onEdit, onDelete, onToggle }) {
  return (
    <div
      className="annrow"
      style={template.is_active ? undefined : { opacity: 0.6 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{template.title}</strong>
          {!template.is_active && <Tag tone="grey">Turned off</Tag>}
          {template.duration_minutes && (
            <span className="muted" style={{ fontSize: 12 }}>
              ~{template.duration_minutes} min
            </span>
          )}
        </div>
        {template.description && (
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
            {template.description}
          </p>
        )}
        {template.materials && (
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            <Icon name="layers" size={13} /> {template.materials}
          </p>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {(template.areas || []).map((a) => (
            <Tag key={a} tone="grey">
              {AREA_SHORT[a] || a}
            </Tag>
          ))}
          <span className="muted" style={{ fontSize: 12 }}>
            {template.times_planned
              ? `Planned ${template.times_planned} ${template.times_planned === 1 ? "time" : "times"}`
              : "Never planned"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Btn variant="outline" size="sm" onClick={onToggle}>
          {template.is_active ? "Turn off" : "Turn on"}
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

function TemplateModal({ template, busy, onClose, onSave }) {
  const [title, setTitle] = useState(template.title || "");
  const [description, setDescription] = useState(template.description || "");
  const [materials, setMaterials] = useState(template.materials || "");
  const [duration, setDuration] = useState(template.duration_minutes || "");
  const [areas, setAreas] = useState(template.areas || []);

  const ready = title.trim().length >= 2;
  const existing = Boolean(template.id);

  function toggleArea(value) {
    setAreas((current) =>
      current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value]
    );
  }

  return (
    <Modal
      title={existing ? `Edit "${template.title}"` : "Add to your library"}
      sub="Something your rooms run often. You write it once and plan it many times."
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
                title: title.trim(),
                description: description.trim() || null,
                materials: materials.trim() || null,
                duration_minutes: duration ? Number(duration) : null,
                areas,
              })
            }
          >
            {busy ? "Saving…" : "Save"}
          </Btn>
        </>
      }
    >
      {existing && (
        <p className="note-box" style={{ marginBottom: 12 }}>
          {/* The surprising rule, stated where it applies. */}
          <Icon name="alertCircle" size={14} /> Changes here apply to activities
          you plan <strong>from now on</strong>. Anything already on the plan
          keeps the wording it was given — a room should not find its
          instructions rewritten after the fact.
        </p>
      )}

      <label className="dfield">
        <span>Name</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Water play"
          maxLength={120}
        />
      </label>

      <label className="dfield">
        <span>What happens</span>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Trays of water with jugs and funnels, outside if dry."
          maxLength={2000}
        />
      </label>

      <label className="dfield">
        <span>What the room needs</span>
        <textarea
          rows={2}
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          placeholder="Two trays, aprons, towels."
          maxLength={1000}
        />
        <small className="muted">
          {/* Why this field earns its place. */}
          The first thing a caretaker checks at 8am. Worth filling in.
        </small>
      </label>

      <label className="dfield">
        <span>Roughly how long (minutes)</span>
        <input
          type="number"
          min={1}
          max={600}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="30"
        />
        <small className="muted">
          A hint for planning a day. Nothing enforces it — an activity that
          grips the room should run long.
        </small>
      </label>

      <label className="dfield">
        <span>What it tends to involve</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AREAS.map((area) => (
            <button
              key={area.value}
              type="button"
              onClick={() => toggleArea(area.value)}
              className="note-box"
              style={{
                cursor: "pointer",
                padding: "6px 10px",
                borderColor: areas.includes(area.value)
                  ? "var(--brand-600)"
                  : "var(--line)",
                background: areas.includes(area.value)
                  ? "var(--brand-50)"
                  : "transparent",
              }}
            >
              {AREA_SHORT[area.value]}
            </button>
          ))}
        </div>
        <small className="muted">
          {/* The honest framing, same vocabulary as observations. */}
          Describes the activity, not the children. Useful later: a centre that
          plans for language and writes no language observations has learned
          something.
        </small>
      </label>
    </Modal>
  );
}

function PlanModal({ date, rooms, templates, busy, onClose, onSave }) {
  const [classroomId, setClassroomId] = useState(rooms[0]?.id || "");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [on, setOn] = useState(date);

  const picked = templates.find((t) => t.id === templateId);
  const ready = classroomId && (templateId || title.trim().length >= 2);

  return (
    <Modal
      title="Plan an activity"
      sub="Pick one from your library, or type a one-off."
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
                client_id: crypto.randomUUID(),
                classroom_id: classroomId,
                scheduled_date: on,
                ...(templateId ? { template_id: templateId } : {}),
                ...(title.trim() ? { title: title.trim() } : {}),
                ...(note.trim() ? { note: note.trim() } : {}),
              })
            }
          >
            {busy ? "Adding…" : "Add to the plan"}
          </Btn>
        </>
      }
    >
      <label className="dfield">
        <span>Room</span>
        <select
          value={classroomId}
          onChange={(e) => setClassroomId(e.target.value)}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <label className="dfield">
        <span>Day</span>
        <input type="date" value={on} onChange={(e) => setOn(e.target.value)} />
      </label>

      <label className="dfield">
        <span>From your library</span>
        <select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            if (e.target.value) setTitle("");
          }}
        >
          <option value="">— a one-off, not from the library —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        {picked?.materials && (
          <small className="muted">Needs: {picked.materials}</small>
        )}
      </label>

      {!templateId && (
        <label className="dfield">
          <span>Or name a one-off</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Visit from the fire brigade"
            maxLength={120}
          />
        </label>
      )}

      <label className="dfield">
        <span>Anything specific to this one? (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Small hall — the garden is wet."
          maxLength={1000}
        />
      </label>
    </Modal>
  );
}
