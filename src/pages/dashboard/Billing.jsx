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
 * Fees: what a place costs, and what each family has been billed.
 *
 * This page was a `NotBuilt` placeholder while the payment rail landed. Two
 * things live here, and they are deliberately separate:
 *
 *  - **Plans** — what a place costs. Written once, changed rarely.
 *  - **Invoices** — one period of a plan, for one child.
 *
 * Three rules from the API shape the page:
 *
 *  1. **An invoice keeps its own amount.** It is copied from the plan when
 *     the invoice is raised, so raising the fee next term does not rewrite
 *     what a family was already billed. Same reasoning as a planned activity
 *     keeping its wording — see Activities.
 *  2. **A draft is not a bill.** Nothing reaches the parent app until it is
 *     sent, which is why Send is a separate, deliberate action rather than
 *     something that happens on save.
 *  3. **Nothing is deleted.** An invoice a family may have seen is voided
 *     with a reason, and the reason is kept.
 *
 * Money is integer paise end to end. It is never a float here, not even to
 * display: `rupees()` divides and formats with integer arithmetic, because a
 * fee that renders as ₹18,249.99 costs you the family's trust in every other
 * number on the page.
 */

const CYCLES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "TERM", label: "Per term" },
  { value: "ONE_OFF", label: "One-off" },
];

const STATUS_TONE = {
  DRAFT: "grey",
  SENT: "amber",
  PAID: "green",
  OVERDUE: "red",
  VOID: "grey",
};

const STATUS_LABEL = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  // The API calls it VOID. "Cancelled" is what it means to a person.
  VOID: "Cancelled",
};

/** Indian digit grouping: 1,980 · 11,250 · 1,18,500. */
function grouped(whole) {
  const digits = String(Math.abs(whole));
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  let out = "";
  for (let i = 0; i < head.length; i += 1) {
    if (i > 0 && (head.length - i) % 2 === 0) out += ",";
    out += head[i];
  }
  return `${out},${tail}`;
}

/**
 * Integer paise to `₹18,250`, or `₹18,250.50` when they are not round.
 *
 * No division into a float anywhere: `Math.trunc` for the rupees and `%` for
 * the remainder, so the figure on screen is exactly what the server stores.
 */
function rupees(amountPaise) {
  const negative = amountPaise < 0;
  const magnitude = Math.abs(amountPaise);
  const whole = Math.trunc(magnitude / 100);
  const paise = magnitude % 100;
  const body = `₹${grouped(whole)}`;
  const withPaise = paise === 0 ? body : `${body}.${String(paise).padStart(2, "0")}`;
  return negative ? `-${withPaise}` : withPaise;
}

/** Rupees typed into a box, back to integer paise. */
function toPaise(typed) {
  const cleaned = String(typed).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const paise = Number(`${fraction}00`.slice(0, 2));
  const rupeesPart = Number(whole || 0);
  if (!Number.isFinite(rupeesPart) || !Number.isFinite(paise)) return null;
  return rupeesPart * 100 + paise;
}

function monthLabel(iso) {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function dateLabel(iso) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The first and last day of the month an ISO date falls in. */
function monthBounds(iso) {
  const date = new Date(`${iso}T00:00:00`);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

export default function Billing() {
  const toast = useToast();
  const [tab, setTab] = useState("invoices");
  const [status, setStatus] = useState("");
  const [planModal, setPlanModal] = useState(null);
  const [raising, setRaising] = useState(false);
  const [voiding, setVoiding] = useState(null);

  const plansCall = useResource((signal) => api.listFeePlans({ signal }), []);
  const childrenCall = useResource(
    // listAllChildren, not listChildren: the latter is one page of 100 and
    // a centre with more would silently be unable to bill the rest.
    (signal) => api.listAllChildren({ status: "ACTIVE" }, { signal }),
    []
  );
  const invoicesCall = useResource(
    (signal) =>
      api.listInvoices({ status: status || undefined, per_page: 100 }, { signal }),
    [status]
  );

  const savePlan = useAction((id, payload) =>
    id ? api.updateFeePlan(id, payload) : api.createFeePlan(payload)
  );
  const raise = useAction((payload) => api.createInvoice(payload));
  const send = useAction((id) => api.sendInvoice(id));
  const cancel = useAction((id, reason) => api.voidInvoice(id, reason));

  const plans = useMemo(() => plansCall.data || [], [plansCall.data]);
  const children = useMemo(() => childrenCall.data || [], [childrenCall.data]);
  const invoices = useMemo(() => invoicesCall.data || [], [invoicesCall.data]);

  const childName = useMemo(() => {
    const map = new Map(children.map((c) => [c.id, c.name]));
    return (id) => map.get(id) || "Unknown child";
  }, [children]);

  const planName = useMemo(() => {
    const map = new Map(plans.map((p) => [p.id, p.name]));
    return (id) => map.get(id) || "—";
  }, [plans]);

  /* Summed as integer paise, then formatted once. Only what is actually
     owed: a draft has not been sent, and a cancelled one is not owed. */
  const outstanding = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
        .reduce((total, i) => total + i.amount_paise, 0),
    [invoices]
  );

  const overdue = useMemo(
    () => invoices.filter((i) => i.status === "OVERDUE").length,
    [invoices]
  );

  const drafts = useMemo(
    () => invoices.filter((i) => i.status === "DRAFT").length,
    [invoices]
  );

  const reload = () => {
    invoicesCall.reload();
    plansCall.reload();
  };

  return (
    <>
      <PageHead
        title="Fees"
        sub="What a place costs, and what each family has been billed."
      >
        {tab === "plans" ? (
          <Btn icon="plus" onClick={() => setPlanModal({})}>
            New plan
          </Btn>
        ) : (
          <Btn
            icon="plus"
            disabled={plans.length === 0 || children.length === 0}
            onClick={() => setRaising(true)}
          >
            Raise an invoice
          </Btn>
        )}
      </PageHead>

      <div className="dstats">
        <StatCard
          icon="wallet"
          tone="amber"
          label="Outstanding"
          value={rupees(outstanding)}
        />
        <StatCard
          icon="alert"
          tone={overdue > 0 ? "red" : "grey"}
          label="Overdue"
          value={String(overdue)}
        />
        <StatCard
          icon="edit"
          tone="grey"
          label="Not sent yet"
          value={String(drafts)}
        />
        <StatCard
          icon="tag"
          tone="brand"
          label="Fee plans"
          value={String(plans.filter((p) => p.is_active).length)}
        />
      </div>

      <Tabs
        tabs={[
          { id: "invoices", label: "Invoices" },
          { id: "plans", label: "Plans" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "invoices" ? (
        <Panel
          title="Invoices"
          sub="A draft is yours alone. Sending it is what a family sees."
          tools={
            <Select
              value={status}
              onChange={setStatus}
              placeholder="Any status"
              options={[
                { value: "", label: "Any status" },
                { value: "DRAFT", label: "Not sent" },
                { value: "SENT", label: "Sent" },
                { value: "OVERDUE", label: "Overdue" },
                { value: "PAID", label: "Paid" },
                { value: "VOID", label: "Cancelled" },
              ]}
            />
          }
        >
          {invoicesCall.busy ? (
            <p className="dmuted">Loading…</p>
          ) : invoicesCall.error ? (
            <p className="dfield__error">{invoicesCall.error.message}</p>
          ) : invoices.length === 0 ? (
            <Empty
              icon="wallet"
              title={status ? "Nothing with that status" : "No invoices yet"}
              body={
                plans.length === 0
                  ? "Create a fee plan first — an invoice is one period of a plan, for one child."
                  : "Raise one for a child and it stays a draft until you send it."
              }
            />
          ) : (
            <table className="dtable">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{childName(invoice.child_id)}</strong>
                      <br />
                      <span className="muted" style={{ fontSize: 12.5 }}>
                        {planName(invoice.fee_plan_id)}
                      </span>
                    </td>
                    <td>{monthLabel(invoice.period_start)}</td>
                    <td>
                      <strong>{rupees(invoice.amount_paise)}</strong>
                    </td>
                    <td>{dateLabel(invoice.due_date)}</td>
                    <td>
                      <Tag tone={STATUS_TONE[invoice.status] || "grey"}>
                        {STATUS_LABEL[invoice.status] || invoice.status}
                      </Tag>
                    </td>
                    <td className="nowrap">
                      {invoice.status === "DRAFT" ? (
                        <Btn
                          size="sm"
                          variant="outline"
                          icon="send"
                          disabled={send.busy}
                          onClick={() =>
                            send
                              .run(invoice.id)
                              .then(() => {
                                reload();
                                toast(
                                  `Sent to ${childName(invoice.child_id)}'s family`
                                );
                              })
                              .catch(() => {})
                          }
                        >
                          Send
                        </Btn>
                      ) : null}
                      {invoice.status === "DRAFT" ||
                      invoice.status === "SENT" ||
                      invoice.status === "OVERDUE" ? (
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => setVoiding(invoice)}
                        >
                          Cancel
                        </Btn>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      ) : (
        <Panel
          title="Fee plans"
          sub="What a place costs. An invoice copies the amount when it is raised, so changing a plan never rewrites a bill already sent."
        >
          {plansCall.busy ? (
            <p className="dmuted">Loading…</p>
          ) : plans.length === 0 ? (
            <Empty
              icon="tag"
              title="No fee plans yet"
              body="Add what a place costs — full-day monthly, half-day, and so on. You bill a child against one of these."
              action={<Btn onClick={() => setPlanModal({})}>New plan</Btn>}
            />
          ) : (
            <table className="dtable">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Cycle</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.name}</strong>
                    </td>
                    <td>
                      <strong>{rupees(plan.amount_paise)}</strong>
                    </td>
                    <td>
                      {CYCLES.find((c) => c.value === plan.cycle)?.label ||
                        plan.cycle}
                    </td>
                    <td>
                      <Tag tone={plan.is_active ? "green" : "grey"}>
                        {plan.is_active ? "In use" : "Retired"}
                      </Tag>
                    </td>
                    <td className="nowrap">
                      <Btn
                        size="sm"
                        variant="outline"
                        icon="edit"
                        onClick={() => setPlanModal(plan)}
                      >
                        Edit
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {planModal ? (
        <PlanModal
          plan={planModal.id ? planModal : null}
          save={savePlan}
          onClose={() => setPlanModal(null)}
          onSaved={(name) => {
            setPlanModal(null);
            plansCall.reload();
            toast(`${name} saved`);
          }}
        />
      ) : null}

      {raising ? (
        <RaiseModal
          plans={plans.filter((p) => p.is_active)}
          children={children}
          action={raise}
          onClose={() => setRaising(false)}
          onRaised={(name) => {
            setRaising(false);
            invoicesCall.reload();
            toast(`Draft raised for ${name} — send it when you are ready`);
          }}
        />
      ) : null}

      {voiding ? (
        <VoidModal
          invoice={voiding}
          childName={childName(voiding.child_id)}
          action={cancel}
          onClose={() => setVoiding(null)}
          onVoided={() => {
            setVoiding(null);
            reload();
            toast("Invoice cancelled");
          }}
        />
      ) : null}
    </>
  );
}


function PlanModal({ plan, save, onClose, onSaved }) {
  const [name, setName] = useState(plan?.name || "");
  const [amount, setAmount] = useState(
    plan ? String(Math.trunc(plan.amount_paise / 100)) : ""
  );
  const [cycle, setCycle] = useState(plan?.cycle || "MONTHLY");
  const [active, setActive] = useState(plan ? plan.is_active : true);
  const [localError, setLocalError] = useState(null);

  const submit = () => {
    setLocalError(null);
    if (!name.trim()) return setLocalError("Give the plan a name.");
    const paise = toPaise(amount);
    if (paise === null || paise <= 0) {
      return setLocalError("Enter the amount in rupees.");
    }

    const payload = plan
      ? { name: name.trim(), amount_paise: paise, is_active: active }
      : {
          client_id: crypto.randomUUID(),
          name: name.trim(),
          amount_paise: paise,
          cycle,
        };

    return save
      .run(plan?.id, payload)
      .then(() => onSaved(name.trim()))
      .catch(() => {});
  };

  const error = localError || save.error?.message;
  const fieldErrors = save.error?.fields || {};

  return (
    <Modal
      title={plan ? "Edit fee plan" : "New fee plan"}
      sub={
        plan
          ? "Changing the amount affects invoices raised from now on, never ones already sent."
          : "What a place costs. You bill a child against this."
      }
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn icon="check" disabled={save.busy} onClick={submit}>
            {save.busy ? "Saving..." : "Save plan"}
          </Btn>
        </>
      }
    >
      <div className="dfield-2">
        <label className="dfield">
          <span>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Full-day monthly"
          />
          {fieldErrors.name ? (
            <small className="dfield__error">{fieldErrors.name}</small>
          ) : null}
        </label>
        <label className="dfield">
          <span>Amount (₹)</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="8000"
            inputMode="decimal"
          />
          {fieldErrors.amount_paise ? (
            <small className="dfield__error">{fieldErrors.amount_paise}</small>
          ) : null}
        </label>
      </div>

      {plan ? (
        <label className="dfield" style={{ marginTop: 14 }}>
          <span>Status</span>
          <select
            value={active ? "yes" : "no"}
            onChange={(event) => setActive(event.target.value === "yes")}
          >
            <option value="yes">In use</option>
            <option value="no">Retired — not offered for new invoices</option>
          </select>
        </label>
      ) : (
        <label className="dfield" style={{ marginTop: 14 }}>
          <span>Cycle</span>
          <select
            value={cycle}
            onChange={(event) => setCycle(event.target.value)}
          >
            {CYCLES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <small className="dmuted">
            This cannot be changed later — a monthly plan that became a term
            plan would change what every invoice raised from it meant. Retire
            it and make a new one instead.
          </small>
        </label>
      )}

      {error ? (
        <p className="dfield__error" style={{ marginTop: 14 }}>
          {error}
        </p>
      ) : null}
    </Modal>
  );
}

function RaiseModal({ plans, children, action, onClose, onRaised }) {
  const today = new Date().toISOString().slice(0, 10);
  const bounds = monthBounds(today);

  const [childId, setChildId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const [periodStart, setPeriodStart] = useState(bounds.start);
  const [periodEnd, setPeriodEnd] = useState(bounds.end);
  const [dueDate, setDueDate] = useState(bounds.start);
  const [localError, setLocalError] = useState(null);

  const plan = plans.find((p) => p.id === planId);
  const child = children.find((c) => c.id === childId);

  const submit = () => {
    setLocalError(null);
    if (!childId) return setLocalError("Choose a child.");
    if (!planId) return setLocalError("Choose a fee plan.");
    if (periodEnd < periodStart) {
      return setLocalError("The period ends before it starts.");
    }

    return action
      .run({
        client_id: crypto.randomUUID(),
        child_id: childId,
        fee_plan_id: planId,
        period_start: periodStart,
        period_end: periodEnd,
        due_date: dueDate,
      })
      .then(() => onRaised(child?.name || "the child"))
      .catch(() => {});
  };

  const error = localError || action.error?.message;

  return (
    <Modal
      title="Raise an invoice"
      sub="It stays a draft until you send it — the family sees nothing yet."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn icon="check" disabled={action.busy} onClick={submit}>
            {action.busy ? "Raising..." : "Raise draft"}
          </Btn>
        </>
      }
    >
      <div className="dfield-2">
        <label className="dfield">
          <span>Child</span>
          <select
            value={childId}
            onChange={(event) => setChildId(event.target.value)}
          >
            <option value="">Select a child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="dfield">
          <span>Fee plan</span>
          <select
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {rupees(p.amount_paise)}
              </option>
            ))}
          </select>
        </label>
        <label className="dfield">
          <span>Period from</span>
          <input
            type="date"
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
          />
        </label>
        <label className="dfield">
          <span>Period to</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
          />
        </label>
        <label className="dfield">
          <span>Due by</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>

      {plan ? (
        <p className="note-box" style={{ marginTop: 14 }}>
          <Icon name="wallet" />
          <span>
            <strong>{rupees(plan.amount_paise)}</strong> — copied onto this
            invoice now. Changing the plan later will not alter it.
          </span>
        </p>
      ) : null}

      {error ? (
        <p className="dfield__error" style={{ marginTop: 14 }}>
          {error}
        </p>
      ) : null}
    </Modal>
  );
}

function VoidModal({ invoice, childName, action, onClose, onVoided }) {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState(null);

  const submit = () => {
    setLocalError(null);
    if (!reason.trim()) {
      return setLocalError("Say why — it is kept on the record.");
    }
    return action
      .run(invoice.id, reason.trim())
      .then(onVoided)
      .catch(() => {});
  };

  const error = localError || action.error?.message;

  return (
    <Modal
      title={`Cancel this invoice?`}
      sub={`${rupees(invoice.amount_paise)} for ${childName}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Keep it
          </Btn>
          <Btn icon="check" disabled={action.busy} onClick={submit}>
            {action.busy ? "Cancelling..." : "Cancel invoice"}
          </Btn>
        </>
      }
    >
      <p className="dmuted">
        {invoice.status === "DRAFT"
          ? "This one was never sent, so the family has not seen it."
          : "The family has seen this. Cancelling shows it to them as cancelled rather than removing it — an invoice they were sent is a record."}
      </p>
      <label className="dfield" style={{ marginTop: 14 }}>
        <span>Why</span>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Raised against the wrong plan"
        />
      </label>
      {error ? (
        <p className="dfield__error" style={{ marginTop: 14 }}>
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
