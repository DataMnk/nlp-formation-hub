import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";

const SignInPage = () => {
  const { session } = useSession();
  if (session) return <Navigate to="/" />;

  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Logging in...");
    const { error } = await supabase.auth.signInWithPassword({
      email: formValues.email,
      password: formValues.password,
    });
    if (error) {
      alert(error.message);
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

        <button type="submit">Sign in</button>
        <Link className="auth-link" to="/auth/sign-up" style={{ display: "block", marginTop: "1rem" }}>
          Don&apos;t have an account? Sign up
        </Link>
        {status && <p className="text-muted" style={{ marginTop: "1rem" }}>{status}</p>}
      </form>
    </main>
  );
};

export default SignInPage;
