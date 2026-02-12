import { Link } from "react-router-dom";
import supabase from "../supabase";
import { useSession } from "../context/SessionContext";

const HomePage = () => {
  const { session } = useSession();
  return (
    <main>
      <div className="home-layout">
        <section className="main-container">
          <h1 className="header-text">React Supabase Auth Template</h1>
          <p className="text-muted home-subtitle">
            Current user: {session?.user.email || "None"}
          </p>

          <div className="dashboard-actions">
            {session ? (
              <button type="button" onClick={() => supabase.auth.signOut()}>
                Sign Out
              </button>
            ) : (
              <Link to="/auth/sign-in">Sign In</Link>
            )}
            <Link to="/admin">Admin Dashboard</Link>
            <Link to="/member">Member Dashboard</Link>
            <Link to="/profile">Profile</Link>
          </div>

          <div id="divider" />

          <Link
            to="https://github.com/datamnk/protected-notes-supabase"
            target="_blank"
            rel="noreferrer noopener"
            id="github-repo-link"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="24"
              height="24"
              viewBox="0 0 64 64"
            >
              <path d="M32 6C17.641 6 6 17.641 6 32c0 12.277 8.512 22.56 19.955 25.286-.592-.141-1.179-.299-1.755-.479V50.85c0 0-.975.325-2.275.325-3.637 0-5.148-3.245-5.525-4.875-.229-.993-.827-1.934-1.469-2.509-.767-.684-1.126-.686-1.131-.92-.01-.491.658-.471.975-.471 1.625 0 2.857 1.729 3.429 2.623 1.417 2.207 2.938 2.577 3.721 2.577.975 0 1.817-.146 2.397-.426.268-1.888 1.108-3.57 2.478-4.774-6.097-1.219-10.4-4.716-10.4-10.4 0-2.928 1.175-5.619 3.133-7.792C19.333 23.641 19 22.494 19 20.625c0-1.235.086-2.751.65-4.225 0 0 3.708.026 7.205 3.338C28.469 19.268 30.196 19 32 19s3.531.268 5.145.738c3.497-3.312 7.205-3.338 7.205-3.338.567 1.474.65 2.99.65 4.225 0 2.015-.268 3.19-.432 3.697C46.466 26.475 47.6 29.124 47.6 32c0 5.684-4.303 9.181-10.4 10.4 1.628 1.43 2.6 3.513 2.6 5.85v8.557c-.576.181-1.162.338-1.755.479C49.488 54.56 58 44.277 58 32 58 17.641 46.359 6 32 6z" />
            </svg>
            Star on GitHub
          </Link>
        </section>
      </div>
    </main>
  );
};

export default HomePage;
