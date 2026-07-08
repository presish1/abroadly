import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, BookOpen, ChevronRight, User, AlertCircle, ArrowLeft } from "lucide-react";
import { NavBar } from "../../nav-bar";
import { SiteFooter } from "../../site-footer";
import { BLOG_POSTS, BlogPost } from "@/lib/blog-data";

interface Props {
  params: {
    slug: string;
  };
}

// Generate static parameters for static site generation (SSG)
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

// Dynamically generate SEO metadata for each blog post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return {};

  const url = `https://abroadly.online/blog/${post.slug}`;

  return {
    title: `${post.metaTitle} · Abroadly`,
    description: post.metaDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: url,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      tags: post.targetKeywords,
    },
  };
}

export default function BlogPostDetailPage({ params }: Props) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  // Schema markup data structures
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.metaDescription,
    "datePublished": new Date(post.date).toISOString(),
    "dateModified": new Date(post.date).toISOString(),
    "author": {
      "@type": "Organization",
      "name": post.author,
      "url": "https://abroadly.online"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Abroadly",
      "logo": {
        "@type": "ImageObject",
        "url": "https://abroadly.online/icon.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://abroadly.online/blog/${post.slug}`
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <main className="min-h-screen bg-[var(--ab-paper)] text-[var(--ab-ink)] flex flex-col justify-between">
      {/* Dynamic JSON-LD Schemas injected */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div>
        <NavBar showSignIn={true} primary={{ href: "/chat", label: "Open chat" }} />

        {/* Back to Blog List */}
        <div className="max-w-3xl mx-auto px-5 pt-8 sm:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ab-muted)] hover:text-[var(--ab-ink)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guides
          </Link>
        </div>

        {/* Article Layout */}
        <article className="mx-auto max-w-3xl px-5 pb-24 pt-6 sm:px-8">
          {/* Header Metadata */}
          <header className="border-b border-[var(--ab-line)] pb-8">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              {post.category}
            </span>

            <h1 className="mt-4 text-[clamp(1.75rem,5vw,2.75rem)] font-extrabold leading-[1.12] tracking-tight text-[var(--ab-ink)]">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-[var(--ab-muted-soft)]">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </header>

          {/* Intro Text */}
          <p className="ab-subhead mt-8 text-[17px] font-medium leading-[1.6] text-[var(--ab-ink-soft)] italic border-l-4 border-blue-500 pl-4 bg-slate-50/50 py-3 rounded-r-lg">
            {post.intro}
          </p>

          {/* Render Sections */}
          <div className="mt-10 space-y-10">
            {post.sections.map((section, idx) => (
              <section key={idx} className="space-y-4">
                {section.heading && (
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ab-ink)] tracking-tight">
                    {section.heading}
                  </h2>
                )}

                {section.type === "paragraph" && section.content && (
                  <p className="text-[16px] leading-[1.75] text-[var(--ab-ink-soft)] font-medium">
                    {section.content}
                  </p>
                )}

                {section.type === "list" && section.items && (
                  <ul className="space-y-2.5 pl-6 list-disc text-[16px] leading-[1.7] text-[var(--ab-ink-soft)] font-medium">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.type === "callout" && section.content && (
                  <div className="rounded-[18px] border border-blue-100 bg-blue-50/60 p-5 flex gap-3.5">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[15px] leading-relaxed text-blue-900 font-bold">
                      {section.content}
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Interlinks section */}
          <section className="mt-12 p-6 rounded-[24px] border border-[var(--ab-line)] bg-slate-50/50">
            <h3 className="text-md font-bold text-[var(--ab-ink)]">How to use Abroadly tools:</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href="/onboarding" className="flex items-center justify-between p-3 rounded-xl bg-white border border-[var(--ab-line-soft)] hover:border-blue-400 transition-all font-semibold text-sm text-[var(--ab-ink-soft)]">
                <span>1. Start Your Profile Assessment</span>
                <ChevronRight className="h-4 w-4 text-blue-500" />
              </Link>
              <Link href="/chat" className="flex items-center justify-between p-3 rounded-xl bg-white border border-[var(--ab-line-soft)] hover:border-blue-400 transition-all font-semibold text-sm text-[var(--ab-ink-soft)]">
                <span>2. Open AI Counselor Chat</span>
                <ChevronRight className="h-4 w-4 text-blue-500" />
              </Link>
              <Link href="/universities" className="flex items-center justify-between p-3 rounded-xl bg-white border border-[var(--ab-line-soft)] hover:border-blue-400 transition-all font-semibold text-sm text-[var(--ab-ink-soft)]">
                <span>3. Explore Universities Database</span>
                <ChevronRight className="h-4 w-4 text-blue-500" />
              </Link>
              <Link href="/chat/documents" className="flex items-center justify-between p-3 rounded-xl bg-white border border-[var(--ab-line-soft)] hover:border-blue-400 transition-all font-semibold text-sm text-[var(--ab-ink-soft)]">
                <span>4. Upload Documents for Check</span>
                <ChevronRight className="h-4 w-4 text-blue-500" />
              </Link>
            </div>
          </section>

          {/* FAQ Accordion Section */}
          <section className="mt-16 border-t border-[var(--ab-line)] pt-12">
            <h2 className="text-2xl font-extrabold text-[var(--ab-ink)] tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-6">
              {post.faqs.map((faq, faqIdx) => (
                <div key={faqIdx} className="border-b border-[var(--ab-line-soft)] pb-5">
                  <h3 className="text-[16px] font-bold text-[var(--ab-ink)]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--ab-muted)] font-semibold">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom inline CTA */}
          <section className="mt-16 rounded-[28px] bg-gradient-to-br from-[#12244a] to-[#1F3D78] p-8 text-center text-white shadow-lg">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-300">
              Get Personal Guidance
            </span>
            <h2 className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight">
              Compare options tailored to your qualifications.
            </h2>
            <p className="mt-3 text-sm text-slate-300 font-medium max-w-xl mx-auto">
              Skip general advice. Sign in to analyze your exact Class 12 GPA, backlogs, test scores, and budget limits with Abroadly AI counselor.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/onboarding"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#0044FF] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600"
              >
                Start Onboarding
              </Link>
              <Link
                href="/chat"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-6 text-sm font-bold text-white border border-white/20 transition-all hover:bg-white/20"
              >
                Talk to AI Counselor
              </Link>
            </div>
          </section>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
