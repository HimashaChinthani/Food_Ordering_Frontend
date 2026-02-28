import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./RegisterPage.css";

const RegisterPage = ({ onSwitchToLogin }) => {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const registrationData = {
      role: role.toUpperCase(),   // 🚀 FIXED
      ...form,
    };

    try {
      const response = await fetch("http://localhost:8080/api/v1/adduser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      alert("Registration Successful!");
      console.log("Saved User:", data);

      if (onSwitchToLogin) onSwitchToLogin();
    } catch (err) {
      console.error(err);
      alert("Error registering user");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-form">
          <h2>Register</h2>

          <div className="role-selection">
            <label>
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === "user"}
                onChange={(e) => setRole(e.target.value)}
              />
              User
            </label>

            <label>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === "admin"}
                onChange={(e) => setRole(e.target.value)}
              />
              Admin
            </label>
          </div>

          <form onSubmit={handleRegister}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="phoneNumber"
              placeholder="Phone Number"
              value={form.phoneNumber}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              required
            />

            <button type="submit">Register</button>
          </form>

          <p>
            Already have an account?{" "}
            <Link to="/login" className="link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
