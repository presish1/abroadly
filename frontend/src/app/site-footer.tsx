import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#EFECE4] bg-[#FAF9F6] text-[#8A847B] py-12 px-5 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Main 3-Column Footer Grid */}
        <div className="grid gap-10 md:grid-cols-3 md:gap-8 pb-10">

          {/* Column 1: Brand & Socials */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="ab-focus inline-block w-fit rounded-lg">
              <BrandWordmark />
            </Link>
            <p className="text-[13px] leading-relaxed max-w-sm text-[#6B655C]">
              Abroadly is a free, independent study-abroad guidance tool designed specifically for Nepali students. We help you explore options, prepare documents, and navigate visas without consultancy pressure.
            </p>

            {/* Social Media Links with SVG Logos */}
            <div className="flex items-center gap-4 mt-2">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/abroadly.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8A847B] hover:text-[#0A6E45] transition-colors"
                title="Instagram"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@abroadly.online"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8A847B] hover:text-[#0A6E45] transition-colors"
                title="TikTok"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.89 2.22 1.45 3.53 1.63V9.8c-1.19-.1-2.35-.54-3.34-1.22-.38-.26-.73-.56-1.04-.89v7.87c.04 1.29-.3 2.58-.99 3.67-.93 1.46-2.45 2.51-4.16 2.82-1.74.32-3.56.03-5.11-.8-1.57-.84-2.77-2.34-3.23-4.08-.47-1.74-.23-3.64.67-5.2C5.3 10.4 6.89 9.3 8.7 9.07c1.19-.15 2.41.05 3.49.63l-.06 3.9c-.64-.32-1.35-.45-2.06-.39-.71.07-1.39.4-1.9.92-.51.52-.82 1.23-.88 1.95-.06.72.16 1.45.62 2.01.46.56 1.12.92 1.83 1.01.71.09 1.44-.09 2.03-.5.59-.41.99-1.05 1.13-1.76.08-.43.08-.88.08-1.32V.02Z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/abroadlyonline/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8A847B] hover:text-[#0A6E45] transition-colors"
                title="LinkedIn"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9H7.12v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Featured Guides (SEO Internal Links) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-bold text-[var(--ab-ink)] uppercase tracking-wider">
              Country Guides
            </h4>
            <nav className="flex flex-col gap-2.5 text-[13px] font-semibold text-[#6B655C]">
              <Link href="/blog/study-in-australia-from-nepal" className="hover:text-[var(--ab-ink)] transition-colors">
                Study in Australia Guide
              </Link>
              <Link href="/blog/study-in-uk-from-nepal" className="hover:text-[var(--ab-ink)] transition-colors">
                Study in the UK Guide
              </Link>
              <Link href="/blog/study-in-canada-from-nepal" className="hover:text-[var(--ab-ink)] transition-colors">
                Study in Canada Guide
              </Link>
              <Link href="/blog/study-in-usa-from-nepal" className="hover:text-[var(--ab-ink)] transition-colors">
                Study in the USA Guide
              </Link>
              <Link href="/blog/study-in-new-zealand-from-nepal" className="hover:text-[var(--ab-ink)] transition-colors">
                Study in New Zealand Guide
              </Link>
              <Link href="/blog" className="text-blue-600 hover:text-blue-700 transition-colors">
                View all 36 Guides →
              </Link>
            </nav>
          </div>

          {/* Column 3: Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-bold text-[var(--ab-ink)] uppercase tracking-wider">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-2.5 text-[13px] font-semibold text-[#6B655C]">
              <Link href="/" className="hover:text-[var(--ab-ink)] transition-colors">
                Home
              </Link>
              <Link href="/chat" className="hover:text-[var(--ab-ink)] transition-colors">
                AI Counselor Chat
              </Link>
              <Link href="/onboarding" className="hover:text-[var(--ab-ink)] transition-colors">
                Start Onboarding
              </Link>
              <Link href="/universities" className="hover:text-[var(--ab-ink)] transition-colors">
                Universities Database
              </Link>
              <Link href="/privacy" className="hover:text-[var(--ab-ink)] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[var(--ab-ink)] transition-colors">
                Terms & Conditions
              </Link>
            </nav>
          </div>

        </div>

        {/* Bottom row */}
        <div className="border-t border-[#EFECE4] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A847B] gap-2">
          <p>© {year} Abroadly · Free study-abroad guidance for Nepali students.</p>
          <p className="font-semibold text-[#6B655C]">
            Not a consultancy. No placement fees. Honest guidance.
          </p>
        </div>
      </div>
    </footer>
  );
}
