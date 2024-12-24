import React from 'react';
import './Login.css';
import assets from '../assets/assets';

const Login = () => {
  return (
    <div className="login-container">

      <div className="left-section">
        <img src={assets.loginImage} alt="Login Page Image" />
      </div>

      <div className="right-section">
        <h1>Legal Compliance, Simplified</h1>
        <h2>Welcome</h2>
        <form>
          <div className="form-group">
            <input type="email" placeholder="Email" required />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Password" required />
          </div>
          <div className="forgot-password">
            <a href="#">Forgot password?</a>
          </div>
          <button type="submit" className="login-button">Log in</button>

          <div className="login-options">
            <hr />
            <span>Or</span>
            <button className="login-option google">Google</button>
            <button className="login-option gitlab">GitLab</button>
          </div>
        </form>

        <div className="register-link">
          <p>Have no account yet? <a href="#">Registration</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
