import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/useSession";
import supabase from "../../supabase";

const SignInPage = () => {
  const { session } = useSession();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  if (session) return <Navigate to="/" />;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setStatus("Logging in...");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formValues.email,
      password: formValues.password,
    });
    if (signInError) {
      setError(signInError.message);
      setStatus("");
      return;
    }
    setStatus("");
  };

  return (
    <main>
      <Link className="home-link" to="/">
        ◄ Home
      </Link>
      <form className="main-container" onSubmit={handleSubmit}>
        <h1 className="header-text">Sign In</h1>
        <div className="section-block">
          <label>
            Email
            <input
              name="email"
              onChange={handleInputChange}
              type="email"
              placeholder="you@example.com"
              value={formValues.email}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              onChange={handleInputChange}
              type="password"
              placeholder="••••••••"
              value={formValues.password}
            />
          </label>
        </div>
        <button type="submit" disabled={status === "Logging in..."}>
          {status === "Logging in..." ? "Logging in..." : "Sign in"}
        </button>
        <Link className="auth-link" to="/auth/sign-up" style={{ display: "block", marginTop: "1rem" }}>
          Don&apos;t have an account? Sign up
        </Link>
        {error && (
          <p style={{ marginTop: "1rem", color: "crimson", textAlign: "center" }}>{error}</p>
        )}
      </form>
    </main>
  );
};

export default SignInPage;
