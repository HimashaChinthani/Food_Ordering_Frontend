import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./LoginPage.css";

const LoginPage = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const loginData = { email, password };

    try {
      const response = await fetch("http://localhost:8080/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const user = await response.json();
      console.log("Logged in user:", user);
      // Optional: save user to localStorage
      localStorage.setItem("user", JSON.stringify(user));

      // Navigate to home page after successful login
      navigate('/home');

    } catch (error) {
      console.error(error);
      alert("Login failed: Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Left Image */}
        <div className="login-image">
          <img
            src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80"
            alt="food"
          />
        </div>

        {/* Right Side Form */}
        <div className="login-form">
          <h2>Foodie Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          <p>
            Don’t have an account?{" "}
            <span
              className="link"
              onClick={() => onSwitchToRegister && onSwitchToRegister()}
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
