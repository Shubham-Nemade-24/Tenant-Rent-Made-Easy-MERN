import { useState, useEffect } from "react";

export default function Toast({ message, type = "success", onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDone) onDone();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="toast-container">
      <div className={`toast ${type}`}>
        <span>{type === "success" ? "✓" : "✕"}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
