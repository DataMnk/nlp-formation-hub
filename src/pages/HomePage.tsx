import { Link } from "react-router-dom";
import supabase from "../supabase";
import { useSession } from "../context/useSession";

const HomePage = () => {
  const { session } = useSession();
  return (
    <main>
      <div className="home-layout">
        <section className="main-container">
          <h1 className="header-text">Formation Hub</h1>
          <p className="text-muted home-subtitle">
            Current user: {session?.user.email || "None, please sign in or create an account."}
          </p>

          {session && (
            <div className="home-signout-wrap">
              <button
                type="button"
                className="home-signout-btn"
                onClick={() => supabase.auth.signOut()}
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          )}

          <div className="home-actions-grid" role="navigation" aria-label="Quick actions">
            {!session && (
              <Link to="/auth/sign-in" className="home-action-card" tabIndex={0}>
                <span className="home-action-icon" aria-hidden>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </span>
                <span className="home-action-title">Sign In</span>
                <span className="home-action-subtitle">Sign in to your account</span>
              </Link>
            )}
            <Link to="/admin" className="home-action-card" tabIndex={0}>
              <span className="home-action-icon" aria-hidden>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="home-action-title">Admin Dashboard</span>
              <span className="home-action-subtitle">Manage members and letters</span>
            </Link>
            <Link to="/member" className="home-action-card" tabIndex={0}>
              <span className="home-action-icon" aria-hidden>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className="home-action-title">Member Dashboard</span>
              <span className="home-action-subtitle">View letters and progress</span>
            </Link>
            <Link to="/profile" className="home-action-card" tabIndex={0}>
              <span className="home-action-icon" aria-hidden>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="8" r="3" />
                </svg>
              </span>
              <span className="home-action-title">Profile</span>
              <span className="home-action-subtitle">Edit your profile</span>
            </Link>
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
