import { useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Btn, PageHead, Panel, Select, StatCard, Tabs, Tag } from "../../components/dash/ui.jsx";
import { AreaChart, BarChart, Donut, RankBars } from "../../components/dash/Charts.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import {
  admissionsTrend,
  attendanceByClass,
  attendanceTrend,
  classDistribution,
  reportRange,
  reportTypeTone,
  revenueTrend,
  savedReports,
} from "../../data/dash/reports.js";
import { billingSummary } from "../../data/dash/billing.js";
import { fmtMoney } from "../../data/dash/seed.js";

export default function Reports() {
  const toast = useToast();
  const [tab, setTab] = useState("attendance");
  const [range, setRange] = useState("Last 30 days");

  return (
    <>
      <PageHead title="Reports & Analytics" sub="Attendance, revenue and admissions at a glance">
        <Select value={range} onChange={setRange} options={reportRange} />
        <Btn variant="outline" icon="printer" onClick={() => toast("Report sent to your email")}>
          Email report
        </Btn>
        <Btn icon="download" onClick={() => toast("Report downloaded as PDF")}>
          Download
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard icon="checkSquare" tone="green" label="Average attendance" value="91%" delta={{ dir: "up", text: "3% vs last month" }} />
        <StatCard icon="wallet" tone="brand" label="Collected this month" value={fmtMoney(billingSummary.collected)} delta={{ dir: "up", text: "16% vs last month" }} />
        <StatCard icon="userPlus" tone="blue" label="New admissions" value={12} delta={{ dir: "up", text: "4 more than July" }} />
        <StatCard icon="logOut" tone="amber" label="Withdrawals" value={2} delta={{ dir: "flat", text: "Same as July" }} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "attendance", label: "Attendance" },
            { id: "revenue", label: "Revenue" },
            { id: "admissions", label: "Admissions" },
            { id: "saved", label: "Saved reports" },
          ]}
        />
      </div>

      {tab === "attendance" ? (
        <div className="dcols dcols--main">
          <Panel title="Attendance rate" sub="Monthly average, percent of the register">
            <AreaChart
              points={attendanceTrend.values}
              labels={attendanceTrend.labels}
              color="#16a34a"
              height={250}
              formatY={(value) => `${value}%`}
            />
          </Panel>
          <div className="dstack">
            <Panel title="By classroom" sub="Average this month">
              <RankBars data={attendanceByClass} color="#16a34a" format={(value) => `${value}%`} />
            </Panel>
            <Panel title="Children per classroom">
              <div className="donut-row">
                <Donut
                  segments={classDistribution}
                  size={150}
                  centre={{ value: classDistribution.reduce((sum, item) => sum + item.value, 0), label: "Enrolled" }}
                />
                <ul className="legend">
                  {classDistribution.map((segment) => (
                    <li key={segment.label}>
                      <span className="legend__swatch" style={{ background: segment.color }} />
                      <span className="legend__label">{segment.label}</span>
                      <span className="legend__value">{segment.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "revenue" ? (
        <div className="dcols dcols--main">
          <Panel title="Fee collections" sub="Last 12 months, in lakhs">
            <AreaChart
              points={revenueTrend.values}
              labels={revenueTrend.labels}
              color="#7c3aed"
              height={250}
              formatY={(value) => `${value}L`}
            />
          </Panel>
          <div className="dstack">
            <Panel title="This month">
              <ul className="statlist">
                <li>
                  <span>Billed</span>
                  <strong>{fmtMoney(billingSummary.billed)}</strong>
                </li>
                <li>
                  <span>Collected</span>
                  <strong>{fmtMoney(billingSummary.collected)}</strong>
                </li>
                <li>
                  <span>Pending</span>
                  <strong>{fmtMoney(billingSummary.pending)}</strong>
                </li>
                <li>
                  <span>Overdue</span>
                  <strong>{fmtMoney(billingSummary.overdue)}</strong>
                </li>
                <li>
                  <span>Collection rate</span>
                  <strong>{Math.round((billingSummary.collected / billingSummary.billed) * 100)}%</strong>
                </li>
              </ul>
            </Panel>
            <Panel title="Revenue by plan">
              <RankBars
                data={[
                  { label: "Full-day", value: 1170000 },
                  { label: "Half-day", value: 389500 },
                  { label: "Extended care", value: 27000 },
                ]}
                format={fmtMoney}
              />
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "admissions" ? (
        <div className="dcols dcols--main">
          <Panel title="Joined vs left" sub="Children enrolled and withdrawn each month">
            <BarChart
              data={admissionsTrend.labels.map((label, index) => ({
                label,
                value: admissionsTrend.joined[index],
              }))}
              color="#3b82f6"
              height={250}
            />
          </Panel>
          <div className="dstack">
            <Panel title="Where enquiries come from">
              <RankBars
                data={[
                  { label: "Kribble parent app", value: 42, color: "#7c3aed" },
                  { label: "Referral", value: 18, color: "#3b82f6" },
                  { label: "Walk-in", value: 11, color: "#16a34a" },
                  { label: "Phone enquiry", value: 7, color: "#f59e0b" },
                ]}
              />
            </Panel>
            <Panel title="Conversion">
              <ul className="statlist">
                <li>
                  <span>Enquiries received</span>
                  <strong>78</strong>
                </li>
                <li>
                  <span>Centre visits booked</span>
                  <strong>46</strong>
                </li>
                <li>
                  <span>Admissions confirmed</span>
                  <strong>31</strong>
                </li>
                <li>
                  <span>Conversion rate</span>
                  <strong>40%</strong>
                </li>
              </ul>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "saved" ? (
        <Panel
          title="Saved reports"
          sub="Generated reports stay available for 12 months"
          flush
          tools={
            <Btn size="sm" variant="soft" icon="plus" onClick={() => toast("Report queued — we'll email it shortly")}>
              Generate report
            </Btn>
          }
        >
          <DataTable
            columns={[
              {
                key: "name",
                header: "Report",
                render: (row) => (
                  <div className="who">
                    <span className={`avatar avatar--square tone-${reportTypeTone[row.type]}`} style={{ width: 36, height: 36 }}>
                      <Icon name="fileText" size={17} />
                    </span>
                    <span className="who__text">
                      <strong>{row.name}</strong>
                      <span>{row.period}</span>
                    </span>
                  </div>
                ),
              },
              { key: "type", header: "Type", render: (row) => <Tag tone={reportTypeTone[row.type]}>{row.type}</Tag> },
              { key: "generated", header: "Generated" },
              { key: "size", header: "Size" },
              {
                key: "action",
                header: "",
                align: "right",
                render: () => (
                  <button type="button" className="dbtn dbtn--soft dbtn--sm">
                    Download
                  </button>
                ),
              },
            ]}
            rows={savedReports}
          />
        </Panel>
      ) : null}
    </>
  );
}
