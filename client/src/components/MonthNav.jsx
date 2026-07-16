export default function MonthNav({ label, onPrev, onNext }) {
  return (
    <div className="month-nav">
      <button onClick={onPrev} aria-label="Previous month">←</button>
      <span className="month-label">{label}</span>
      <button onClick={onNext} aria-label="Next month">→</button>
    </div>
  );
}
