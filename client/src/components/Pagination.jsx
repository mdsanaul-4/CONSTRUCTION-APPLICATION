import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-ink-600">
      <span>
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          className="btn btn-secondary px-2 py-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn btn-secondary px-2 py-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
