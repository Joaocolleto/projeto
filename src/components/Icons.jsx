const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const EditIcon = (p) => (
  <svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
export const BackIcon = (p) => (
  <svg {...base} width={24} height={24} {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
);
export const PlusIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const TrashIcon = (p) => (
  <svg {...base} width={18} height={18} {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
);
