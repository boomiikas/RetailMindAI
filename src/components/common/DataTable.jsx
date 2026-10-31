import React from 'react';

const DataTable = ({ columns, data, emptyMessage = 'No records found matching criteria.' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="data-table-container" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={col.key || index} style={{ textAlign: col.align || 'left', width: col.width || 'auto' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
