import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <main>
      <section className="main-container">
        <h1 className="header-text">404 Page Not Found</h1>
        <p className="text-muted" style={{ marginBottom: "1rem" }}>This page doesn’t exist.</p>
        <Link to="/">Go back to Home</Link>
      </section>
    </main>
  );
};

export default NotFoundPage;
