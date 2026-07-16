import { useState } from "react";
import { login } from "../api";

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err.message || "Incorrect password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon">🏠</div>
        <h1 className="login-title">Rental Rooms</h1>
        <p className="login-subtitle">Private rental ledger</p>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            App password
          </label>
          <input
            id="password"
            className="form-input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div style={{
            color: "var(--status-unpaid)",
            fontSize: "var(--font-sm)",
            marginBottom: "var(--space-lg)",
            textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Opening…" : "Open ledger"}
        </button>
      </form>
    </div>
  );
}
