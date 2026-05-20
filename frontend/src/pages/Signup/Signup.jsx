"use client"

import { useCallback, useEffect, useState } from "react"
import { Card } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import API_URL from "../../utils/apiConfig"
import "./Signup.css"

const Signup = (props) => {
  const [credentials, setCredentials] = useState({ name: "", email: "", password: "", cpassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const navigate = useNavigate()

  const { showAlert } = props

  const memoizedShowAlert = useCallback(() => {
    showAlert?.("This user Exists! (Please try with another)", "info")
  }, [showAlert])

  // Check login status only once when the component mounts
  useEffect(() => {
    const token = sessionStorage.getItem("auth-token")
    if (token) {
      setTimeout(() => {
        memoizedShowAlert()
      }, 100)
      navigate("/dashboard")
    }
  }, []) // Empty dependency array ensures it runs only once

  //  Password confirmation logic
  useEffect(() => {
    setPasswordMatch(credentials.password === credentials.cpassword)
  }, [credentials.password, credentials.cpassword])

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const form = e.target.form
      const index = Array.from(form).indexOf(e.target)
      if (form[index + 1]) {
        form[index + 1].focus()
      } else {
        form.requestSubmit()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, email, password } = credentials
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })
    const json = await response.json()
    // console.log(json)

    if (json.success) {
      sessionStorage.setItem("auth-token", json.authToken)
      showAlert("Account created Successfully", "success")
      navigate("/dashboard")
    } else {
      showAlert("Invalid details", "danger")
    }
  }

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value })
  }

  const isFormValid =
    credentials.name &&
    credentials.email &&
    credentials.password &&
    credentials.cpassword &&
    passwordMatch &&
    credentials.password.length >= 5

  return (
    <div className="signup-container">
      {/* Back Button */}
      <Link to="/" className="signup-back-button">
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

      <div className="signup-content-container">
        <div className="signup-card-wrapper">
          <Card className="signup-card">
            <div className="signup-title-container">
              <h1 className="signup-title">Mr.Travis</h1>
            </div>
            <div className="signup-form-container">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control signup-input-field"
                    value={credentials.name}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    id="name"
                    name="name"
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control signup-input-field"
                    value={credentials.email}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    id="email"
                    name="email"
                    placeholder="Email"
                    required
                  />
                  <div className="signup-helper-text" id="emailHelp">
                    We'll never share your email with anyone else.
                  </div>
                </div>
                <div className="mb-3">
                  <div className="signup-password-input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control signup-input-field"
                      value={credentials.password}
                      onChange={onChange}
                      onKeyDown={handleKeyDown}
                      name="password"
                      id="password"
                      placeholder="Password (min 5 characters)"
                      required
                      minLength="5"
                    />
                    <span
                      className="signup-password-toggle"
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
                <div className="mb-3">
                  <input
                    type="password"
                    className={`form-control signup-input-field ${!passwordMatch && credentials.cpassword ? "is-invalid" : ""}`}
                    value={credentials.cpassword}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    name="cpassword"
                    id="cpassword"
                    placeholder="Confirm Password"
                    required
                  />
                  {!passwordMatch && credentials.cpassword && (
                    <div className="signup-error-feedback">Passwords do not match</div>
                  )}
                </div>
                <div className="mt-3">
                  <button type="submit" className="signup-button" disabled={!isFormValid}>
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </Card>
          <div className="signup-account-link-container">
            <p className="signup-account-link">
              Already have an account?{" "}
              <Link to="/login" className="signup-link">
                Log in
              </Link>
            </p>
            <p className="signup-account-link">
              Go back to{" "}
              <Link to="/" className="signup-link">
                Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup;