import { Navigate, Route, Routes } from "react-router-dom";
import { PROBLEMS } from "./problems.js";
import { Home } from "./Home.jsx";
import { Sim } from "./Sim.jsx";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {Object.keys(PROBLEMS).map((id) => (
        <Route key={id} path={`/${id}`} element={<Sim id={id} />} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
