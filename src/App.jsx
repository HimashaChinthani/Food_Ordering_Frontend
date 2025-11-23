import React, { useState } from "react";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";

function App() {
  const [page, setPage] = useState("login");

  return page === "login" ? (
    <Login onSwitchToRegister={() => setPage("register")} />
  ) : (
    <Register onSwitchToLogin={() => setPage("login")} />
  );
}

export default App;
