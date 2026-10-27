import { Search } from 'lucide-react';

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg
          placeholder:text-slate-400 text-slate-700
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-colors"
        aria-label={placeholder}
      />
    </div>
  );
}
