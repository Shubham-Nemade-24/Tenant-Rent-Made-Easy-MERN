import { useState, useEffect, useCallback } from "react";
import { isAuthenticated, clearToken, fetchMonth } from "./api";
import { currentMonthKey, shiftMonth } from "./helpers";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RecordPayment from "./pages/RecordPayment";
import Electricity from "./pages/Electricity";
import TenantDetails from "./pages/TenantDetails";
import BottomNav from "./components/BottomNav";

import "./index.css";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [tab, setTab] = useState("dashboard");
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMonth = useCallback(async (key) => {
    setLoading(true);
    try {
      const result = await fetchMonth(key);
      setData(result);
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        setAuthed(false);
      }
      console.error("Failed to load month:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data whenever month changes
  useEffect(() => {
    if (authed) loadMonth(monthKey);
  }, [authed, monthKey, loadMonth]);

  function handlePrev() {
    setMonthKey((k) => shiftMonth(k, -1));
  }

  function handleNext() {
    setMonthKey((k) => shiftMonth(k, 1));
  }

  function handleRefresh() {
    loadMonth(monthKey);
  }

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <>
      <div className="app-container">
        {tab === "dashboard" && (
          <Dashboard
            monthKey={monthKey}
            data={data}
            loading={loading}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
        {tab === "payment" && (
          <RecordPayment
            monthKey={monthKey}
            data={data}
            onPrev={handlePrev}
            onNext={handleNext}
            onRefresh={handleRefresh}
          />
        )}
        {tab === "electric" && (
          <Electricity
            monthKey={monthKey}
            data={data}
            onPrev={handlePrev}
            onNext={handleNext}
            onRefresh={handleRefresh}
          />
        )}
        {tab === "tenant" && (
          <TenantDetails
            monthKey={monthKey}
            data={data}
            onPrev={handlePrev}
            onNext={handleNext}
            onRefresh={handleRefresh}
          />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </>
  );
}
