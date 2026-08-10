import Icon from "../../icons/Icon.jsx";
import { Empty } from "./ui.jsx";

/**
 * Config-driven table.
 * columns: [{ key, header, render?, align?, width? }]
 * Passing `onRowClick` makes rows selectable, which is how the detail
 * drawers are opened across the dashboard.
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  onRowClick,
  selectedId,
  empty = { title: "Nothing here yet", body: "Try clearing your filters." },
}) {
  if (rows.length === 0) {
    return <Empty icon="search" title={empty.title} body={empty.body} />;
  }

  return (
    <div className="dtable-wrap">
      <table className="dtable">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width, textAlign: column.align || "left" }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = rowKey(row);
            return (
              <tr
                key={id}
                className={`${onRowClick ? "is-clickable" : ""} ${
                  selectedId === id ? "is-selected" : ""
                }`.trim()}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} style={{ textAlign: column.align || "left" }}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Footer link that sits under a preview table, e.g. "View all 56 pending". */
export function TableFoot({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "12px",
        marginTop: 14,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--line)",
        color: "var(--brand-600)",
        fontSize: 13.5,
        fontWeight: 600,
      }}
    >
      {children}
      <Icon name="arrowRight" size={15} />
    </button>
  );
}
