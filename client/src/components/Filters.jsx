import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../labels.js';
import { DEFAULT_FILTERS } from '../constants.js';
import Button from './ui/Button.jsx';

export default function Filters({ value, onChange, categories, showStatus = true }) {
  function update(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group" style={{ flex: '1 1 260px' }}>
        <input
          type="search"
          className="toolbar-input"
          value={value.search}
          onChange={(event) => update('search', event.target.value)}
          placeholder="Cari judul atau deskripsi..."
          aria-label="Cari tugas"
        />
      </div>

      <div className="toolbar-group">
        <select
          className="toolbar-select"
          value={value.category_id}
          onChange={(event) => update('category_id', event.target.value)}
          aria-label="Filter kategori"
        >
          <option value="all">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
          <option value="none">Tanpa Kategori</option>
        </select>

        {showStatus && (
          <select
            className="toolbar-select"
            value={value.status}
            onChange={(event) => update('status', event.target.value)}
            aria-label="Filter status"
          >
            <option value="all">Semua status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        <select
          className="toolbar-select"
          value={value.priority}
          onChange={(event) => update('priority', event.target.value)}
          aria-label="Filter prioritas"
        >
          <option value="all">Semua prioritas</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          value={value.sort}
          onChange={(event) => update('sort', event.target.value)}
          aria-label="Urutkan tugas"
        >
          <option value="created_desc">Terbaru dibuat</option>
          <option value="deadline_asc">Tenggat terdekat</option>
        </select>

        <Button variant="ghost" size="small" onClick={() => onChange({ ...DEFAULT_FILTERS })}>
          Atur Ulang
        </Button>
      </div>
    </div>
  );
}
