import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Fact,
  PageHead,
  Panel,
  Reset,
  Row,
  Search,
  Select,
  StatCard,
  Tabs,
  Tag,
  Who,
} from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { AreaChart } from "../../components/dash/Charts.jsx";
import { Drawer, Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import {
  billingSummary,
  collectionLabels,
  collectionTrend,
  feePlans,
  invoiceStatusTone,
  invoices,
  kribblePlan,
} from "../../data/dash/billing.js";
import { fmtMoney } from "../../data/dash/seed.js";

const statuses = ["Paid", "Pending", "Overdue"];

export default function Billing() {
  const toast = useToast();
  const [tab, setTab] = useState("fees");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [recording, setRecording] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (status && invoice.status !== status) return false;
      return (
        !needle ||
        invoice.child.toLowerCase().includes(needle) ||
        invoice.id.toLowerCase().includes(needle) ||
        invoice.parent.toLowerCase().includes(needle)
      );
    });
  }, [query, status]);

  const columns = [
    { key: "id", header: "Invoice", render: (row) => <span className="mono">{row.id}</span> },
    { key: "child", header: "Child", render: (row) => <Who name={row.child} sub={row.parent} size={34} /> },
    { key: "plan", header: "Plan", render: (row) => <span className="nowrap">{row.plan}</span> },
    { key: "period", header: "Period", render: (row) => <span className="nowrap">{row.period}</span> },
    { key: "amount", header: "Amount", align: "right", render: (row) => fmtMoney(row.amount) },
    { key: "dueLabel", header: "Due", render: (row) => <span className="nowrap">{row.dueLabel}</span> },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Tag tone={invoiceStatusTone[row.status]} dot>
          {row.status}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <PageHead title="Billing" sub="Fees you collect from parents, and what you pay Kribble">
        <Btn variant="outline" icon="download" onClick={() => toast("Statement downloaded")}>
          Statement
        </Btn>
        <Btn icon="plus" onClick={() => setRecording(true)}>
          Record payment
        </Btn>
      </PageHead>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "fees", label: "Parent fees" },
            { id: "setup", label: "Fee setup" },
            { id: "plan", label: "Your Kribble plan" },
          ]}
        />
      </div>

      {tab === "fees" ? (
        <>
          <div className="stats">
            <StatCard
              icon="receipt"
              tone="brand"
              label="Billed this month"
              value={fmtMoney(billingSummary.billed)}
              delta={{ dir: "up", text: `${invoices.length} invoices` }}
            />
            <StatCard
              icon="checkCircle"
              tone="green"
              label="Collected"
              value={fmtMoney(billingSummary.collected)}
              delta={{ dir: "up", text: `${Math.round((billingSummary.collected / billingSummary.billed) * 100)}% of billed` }}
            />
            <StatCard
              icon="clock"
              tone="amber"
              label="Pending"
              value={fmtMoney(billingSummary.pending)}
              delta={{ dir: "flat", text: `${billingSummary.pendingCount} invoices` }}
            />
            <StatCard
              icon="alertTriangle"
              tone="red"
              label="Overdue"
              value={fmtMoney(billingSummary.overdue)}
              delta={{ dir: "down", text: `${billingSummary.overdueCount} invoices` }}
            />
          </div>

          <div className="dcols dcols--main" style={{ marginBottom: 18 }}>
            <Panel title="Collections over time" sub="Fees collected each month, in lakhs">
              <AreaChart
                points={collectionTrend}
                labels={collectionLabels}
                color="#7c3aed"
                height={230}
                formatY={(value) => `${value}L`}
              />
            </Panel>

            <Panel title="Chase up" sub="Send a reminder in one tap">
              <ul className="feed">
                {invoices
                  .filter((invoice) => invoice.status === "Overdue")
                  .slice(0, 5)
                  .map((invoice) => (
                    <li key={invoice.id}>
                      <div className="feed__row">
                        <span className="feed__icon tone-red">
                          <Icon name="alertTriangle" size={15} />
                        </span>
                        <span className="feed__text">
                          <strong>{invoice.child}</strong>
                          <span>
                            {fmtMoney(invoice.amount)} · due {invoice.dueLabel}
                          </span>
                        </span>
                        <Btn size="sm" variant="soft" onClick={() => toast(`Reminder sent to ${invoice.parent}`)}>
                          Remind
                        </Btn>
                      </div>
                    </li>
                  ))}
              </ul>
              <Btn
                variant="outline"
                className="dbtn--block"
                icon="send"
                onClick={() => toast("Reminders sent to all overdue parents")}
              >
                Remind everyone overdue
              </Btn>
            </Panel>
          </div>

          <div className="toolbar">
            <Search value={query} onChange={setQuery} placeholder="Search invoice, child or parent..." />
            <Select value={status} onChange={setStatus} options={statuses} placeholder="All statuses" />
            <div className="toolbar__spacer" />
            <Reset
              onClick={() => {
                setQuery("");
                setStatus("");
              }}
            />
          </div>

          <Panel title="Invoices" badge={{ label: `${rows.length} shown`, tone: "brand" }} flush>
            <DataTable
              columns={columns}
              rows={rows}
              onRowClick={setSelected}
              selectedId={selected?.id}
              empty={{ title: "No invoices match", body: "Try a different status." }}
            />
          </Panel>
        </>
      ) : null}

      {tab === "setup" ? (
        <div className="dcols dcols--main">
          <Panel
            title="Fee structure"
            sub="What parents are charged. Changes apply from the next billing cycle."
            tools={
              <Btn size="sm" variant="soft" icon="plus" onClick={() => toast("New fee plan added")}>
                Add plan
              </Btn>
            }
          >
            <ul className="planlist">
              {feePlans.map((plan) => (
                <li key={plan.id}>
                  <div className="planlist__text">
                    <strong>{plan.name}</strong>
                    <span className="muted">{plan.note}</span>
                    {plan.children ? (
                      <span className="muted" style={{ fontSize: 12.5 }}>
                        {plan.children} children on this plan
                      </span>
                    ) : null}
                  </div>
                  <div className="planlist__price">
                    <strong>{fmtMoney(plan.monthly)}</strong>
                    <span className="muted">{plan.id === "admission" ? "one-time" : "per month"}</span>
                  </div>
                  <Btn size="sm" variant="outline" onClick={() => toast(`${plan.name} updated`)}>
                    Edit
                  </Btn>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="dstack">
            <Panel title="Billing cycle">
              <Row label="Invoices generated" value="1st of each month" />
              <Row label="Payment due" value="Within 7 days" />
              <Row label="Late fee" value="Not charged" />
              <Row label="Auto reminders" value="3 days before, on the day, 3 days after" />
              <Btn variant="outline" className="dbtn--block" style={{ marginTop: 16 }} onClick={() => toast("Billing cycle saved")}>
                Change cycle
              </Btn>
            </Panel>

            <Panel title="Payouts">
              <p className="note-box">
                Parent payments made through Kribble are settled to your verified account every Tuesday
                and Friday, after the platform commission.
              </p>
              <Row label="Settlement account" value="HDFC •••• 4471" />
              <Row label="Last settlement" value={fmtMoney(284000)} />
              <Row label="Next settlement" value="Friday" />
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "plan" ? (
        <div className="dcols dcols--main">
          <Panel title="Your Kribble plan" sub="What your centre pays to be on Kribble">
            <div className="plancard">
              <div className="plancard__head">
                <span className="plancard__icon tone-brand">
                  <Icon name="sparkle" size={22} />
                </span>
                <div>
                  <strong>{kribblePlan.name}</strong>
                  <span className="muted">{kribblePlan.seats}</span>
                </div>
                <Tag tone="green" dot>
                  {kribblePlan.status}
                </Tag>
              </div>

              <div className="plancard__price">
                <strong>{fmtMoney(kribblePlan.price)}</strong>
                <span className="muted">{kribblePlan.cycle}</span>
              </div>

              <ul className="ticklist">
                {kribblePlan.features.map((feature) => (
                  <li key={feature}>
                    <Icon name="checkCircle" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="dgrid" style={{ marginTop: 20 }}>
                <Fact label="Renews on" value={kribblePlan.renewsOn} />
                <Fact label="Commission" value={kribblePlan.commission} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <Btn variant="outline" onClick={() => toast("Plan comparison opens with the backend")}>
                  Compare plans
                </Btn>
                <Btn onClick={() => toast("Upgrade request sent to your partner manager")}>Upgrade</Btn>
              </div>
            </div>
          </Panel>

          <Panel title="Plan invoices" flush>
            <DataTable
              columns={[
                { key: "id", header: "Invoice" },
                { key: "period", header: "Period" },
                { key: "amount", header: "Amount", align: "right", render: (row) => fmtMoney(row.amount) },
                { key: "on", header: "Paid on" },
                {
                  key: "status",
                  header: "",
                  align: "right",
                  render: () => (
                    <button type="button" className="dbtn dbtn--soft dbtn--sm">
                      Receipt
                    </button>
                  ),
                },
              ]}
              rows={kribblePlan.history}
            />
          </Panel>
        </div>
      ) : null}

      {selected ? (
        <Drawer
          title="Invoice"
          sub={selected.id}
          onClose={() => setSelected(null)}
          footer={
            <>
              <Btn variant="outline" icon="printer" onClick={() => toast("Receipt downloaded")}>
                Receipt
              </Btn>
              {selected.status === "Paid" ? (
                <Btn variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Btn>
              ) : (
                <Btn
                  icon="check"
                  onClick={() => {
                    setSelected(null);
                    toast(`Payment recorded for ${selected.child}`);
                  }}
                >
                  Mark as paid
                </Btn>
              )}
            </>
          }
        >
          <div className="dident">
            <span className={`avatar avatar--square tone-${invoiceStatusTone[selected.status]}`} style={{ width: 46, height: 46 }}>
              <Icon name="receipt" size={22} />
            </span>
            <div className="dident__text">
              <strong>{fmtMoney(selected.amount)}</strong>
              <span>
                {selected.period} · {selected.plan}
              </span>
            </div>
            <Tag tone={invoiceStatusTone[selected.status]} dot>
              {selected.status}
            </Tag>
          </div>

          <section className="dsec">
            <h3>Billed to</h3>
            <div className="dgrid">
              <Fact label="Child" value={selected.child} />
              <Fact label="Classroom" value={selected.classroom} />
              <Fact label="Parent" value={selected.parent} />
              <Fact label="Invoice ID" value={selected.id} />
            </div>
          </section>

          <section className="dsec">
            <h3>Payment</h3>
            <Row label="Due on" value={selected.dueLabel} />
            <Row label="Paid on" value={selected.paidOn} />
            <Row label="Method" value={selected.method} />
            <Row label="Reminders sent" value={selected.reminders} />
          </section>

          {selected.status !== "Paid" ? (
            <section className="dsec">
              <Btn
                variant="soft"
                icon="send"
                className="dbtn--block"
                onClick={() => toast(`Reminder sent to ${selected.parent}`)}
              >
                Send a reminder
              </Btn>
            </section>
          ) : null}
        </Drawer>
      ) : null}

      {recording ? (
        <Modal
          title="Record a payment"
          sub="Log a fee paid in cash or directly to your account."
          onClose={() => setRecording(false)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setRecording(false)}>
                Cancel
              </Btn>
              <Btn
                icon="check"
                onClick={() => {
                  setRecording(false);
                  toast("Payment recorded and receipt issued");
                }}
              >
                Record payment
              </Btn>
            </>
          }
        >
          <div className="dfield-2">
            <label className="dfield">
              <span>Child</span>
              <select defaultValue="">
                <option value="">Select a child</option>
                {invoices.slice(0, 12).map((invoice) => (
                  <option key={invoice.id}>{invoice.child}</option>
                ))}
              </select>
            </label>
            <label className="dfield">
              <span>Amount</span>
              <input placeholder="15000" />
            </label>
            <label className="dfield">
              <span>Paid on</span>
              <input type="date" />
            </label>
            <label className="dfield">
              <span>Method</span>
              <select defaultValue="">
                <option value="">Select a method</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank transfer</option>
                <option>Cash</option>
              </select>
            </label>
          </div>
          <label className="dfield">
            <span>Note (optional)</span>
            <textarea placeholder="e.g. Paid in cash at the front desk" />
          </label>
        </Modal>
      ) : null}
    </>
  );
}
