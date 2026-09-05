export default function Select({ value, onChange, options, placeholder = 'All', className = '' }) {
  return (
    <select
      className={`input ${className}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
