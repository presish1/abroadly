"use client";

import { useState } from "react";

const UNIS: { name: string; logo: string; fallbackDomain: string }[] = [
  {
    name: "Oxford",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/64px-Oxford-University-Circlet.svg.png",
    fallbackDomain: "ox.ac.uk",
  },
  {
    name: "Cambridge",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Coat_of_Arms_of_the_University_of_Cambridge.svg/64px-Coat_of_Arms_of_the_University_of_Cambridge.svg.png",
    fallbackDomain: "cam.ac.uk",
  },
  {
    name: "Imperial",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Imperial_College_London_logo.svg/128px-Imperial_College_London_logo.svg.png",
    fallbackDomain: "imperial.ac.uk",
  },
  {
    name: "UCL",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/University_College_London_logo.svg/128px-University_College_London_logo.svg.png",
    fallbackDomain: "ucl.ac.uk",
  },
  {
    name: "Melbourne",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/University_of_Melbourne_crest_logo.svg/64px-University_of_Melbourne_crest_logo.svg.png",
    fallbackDomain: "unimelb.edu.au",
  },
  {
    name: "Toronto",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/University_of_Toronto_crest.svg/64px-University_of_Toronto_crest.svg.png",
    fallbackDomain: "utoronto.ca",
  },
  {
    name: "UBC",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/UBC_logo.svg/128px-UBC_logo.svg.png",
    fallbackDomain: "ubc.ca",
  },
  {
    name: "Stanford",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Seal_of_Stanford_University.svg/64px-Seal_of_Stanford_University.svg.png",
    fallbackDomain: "stanford.edu",
  },
  {
    name: "MIT",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/128px-MIT_logo.svg.png",
    fallbackDomain: "mit.edu",
  },
  {
    name: "Harvard",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_University_shield.svg/64px-Harvard_University_shield.svg.png",
    fallbackDomain: "harvard.edu",
  },
  {
    name: "Sydney",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/University_of_Sydney_logo.svg/128px-University_of_Sydney_logo.svg.png",
    fallbackDomain: "sydney.edu.au",
  },
  {
    name: "UNSW",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/UNSW_Sydney_coat_of_arms.svg/64px-UNSW_Sydney_coat_of_arms.svg.png",
    fallbackDomain: "unsw.edu.au",
  },
];

function UniItem({ name, logo, fallbackDomain }: { name: string; logo: string; fallbackDomain: string }) {
  const [src, setSrc] = useState(logo);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div
      className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white shadow-sm transition hover:scale-110 hover:shadow-md grayscale opacity-60 hover:grayscale-0 hover:opacity-100 mx-4"
      title={name}
    >
      <img
        src={src}
        alt={`${name} logo`}
        width={36}
        height={36}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => {
          if (src === logo) {
            setSrc(`https://www.google.com/s2/favicons?domain_url=https://${fallbackDomain}&sz=64`);
          } else {
            setFailed(true);
          }
        }}
        className="h-9 w-9 object-contain"
      />
    </div>
  );
}

export function HeroUniversityStrip() {
  const extendedUnis = [...UNIS, ...UNIS, ...UNIS, ...UNIS];

  return (
    <div className="w-full max-w-[1200px] overflow-hidden marquee-mask py-4">
      <div className="flex w-max animate-marquee-right">
        {extendedUnis.map((u, i) => (
          <UniItem key={`${u.fallbackDomain}-${i}`} name={u.name} logo={u.logo} fallbackDomain={u.fallbackDomain} />
        ))}
      </div>
    </div>
  );
}
