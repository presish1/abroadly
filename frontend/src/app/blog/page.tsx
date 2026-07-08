"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, Calendar, ArrowRight } from "lucide-react";
import { NavBar } from "../nav-bar";
import { SiteFooter } from "../site-footer";
import { BLOG_POSTS, BlogPost } from "@/lib/blog-data";

export default function BlogIndexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get all unique categories
  const categories = ["All", ...Array.from(new Set(BLOG_POSTS.map((post) => post.category)))];

  // Filter posts
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.intro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.targetKeywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[var(--ab-paper)] text-[var(--ab-ink)] flex flex-col justify-between">
      {/* Head Tags (Canonical / OG) */}
      <link rel="canonical" href="https://abroadly.online/blog" />

      <div>
        <NavBar showSignIn={true} primary={{ href: "/chat", label: "Open chat" }} />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-[var(--ab-paper)] to-[var(--ab-paper)] pt-16 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-blue-700 border border-blue-100">
              <BookOpen className="h-3.5 w-3.5" />
              Resources & Guidance
            </span>
            <h1 className="mt-4 text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-[var(--ab-ink)]">
              Study Abroad, Made Simple.
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-[var(--ab-muted)] max-w-2xl mx-auto font-medium">
              Expert guides, document checklists, and visa tips written specifically for Nepali students preparing for Australia, UK, USA, Canada, and New Zealand.
            </p>

            {/* Search Input */}
            <div className="mt-8 mx-auto max-w-lg relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search guides, countries, or documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-full border border-[var(--ab-line)] bg-white text-[15px] placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
              />
            </div>

            {/* Categories filter */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${
                    selectedCategory === category
                      ? "bg-[var(--ab-ink)] text-white border-[var(--ab-ink)]"
                      : "bg-white text-[var(--ab-muted)] border-[var(--ab-line)] hover:border-slate-400"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Post Grid */}
        <section className="pb-24 max-w-6xl mx-auto px-5 sm:px-8">
          {filteredPosts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex">
                  <article className="flex flex-col justify-between w-full rounded-[24px] border border-[var(--ab-line)] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-[var(--ab-muted-soft)]">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 uppercase tracking-wider text-[10px]">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>

                      <h2 className="mt-4 text-[18px] font-extrabold leading-tight text-[var(--ab-ink)] transition-colors group-hover:text-blue-600">
                        {post.title}
                      </h2>
                      <p className="mt-3 text-[14px] leading-relaxed text-[var(--ab-muted)] font-medium line-clamp-3">
                        {post.intro}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--ab-line-soft)] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--ab-muted-soft)]">
                        <Calendar className="h-3 w-3" />
                        <span>{post.date}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-blue-600 group-hover:text-blue-700">
                        Read Guide
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-[var(--ab-line)] rounded-[24px]">
              <p className="text-[17px] font-semibold text-[var(--ab-muted)]">No guides found matching your search.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* Feature CTA Section */}
        <section className="bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB]/50 border-y border-blue-100 py-16 text-center">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12244a] leading-tight">
              Ready to create your personalized study profile?
            </h2>
            <p className="mt-3 text-[15px] sm:text-[16px] text-slate-700 font-medium">
              Take the guesswork out of the application. Get concrete university lists, GPA checks, and visa checklists tailored to your exact profile in seconds.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/onboarding"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#0044FF] px-6 text-[14px] font-bold text-white shadow-md transition-all hover:bg-blue-600 hover:scale-[1.02]"
              >
                Get Started Free
              </Link>
              <Link
                href="/chat"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[14px] font-bold text-slate-700 border border-slate-200 shadow-sm transition-all hover:bg-slate-50 hover:scale-[1.02]"
              >
                Chat with AI Assistant
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
