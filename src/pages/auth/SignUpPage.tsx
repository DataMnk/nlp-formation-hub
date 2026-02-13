import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";

const SignUpPage = () => {
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
    setStatus("Creating account...");
    const { error } = await supabase.auth.signUp({
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
        <h1 className="header-text">Sign Up</h1>
        <p className="text-muted" style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          Don't have an account? Sign up for a new account.
        </p>

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

        <button type="submit">Create account</button>
        <Link className="auth-link" to="/auth/sign-in" style={{ display: "block", marginTop: "1rem" }}>
          Already have an account? Sign in
        </Link>
        {status && <p className="text-muted" style={{ marginTop: "1rem" }}>{status}</p>}
      </form>
    </main>
  );
};

export default SignUpPage;
