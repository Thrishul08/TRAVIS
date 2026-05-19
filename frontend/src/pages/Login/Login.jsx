"use client"

import { useCallback, useEffect, useState } from "react"
import { Card } from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import API_URL from "../../utils/apiConfig"
import "./Login.css"

const Login = (props) => {
  const location = useLocation()
  const message = location.state?.message

  const [credentials, setCredentials] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [checkedLogin, setCheckedLogin] = useState(false) // Track first check
  const navigate = useNavigate()

  const { showAlert } = props

  const memoizedShowAlert = useCallback(() => {
    showAlert?.("Already Logged-in! (Logout to switch account)", "info")
  }, [showAlert])

  // Check login only when the component mounts
  useEffect(() => {
    const token = sessionStorage.getItem("auth-token")

    if (token && !checkedLogin) {
      setCheckedLogin(true)
      setTimeout(() => {
        memoizedShowAlert()
      }, 100)
      navigate("/dashboard")
    }
  }, []) // Empty dependency array ensures this runs only once

  const handleSubmit = async (e) => {
    e.preventDefault()
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    })
    const json = await response.json()
    console.log(json)

    if (json.success) {
      sessionStorage.setItem("auth-token", json.authToken)
      showAlert("Logged-in Successfully", "success")
      navigate("/dashboard")
    } else {
      showAlert("Invalid credentials", "danger")
    }
  }

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value })
  }

  const isFormValid = credentials.email && credentials.password

  return (
    <div className="login-container">
      {/* Back Button */}
      <Link to="/" className="login-back-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </Link>

      <div className="login-content-container">
        <div className="login-card-wrapper">
          <Card className="login-card">
            <div className="login-title-container">
              <h1 className="login-title">Mr.Travis</h1>
            </div>
            <div className="login-form-container">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <div className="input-group">
                    <input
                      type="email"
                      className="form-control login-input-field"
                      value={credentials.email}
                      onChange={onChange}
                      id="email"
                      name="email"
                      aria-describedby="emailHelp"
                      placeholder="Email"
                      required
                    />
                  </div>
                  <div className="login-helper-text" id="emailHelp">
                    We'll never share your email with anyone else.
                  </div>
                </div>
                <div className="mb-3">
                  <div className="login-password-input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control login-input-field"
                      value={credentials.password}
                      onChange={onChange}
                      name="password"
                      id="password"
                      placeholder="Password"
                      required
                    />
                    <span
                      className="login-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <button type="submit" className="login-button" disabled={!isFormValid}>
                    Login
                  </button>
                </div>
              </form>
            </div>
            {message && (
              <div className="login-message-container">
                <p className="login-error-message">{message}</p>
              </div>
            )}
          </Card>
          <div className="login-account-link-container">
            <p className="login-account-link">
              Don't have an account?{" "}
              <Link to="/signup" className="login-link">
                Sign up
              </Link>
            </p>
            <p className="login-account-link">
              Go back to{" "}
              <Link to="/" className="login-link">
                Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login;