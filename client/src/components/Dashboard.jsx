import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../labels.js';

function StatRow({ label, value, max }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="stat-row">
      <div className="stat-row-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="stat-bar" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard({ stats, loading, error, onRetry }) {
  if (loading && !stats) {
    return <p className="state">Memuat ringkasan...</p>;
  }

  if (error) {
    return (
      <div className="state error-state">
        <p>{error}</p>
        <button type="button" className="button secondary" onClick={onRetry}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const maxStatus = Math.max(
    1,
    ...STATUS_OPTIONS.map((option) => stats.byStatus[option.value] ?? 0),
  );
  const maxPriority = Math.max(
    1,
    ...PRIORITY_OPTIONS.map((option) => stats.byPriority[option.value] ?? 0),
  );

  return (
    <section className="dashboard">
      <header className="section-heading">
        <div>
          <h2>Dashboard</h2>
          <p>Statistik seluruh tugas, tidak terpengaruh filter tampilan.</p>
        </div>
      </header>

      <div className="stats-grid">
        <article className="stat-card stat-card-total">
          <span>Total Tugas</span>
          <strong>{stats.total}</strong>
        </article>

        {STATUS_OPTIONS.map((option) => (
          <article className="stat-card" key={option.value}>
            <span>{option.label}</span>
            <strong>{stats.byStatus[option.value] ?? 0}</strong>
          </article>
        ))}

        {PRIORITY_OPTIONS.map((option) => (
          <article className="stat-card stat-card-priority" key={option.value}>
            <span>{option.label}</span>
            <strong>{stats.byPriority[option.value] ?? 0}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-columns">
        <div className="panel">
          <h3>Berdasarkan Status</h3>
          {STATUS_OPTIONS.map((option) => (
            <StatRow
              key={option.value}
              label={option.label}
              value={stats.byStatus[option.value] ?? 0}
              max={maxStatus}
            />
          ))}
        </div>

        <div className="panel">
          <h3>Berdasarkan Prioritas</h3>
          {PRIORITY_OPTIONS.map((option) => (
            <StatRow
              key={option.value}
              label={option.label}
              value={stats.byPriority[option.value] ?? 0}
              max={maxPriority}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
