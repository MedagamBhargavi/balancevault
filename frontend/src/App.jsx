
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={<Home />} />

      {/* Login Page */}
      <Route path="/login" element={<Login />} />

      {/* Registration Page */}
      <Route path="/register" element={<Register />} />

      {/* Dashboard Page */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Redirect unknown routes to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/admin" element={<AdminDashboard />} />  
    </Routes>
  );
}

export default App;
