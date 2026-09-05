import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        className="input pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
