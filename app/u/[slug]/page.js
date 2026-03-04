"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FeedPage({ params }) {
  const { slug } = use(params);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState(null);
  const [circlePosts, setCirclePosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("circle");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Step 1: resolve slug → phone_number + name
      const { data: owner, error: ownerError } = await supabase
        .from("users")
        .select("phone_number, name")
        .eq("feed_slug", slug)
        .single();

      if (ownerError) console.error("[feed] users lookup error:", ownerError);

      if (!owner) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setOwnerName(owner.name);
      setOwnerPhone(owner.phone_number);

      // Step 2: My Posts — posts by the owner
      const { data: myRaw } = await supabase
        .from("posts")
        .select("*")
        .eq("phone_number", owner.phone_number)
        .order("created_at", { ascending: false });

      setMyPosts(
        (myRaw || []).map((p) => ({ ...p, sender_name: owner.name }))
      );

      // Step 3: Circle Feed — find who has the owner in their circle
      const { data: circleRows } = await supabase
        .from("circle")
        .select("sender_phone")
        .eq("recipient_phone", owner.phone_number);

      const circleSenderPhones = (circleRows || []).map((r) => r.sender_phone);

      if (circleSenderPhones.length === 0) {
        setCirclePosts([]);
        setLoading(false);
        return;
      }

      // Step 4: Fetch posts from those senders
      const { data: circleRaw } = await supabase
        .from("posts")
        .select("*")
        .in("phone_number", circleSenderPhones)
        .order("created_at", { ascending: false });

      if (!circleRaw || circleRaw.length === 0) {
        setCirclePosts([]);
        setLoading(false);
        return;
      }

      // Step 5: Resolve names for circle senders
      const uniquePhones = [...new Set(circleRaw.map((p) => p.phone_number))];
      const { data: senderUsers } = await supabase
        .from("users")
        .select("phone_number, name")
        .in("phone_number", uniquePhones);

      const nameByPhone = Object.fromEntries(
        (senderUsers || []).map((u) => [u.phone_number, u.name])
      );

      setCirclePosts(
        circleRaw.map((p) => ({
          ...p,
          sender_name: nameByPhone[p.phone_number] ?? p.phone_number,
        }))
      );

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-5">🔍</p>
          <p className="font-serif text-xl font-semibold text-warm-700 mb-2">Circle not found</p>
          <p className="text-warm-400 text-sm">No circle exists at this address.</p>
        </div>
      </div>
    );
  }

  const displayedPosts = activeTab === "circle" ? circlePosts : myPosts;

  return (
    <div className="min-h-screen bg-cream">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-warm-100 bg-cream/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
            <span className="font-serif font-semibold text-warm-900 text-[15px]">
              {ownerName || slug}&rsquo;s circle
            </span>
          </div>
          <Link
            href={`/setup/${slug}`}
            className="text-sm text-warm-400 hover:text-terracotta transition-colors"
          >
            Manage circle →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white border border-warm-100 rounded-full p-1 w-fit">
          {[
            { id: "circle", label: "Circle Feed" },
            { id: "mine", label: "My Posts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-terracotta text-white shadow-sm"
                  : "text-warm-500 hover:text-terracotta"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <SkeletonList />
        ) : displayedPosts.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-4">
            {displayedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PostCard({ post }) {
  const isLink = post.type === "link" || post.content?.startsWith("http");
  const [meta, setMeta] = useState({
    title: post.title || null,
    image: post.thumbnail || null,
  });

  useEffect(() => {
    if (!isLink || meta.title) return;
    fetch(`https://api.microlink.io?url=${encodeURIComponent(post.content)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setMeta({
            title: data.data.title || null,
            image: data.data.image?.url || null,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (isLink) {
    return (
      <article className="bg-white rounded-2xl p-5 border border-warm-100 shadow-sm hover:shadow-md transition-shadow">
        <a
          href={post.content}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 mb-3 group"
        >
          {meta.image && (
            <img
              src={meta.image}
              alt=""
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-warm-900 group-hover:text-terracotta transition-colors leading-snug text-[15px]">
              {meta.title || post.content}
            </h2>
            <p className="text-xs text-warm-400 truncate mt-1">{post.content}</p>
          </div>
        </a>

        {post.summary && (
          <div className="bg-cream rounded-xl px-4 py-3 border border-warm-100 mb-3">
            <SummaryLines text={post.summary} icon="•" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar name={post.sender_name} />
            <span className="text-xs text-warm-500">{post.sender_name}</span>
          </div>
          <span className="text-xs text-warm-300">{timeAgo(post.created_at)}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-2xl p-5 border border-warm-100 shadow-sm hover:shadow-md transition-shadow">
      <p className="font-serif text-[17px] text-warm-900 leading-relaxed mb-4">{post.content}</p>

      {post.summary && (
        <div className="bg-cream rounded-xl px-4 py-3 border border-warm-100 mb-3">
          <SummaryLines text={post.summary} icon="✦" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={post.sender_name} />
          <span className="text-xs text-warm-500">{post.sender_name}</span>
        </div>
        <span className="text-xs text-warm-300">{timeAgo(post.created_at)}</span>
      </div>
    </article>
  );
}

function SummaryLines({ text, icon }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div>
      {lines.map((line, i) => (
        <p key={i} className={`text-[13px] text-warm-700 leading-relaxed${i < lines.length - 1 ? " mb-2" : ""}`}>
          <span className="text-terracotta font-bold mr-1.5">{icon}</span>
          {line}
        </p>
      ))}
    </div>
  );
}

function Avatar({ name }) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="w-6 h-6 rounded-full bg-terracotta/15 flex items-center justify-center text-[10px] font-bold text-terracotta flex-shrink-0">
      {initial}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-warm-100 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-warm-100" />
            <div className="h-3 bg-warm-100 rounded-full w-1/5" />
          </div>
          <div className="h-5 bg-warm-100 rounded-full w-3/4 mb-2" />
          <div className="h-4 bg-warm-100 rounded-full w-full mb-1" />
          <div className="h-4 bg-warm-100 rounded-full w-2/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="text-center py-24">
      <p className="text-5xl mb-5">📭</p>
      <p className="font-serif text-xl font-semibold text-warm-700 mb-2">
        {tab === "circle" ? "No circle posts yet" : "No posts yet"}
      </p>
      <p className="text-warm-400 text-sm">
        {tab === "circle"
          ? "Posts from people who have you in their circle will appear here."
          : "Your shared links will appear here."}
      </p>
    </div>
  );
}
