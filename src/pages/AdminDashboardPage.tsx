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
      <Link className="home-link" to="/">
        ◄ Home
      </Link>
      <Link to="/profile" className="auth-link" style={{ marginBottom: 8 }}>
        Profile
      </Link>
      <section className="main-container">
        <h1 className="header-text">Admin Dashboard</h1>
        <p>Current User: {session?.user.email ?? "None"}</p>

        <div id="divider"></div>

        {/* Create / edit letter */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>
            {editingLetter ? "Edit letter" : "New letter"}
          </h2>
          <form onSubmit={handleSaveLetter} style={{ width: "100%" }}>
            <label style={{ display: "block", marginBottom: 8 }}>
              Program (required)
              <select
                required
                value={formProgramId}
                onChange={(e) => setFormProgramId(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 7,
                  padding: 10,
                  borderRadius: 4,
                  background: "#3a3a3a",
                  border: "1px solid #4a4a4a",
                  color: "white",
                  fontSize: "1rem",
                }}
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
              <p style={{ opacity: 0.8, marginBottom: 8 }}>Loading programs...</p>
            )}
            <label style={{ display: "block", marginBottom: 8 }}>
              Month number
              <input
                type="number"
                min={1}
                value={formMonth}
                onChange={(e) => setFormMonth(parseInt(e.target.value, 10) || 1)}
                style={{ width: "100%", marginTop: 7, marginBottom: 0 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              Title
              <input
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={{ width: "100%", marginTop: 7, marginBottom: 0 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              Markdown content
              <textarea
              placeholder="Markdown content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  marginTop: 7,
                  marginBottom: 0,
                  padding: 10,
                  borderRadius: 4,
                  background: "#3a3a3a",
                  border: "1px solid #4a4a4a",
                  color: "white",
                  fontFamily: "inherit",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingLetter ? "Update" : "Create"}
              </button>
              {editingLetter && (
                <button
                  type="button"
                  onClick={openNewLetter}
                  style={{ background: "transparent", color: "#3ecf8e", border: "1px solid #3ecf8e" }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          {status && (
            <p style={{ marginTop: 8, color: status.startsWith("Error") ? "#ff6b6b" : "#3ecf8e", fontSize: "0.9rem" }}>
              {status}
            </p>
          )}
        </div>

        <div id="divider"></div>

        {/* List of letters */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Letters</h2>
          {lettersLoading ? (
            <p style={{ opacity: 0.8 }}>Loading...</p>
          ) : letters.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No letters yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {letters.map((l) => (
                <li
                  key={l.id}
                  style={{
                    padding: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span>
                    {programs.find((p) => p.id === l.program_id)?.name ?? l.program_id} — {l.title ?? "(untitled)"} — Month {l.month_number ?? "—"}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openEditLetter(l)}
                      style={{ width: "auto", padding: "6px 12px" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLetter(l.id)}
                      style={{ width: "auto", padding: "6px 12px", background: "#8b2a2a", borderColor: "#a33" }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="divider"></div>

        {/* Members list */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Members</h2>
          {membersLoading ? (
            <p style={{ opacity: 0.8 }}>Loading...</p>
          ) : members.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No members yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", textAlign: "left" }}>
                    <th style={{ padding: "8px 4px" }}>Email</th>
                    <th style={{ padding: "8px 4px" }}>City</th>
                    <th style={{ padding: "8px 4px" }}>Long</th>
                    <th style={{ padding: "8px 4px" }}>Short</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <td style={{ padding: "8px 4px" }}>{m.email ?? m.display_name ?? "—"}</td>
                      <td style={{ padding: "8px 4px" }}>{m.city ?? "—"}</td>
                      <td style={{ padding: "8px 4px" }}>{m.long_events_count ?? "—"}</td>
                      <td style={{ padding: "8px 4px" }}>{m.short_events_count ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="divider"></div>

        {/* Progress placeholder */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Progress</h2>
          <p style={{ opacity: 0.8 }}>Progress overview coming soon.</p>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboardPage;
