import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import supabase from "../supabase";

type ProfileForm = {
  display_name: string;
  phone: string;
  city: string;
  long_events_count: number;
  short_events_count: number;
};

const defaultForm: ProfileForm = {
  display_name: "",
  phone: "",
  city: "",
  long_events_count: 0,
  short_events_count: 0,
};

const ProfilePage = () => {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;

  const [form, setForm] = useState<ProfileForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone, city, long_events_count, short_events_count")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        setMessage({ type: "error", text: error.message });
        setIsLoading(false);
        return;
      }
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          long_events_count: Number(data.long_events_count) ?? 0,
          short_events_count: Number(data.short_events_count) ?? 0,
        });
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "long_events_count" || name === "short_events_count") {
      setForm((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setMessage(null);
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          display_name: form.display_name.trim() || null,
          phone: form.phone.trim() || null,
          city: form.city.trim() || null,
          long_events_count: form.long_events_count,
          short_events_count: form.short_events_count,
        },
        { onConflict: "id" }
      );

    setIsSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Profile saved." });
  };

  if (!userId) return null;

  if (isLoading) {
    return (
      <main>
        <Link className="home-link" to="/">◄ Home</Link>
        <section className="main-container">
          <p className="text-muted">Loading profile…</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Link className="home-link" to="/">◄ Home</Link>
      <section className="main-container">
        <h1 className="header-text">Profile</h1>

        <form onSubmit={handleSubmit} className="section-block" style={{ maxWidth: 320 }}>
          <label>
            Display name
            <input
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              placeholder="Display name"
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
            />
          </label>
          <label>
            City
            <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
          </label>
          <label>
            Long events count
            <input
              name="long_events_count"
              type="number"
              min={0}
              value={form.long_events_count}
              onChange={handleChange}
            />
          </label>
          <label>
            Short events count
            <input
              name="short_events_count"
              type="number"
              min={0}
              value={form.short_events_count}
              onChange={handleChange}
            />
          </label>
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </button>
        </form>

        {message && (
          <p className={message.type === "error" ? "status-error" : "status-success"}>
            {message.text}
          </p>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
