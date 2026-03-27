"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SetupPage({ params }) {
  const { slug } = use(params);
  const [ownerPhone, setOwnerPhone] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ recipient_name: "", recipient_phone: "" });
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [hasContactPicker, setHasContactPicker] = useState(null);
  const [showExisting, setShowExisting] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  useEffect(() => {
    setHasContactPicker(
      typeof navigator !== "undefined" &&
        "contacts" in navigator &&
        typeof navigator.contacts.select === "function"
    );

    async function init() {
      console.log("[setup] init() slug:", slug);

      const { data: owner, error: ownerError } = await supabase
        .from("users")
        .select("phone_number, name, digest_weekly, digest_daily")
        .eq("feed_slug", slug)
        .single();

      console.log("[setup] users lookup response:", { data: owner, error: ownerError });
      if (ownerError) console.error("[setup] users lookup error:", ownerError);

      if (!owner) {
        setLoading(false);
        return;
      }

      setOwnerPhone(owner.phone_number);
      setOwnerName(owner.name || "");
      console.log("[setup] ownerPhone set to:", owner.phone_number);

      if (owner.digest_weekly !== null && owner.digest_weekly !== undefined) {
        setWeeklyDigest(owner.digest_weekly);
      }
      if (owner.digest_daily !== null && owner.digest_daily !== undefined) {
        setDailyDigest(owner.digest_daily);
      }

      const { data } = await supabase
        .from("circle")
        .select("*")
        .eq("sender_phone", owner.phone_number)
        .order("created_at", { ascending: true });

      setMembers(data || []);
      setLoading(false);
    }

    init();
  }, [slug]);

  async function handleContactPicker() {
    try {
      const contacts = await navigator.contacts.select(["name", "tel", "email"], {
        multiple: false,
      });
      if (contacts.length > 0) {
        const c = contacts[0];
        setForm({
          recipient_name: c.name?.[0] ?? "",
          recipient_phone: c.tel?.[0] ?? "",
        });
      }
    } catch {
      // Contact picker was dismissed or unavailable — silently ignore
    }
  }

  function normalizePhone(phone) {
    return phone.replace(/\D/g, "");
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.recipient_name || !form.recipient_phone || !ownerPhone) return;

    setAdding(true);
    const { data, error } = await supabase
      .from("circle")
      .insert({
        sender_phone: ownerPhone,
        recipient_name: form.recipient_name,
        recipient_phone: normalizePhone(form.recipient_phone),
      })
      .select()
      .single();

    if (error) console.error("[handleAdd] circle insert error:", error);

    if (!error && data) {
      setMembers((prev) => [...prev, data]);
      setForm({ recipient_name: "", recipient_phone: "" });
    }
    setAdding(false);
  }

  async function handleReAdd(member) {
    if (!ownerPhone) return;
    const { data, error } = await supabase
      .from("circle")
      .insert({
        sender_phone: ownerPhone,
        recipient_name: member.recipient_name,
        recipient_phone: member.recipient_phone,
        recipient_email: member.recipient_email,
      })
      .select()
      .single();

    if (!error && data) {
      setMembers((prev) => [...prev, data]);
    }
  }

  async function handleRemove(id) {
    setRemoving(id);
    const { error } = await supabase.from("circle").delete().eq("id", id);
    if (!error) setMembers((prev) => prev.filter((m) => m.id !== id));
    setRemoving(null);
  }

  async function handleDigestToggle(field, value) {
    if (field === "digest_weekly") setWeeklyDigest(value);
    if (field === "digest_daily") setDailyDigest(value);
    await supabase.from("users").update({ [field]: value }).eq("feed_slug", slug);
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-warm-100 bg-cream/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            href={`/u/${slug}`}
            className="text-sm text-warm-400 hover:text-terracotta transition-colors"
          >
            ← Back to feed
          </Link>
          <span className="text-warm-200">·</span>
          <span className="font-serif font-semibold text-warm-900 text-[15px]">
            {ownerName || slug}&rsquo;s FaveFinds
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Circle header card */}
        <div className="bg-white rounded-2xl p-6 border border-warm-100 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-warm-900">Your People</h2>
          <p className="text-sm text-warm-400 mt-0.5">People in your FaveFinds</p>
        </div>

        {/* Members list */}
        <section>
          <div className="flex items-baseline gap-2 mb-3 px-1">
          <h3 className="font-serif text-base font-semibold text-warm-900">Members</h3>
          {!loading && (
            <span className={`text-xs font-medium ${members.length >= 40 && members.length < 50 ? "text-orange-500" : "text-warm-400"}`}>
              {members.length}/50
              {members.length >= 40 && members.length < 50 && ` · ${50 - members.length} spot${50 - members.length === 1 ? "" : "s"} remaining`}
            </span>
          )}
        </div>

          {loading ? (
            <SkeletonMembers />
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-warm-100">
              <p className="text-3xl mb-3">👤</p>
              <p className="text-warm-500 text-sm">
                No one added yet. Add friends below to start sharing!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  removing={removing === member.id}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </section>

        {/* Add member */}
        <section className="bg-white rounded-2xl p-6 border border-warm-100 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-warm-900 mb-5">Add someone to your FaveFinds</h3>

          {members.length >= 50 ? (
            <p className="text-sm text-warm-600 text-center py-2">
              You&rsquo;ve reached the 50 person limit. Remove someone to add a new person.
            </p>
          ) : (
            <>
              {/* Contact picker */}
              {hasContactPicker === true && (
                <>
                  <button
                    onClick={handleContactPicker}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-sage/10 text-sage border border-sage/20 rounded-xl py-3 text-sm font-semibold mb-4 hover:bg-sage/20 transition-colors"
                  >
                    <span>📱</span> Pick from contacts
                  </button>
                  <Divider label="or fill in manually" />
                </>
              )}
              {hasContactPicker === false && (
                <p className="text-xs text-warm-400 mb-4">
                  Contact import isn&rsquo;t available in this browser. On iOS Safari 14+ or Android Chrome you can pick contacts directly.
                </p>
              )}

              <form onSubmit={handleAdd} className="space-y-3.5">
                <Field
                  label="Name"
                  required
                  value={form.recipient_name}
                  onChange={(v) => setForm((f) => ({ ...f, recipient_name: v }))}
                  placeholder="Alex"
                  type="text"
                />
                <Field
                  label="Phone"
                  required
                  value={form.recipient_phone}
                  onChange={(v) => setForm((f) => ({ ...f, recipient_phone: v }))}
                  placeholder="+1 555 000 0000"
                  type="tel"
                  hint="Open WhatsApp, go to their contact, tap their name and copy their number"
                />
                <button
                  type="submit"
                  disabled={adding || !form.recipient_name || !form.recipient_phone}
                  className="w-full bg-terracotta text-white font-semibold py-3 rounded-xl hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {adding ? "Adding…" : "Add to your FaveFinds"}
                </button>
              </form>
            </>
          )}

        </section>

        {/* Digest Settings */}
        <section className="bg-white rounded-2xl p-6 border border-warm-100 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-warm-900 mb-1">Digest Settings</h3>
          <p className="text-xs text-warm-400 mb-5">Digests are sent to your email on file</p>
          <div className="space-y-4">
            <Toggle
              label="Weekly digest"
              checked={weeklyDigest}
              onChange={(v) => handleDigestToggle("digest_weekly", v)}
            />
            <Toggle
              label="Daily digest"
              checked={dailyDigest}
              onChange={(v) => handleDigestToggle("digest_daily", v)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function MemberRow({ member, removing, onRemove }) {
  const initial = member.recipient_name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 border border-warm-100 shadow-sm">
      <div className="w-9 h-9 rounded-full bg-terracotta/15 flex items-center justify-center text-xs font-bold text-terracotta flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warm-900 truncate">{member.recipient_name}</p>
        <p className="text-xs text-warm-400 truncate">
          {member.recipient_phone}
        </p>
      </div>
      <button
        onClick={() => onRemove(member.id)}
        disabled={removing}
        className="text-warm-300 hover:text-red-400 transition-colors text-xs px-2 py-1 disabled:opacity-40"
        aria-label={`Remove ${member.recipient_name}`}
      >
        {removing ? "…" : "✕"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type, required, optional, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-warm-700 mb-1">
        {label}
        {optional && <span className="text-warm-400 font-normal ml-1">(optional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-cream text-warm-900 text-sm placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta/25 focus:border-terracotta transition-colors"
      />
      {hint && <p className="text-xs text-warm-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-warm-800">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? "bg-terracotta" : "bg-warm-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-warm-100" />
      <span className="text-xs text-warm-400">{label}</span>
      <div className="flex-1 h-px bg-warm-100" />
    </div>
  );
}

function SkeletonMembers() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 border border-warm-100 animate-pulse"
        >
          <div className="w-9 h-9 rounded-full bg-warm-100 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-warm-100 rounded-full w-1/3" />
            <div className="h-3 bg-warm-100 rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
