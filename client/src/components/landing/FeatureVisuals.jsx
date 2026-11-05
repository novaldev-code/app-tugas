export function DashboardMock() {
  return (
    <div className="feature-visual feature-visual-dashboard" aria-hidden="true">
      <div className="feature-stat-row">
        <div className="feature-stat">
          <span>Total</span>
          <strong>12</strong>
        </div>
        <div className="feature-stat">
          <span>Selesai</span>
          <strong>5</strong>
        </div>
        <div className="feature-stat">
          <span>Fokus</span>
          <strong>3</strong>
        </div>
      </div>
      <div className="feature-chart">
        {[42, 68, 54, 82, 61, 90, 74].map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ListMock() {
  return (
    <div className="feature-visual feature-visual-list" aria-hidden="true">
      {[
        ['Susun rencana minggu ini', 'Tinggi'],
        ['Review catatan proyek', 'Sedang'],
        ['Latihan singkat', 'Rendah'],
      ].map(([title, priority]) => (
        <div className="feature-list-row" key={title}>
          <span className="feature-check" />
          <span className="feature-list-title">{title}</span>
          <span className={`feature-priority feature-priority-${priority.toLowerCase()}`}>
            {priority}
          </span>
        </div>
      ))}
    </div>
  );
}

export function KanbanMock() {
  return (
    <div className="feature-visual feature-visual-kanban" aria-hidden="true">
      {['Todo', 'Proses', 'Selesai'].map((column, index) => (
        <div className="feature-kanban-column" key={column}>
          <span className="feature-kanban-label">{column}</span>
          <span className={`feature-kanban-card feature-kanban-card-${index}`} />
          <span className="feature-kanban-card feature-kanban-card-soft" />
        </div>
      ))}
    </div>
  );
}

export function CategoryMock() {
  return (
    <div className="feature-visual feature-visual-category" aria-hidden="true">
      <div className="feature-category-chips">
        <span>Pribadi</span>
        <span>Pekerjaan</span>
        <span>Belajar</span>
        <span>+ Baru</span>
      </div>
      <div className="feature-category-stack">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function FeatureVisual({ type }) {
  if (type === 'dashboard') {
    return <DashboardMock />;
  }

  if (type === 'list') {
    return <ListMock />;
  }

  if (type === 'kanban') {
    return <KanbanMock />;
  }

  if (type === 'category') {
    return <CategoryMock />;
  }

  return null;
}
