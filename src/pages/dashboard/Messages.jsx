import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Btn, Empty, PageHead, Panel, Search } from "../../components/dash/ui.jsx";
import * as api from "../../api/endpoints.js";
import { useResource } from "../../api/useResource.js";
import NotBuilt from "../../components/dash/NotBuilt.jsx";

/**
 * Conversations with families.
 *
 * **One thread per child, not per parent.** Both guardians write into the
 * same conversation and the centre answers once — otherwise a centre replies
 * to the mother and the father separately with two different versions of the
 * day, and neither of them knows the other asked.
 *
 * Three rules this page keeps, because a message to a family is a
 * safeguarding record rather than a chat app:
 *
 * * **Nothing reads as sent until the server says so.** A message in flight
 *   is visibly in flight and a failed one offers a retry with the text still
 *   in it. An owner who believes they told a parent something, when the
 *   message never left the browser, is the failure that matters here.
 * * **No delete and no edit.** A database trigger refuses both, so either
 *   control would be a button that always errors.
 * * **Switched off is not the same as empty.** Every /messages route answers
 *   404 while CHAT_ENABLED is false, and a centre told "no conversations
 *   yet" would wait for a reply that cannot come.
 */

function clock(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function dayLabel(value) {
  const when = new Date(value);
  const today = new Date();
  const sameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(when, today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(when, yesterday)) return "Yesterday";

  return when.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: when.getFullYear() === today.getFullYear() ? undefined : "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** "4 min ago" / "Yesterday" / "12 Mar" — coarse on purpose. */
function since(value) {
  if (!value) return "No messages yet";
  const gap = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(gap / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return dayLabel(value);
}

export default function Messages() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const threadsCall = useResource((signal) => api.listThreads({}, { signal }), []);

  // 404 on the list means the feature is off for this deployment, not that
  // something broke. Anything else is a real error.
  const switchedOff = threadsCall.error?.status === 404;

  const threads = useMemo(() => {
    const all = Array.isArray(threadsCall.data) ? threadsCall.data : [];
    const needle = query.trim().toLowerCase();
    const matching = needle
      ? all.filter((thread) =>
          (thread.child?.name || "").toLowerCase().includes(needle)
        )
      : all;

    return [...matching].sort((a, b) => {
      // Unread first: an owner opening this has one question, and the order
      // answers it before they read a word.
      const unreadA = (a.unread_count || 0) > 0;
      const unreadB = (b.unread_count || 0) > 0;
      if (unreadA !== unreadB) return unreadA ? -1 : 1;
      const timeA = a.last_message_at ? Date.parse(a.last_message_at) : 0;
      const timeB = b.last_message_at ? Date.parse(b.last_message_at) : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (a.child?.name || "").localeCompare(b.child?.name || "");
    });
  }, [threadsCall.data, query]);

  // Derived, not synced into state. Falling back to the first conversation
  // means the pane is never an empty frame on a page that has conversations
  // in it, and a search that hides the open one shows the first match rather
  // than nothing.
  const open = threads.find((thread) => thread.id === openId) ?? threads[0] ?? null;
  const waiting = threads.filter((thread) => (thread.unread_count || 0) > 0).length;

  if (switchedOff) {
    // NotBuilt renders its own PageHead, so this branch must not add one.
    return (
      <NotBuilt
        title="Messages"
        sub="Messaging is not switched on for your centre yet."
        icon="message"
        instead="Announcements reach every family at once, and are switched on today."
      />
    );
  }

  return (
    <>
      <PageHead
        title="Messages"
        sub={
          waiting
            ? `${waiting} ${waiting === 1 ? "family is" : "families are"} waiting on a reply.`
            : "Conversations with families, one per child."
        }
      />

      <div className="msg">
        <Panel
          className="msg__list"
          title="Conversations"
          tools={
            <Search
              value={query}
              onChange={setQuery}
              placeholder="Search a child..."
            />
          }
          flush
        >
          {threadsCall.loading ? (
            <p className="msg__muted">Loading conversations...</p>
          ) : threadsCall.error ? (
            <Empty
              icon="alertTriangle"
              title="Could not load conversations"
              body={threadsCall.error.message}
              action={<Btn onClick={threadsCall.reload}>Try again</Btn>}
            />
          ) : threads.length === 0 ? (
            <Empty
              icon="message"
              title={query ? "No child by that name" : "No conversations yet"}
              body={
                query
                  ? "Clear the search to see every conversation."
                  : "A conversation appears here for every child enrolled at your centre."
              }
            />
          ) : (
            <ul className="msg__threads">
              {threads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  active={thread.id === openId}
                  onOpen={() => setOpenId(thread.id)}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="msg__pane" flush>
          {open ? (
            <Conversation
              key={open.id}
              thread={open}
              onChanged={threadsCall.reload}
            />
          ) : (
            <Empty
              icon="message"
              title="Pick a conversation"
              body="Choose a child on the left to read and reply."
            />
          )}
        </Panel>
      </div>
    </>
  );
}

function ThreadRow({ thread, active, onOpen }) {
  const unread = thread.unread_count || 0;
  const name = thread.child?.name || "A child";
  const room = thread.classroom?.name;

  return (
    <li>
      <button
        type="button"
        className={`msg__thread${active ? " is-active" : ""}`}
        onClick={onOpen}
      >
        <span className={`msg__dot${unread ? " is-unread" : ""}`} aria-hidden />
        <span className="msg__threadText">
          <span className={`msg__name${unread ? " is-unread" : ""}`}>{name}</span>
          <span className="msg__meta">
            {[room, since(thread.last_message_at)].filter(Boolean).join(" · ")}
          </span>
        </span>
        {unread ? (
          <span className="msg__badge">{unread > 99 ? "99+" : unread}</span>
        ) : null}
      </button>
    </li>
  );
}

function Conversation({ thread, onChanged }) {
  // The first page goes through useResource so the request is aborted when
  // the thread changes. Hand-rolling it left two fetches racing on a fast
  // click between conversations, and the slower one won.
  const historyCall = useResource(
    (signal) => api.getThreadHistory(thread.id, {}, { signal }),
    [thread.id]
  );

  // Earlier pages and anything sent from this browser, kept BESIDE the
  // fetched page rather than merged into it — the hook owns its own data and
  // replaces it on reload, which would otherwise drop both.
  const [older, setOlder] = useState([]);
  const [sent, setSent] = useState([]);
  const [page, setPage] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");

  const bottom = useRef(null);
  const acknowledged = useRef(null);

  const first = useMemo(
    () => (Array.isArray(historyCall.data) ? historyCall.data : []),
    [historyCall.data]
  );

  // `page` is set only once "Load earlier" has run; before that the cursor
  // and the has-more flag come from the first page's own meta.
  const cursor = page ? page.next_before : historyCall.data?.meta?.next_before;
  const hasMore = page
    ? page.has_more
    : Boolean(historyCall.data?.meta?.has_more);

  const messages = useMemo(() => {
    const merged = [...older, ...first, ...sent];
    // A confirmed send appears twice once the list is refetched: once as our
    // own copy and once from the server. client_id is what ties them
    // together, and the server's version wins because it carries the real id
    // and the real sequence.
    const byClient = new Map();
    merged.forEach((message) => {
      const key = message.client_id || message.id;
      const existing = byClient.get(key);
      if (!existing || existing.pending || existing.failed) {
        byClient.set(key, message);
      }
    });
    return [...byClient.values()].sort((a, b) => a.sequence - b.sequence);
  }, [older, first, sent]);

  // Tell the server how far THIS user has read, so the badge clears for them
  // and nobody else. Guarded by a ref against re-sending the same cursor; a
  // failed acknowledgement is not worth telling anyone about, because the
  // badge simply stays, which is the harmless direction.
  useEffect(() => {
    const last = messages.filter((message) => !message.pending).at(-1);
    if (!last || acknowledged.current === last.id) return;
    acknowledged.current = last.id;
    api
      .markThreadRead(thread.id, last.id)
      .then(onChanged)
      .catch(() => {});
  }, [messages, thread.id, onChanged]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const loadOlder = async () => {
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const earlier = await api.getThreadHistory(thread.id, { before: cursor });
      const items = Array.isArray(earlier) ? [...earlier] : [];
      setOlder((current) => [...items, ...current]);
      setPage({
        next_before: earlier?.meta?.next_before || null,
        has_more: Boolean(earlier?.meta?.has_more),
      });
    } catch {
      // Leaves the button in place to try again. Nothing is lost.
    } finally {
      setLoadingOlder(false);
    }
  };

  const deliver = async (pending) => {
    try {
      const confirmed = await api.sendMessage(thread.id, {
        client_id: pending.client_id,
        body: pending.body,
      });
      setSent((current) => [
        ...current.filter((m) => m.client_id !== pending.client_id),
        confirmed,
      ]);
      onChanged();
    } catch {
      setSent((current) =>
        current.map((m) =>
          m.client_id === pending.client_id
            ? { ...m, pending: false, failed: true }
            : m
        )
      );
    }
  };

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    // Shown immediately. Waiting for the round trip before the message
    // appears reads as the page having swallowed it, and the owner types it
    // again. The client_id is minted once and travels with the pending copy,
    // so a retry reuses it and the backend treats it as a replay rather than
    // a second message.
    const clientId = crypto.randomUUID();
    const pending = {
      id: `pending-${clientId}`,
      client_id: clientId,
      sequence: Number.MAX_SAFE_INTEGER,
      body,
      sender_side: "CENTRE",
      sender_name: "",
      created_at: new Date().toISOString(),
      pending: true,
    };
    setDraft("");
    setSent((current) => [...current, pending]);
    await deliver(pending);
  };

  const retry = async (failed) => {
    setSent((current) =>
      current.map((m) =>
        m.client_id === failed.client_id
          ? { ...m, pending: true, failed: false }
          : m
      )
    );
    await deliver(failed);
  };

  const name = thread.child?.name || "A child";
  const firstName = name.split(" ")[0];

  return (
    <div className="msg__conv">
      <header className="msg__convHead">
        <div>
          <h3>{name}</h3>
          <p>
            {[thread.classroom?.name, "This child's family"]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </header>

      <div className="msg__scroll">
        {hasMore ? (
          <div className="msg__older">
            <Btn
              variant="soft"
              size="sm"
              disabled={loadingOlder}
              onClick={loadOlder}
            >
              {loadingOlder ? "Loading..." : "Load earlier messages"}
            </Btn>
          </div>
        ) : null}

        {historyCall.loading ? (
          <p className="msg__muted">Loading...</p>
        ) : historyCall.error && messages.length === 0 ? (
          <Empty
            icon="alertTriangle"
            title="Could not open this conversation"
            body={historyCall.error.message}
            action={<Btn onClick={historyCall.reload}>Try again</Btn>}
          />
        ) : messages.length === 0 ? (
          <Empty
            icon="message"
            title="No messages yet"
            body={
              thread.can_send
                ? "Anything you send goes to " + firstName + "'s parents."
                : "Nothing has been sent in this conversation."
            }
          />
        ) : (
          <Bubbles messages={messages} onRetry={retry} />
        )}
        <div ref={bottom} />
      </div>

      {thread.can_send ? (
        <form className="msg__composer" onSubmit={send}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter breaks the line. A message to a
              // parent is usually one line, and reaching for the button each
              // time is what makes people stop replying.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(event);
              }
            }}
            placeholder={"Write to " + firstName + "'s parents"}
            rows={2}
            // The server refuses anything longer, so stopping here saves
            // writing a paragraph that is rejected on send.
            maxLength={4000}
          />
          <Btn icon="send" disabled={!draft.trim()} type="submit">
            Send
          </Btn>
        </form>
      ) : (
        <p className="msg__readonly">
          This conversation is read-only. It stays here as a record.
        </p>
      )}
    </div>
  );
}

function Bubbles({ messages, onRetry }) {
  return (
    <ul className="msg__bubbles">
      {messages.map((message, index) => {
        const day = dayLabel(message.created_at);
        // Compared against the previous message rather than carried in a
        // variable, so nothing is reassigned while rendering.
        const newDay =
          index === 0 || day !== dayLabel(messages[index - 1].created_at);
        const mine = message.sender_side === "CENTRE";

        return (
          <li key={message.id}>
            {newDay ? <p className="msg__day">{day}</p> : null}
            <div className={`msg__bubbleRow${mine ? " is-mine" : ""}`}>
              <div
                className={`msg__bubble${mine ? " is-mine" : ""}${
                  message.pending ? " is-pending" : ""
                }`}
              >
                {message.body}
              </div>
            </div>
            <p className={`msg__stamp${mine ? " is-mine" : ""}`}>
              {message.failed ? (
                <>
                  <Icon name="alertCircle" size={13} />
                  <span className="msg__failed">Not sent</span>
                  <button
                    type="button"
                    className="msg__retry"
                    onClick={() => onRetry(message)}
                  >
                    Retry
                  </button>
                </>
              ) : message.pending ? (
                "Sending..."
              ) : (
                [
                  // Which staff member replied. A parent only ever sees "the
                  // centre", but inside the centre it matters who answered.
                  mine && message.sender_name ? message.sender_name : null,
                  clock(message.created_at),
                ]
                  .filter(Boolean)
                  .join(" · ")
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
