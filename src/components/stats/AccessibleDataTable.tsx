interface AccessibleDataTableProps {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}

/** Every chart needs a non-visual, always-in-the-DOM alternative — screen
 * readers can't parse SVG bars/slices. `sr-only` keeps it out of the visual
 * layout without hiding it from assistive tech. */
function AccessibleDataTable({ caption, headers, rows }: AccessibleDataTableProps) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AccessibleDataTable;
