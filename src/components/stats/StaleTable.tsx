import { useNavigate } from 'react-router-dom';
import type { StaleEntry } from '../../lib/stats';
import { useUiStore } from '../../store/useUiStore';

interface StaleTableProps {
  entries: StaleEntry[];
}

function StaleTable({ entries }: StaleTableProps) {
  const navigate = useNavigate();
  const openDetail = useUiStore((s) => s.openDetail);

  function handleOpen(applicationId: string) {
    openDetail(applicationId);
    navigate('/');
  }

  return (
    <div className="rounded-column border border-line bg-surface p-4 md:col-span-2">
      <h3 className="mb-3 text-sm font-semibold">Stale applications</h3>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">Nothing's gone quiet — nice work staying on top of it.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="pb-2 font-medium">
                Company
              </th>
              <th scope="col" className="pb-2 font-medium">
                Role
              </th>
              <th scope="col" className="pb-2 font-medium">
                Days quiet
              </th>
              <th scope="col" className="pb-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ application, daysQuiet }) => (
              <tr key={application.id} className="border-b border-line last:border-0">
                <td className="py-1.5">{application.company}</td>
                <td className="py-1.5 text-muted">{application.role}</td>
                <td className="py-1.5 font-mono" style={{ color: 'var(--flag-text)' }}>
                  {daysQuiet}d
                </td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleOpen(application.id)}
                    className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:bg-bg hover:text-ink"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StaleTable;
