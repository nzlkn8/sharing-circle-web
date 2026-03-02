"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["All", "Article", "Video", "Recipe", "Product", "Thought", "Other"];

const CATEGORY_STYLES = {
  Article:  "bg-terracotta/10 text-terracotta",
  Video:    "bg-sage/10 text-sage",
  Recipe:   "bg-amber-100 text-amber-700",
  Product:  "bg-sky-100 text-sky-700",
  Thought:  "bg-violet-100 text-violet-700",
  Other:    "bg-warm-100 text-warm-500",
};

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
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      // Step 1: resolve slug → phone_number + name
      const { data: owner } = await supabase
        .from("users")
        .select("phone_number, name")
        .eq("feed_slug", slug)
        .single();

      if (!owner) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setOwnerName(owner.name);

      // Step 2: fetch posts for this user
      const { data: rawPosts } = await supabase
        .from("posts")
        .select("*")
        .eq("phone_number", owner.phone_number)
        .order("created_at", { ascending: false });

      if (!rawPosts || rawPosts.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Step 3: fetch names for all unique senders that appear in the posts
      const uniquePhones = [...new Set(rawPosts.map((p) => p.phone_number))];
      const { data: senderUsers } = await supabase
        .from("users")
        .select("phone_number, name")
        .in("phone_number", uniquePhones);

      const nameByPhone = Object.fromEntries(
        (senderUsers || []).map((u) => [u.phone_number, u.name])
      );

      setPosts(
        rawPosts.map((p) => ({
          ...p,
          sender_name: nameByPhone[p.phone_number] ?? p.phone_number,
        }))
      );
      setLoading(false);
    }

    fetchPosts();
  }, [slug]);

  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

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
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-terracotta text-white shadow-sm"
                  : "bg-white text-warm-500 border border-warm-200 hover:border-terracotta/40 hover:text-terracotta"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          <div className="space-y-4">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PostCard({ post }) {
  const colorClass = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.Other;
  const isLink = post.type === "link" || post.content?.startsWith("http");

  return (
    <article className="bg-white rounded-2xl p-5 md:p-6 border border-warm-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Top meta row */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full ${colorClass}`}>
          {post.category || "Other"}
        </span>
        <span className="text-xs text-warm-300">{timeAgo(post.created_at)}</span>
      </div>

      {/* Content */}
      {isLink ? (
        <a href={post.content} target="_blank" rel="noopener noreferrer" className="group block mb-3">
          <h2 className="font-serif text-lg font-semibold text-warm-900 group-hover:text-terracotta transition-colors leading-snug mb-1">
            {post.content}
          </h2>
          <p className="text-xs text-warm-400 truncate">{post.content}</p>
        </a>
      ) : (
        <p className="font-serif text-[17px] text-warm-900 leading-relaxed mb-3">{post.content}</p>
      )}

      {/* AI summary */}
      {post.summary && (
        <div className="bg-cream rounded-xl px-4 py-3 mb-4 border border-warm-100">
          <p className="text-[13px] text-warm-700 leading-relaxed">
            <span className="text-terracotta font-bold mr-1.5">✦</span>
            {post.summary}
          </p>
        </div>
      )}

      {/* Sender */}
      <div className="flex items-center gap-2">
        <Avatar name={post.sender_name} />
        <span className="text-xs text-warm-500">{post.sender_name}</span>
      </div>
    </article>
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
          <div className="h-3.5 bg-warm-100 rounded-full w-1/5 mb-4" />
          <div className="h-5 bg-warm-100 rounded-full w-3/4 mb-2" />
          <div className="h-4 bg-warm-100 rounded-full w-full mb-1" />
          <div className="h-4 bg-warm-100 rounded-full w-2/3 mb-5" />
          <div className="h-3 bg-warm-100 rounded-full w-1/6" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ category }) {
  return (
    <div className="text-center py-24">
      <p className="text-5xl mb-5">📭</p>
      <p className="font-serif text-xl font-semibold text-warm-700 mb-2">
        {category === "All" ? "Nothing here yet" : `No ${category.toLowerCase()} shares yet`}
      </p>
      <p className="text-warm-400 text-sm">
        {category === "All"
          ? "When your circle shares links via WhatsApp, they'll appear here."
          : "Try a different category, or check back later."}
      </p>
    </div>
  );
}
