const PREVIEW_NAV = ['Dashboard', 'Daftar Tugas', 'Kanban', 'Kategori'];

const PREVIEW_TASKS = [
  { title: 'Susun rencana minggu ini', category: 'Pribadi', tone: 'todo' },
  { title: 'Review catatan proyek', category: 'Pekerjaan', tone: 'progress' },
  { title: 'Selesaikan latihan singkat', category: 'Belajar', tone: 'done' },
];

const KANBAN_ITEMS = [
  { column: 'Todo', title: 'Rencana mingguan', tone: 'todo' },
  { column: 'Proses', title: 'Review catatan', tone: 'progress' },
  { column: 'Selesai', title: 'Latihan singkat', tone: 'done' },
];

export default function ProductPreview() {
  return (
    <div className="landing-preview">
      <div className="landing-preview-halo" aria-hidden="true" />

      <div className="landing-preview-window" aria-hidden="true">
        <div className="landing-preview-topbar">
          <div className="landing-preview-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="landing-preview-address">personal-task-manager.app</span>
          <span className="landing-preview-static">Pratinjau statis</span>
        </div>

        <div className="landing-preview-body">
          <aside className="landing-preview-sidebar">
            <div className="landing-preview-brand">
              <span className="landing-preview-brand-mark">MT</span>
              <span className="landing-preview-brand-text">
                <strong>Manajer Tugas</strong>
                <span>Pribadi</span>
              </span>
            </div>

            <nav className="landing-preview-nav-list">
              {PREVIEW_NAV.map((item, index) => (
                <span
                  className={`landing-preview-nav${index === 0 ? ' active' : ''}`}
                  key={item}
                >
                  <span className="landing-preview-nav-dot" />
                  {item}
                </span>
              ))}
            </nav>

            <div className="landing-preview-sidebar-card">
              <span>Fokus hari ini</span>
              <strong>3 tugas</strong>
              <div className="landing-preview-mini-progress">
                <span />
              </div>
            </div>
          </aside>

          <div className="landing-preview-content">
            <div className="landing-preview-content-header">
              <div>
                <span className="landing-preview-eyebrow">Dashboard</span>
                <strong>Selamat datang kembali</strong>
              </div>
              <span className="landing-preview-avatar">A</span>
            </div>

            <div className="landing-preview-stats">
              <div>
                <span>Total tugas</span>
                <strong>12</strong>
                <small>+3 minggu ini</small>
              </div>
              <div>
                <span>Selesai</span>
                <strong>5</strong>
                <small>42% progres</small>
              </div>
              <div>
                <span>Prioritas tinggi</span>
                <strong>3</strong>
                <small>Perlu perhatian</small>
              </div>
            </div>

            <div className="landing-preview-grid">
              <div className="landing-preview-panel">
                <div className="landing-preview-panel-header">
                  <span>Fokus hari ini</span>
                  <span className="landing-preview-link">Lihat semua</span>
                </div>
                <div className="landing-preview-task-list">
                  {PREVIEW_TASKS.map((task) => (
                    <div className="landing-preview-task" key={task.title}>
                      <span className={`landing-preview-check ${task.tone}`} />
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.category}</span>
                      </div>
                      <span className={`landing-preview-status ${task.tone}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="landing-preview-panel landing-preview-kanban-panel">
                <div className="landing-preview-panel-header">
                  <span>Kanban</span>
                  <span className="landing-preview-link">3 kolom</span>
                </div>
                <div className="landing-preview-kanban">
                  {KANBAN_ITEMS.map((item) => (
                    <div className="landing-preview-kanban-column" key={item.column}>
                      <span>{item.column}</span>
                      <div className={`landing-preview-kanban-card ${item.tone}`}>
                        <span />
                        <strong>{item.title}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-preview-float landing-preview-float-progress" aria-hidden="true">
        <span>Progres minggu ini</span>
        <strong>64%</strong>
        <div>
          <span />
        </div>
      </div>

      <div className="landing-preview-float landing-preview-float-task" aria-hidden="true">
        <span className="landing-preview-float-label">Tugas berikutnya</span>
        <strong>Review catatan proyek</strong>
        <span>Hari ini · 14.00</span>
      </div>

      <p className="landing-preview-caption">
        Pratinjau statis antarmuka workspace. Tidak memuat data tugas Anda.
      </p>
    </div>
  );
}
