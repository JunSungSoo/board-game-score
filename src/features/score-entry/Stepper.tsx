export function Stepper({ value, min = -Infinity, max = Infinity, step = 1, onChange, label }: { value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void; label?: string }) {
  return <div className="stepper"><button type="button" aria-label={`${label ?? ''} 감소`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button><div className="val">{value}</div><button type="button" aria-label={`${label ?? ''} 증가`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button></div>;
}

