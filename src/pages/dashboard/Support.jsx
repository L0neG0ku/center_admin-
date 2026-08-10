import { useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Btn, PageHead, Panel, Tabs, Tag, Who } from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { Drawer, Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { faqs, ticketCategories, ticketStatusTone, tickets } from "../../data/dash/support.js";

export default function Support() {
  const toast = useToast();
  const [tab, setTab] = useState("tickets");
  const [list, setList] = useState(tickets);
  const [selected, setSelected] = useState(null);
  const [raising, setRaising] = useState(false);
  const [openFaq, setOpenFaq] = useState(faqs[0].id);
  const [reply, setReply] = useState("");

  const columns = [
    {
      key: "subject",
      header: "Ticket",
      render: (row) => <Who name={row.subject} sub={`${row.id} · ${row.category}`} icon="ticket" tone="brand" />,
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <Tag tone={row.priority === "High" ? "red" : row.priority === "Medium" ? "amber" : "grey"}>
          {row.priority}
        </Tag>
      ),
    },
    { key: "owner", header: "Handled by" },
    { key: "createdLabel", header: "Raised", render: (row) => <span className="nowrap">{row.createdLabel}</span> },
    { key: "updatedLabel", header: "Last update", render: (row) => <span className="nowrap">{row.updatedLabel}</span> },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Tag tone={ticketStatusTone[row.status]} dot>
          {row.status}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <PageHead title="Support" sub="Raise a ticket with Kribble, or find an answer yourself">
        <Btn icon="plus" onClick={() => setRaising(true)}>
          Raise a ticket
        </Btn>
      </PageHead>

      <div className="dcols dcols--main" style={{ marginBottom: 18 }}>
        <div className="helpstrip">
          <div className="helpstrip__item">
            <span className="helpstrip__icon tone-brand">
              <Icon name="headset" size={20} />
            </span>
            <div>
              <strong>Your partner manager</strong>
              <span className="muted">Rohit Bhatia · responds within 4 hours</span>
            </div>
            <Btn size="sm" variant="soft" onClick={() => toast("Chat opened")}>
              Message
            </Btn>
          </div>
          <div className="helpstrip__item">
            <span className="helpstrip__icon tone-green">
              <Icon name="phone" size={20} />
            </span>
            <div>
              <strong>Partner helpline</strong>
              <span className="muted">1800 200 4455 · 8 AM – 8 PM, all days</span>
            </div>
            <Btn size="sm" variant="outline" onClick={() => toast("Dialling the helpline")}>
              Call
            </Btn>
          </div>
        </div>

        <Panel title="At a glance">
          <ul className="statlist">
            <li>
              <span>Open tickets</span>
              <strong>{list.filter((ticket) => ticket.status !== "Resolved" && ticket.status !== "Closed").length}</strong>
            </li>
            <li>
              <span>Waiting on you</span>
              <strong>{list.filter((ticket) => ticket.status === "Waiting on you").length}</strong>
            </li>
            <li>
              <span>Resolved this month</span>
              <strong>{list.filter((ticket) => ticket.status === "Resolved").length}</strong>
            </li>
            <li>
              <span>Average first response</span>
              <strong>3h 20m</strong>
            </li>
          </ul>
        </Panel>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "tickets", label: "My tickets", count: list.length },
            { id: "faqs", label: "FAQs", count: faqs.length },
          ]}
        />
      </div>

      {tab === "tickets" ? (
        <Panel title="Tickets" flush>
          <DataTable
            columns={columns}
            rows={list}
            onRowClick={setSelected}
            selectedId={selected?.id}
            empty={{ title: "No tickets yet", body: "Raise one and we'll pick it up." }}
          />
        </Panel>
      ) : null}

      {tab === "faqs" ? (
        <Panel title="Frequently asked" sub="The questions daycare partners ask us most">
          <ul className="faqs">
            {faqs.map((faq) => (
              <li key={faq.id} className={openFaq === faq.id ? "is-open" : ""}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  aria-expanded={openFaq === faq.id}
                >
                  <span>{faq.q}</span>
                  <Icon name={openFaq === faq.id ? "minusCircle" : "plus"} size={18} />
                </button>
                {openFaq === faq.id ? <p>{faq.a}</p> : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {selected ? (
        <Drawer
          title={selected.subject}
          sub={`${selected.id} · ${selected.category}`}
          onClose={() => setSelected(null)}
          wide
          footer={
            <>
              <Btn
                variant="outline"
                onClick={() => {
                  setList((current) =>
                    current.map((ticket) =>
                      ticket.id === selected.id ? { ...ticket, status: "Resolved" } : ticket
                    )
                  );
                  setSelected(null);
                  toast("Ticket marked resolved");
                }}
              >
                Mark resolved
              </Btn>
              <Btn
                icon="send"
                onClick={() => {
                  setReply("");
                  toast("Reply sent to the Kribble team");
                }}
              >
                Send reply
              </Btn>
            </>
          }
        >
          <div className="dident">
            <span className="avatar avatar--square tone-brand" style={{ width: 46, height: 46 }}>
              <Icon name="ticket" size={22} />
            </span>
            <div className="dident__text">
              <strong>{selected.priority} priority</strong>
              <span>Raised {selected.createdLabel} · handled by {selected.owner}</span>
            </div>
            <Tag tone={ticketStatusTone[selected.status]} dot>
              {selected.status}
            </Tag>
          </div>

          <section className="dsec">
            <h3>Conversation</h3>
            <ul className="thread">
              {selected.thread.map((message) => (
                <li key={message.id} className={message.from === "you" ? "is-you" : ""}>
                  <div className="thread__bubble">
                    <header>
                      <strong>{message.author}</strong>
                      <span className="muted">{message.at}</span>
                    </header>
                    <p>{message.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="dsec">
            <label className="dfield">
              <span>Your reply</span>
              <textarea
                value={reply}
                placeholder="Add anything that helps us close this faster"
                onChange={(event) => setReply(event.target.value)}
              />
            </label>
          </section>
        </Drawer>
      ) : null}

      {raising ? (
        <Modal
          title="Raise a support ticket"
          sub="Tell us what's happening and we'll get on it."
          onClose={() => setRaising(false)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setRaising(false)}>
                Cancel
              </Btn>
              <Btn
                icon="send"
                onClick={() => {
                  setRaising(false);
                  toast("Ticket raised — we'll reply within 4 hours");
                }}
              >
                Raise ticket
              </Btn>
            </>
          }
        >
          <div className="dfield-2">
            <label className="dfield">
              <span>Category</span>
              <select defaultValue="">
                <option value="">Select a category</option>
                {ticketCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="dfield">
              <span>Priority</span>
              <select defaultValue="Medium">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
          </div>
          <label className="dfield">
            <span>Subject</span>
            <input placeholder="One line on what's wrong" />
          </label>
          <label className="dfield">
            <span>Describe the issue</span>
            <textarea placeholder="What happened, when, and what you've already tried" />
          </label>
        </Modal>
      ) : null}
    </>
  );
}
