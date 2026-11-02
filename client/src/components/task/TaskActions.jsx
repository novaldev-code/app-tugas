import Button from '../ui/Button.jsx';

export default function TaskActions({ onEdit, onDelete }) {
  return (
    <div className="task-card-actions">
      <Button variant="secondary" size="small" onClick={onEdit}>
        Ubah
      </Button>
      <Button variant="danger-ghost" size="small" onClick={onDelete}>
        Hapus
      </Button>
    </div>
  );
}
