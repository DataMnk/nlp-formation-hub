/*import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const ProtectedPage = () => {
  const { session } = useSession();
  return (
    <main>
      <Link className="home-link" to="/">
        ◄ Home
      </Link>
      <section className="main-container">
        <h1 className="header-text">This is a Protected Page</h1>
        <p>Current User : {session?.user.email || "None"}</p>
      </section>
    </main>
  );
};

export default ProtectedPage;*/

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import supabase from "../supabase";

type Note = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  created_at: string | null;
};

const ProtectedPage = () => {
  const { session } = useSession();

  const userId = useMemo(() => session?.user.id ?? null, [session]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fetchNotes = async () => {
    setIsLoading(true);
    setStatus("");

    const { data, error } = await supabase
      .from("notes")
      .select("id,user_id,title,content,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(`Error loading notes: ${error.message}`);
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setNotes((data ?? []) as Note[]);
    setIsLoading(false);
  };

  useEffect(() => {
    // solo intenta si hay sesión
    if (!userId) return;
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");

    if (!userId) {
      setStatus("No session. Please sign in.");
      return;
    }

    if (!title.trim()) {
      setStatus("Title is required.");
      return;
    }

    const { error } = await supabase.from("notes").insert({
      user_id: userId,
      title: title.trim(),
      content: content.trim() || null,
    });

    if (error) {
      setStatus(`Error creating note: ${error.message}`);
      return;
    }

    setTitle("");
    setContent("");
    await fetchNotes();
  };

  const handleDelete = async (id: string) => {
    setStatus("");
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      setStatus(`Error deleting note: ${error.message}`);
      return;
    }

    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <main>
      <Link className="home-link" to="/">
        ◄ Home
      </Link>

      <section className="main-container">
        <h1 className="header-text">Protected Notes</h1>
        <p>Current User : {session?.user.email || "None"}</p>

        <div id="divider"></div>

        <form onSubmit={handleCreateNote} style={{ width: "100%" }}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <textarea
            placeholder="Content (optional)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <button type="submit">Add Note</button>
        </form>

        {status ? (
          <p style={{ marginTop: 12, opacity: 0.9 }}>{status}</p>
        ) : null}

        <div id="divider"></div>

        {isLoading ? (
          <p>Loading notes...</p>
        ) : notes.length === 0 ? (
          <p>No notes yet. Add your first one above.</p>
        ) : (
          <div style={{ width: "100%", display: "grid", gap: 12 }}>
            {notes.map((n) => (
              <div
                key={n.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{n.title ?? "(untitled)"}</strong>
                  <button onClick={() => handleDelete(n.id)}>Delete</button>
                </div>

                {n.content ? (
                  <p style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{n.content}</p>
                ) : null}

                <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProtectedPage;

