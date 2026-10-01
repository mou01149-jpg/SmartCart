function Login() {
  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Welcome Back</h1>

        <p>Login to your SmartCart account</p>

        <input
          type="email"
          placeholder="Email"
        />

        <input
          type="password"
          placeholder="Password"
        />

        <button>
          Login
        </button>

      </div>

    </div>
  );
}

export default Login;