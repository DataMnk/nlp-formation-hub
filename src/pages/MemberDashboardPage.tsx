import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import supabase from "../supabase";
import { sendRagChatMessage } from "../services/ragChat";

type ProfileSummary = {
  display_name: string | null;
  city: string | null;
  program_id: string | null;
};

type LetterRow = {
  id: string;
  title: string | null;
  month_number: number | null;
};

type ProgramOption = {
  id: string;
  name: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  letter_titles?: string[];
};

const MemberDashboardPage = () => {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [programsLoading, setProgramsLoading] = useState(true);

  const [chatProgramId, setChatProgramId] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, city, program_id")
        .eq("id", userId)
        .maybeSingle();
      setProfile(data ?? null);
      if (data?.program_id) setChatProgramId((prev) => prev || data.program_id);
      setProfileLoading(false);
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data } = await supabase
        .from("programs")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (data?.length) {
        setPrograms((data as ProgramOption[]) ?? []);
        setChatProgramId((prev) => prev || (data[0] as ProgramOption).id);
      }
      setProgramsLoading(false);
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    const fetchLetters = async () => {
      const { data, error } = await supabase
        .from("letters")
        .select("id, title, month_number")
        .order("month_number", { ascending: true });
      if (!error) setLetters((data as LetterRow[]) ?? []);
      setLettersLoading(false);
    };
    fetchLetters();
  }, []);

  const handleSendChat = async () => {
    const q = chatInput.trim();
    if (!q || !chatProgramId || !session?.access_token) return;
    setChatError(null);
    setChatMessages((prev) => [...prev, { role: "user", content: q }]);
    setChatInput("");
    setChatSending(true);

    try {
      const res = await sendRagChatMessage(q, chatProgramId, session.access_token);

      if (res.success && res.message !== undefined) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.message ?? "",
            letter_titles: res.letter_titles,
          },
        ]);
      } else {
        setChatError(res.message ?? res.error ?? "Error sending message");
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.message ?? res.error ?? "Sorry, something went wrong.",
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Hubo un error al procesar tu pregunta, intenta de nuevo",
        },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  return (
    <main>
      <nav className="page-nav">
        <Link className="home-link" to="/">◄ Home</Link>
        <Link to="/profile" className="auth-link">Profile</Link>
      </nav>
      <section className="main-container">
        <h1 className="header-text">My Formation</h1>

        <div className="section-block">
          <h2 className="section-title">Profile</h2>
          <div className="card">
            {profileLoading ? (
              <p className="text-muted">Loading…</p>
            ) : (
              <p>
                {profile?.display_name || "—"}, {profile?.city || "—"}
              </p>
            )}
          </div>
        </div>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">Program</h2>
          <p className="text-muted">Program details will appear here.</p>
        </div>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">Letters</h2>
          {lettersLoading ? (
            <p className="text-muted">Loading letters…</p>
          ) : letters.length === 0 ? (
            <p className="text-muted">No letters yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {letters.map((l) => (
                <li key={l.id} className="list-card" style={{ justifyContent: "flex-start" }}>
                  {l.title ?? "(untitled)"} — Month {l.month_number ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">Ask about the letters</h2>
          {!programsLoading && programs.length > 0 && (
            <>
              <label>
                Program
                <select
                  value={chatProgramId}
                  onChange={(e) => setChatProgramId(e.target.value)}
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="chat-messages">
                {chatMessages.length === 0 && (
                  <p className="text-muted">
                    Ask a question about the formation letters. Answers are based only on letter content.
                  </p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <span className={`chat-bubble ${m.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
                      {m.content}
                    </span>
                    {m.role === "assistant" && m.letter_titles?.length ? (
                      <p className="chat-meta">Based on: {m.letter_titles.join(", ")}</p>
                    ) : null}
                  </div>
                ))}
                {chatSending && <p className="text-muted">…</p>}
              </div>
              {chatError && <p className="status-error">{chatError}</p>}
              <div className="chat-input-row">
                <input
                  type="text"
                  placeholder="Your question…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                  disabled={chatSending}
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  disabled={chatSending || !chatInput.trim()}
                >
                  {chatSending ? "…" : "Send"}
                </button>
              </div>
            </>
          )}
          {!programsLoading && programs.length === 0 && (
            <p className="text-muted">No active program. Ask your admin to assign one.</p>
          )}
        </div>

        <div id="divider" />

        <div className="section-block">
          <h2 className="section-title">Progress</h2>
          <p className="text-muted">Progress tracking coming soon.</p>
        </div>
      </section>
    </main>
  );
};

export default MemberDashboardPage;
