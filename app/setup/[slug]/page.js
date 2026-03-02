"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const MAX_MEMBERS = 15;

export default function SetupPage({ params }) {
  const { slug } = use(params);
  const [ownerPhone, setOwnerPhone] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ recipient_name: "", recipient_phone: "", recipient_email: "" });
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [hasContactPicker, setHasContactPicker] = useState(false);

  useEffect(() => {
    setHasContactPicker(
      typeof navigator !== "undefined" &&
        "contacts" in navigator &&
        "ContactsManager" in window
    );

    async function init() {
      // Step 1: resolve slug → phone_number
      const { data: owner } = await supabase
        .from("users")
        .select("phone_number")
        .eq("feed_slug", slug)
        .single();

      if (!owner) {
        setLoading(false);
        return;
      }

      setOwnerPhone(owner.phone_number);

      // Step 2: fetch circle members for this owner
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
          recipient_email: c.email?.[0] ?? "",
        });
      }
    } catch {
      // Contact picker was dismissed or unavailable — silently ignore
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.recipient_name || !form.recipient_phone || members.length >= MAX_MEMBERS || !ownerPhone) return;

    setAdding(true);
    const { data, error } = await supabase
      .from("circle")
      .insert({
        sender_phone: ownerPhone,
        recipient_name: form.recipient_name,
        recipient_phone: form.recipient_phone,
        recipient_email: form.recipient_email || null,
      })
      .select()
      .single();

    if (!error && data) {
      setMembers((prev) => [...prev, data]);
      setForm({ recipient_name: "", recipient_phone: "", recipient_email: "" });
    }
    setAdding(false);
  }

  async function handleRemove(id) {
    setRemoving(id);
    const { error } = await supabase.from("circle").delete().eq("id", id);
    if (!error) setMembers((prev) => prev.filter((m) => m.id !== id));
    setRemoving(null);
  }

  const spotsUsed = members.length;
  const spotsLeft = MAX_MEMBERS - spotsUsed;
  const isFull = spotsUsed >= MAX_MEMBERS;
  const fillPercent = Math.round((spotsUsed / MAX_MEMBERS) * 100);

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
            {slug}&rsquo;s Circle
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Spots card */}
        <div className="bg-white rounded-2xl p-6 border border-warm-100 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="font-serif text-xl font-semibold text-warm-900">Your Circle</h2>
              <p className="text-sm text-warm-400 mt-0.5">People who share with you</p>
            </div>
            <span
              className={`flex-shrink-0 text-sm font-bold px-3 py-1.5 rounded-full ${
                isFull ? "bg-terracotta/10 text-terracotta" : "bg-sage/10 text-sage"
              }`}
            >
              {spotsUsed}/{MAX_MEMBERS}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden mt-4 mb-2">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p className="text-xs text-warm-400">
            {isFull
              ? "Circle is full — remove a member to add someone new."
              : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining`}
          </p>

          {/* Dunbar note */}
          <div className="mt-5 border-t border-warm-100 pt-4">
            <p className="text-xs text-warm-400 leading-relaxed">
              <span className="text-warm-700 font-medium">Why 15?</span> Circles are capped at 15 — the size
              anthropologist Robin Dunbar identified as the layer of closest, most active relationships we
              maintain. Quality over quantity.
            </p>
          </div>
        </div>

        {/* Members list */}
        <section>
          <h3 className="font-serif text-base font-semibold text-warm-900 mb-3 px-1">Members</h3>

          {loading ? (
            <SkeletonMembers />
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-warm-100">
              <p className="text-3xl mb-3">👤</p>
              <p className="text-warm-500 text-sm">
                No members yet. Add people below to start your circle.
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
        {isFull ? (
          <div className="bg-terracotta/5 border border-terracotta/20 rounded-2xl p-5 text-center">
            <p className="text-sm text-terracotta font-medium">
              Your circle is full. Remove a member to invite someone new.
            </p>
          </div>
        ) : (
          <section className="bg-white rounded-2xl p-6 border border-warm-100 shadow-sm">
            <h3 className="font-serif text-lg font-semibold text-warm-900 mb-5">Add someone</h3>

            {/* Contact picker (mobile Chrome) */}
            {hasContactPicker && (
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
              />
              <Field
                label="Email"
                optional
                value={form.recipient_email}
                onChange={(v) => setForm((f) => ({ ...f, recipient_email: v }))}
                placeholder="alex@example.com"
                type="email"
              />
              <button
                type="submit"
                disabled={adding || !form.recipient_name || !form.recipient_phone}
                className="w-full bg-terracotta text-white font-semibold py-3 rounded-xl hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {adding ? "Adding…" : "Add to circle"}
              </button>
            </form>
          </section>
        )}
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
          {member.recipient_email ? ` · ${member.recipient_email}` : ""}
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

function Field({ label, value, onChange, placeholder, type, required, optional }) {
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
