import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import { Btn, Fact, PageHead, Search, Select, StatCard, Tag } from "../../components/dash/ui.jsx";
import { Drawer, Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { announcements, announcementTypes, audiences } from "../../data/dash/announcements.js";

const toneOf = (type) => announcementTypes.find((entry) => entry.id === type) || announcementTypes[0];

export default function Announcements() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(announcements);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(params.get("new") === "1");
  const [draft, setDraft] = useState({ type: "Notice", audience: "All parents", title: "", body: "" });

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return list.filter((item) => {
      if (type && item.type !== type) return false;
      return !needle || item.title.toLowerCase().includes(needle) || item.body.toLowerCase().includes(needle);
    });
  }, [list, query, type]);

  const closeCompose = () => {
    setComposing(false);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  };

  const send = () => {
    const meta = toneOf(draft.type);
    setList((current) => [
      {
        id: `ANN-${513 + current.length}`,
        type: draft.type,
        title: draft.title || "Untitled announcement",
        body: draft.body,
        audience: draft.audience,
        sentOn: new Date(),
        sentLabel: "Just now",
        by: "Deepa Menon",
        reach: draft.audience === "All parents" ? 128 : 32,
        read: 0,
        pinned: meta.id === "Emergency",
      },
      ...current,
    ]);
    setDraft({ type: "Notice", audience: "All parents", title: "", body: "" });
    closeCompose();
    toast("Announcement sent to parents");
  };

  return (
    <>
      <PageHead title="Announcements" sub="Notices, holidays, events and emergency alerts">
        <Btn icon="megaphone" onClick={() => setComposing(true)}>
          New announcement
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard icon="megaphone" tone="brand" label="Sent this month" value={list.length} />
        <StatCard icon="users" tone="blue" label="Parents reached" value={128} />
        <StatCard
          icon="checkCircle"
          tone="green"
          label="Average read rate"
          value={`${Math.round((list.reduce((sum, item) => sum + item.read / item.reach, 0) / list.length) * 100)}%`}
        />
        <StatCard icon="alertTriangle" tone="red" label="Emergency alerts" value={list.filter((item) => item.type === "Emergency").length} />
      </div>

      <div className="toolbar">
        <Search value={query} onChange={setQuery} placeholder="Search announcements..." />
        <Select
          value={type}
          onChange={setType}
          options={announcementTypes.map((entry) => entry.id)}
          placeholder="All types"
        />
        <div className="toolbar__spacer" />
        <span className="muted" style={{ fontSize: 13 }}>
          {rows.length} announcements
        </span>
      </div>

      <ul className="annlist">
        {rows.map((item) => {
          const meta = toneOf(item.type);
          const readPercent = Math.round((item.read / item.reach) * 100);
          return (
            <li key={item.id}>
              <button type="button" className="anncard" onClick={() => setSelected(item)}>
                <span className={`anncard__icon tone-${meta.tone}`}>
                  <Icon name={meta.icon} size={20} />
                </span>
                <div className="anncard__body">
                  <div className="anncard__head">
                    <strong>{item.title}</strong>
                    {item.pinned ? <Tag tone="red">Pinned</Tag> : null}
                    <Tag tone={meta.tone}>{item.type}</Tag>
                  </div>
                  <p>{item.body}</p>
                  <div className="anncard__meta">
                    <span>
                      <Icon name="users" size={14} /> {item.audience}
                    </span>
                    <span>
                      <Icon name="clock" size={14} /> {item.sentLabel}
                    </span>
                    <span>
                      <Icon name="eye" size={14} /> {item.read}/{item.reach} read ({readPercent}%)
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <Drawer
          title={selected.title}
          sub={`${selected.type} · ${selected.sentLabel}`}
          onClose={() => setSelected(null)}
          footer={
            <>
              <Btn variant="outline" icon="refresh" onClick={() => toast("Announcement resent")}>
                Resend
              </Btn>
              <Btn variant="danger" onClick={() => { setList((c) => c.filter((i) => i.id !== selected.id)); setSelected(null); toast("Announcement deleted"); }}>
                Delete
              </Btn>
            </>
          }
        >
          <section className="dsec">
            <p className="note-box">{selected.body}</p>
          </section>

          <section className="dsec">
            <h3>Delivery</h3>
            <div className="dgrid">
              <Fact label="Audience" value={selected.audience} />
              <Fact label="Sent by" value={selected.by} />
              <Fact label="Sent" value={selected.sentLabel} />
              <Fact label="Type" value={selected.type} />
            </div>
          </section>

          <section className="dsec">
            <h3>Read receipts</h3>
            <div className="ring-stat">
              <strong>{Math.round((selected.read / selected.reach) * 100)}%</strong>
              <span>
                {selected.read} of {selected.reach} parents opened this
              </span>
            </div>
            <div className="dbar" style={{ marginTop: 8 }}>
              <span style={{ width: `${(selected.read / selected.reach) * 100}%` }} />
            </div>
            {selected.read < selected.reach ? (
              <Btn
                variant="soft"
                icon="send"
                className="dbtn--block"
                style={{ marginTop: 18 }}
                onClick={() => toast("Nudge sent to parents who haven't read it")}
              >
                Nudge the {selected.reach - selected.read} who haven't read it
              </Btn>
            ) : null}
          </section>
        </Drawer>
      ) : null}

      {composing ? (
        <Modal
          title="New announcement"
          sub="This lands in every selected parent's app straight away."
          onClose={closeCompose}
          size="lg"
          footer={
            <>
              <Btn variant="outline" onClick={closeCompose}>
                Cancel
              </Btn>
              <Btn icon="send" onClick={send}>
                Send now
              </Btn>
            </>
          }
        >
          <label className="dfield">
            <span>Type</span>
            <div className="segrow segrow--wide">
              {announcementTypes.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`seg ${draft.type === entry.id ? `is-on seg--${entry.tone}` : ""}`.trim()}
                  onClick={() => setDraft({ ...draft, type: entry.id })}
                >
                  <Icon name={entry.icon} size={15} />
                  {entry.id}
                </button>
              ))}
            </div>
          </label>

          <label className="dfield">
            <span>Send to</span>
            <select
              value={draft.audience}
              onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
            >
              {audiences.map((audience) => (
                <option key={audience}>{audience}</option>
              ))}
            </select>
          </label>

          <label className="dfield">
            <span>Title</span>
            <input
              value={draft.title}
              placeholder="e.g. Centre closed on 15 August"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>

          <label className="dfield">
            <span>Message</span>
            <textarea
              value={draft.body}
              placeholder="Keep it short — parents read this on their phone."
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
            />
            <small>{draft.body.length} characters</small>
          </label>

          {draft.type === "Emergency" ? (
            <p className="note-box note-box--warn">
              <Icon name="alertTriangle" size={16} />
              Emergency alerts push a notification even if a parent has muted the app. Use them only for
              safety or closure notices.
            </p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
