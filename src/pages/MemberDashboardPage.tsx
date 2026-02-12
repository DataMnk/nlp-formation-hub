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

    const res = await sendRagChatMessage(q, chatProgramId, session.access_token);
    setChatSending(false);

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
        <h1 className="header-text">My Formation</h1>

        {/* Profile summary card */}
        <div
          style={{
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: 14,
            marginTop: 12,
          }}
        >
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Profile</h2>
          {profileLoading ? (
            <p style={{ opacity: 0.8 }}>Loading...</p>
          ) : (
            <p>
              {profile?.display_name || "—"}, {profile?.city || "—"}
            </p>
          )}
        </div>

        <div id="divider"></div>

        {/* Program info placeholder */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Program</h2>
          <p style={{ opacity: 0.8 }}>Program details will appear here.</p>
        </div>

        <div id="divider"></div>

        {/* Letters list (read-only) */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Letters</h2>
          {lettersLoading ? (
            <p style={{ opacity: 0.8 }}>Loading letters...</p>
          ) : letters.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No letters yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {letters.map((l) => (
                <li
                  key={l.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {l.title ?? "(untitled)"} — Month {l.month_number ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="divider"></div>

        {/* RAG Chat — frontend state only, no persistence */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Ask about the letters</h2>
          {!programsLoading && programs.length > 0 && (
            <>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.9rem" }}>
                Program
                <select
                  value={chatProgramId}
                  onChange={(e) => setChatProgramId(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    borderRadius: 4,
                    background: "#3a3a3a",
                    border: "1px solid #4a4a4a",
                    color: "white",
                  }}
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div
                style={{
                  maxHeight: 280,
                  overflowY: "auto",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                  marginBottom: 8,
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {chatMessages.length === 0 && (
                  <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
                    Ask a question about the formation letters. Answers are based only on letter content.
                  </p>
                )}
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 12,
                      textAlign: m.role === "user" ? "right" : "left",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: 8,
                        maxWidth: "85%",
                        background: m.role === "user" ? "rgba(62,207,142,0.2)" : "rgba(255,255,255,0.08)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.95rem",
                      }}
                    >
                      {m.content}
                    </span>
                    {m.role === "assistant" && m.letter_titles?.length ? (
                      <p style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                        Based on: {m.letter_titles.join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
                {chatSending && (
                  <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>…</p>
                )}
              </div>
              {chatError && (
                <p style={{ color: "#ff6b6b", fontSize: "0.85rem", marginBottom: 8 }}>{chatError}</p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Your question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                  disabled={chatSending}
                  style={{ flex: 1, marginTop: 0 }}
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  disabled={chatSending || !chatInput.trim()}
                  style={{ width: "auto", minWidth: 80 }}
                >
                  {chatSending ? "…" : "Send"}
                </button>
              </div>
            </>
          )}
          {!programsLoading && programs.length === 0 && (
            <p style={{ opacity: 0.8 }}>No active program. Ask your admin to assign one.</p>
          )}
        </div>

        <div id="divider"></div>

        {/* Progress placeholder */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Progress</h2>
          <p style={{ opacity: 0.8 }}>Progress tracking coming soon.</p>
        </div>
      </section>
    </main>
  );
};

export default MemberDashboardPage;
