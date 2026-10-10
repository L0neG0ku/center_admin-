import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import {
  Avatar,
  Btn,
  Empty,
  Fact,
  PageHead,
  Panel,
  Row,
  Tabs,
  Tag,
  Who,
} from "../../components/dash/ui.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * Your account, and who else can get into the centre.
 *
 * THE CONSTRAINT THAT SHAPES THIS PAGE: there is no endpoint for an owner to
 * change their own name, email or photo. `PATCH /parents/me` exists but is
 * parent-scoped; an owner's identity comes from signup and the verification
 * call, and nothing exposes an edit. So the "Your details" form with its Save
 * button is gone and the fields are shown as read-only facts, with the one
 * thing that genuinely can be changed — the password — given its own panel.
 *
 * Also gone: the notification-preference switches (six of them), the
 * two-factor toggle, and the language/region picker. None has a column to
 * write to. A switch that flips, says "Preferences saved", and silently
 * forgets is worse than no switch: the owner thinks they have turned
 * something off.
 *
 * The team tab is real — it is the same staff list as the Staff page, read
 * here because "who can get into my centre" is an account question.
 */
export default function Settings() {
  const toast = useToast();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState("account");

  return (
    <>
      <PageHead title="Settings" sub="Your account and your centre's access" />

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "account", label: "Account" },
            { id: "team", label: "Team access" },
            { id: "notifications", label: "Notifications" },
          ]}
        />
      </div>

      {tab === "account" ? (
        <AccountTab user={user} signOut={signOut} toast={toast} />
      ) : null}
      {tab === "team" ? <TeamTab /> : null}
      {tab === "notifications" ? <NotificationsTab /> : null}
    </>
  );
}

function AccountTab({ user, signOut, toast }) {
  // /auth/me is the source for identity. The AuthContext already normalises
  // it, but the verified flags are worth reading straight so the page does
  // not depend on that mapping staying the same.
  const meCall = useResource((signal) => api.getMe({ signal }), []);
  const me = meCall.data || {};

  return (
    <>
      <Panel title="Your details" sub="From your Kribble account">
        <div className="dident">
          <Avatar
            name={me.full_name || user?.name || ""}
            size={48}
            src={me.avatar_url || user?.avatarUrl}
          />
          <div className="dident__text">
            <strong>{me.full_name || user?.name || "—"}</strong>
            <span>
              {user?.role || "Centre owner"}
              {me.public_id ? ` · ${me.public_id}` : ""}
            </span>
          </div>
        </div>

        <div className="dgrid" style={{ marginTop: 16 }}>
          <Fact
            label="Email"
            value={
              me.email ? (
                <>
                  {me.email}{" "}
                  {me.email_verified ? (
                    <Tag tone="green">Verified</Tag>
                  ) : (
                    <Tag tone="amber">Unverified</Tag>
                  )}
                </>
              ) : (
                "—"
              )
            }
          />
          <Fact
            label="Mobile"
            value={
              me.phone ? (
                <>
                  {me.phone}{" "}
                  {me.phone_verified ? (
                    <Tag tone="green">Verified</Tag>
                  ) : (
                    <Tag tone="amber">Unverified</Tag>
                  )}
                </>
              ) : (
                "—"
              )
            }
          />
        </div>

        {/* Said plainly rather than offering a form that cannot save. */}
        <p className="note-box" style={{ marginTop: 16 }}>
          <Icon name="helpCircle" size={15} /> Your name, email and photo come
          from your application and cannot be edited here yet. Contact support
          to change them. Your centre&rsquo;s own details are on{" "}
          <Link to="/dashboard/centre-profile">Centre profile</Link>.
        </p>
      </Panel>

      <PasswordPanel hasPassword={me.has_password} toast={toast} />

      <Panel title="Sign out">
        <Row
          label="This browser"
          value={
            <Btn
              variant="outline"
              icon="logOut"
              onClick={() => signOut?.()}
            >
              Sign out
            </Btn>
          }
        />
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          Signing out here revokes this browser&rsquo;s session. Your
          caretakers&rsquo; sessions on the staff app are not affected.
        </p>
      </Panel>
    </>
  );
}

/**
 * Change password.
 *
 * `POST /auth/password/change` takes the current one and the new one. An
 * owner who signed in by OTP and never set a password has `has_password:
 * false` — for them this is not a change but a first set, and the endpoint
 * needs a current password they do not have, so the panel says so instead of
 * presenting a form that cannot succeed.
 */
function PasswordPanel({ hasPassword, toast }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState(null);

  const change = useAction(() =>
    api.changePassword({ current_password: current, new_password: next })
  );

  if (hasPassword === false) {
    return (
      <Panel title="Password">
        <p className="note-box">
          <Icon name="key" size={15} /> Your account has no password — you sign
          in with your mobile number and a code. Setting one is done through
          the activation link emailed when your centre was approved.
        </p>
      </Panel>
    );
  }

  const submit = () => {
    setLocalError(null);
    if (!current) return setLocalError("Enter your current password.");
    if (next.length < 8) {
      return setLocalError("Your new password needs at least 8 characters.");
    }
    if (next !== confirm) return setLocalError("The new passwords do not match.");
    return change
      .run()
      .then(() => {
        setCurrent("");
        setNext("");
        setConfirm("");
        toast("Password changed");
      })
      .catch(() => {});
  };

  const error = localError || change.error?.message;

  return (
    <Panel
      title="Password"
      action={
        <Btn icon="check" disabled={change.busy} onClick={submit}>
          {change.busy ? "Changing..." : "Change password"}
        </Btn>
      }
    >
      <div className="dfield-2">
        <label className="dfield">
          <span>Current password</span>
          <input
            type="password"
            value={current}
            autoComplete="current-password"
            onChange={(event) => setCurrent(event.target.value)}
          />
        </label>
        <label className="dfield">
          <span>New password</span>
          <input
            type="password"
            value={next}
            autoComplete="new-password"
            onChange={(event) => setNext(event.target.value)}
          />
        </label>
        <label className="dfield">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirm}
            autoComplete="new-password"
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
      </div>
      {error ? <p className="dfield__error">{error}</p> : null}
    </Panel>
  );
}

/** Who else can get into the centre — the same staff list, read-only here. */
function TeamTab() {
  const call = useResource((signal) => api.listStaff({}, { signal }), []);
  const staff = call.data || [];

  if (call.loading) {
    return (
      <Panel title="Team access">
        <Empty icon="users" title="Loading..." body="Fetching your team." />
      </Panel>
    );
  }

  if (call.error) {
    return (
      <Panel title="Team access">
        <Empty
          icon="alertTriangle"
          title="Could not load your team"
          body={call.error.message}
          action={<Btn variant="outline" onClick={call.reload}>Try again</Btn>}
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Team access"
      sub="Everyone who can sign in to your centre"
      action={
        <Link className="dbtn dbtn--primary" to="/dashboard/staff">
          Manage staff
        </Link>
      }
    >
      {staff.length === 0 ? (
        <Empty
          icon="userPlus"
          title="Only you"
          body="No caretakers have been added yet."
          action={
            <Link className="dbtn dbtn--primary" to="/dashboard/staff">
              Add a caretaker
            </Link>
          }
        />
      ) : (
        staff.map((person) => (
          <div className="drow" key={person.id}>
            <Who
              name={person.full_name}
              sub={`${person.job_title || "Caretaker"} · ${person.phone || ""}`}
              size={34}
            />
            <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {person.is_active === false ? (
                <Tag tone="grey" dot>
                  Suspended
                </Tag>
              ) : person.has_signed_in ? (
                <Tag tone="green" dot>
                  Signed in
                </Tag>
              ) : (
                <Tag tone="amber" dot>
                  Never signed in
                </Tag>
              )}
            </strong>
          </div>
        ))
      )}
      <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
        Caretakers sign in with their mobile number and a code. There are no
        passwords to manage and no second owner account — everyone above sees
        only the rooms they are assigned to.
      </p>
    </Panel>
  );
}

/**
 * Notifications.
 *
 * The in-app list is real — `GET /notifications` with a read receipt. What is
 * NOT real, and is why this tab no longer has six switches: there is no
 * preferences table. Nothing stores which categories an owner wants, or
 * whether they want email or SMS. Those switches flipped, said "Preferences
 * saved" and forgot, which would have had an owner believing they had turned
 * something off.
 */
function NotificationsTab() {
  const call = useResource(
    (signal) => api.listNotifications({ per_page: 30 }, { signal }),
    []
  );
  const items = call.data || [];

  const markRead = useAction(() => api.markNotificationsRead(null));
  const unread = items.filter((item) => !item.read_at).length;

  return (
    <>
      <Panel
        title="Your notifications"
        sub={unread > 0 ? `${unread} unread` : "All read"}
        action={
          unread > 0 ? (
            <Btn
              variant="outline"
              disabled={markRead.busy}
              onClick={() =>
                markRead
                  .run()
                  .then(call.reload)
                  .catch(() => {})
              }
            >
              {markRead.busy ? "Marking..." : "Mark all read"}
            </Btn>
          ) : null
        }
      >
        {call.loading ? (
          <Empty icon="bell" title="Loading..." body="Fetching your notifications." />
        ) : call.error ? (
          <Empty
            icon="alertTriangle"
            title="Could not load your notifications"
            body={call.error.message}
            action={<Btn variant="outline" onClick={call.reload}>Try again</Btn>}
          />
        ) : items.length === 0 ? (
          <Empty
            icon="bell"
            title="Nothing yet"
            body="Alerts about pickups, absences and your centre appear here."
          />
        ) : (
          items.map((item) => (
            <div className="drow" key={item.id}>
              <span>
                {item.read_at ? null : (
                  <>
                    <Tag tone="brand">New</Tag>{" "}
                  </>
                )}
                {item.title}
                <br />
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {item.body}
                </span>
              </span>
              <strong className="nowrap muted" style={{ fontSize: 12.5 }}>
                {new Date(item.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                })}
              </strong>
            </div>
          ))
        )}
      </Panel>

      <Panel title="What you get told about">
        <p className="muted" style={{ fontSize: 13.5 }}>
          Kribble notifies you when a child is collected by someone not on
          their authorised list, and when a parent reports an absence. These
          cannot be turned off yet — there is nowhere to store the preference —
          so you will receive all of them.
        </p>
      </Panel>
    </>
  );
}
