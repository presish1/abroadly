"use client";

import { useState } from "react";

const UNIS: { name: string; domain: string }[] = [
  { name: "Oxford", domain: "ox.ac.uk" },
  { name: "Cambridge", domain: "cam.ac.uk" },
  { name: "Imperial", domain: "imperial.ac.uk" },
  { name: "UCL", domain: "ucl.ac.uk" },
  { name: "Melbourne", domain: "unimelb.edu.au" },
  { name: "Toronto", domain: "utoronto.ca" },
  { name: "UBC", domain: "ubc.ca" },
  { name: "Stanford", domain: "stanford.edu" },
  { name: "MIT", domain: "mit.edu" },
  { name: "Harvard", domain: "harvard.edu" },
  { name: "Sydney", domain: "sydney.edu.au" },
  { name: "UNSW", domain: "unsw.edu.au" },
];

function UniItem({ domain }: { domain: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-white border border-slate-200 shadow-sm transition hover:shadow-md hover:scale-110 flex-shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 mx-4">
      <img
        src={`https://logo.clearbit.com/${domain}?size=128`}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-8 w-8 object-contain"
      />
    </div>
  );
}

export function HeroUniversityStrip() {
  // We use 4 copies to make the -25% to 0% infinite loop seamless
  const extendedUnis = [...UNIS, ...UNIS, ...UNIS, ...UNIS];

  return (
    <div className="w-full max-w-[1200px] overflow-hidden marquee-mask py-4">
      <div className="flex w-max animate-marquee-right">
        {extendedUnis.map((u, i) => (
          <UniItem key={`${u.domain}-${i}`} domain={u.domain} />
        ))}
      </div>
    </div>
  );
}
