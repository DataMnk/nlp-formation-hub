import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import supabase from "../supabase";

type Program = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type Letter = {
  id: string;
  program_id: string;
  month_number: number | null;
  title: string | null;
  content_md: string | null;
};

type MemberRow = {
  id: string;
  email?: string | null;
  display_name: string | null;
  city: string | null;
  long_events_count: number | null;
  short_events_count: number | null;
};

const AdminDashboardPage = () => {
  const { session } = useSession();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [formProgramId, setFormProgramId] = useState("");
  const [formMonth, setFormMonth] = useState<number>(1);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from("programs")
      .select("id, name, description, is_active, created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (!error) setPrograms((data as Program[]) ?? []);
    setProgramsLoading(false);
  };

  const fetchLetters = async () => {
    const { data, error } = await supabase
      .from("letters")
      .select("id, program_id, month_number, title, content_md")
      .order("month_number", { ascending: true });
    if (!error) setLetters((data as Letter[]) ?? []);
    setLettersLoading(false);
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, city, long_events_count, short_events_count")
      .order("display_name", { ascending: true });
    if (!error) setMembers((data as MemberRow[]) ?? []);
    setMembersLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);
  useEffect(() => {
    fetchLetters();
  }, []);
  useEffect(() => {
    fetchMembers();
  }, []);

  const openNewLetter = () => {
    setEditingLetter(null);
    setFormProgramId("");
    setFormMonth(1);
    setFormTitle("");
    setFormContent("");
    setStatus("");
  };

  const openEditLetter = (l: Letter) => {
    setEditingLetter(l);
    setFormProgramId(l.program_id);
    setFormMonth(l.month_number ?? 1);
    setFormTitle(l.title ?? "");
    setFormContent(l.content_md ?? "");
    setStatus("");
  };

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    if (!formProgramId.trim()) {
      setStatus("Please select a program.");
      return;
    }
    setSaving(true);

    const payload = {
      program_id: formProgramId,
      month_number: formMonth,
      title: formTitle.trim() || null,
      content_md: formContent.trim() || null,
    };

    if (editingLetter) {
      const { error } = await supabase.from("letters").update(payload).eq("id", editingLetter.id);
      if (error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus("Letter updated.");
        setEditingLetter(null);
        await fetchLetters();
      }
    } else {
      const { error } = await supabase.from("letters").insert({
        ...payload,
        is_published: true,
      });
      if (error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus("Letter created.");
        setFormProgramId("");
        setFormMonth(1);
        setFormTitle("");
        setFormContent("");
        await fetchLetters();
      }
    }
    setSaving(false);
  };

  const handleDeleteLetter = async (id: string) => {
    setStatus("");
    const { error } = await supabase.from("letters").delete().eq("id", id);
    if (error) setStatus(`Error: ${error.message}`);
    else await fetchLetters();
  };

  return (
    <main>
      <nav className="page-nav">
        <Link className="home-link" to="/">◄ Home</Link>
        <Link to="/profile" className="auth-link">Profile</Link>
      </nav>
      <section className="main-container">
        <h1 className="header-text">Admin Dashboard</h1>
        <p className="text-muted">Current user: {session?.user.email ?? "None"}</p>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">{editingLetter ? "Edit letter" : "New letter"}</h2>
          <form onSubmit={handleSaveLetter}>
            <label>
              Program (required)
              <select
                required
                value={formProgramId}
                onChange={(e) => setFormProgramId(e.target.value)}
              >
                <option value="">— Select program —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {programsLoading && programs.length === 0 && (
              <p className="text-muted" style={{ marginBottom: "0.5rem" }}>Loading programs...</p>
            )}
            <label>
              Month number
              <input
                type="number"
                min={1}
                value={formMonth}
                onChange={(e) => setFormMonth(parseInt(e.target.value, 10) || 1)}
              />
            </label>
            <label>
              Title
              <input
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </label>
            <label>
              Markdown content
              <textarea
                placeholder="Markdown content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
              />
            </label>
            <div className="dashboard-actions">
              <button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingLetter ? "Update" : "Create"}
              </button>
              {editingLetter && (
                <button type="button" onClick={openNewLetter} className="btn-ghost">
                  Cancel
                </button>
              )}
            </div>
          </form>
          {status && (
            <p className={status.startsWith("Error") ? "status-error" : "status-success"}>{status}</p>
          )}
        </div>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">Letters</h2>
          {lettersLoading ? (
            <p className="text-muted">Loading…</p>
          ) : letters.length === 0 ? (
            <p className="text-muted">No letters yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {letters.map((l) => (
                <li key={l.id} className="list-card">
                  <span className="text-muted" style={{ flex: "1 1 200px" }}>
                    {programs.find((p) => p.id === l.program_id)?.name ?? l.program_id} — {l.title ?? "(untitled)"} — Month {l.month_number ?? "—"}
                  </span>
                  <div className="list-card-actions">
                    <button type="button" onClick={() => openEditLetter(l)}>Edit</button>
                    <button type="button" onClick={() => handleDeleteLetter(l.id)} className="btn-danger">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">Members</h2>
          {membersLoading ? (
            <p className="text-muted">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-muted">No members yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>City</th>
                    <th>Long</th>
                    <th>Short</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>{m.email ?? m.display_name ?? "—"}</td>
                      <td>{m.city ?? "—"}</td>
                      <td>{m.long_events_count ?? "—"}</td>
                      <td>{m.short_events_count ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">Progress</h2>
          <p className="text-muted">Progress overview coming soon.</p>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboardPage;
