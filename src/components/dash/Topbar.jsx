import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import { Avatar } from "./ui.jsx";
import { quickActions } from "./nav.js";
import {
  formatRupees,
  notifications,
  walletSummary,
} from "../../data/dash/overview.js";

/** Closes a dropdown when you click anywhere else. */
function useOutside(onClose) {
  const ref = useRef(null);

  useEffect(() => {
    const handle = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return ref;
}

function Dropdown({ open, onClose, children, wide }) {
  const ref = useOutside(onClose);
  if (!open) return null;
  return (
    <div className={`dmenu ${wide ? "dmenu--wide" : ""}`.trim()} ref={ref}>
      {children}
    </div>
  );
}

export default function Topbar({ onBurger, user, onSignOut }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);

  const toggle = (name) => setMenu((current) => (current === name ? null : name));
  const close = () => setMenu(null);

  const go = (to) => {
    close();
    navigate(to);
  };

  return (
    <header className="dtop">
      <button type="button" className="dtop__burger" onClick={onBurger} aria-label="Toggle menu">
        <Icon name="menu" size={21} />
      </button>

      <button type="button" className="dtop__centre">
        <Icon name="building" size={17} />
        <span>{user.centre}</span>
        <Icon name="chevronDown" size={15} className="dtop__caret" />
      </button>

      <div className="dtop__search">
        <Icon name="search" size={17} />
        <input type="search" placeholder="Search children, staff, invoices..." />
        <span className="dtop__kbd">⌘K</span>
      </div>

      <div className="dtop__right">
        <div className="dtop__wrap">
          <button
            type="button"
            className="dtop__wallet"
            onClick={() => toggle("wallet")}
            aria-label={`Wallet balance ${walletSummary.currency}${formatRupees(
              walletSummary.balance
            )}`}
          >
            <span className="dtop__wallet-icon">
              <Icon name="wallet" size={16} />
            </span>
            <span className="dtop__wallet-text">
              <small>Wallet</small>
              <strong>
                {walletSummary.currency}
                {formatRupees(walletSummary.balance)}
              </strong>
            </span>
            <Icon name="chevronDown" size={14} className="muted" />
          </button>

          <Dropdown open={menu === "wallet"} onClose={close}>
            <div className="dmenu__head">
              <strong>Wallet</strong>
            </div>

            <div className="dwallet">
              <p className="dwallet__label">Available balance</p>
              <p className="dwallet__balance">
                {walletSummary.currency}
                {formatRupees(walletSummary.balance)}
              </p>

              <div className="dwallet__rows">
                <div>
                  <span>Pending from parents</span>
                  <strong>
                    {walletSummary.currency}
                    {formatRupees(walletSummary.pending)}
                    <small> · {walletSummary.pendingCount} fees</small>
                  </strong>
                </div>
                <div>
                  <span>Last payout</span>
                  <strong>
                    {walletSummary.currency}
                    {formatRupees(walletSummary.lastPayout.amount)}
                    <small> · {walletSummary.lastPayout.at}</small>
                  </strong>
                </div>
                <div>
                  <span>Next payout</span>
                  <strong>{walletSummary.nextPayout}</strong>
                </div>
              </div>
            </div>

            <div className="dmenu__split" />
            <button
              type="button"
              className="dmenu__item"
              onClick={() => go("/dashboard/billing")}
            >
              <Icon name="receipt" size={18} />
              <span>
                Go to billing
                <small>Invoices, payouts and fee reminders</small>
              </span>
            </button>
          </Dropdown>
        </div>

        <div className="dtop__wrap">
          <button type="button" className="dtop__quick" onClick={() => toggle("quick")}>
            <Icon name="zap" size={16} />
            <span>Quick Actions</span>
            <Icon name="chevronDown" size={14} />
          </button>

          <Dropdown open={menu === "quick"} onClose={close} wide>
            <div className="dmenu__head">
              <strong>Quick actions</strong>
            </div>
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="dmenu__item"
                onClick={() => go(action.to)}
              >
                <Icon name={action.icon} size={18} />
                <span>
                  {action.label}
                  <small>{action.body}</small>
                </span>
              </button>
            ))}
          </Dropdown>
        </div>

        <div className="dtop__wrap">
          <button
            type="button"
            className="dtop__icon"
            onClick={() => toggle("bell")}
            aria-label="Notifications"
          >
            <Icon name="bell" size={20} />
            <span className="dtop__dot dtop__dot--brand">4</span>
          </button>

          <Dropdown open={menu === "bell"} onClose={close} wide>
            <div className="dmenu__head">
              <strong>Notifications</strong>
              <span>Mark all read</span>
            </div>
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className="dmenu__item"
                onClick={() => go(item.to)}
              >
                <Icon name={item.icon} size={18} />
                <span>
                  {item.title}
                  <small>
                    {item.body} · {item.at}
                  </small>
                </span>
              </button>
            ))}
          </Dropdown>
        </div>

        <div className="dtop__wrap">
          <button
            type="button"
            className="dtop__icon"
            onClick={() => go("/dashboard/support")}
            aria-label="Messages"
          >
            <Icon name="message" size={20} />
            <span className="dtop__dot dtop__dot--green">2</span>
          </button>
        </div>

        <div className="dtop__wrap">
          <button type="button" className="dtop__me" onClick={() => toggle("me")}>
            <Avatar name={user.name} size={32} />
            <span className="dtop__me-text">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </span>
            <Icon name="chevronDown" size={15} className="muted" />
          </button>

          <Dropdown open={menu === "me"} onClose={close}>
            <div className="dmenu__head">
              <strong>{user.centre}</strong>
              <span>{user.centreId}</span>
            </div>
            <button type="button" className="dmenu__item" onClick={() => go("/dashboard/centre-profile")}>
              <Icon name="building" size={18} />
              <span>Centre profile</span>
            </button>
            <button type="button" className="dmenu__item" onClick={() => go("/dashboard/settings")}>
              <Icon name="settings" size={18} />
              <span>Settings</span>
            </button>
            <button type="button" className="dmenu__item" onClick={() => go("/dashboard/support")}>
              <Icon name="helpCircle" size={18} />
              <span>Help centre</span>
            </button>
            <div className="dmenu__split" />
            <button type="button" className="dmenu__item dmenu__item--danger" onClick={onSignOut}>
              <Icon name="logOut" size={18} />
              <span>Log out</span>
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
