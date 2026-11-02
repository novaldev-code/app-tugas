import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../labels.js';
import { DEFAULT_FILTERS } from '../constants.js';

export default function Filters({ value, onChange, categories, showStatus = true }) {
  function update(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <div className="filters">
      <label className="field search-field">
        <span>Cari</span>
        <input
          type="search"
          value={value.search}
          onChange={(event) => update('search', event.target.value)}
          placeholder="Cari judul atau deskripsi..."
        />
      </label>

      <label className="field">
        <span>Kategori</span>
        <select
          value={value.category_id}
          onChange={(event) => update('category_id', event.target.value)}
        >
          <option value="all">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
          <option value="none">Tanpa Kategori</option>
        </select>
      </label>

      {showStatus && (
        <label className="field">
          <span>Status</span>
          <select
            value={value.status}
            onChange={(event) => update('status', event.target.value)}
          >
            <option value="all">Semua status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>Prioritas</span>
        <select
          value={value.priority}
          onChange={(event) => update('priority', event.target.value)}
        >
          <option value="all">Semua prioritas</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Urutkan</span>
        <select
          value={value.sort}
          onChange={(event) => update('sort', event.target.value)}
        >
          <option value="created_desc">Terbaru dibuat</option>
          <option value="deadline_asc">Tenggat terdekat</option>
        </select>
      </label>

      <button
        type="button"
        className="button ghost reset-filters"
        onClick={() => onChange({ ...DEFAULT_FILTERS })}
      >
        Atur Ulang
      </button>
    </div>
  );
}
