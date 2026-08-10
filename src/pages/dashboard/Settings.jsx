import { useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Avatar, Btn, PageHead, Panel, Switch, Tabs, Tag } from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { staff } from "../../data/dash/staff.js";

const accessLevels = ["Full access", "Teachers only", "No billing access"];

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState("account");
  const [inviting, setInviting] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [notifications, setNotifications] = useState({
    admissions: true,
    fees: true,
    attendance: false,
    tickets: true,
    digest: true,
    marketing: false,
  });

  const admins = staff.slice(0, 4).map((person, index) => ({
    ...person,
    access: accessLevels[index % accessLevels.length],
    lastActive: ["Just now", "2 hours ago", "Yesterday", "4 days ago"][index],
  }));

  return (
    <>
      <PageHead title="Settings" sub="Your account, staff access, notifications and security" />

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "account", label: "Account" },
            { id: "staff", label: "Staff accounts" },
            { id: "notifications", label: "Notifications" },
            { id: "security", label: "Security" },
          ]}
        />
      </div>

      {tab === "account" ? (
        <div className="dcols dcols--main">
          <Panel title="Your details">
            <div className="dident">
              <Avatar name={user.name} size={48} />
              <div className="dident__text">
                <strong>{user.name}</strong>
                <span>
                  {user.role} · {user.email}
                </span>
              </div>
              <Btn size="sm" variant="outline" onClick={() => toast("Photo upload arrives with the backend")}>
                Change photo
              </Btn>
            </div>

            <div className="dfield-2">
              <label className="dfield">
                <span>Full name</span>
                <input defaultValue={user.name} />
              </label>
              <label className="dfield">
                <span>Role</span>
                <input defaultValue={user.role} readOnly />
              </label>
              <label className="dfield">
                <span>Email</span>
                <input defaultValue={user.email} />
              </label>
              <label className="dfield">
                <span>Mobile</span>
                <input defaultValue="+91 98765 43210" />
              </label>
            </div>

            <Btn icon="check" onClick={() => toast("Details saved")}>
              Save details
            </Btn>
          </Panel>

          <Panel title="Language & region">
            <label className="dfield">
              <span>Language</span>
              <select defaultValue="English">
                <option>English</option>
                <option>हिन्दी</option>
                <option>తెలుగు</option>
              </select>
            </label>
            <label className="dfield">
              <span>Time zone</span>
              <select defaultValue="Asia/Kolkata">
                <option>Asia/Kolkata</option>
              </select>
            </label>
            <label className="dfield">
              <span>Date format</span>
              <select defaultValue="DD/MM/YYYY">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
              </select>
            </label>
            <Btn variant="outline" className="dbtn--block" onClick={() => toast("Preferences saved")}>
              Save preferences
            </Btn>
          </Panel>
        </div>
      ) : null}

      {tab === "staff" ? (
        <Panel
          title="Staff accounts"
          sub="Who can log in to this dashboard, and what they can see"
          tools={
            <Btn size="sm" variant="soft" icon="userPlus" onClick={() => setInviting(true)}>
              Invite
            </Btn>
          }
        >
          <ul className="acclist">
            {admins.map((person) => (
              <li key={person.id}>
                <Avatar name={person.name} size={40} />
                <div className="acclist__text">
                  <strong>{person.name}</strong>
                  <span className="muted">
                    {person.email} · active {person.lastActive}
                  </span>
                </div>
                <Tag tone={person.access === "Full access" ? "brand" : "grey"}>{person.access}</Tag>
                <Btn size="sm" variant="outline" onClick={() => toast(`Access updated for ${person.name}`)}>
                  Change
                </Btn>
                <Btn size="sm" variant="danger" onClick={() => toast(`${person.name}'s access removed`)}>
                  Remove
                </Btn>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {tab === "notifications" ? (
        <div className="dcols dcols--main">
          <Panel title="What we notify you about">
            <Switch
              on={notifications.admissions}
              onChange={(value) => setNotifications({ ...notifications, admissions: value })}
              title="New admission requests"
              body="When a parent applies through the Kribble app"
            />
            <Switch
              on={notifications.fees}
              onChange={(value) => setNotifications({ ...notifications, fees: value })}
              title="Fee payments and overdue invoices"
              body="Payment received, and a nudge when an invoice goes overdue"
            />
            <Switch
              on={notifications.attendance}
              onChange={(value) => setNotifications({ ...notifications, attendance: value })}
              title="Attendance not marked"
              body="If a classroom register is still empty by 10 AM"
            />
            <Switch
              on={notifications.tickets}
              onChange={(value) => setNotifications({ ...notifications, tickets: value })}
              title="Support ticket replies"
              body="When the Kribble team responds to you"
            />
            <Switch
              on={notifications.digest}
              onChange={(value) => setNotifications({ ...notifications, digest: value })}
              title="Weekly summary email"
              body="Attendance, collections and admissions, every Monday"
            />
            <Switch
              on={notifications.marketing}
              onChange={(value) => setNotifications({ ...notifications, marketing: value })}
              title="Product updates from Kribble"
              body="New features and occasional partner tips"
            />
            <Btn icon="check" style={{ marginTop: 18 }} onClick={() => toast("Notification preferences saved")}>
              Save preferences
            </Btn>
          </Panel>

          <Panel title="How you get them">
            <ul className="statlist">
              <li>
                <span>In-app</span>
                <strong>Always on</strong>
              </li>
              <li>
                <span>Email</span>
                <strong>{user.email}</strong>
              </li>
              <li>
                <span>SMS</span>
                <strong>+91 98765 43210</strong>
              </li>
              <li>
                <span>WhatsApp</span>
                <strong>Not connected</strong>
              </li>
            </ul>
            <Btn variant="outline" className="dbtn--block" onClick={() => toast("WhatsApp connect flow opens with the backend")}>
              Connect WhatsApp
            </Btn>
          </Panel>
        </div>
      ) : null}

      {tab === "security" ? (
        <div className="dcols dcols--main">
          <Panel title="Change password">
            <label className="dfield">
              <span>Current password</span>
              <input type="password" placeholder="••••••••" />
            </label>
            <label className="dfield">
              <span>New password</span>
              <input type="password" placeholder="At least 8 characters" />
            </label>
            <label className="dfield">
              <span>Confirm new password</span>
              <input type="password" placeholder="Repeat the new password" />
            </label>
            <Btn icon="lock" onClick={() => toast("Password updated")}>
              Update password
            </Btn>
          </Panel>

          <div className="dstack">
            <Panel title="Two-factor authentication">
              <Switch
                on={twoFactor}
                onChange={(value) => {
                  setTwoFactor(value);
                  toast(value ? "Two-factor authentication enabled" : "Two-factor authentication turned off");
                }}
                title="Require a code at login"
                body="We'll send a 6-digit code to your mobile each time you sign in"
              />
              <p className="note-box" style={{ marginTop: 14 }}>
                Strongly recommended — your dashboard holds children's personal and medical details.
              </p>
            </Panel>

            <Panel title="Where you're signed in">
              <ul className="acclist acclist--tight">
                {[
                  ["Chrome · Windows", "Hyderabad · this device", "Active now"],
                  ["Safari · iPhone", "Hyderabad", "2 days ago"],
                  ["Chrome · Android", "Hyderabad", "1 week ago"],
                ].map(([device, where, when]) => (
                  <li key={device}>
                    <span className="mini-card__icon tone-grey">
                      <Icon name="lock" size={16} />
                    </span>
                    <div className="acclist__text">
                      <strong>{device}</strong>
                      <span className="muted">
                        {where} · {when}
                      </span>
                    </div>
                    <Btn size="sm" variant="outline" onClick={() => toast("Session signed out")}>
                      Sign out
                    </Btn>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      ) : null}

      {inviting ? (
        <Modal
          title="Invite a staff account"
          sub="They'll set their own password from the invite link."
          onClose={() => setInviting(false)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setInviting(false)}>
                Cancel
              </Btn>
              <Btn
                icon="send"
                onClick={() => {
                  setInviting(false);
                  toast("Invite sent");
                }}
              >
                Send invite
              </Btn>
            </>
          }
        >
          <label className="dfield">
            <span>Email address</span>
            <input placeholder="name@littlestars.in" />
          </label>
          <label className="dfield">
            <span>Access level</span>
            <select defaultValue="">
              <option value="">Choose what they can see</option>
              {accessLevels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
            <small>Only full access can see billing and payouts.</small>
          </label>
        </Modal>
      ) : null}
    </>
  );
}
