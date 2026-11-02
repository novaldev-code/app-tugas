import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../labels.js';
import {
  calculateCompletionRate,
  getPriorityValue,
  getStatusValue,
} from '../utils/dashboard.js';
import { SkeletonCard, SkeletonKPI } from './ui/Skeleton.jsx';

function ProgressRow({ label, value, max }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="progress-row">
      <div className="progress-row-header">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="progress-bar" aria-hidden="true">
        <div className="progress-bar-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard({ stats, loading, error, onRetry }) {
  if (loading && !stats) {
    return (
      <section className="page">
        <div className="kpi-grid">
          <SkeletonKPI className="kpi-card kpi-card-total" />
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
        </div>
        <div className="dashboard-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Gagal memuat statistik</div>
        <p className="empty-state-text">{error}</p>
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const total = Number(stats.total) || 0;
  const completionRate = calculateCompletionRate(stats);

  const statusValues = STATUS_OPTIONS.map((option) => getStatusValue(stats, option.value));
  const priorityValues = PRIORITY_OPTIONS.map((option) => getPriorityValue(stats, option.value));
  const maxStatus = Math.max(1, ...statusValues);
  const maxPriority = Math.max(1, ...priorityValues);

  return (
    <section className="page">
      <div className="kpi-grid">
        <article className="kpi-card kpi-card-total">
          <span className="kpi-label">Total Tugas</span>
          <strong className="kpi-value">{total}</strong>
          <span className="kpi-meta">Tidak terpengaruh filter tampilan</span>
        </article>

        {STATUS_OPTIONS.map((option) => (
          <article className="kpi-card" key={option.value}>
            <span className="kpi-label">{option.label}</span>
            <strong className="kpi-value">{getStatusValue(stats, option.value)}</strong>
          </article>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Tingkat Penyelesaian</h2>
            <p className="page-subtitle">
              {total > 0
                ? `${getStatusValue(stats, 'Done')} dari ${total} tugas telah selesai`
                : 'Belum ada tugas untuk dihitung'}
            </p>
          </div>
          <div className="badge badge-status-done">{completionRate}% Selesai</div>
        </div>
        <div className="card-body">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Berdasarkan Status</h3>
          </div>
          <div className="panel-body">
            <div className="progress-list">
              {STATUS_OPTIONS.map((option, index) => (
                <ProgressRow
                  key={option.value}
                  label={option.label}
                  value={statusValues[index]}
                  max={maxStatus}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Berdasarkan Prioritas</h3>
          </div>
          <div className="panel-body">
            <div className="progress-list">
              {PRIORITY_OPTIONS.map((option, index) => (
                <ProgressRow
                  key={option.value}
                  label={option.label}
                  value={priorityValues[index]}
                  max={maxPriority}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
