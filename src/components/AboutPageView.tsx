"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/LanguageContext";

const leadership = [
  {
    name: "Tariq Al-Omari",
    title: "Principal Process Engineer",
    bio: "Tariq Al-Omari brings more than 25 years of process engineering experience across oil, gas, refining, and petrochemical projects worldwide. His career spans principal and senior engineering roles at CB&I Lummus, Worley Parsons Resources and Energy, PDVSA, Chemex Global, and STRIKE, with project experience in the United States, the UAE, Ecuador, and the U.S. Virgin Islands.\n\nTariq has deep technical expertise in gas processing and compression, process simulation, and project execution across the full asset lifecycle — from early feasibility through commissioning. He brings disciplined process engineering and a client-first approach to every engagement.",
  },
];

export function AboutPageView() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-none px-5 py-16 sm:px-6 sm:py-20 lg:px-8 xl:px-10">

      <p className="font-mono-label text-photo-dim">{t("about.label")}</p>
      <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl text-photo">
        {t("about.headline")}
      </h1>
      <div className="mt-10 space-y-6 text-base leading-relaxed text-photo-muted max-w-3xl">
        <p className="text-photo">{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2">
        <div className="glass rounded-2xl p-8">
          <p className="font-mono-label text-photo-dim">{t("about.missionL")}</p>
          <p className="mt-4 font-display text-xl font-light text-photo whitespace-pre-line">
            {t("about.mission")}
          </p>
        </div>
        <div className="glass rounded-2xl p-8">
          <p className="font-mono-label text-photo-dim">{t("about.visionL")}</p>
          <p className="mt-4 font-display text-xl font-light text-photo">{t("about.vision")}</p>
        </div>
      </div>

      {/* Leadership */}
      <section className="mt-20" aria-labelledby="leadership-heading">
        <p className="font-mono-label text-photo-dim">Leadership</p>
        <h2 id="leadership-heading" className="font-display mt-4 text-3xl font-light text-photo sm:text-4xl">
          Our Team
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leadership.map((person) => (
            <div key={person.name} className="glass rounded-2xl p-8">
              {/* Initials avatar */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-light text-[var(--photo-text)]"
                style={{ background: "rgba(26,61,107,0.55)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                {person.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <h3 className="font-display mt-5 text-2xl font-light text-[var(--color-text)]">
                {person.name}
              </h3>
              <p className="font-mono-label mt-1 text-[var(--color-dim)]">{person.title}</p>
              <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)] whitespace-pre-line">
                {person.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20" aria-labelledby="global-experience-heading">
        <h2 id="global-experience-heading" className="font-display text-2xl font-light text-photo sm:text-3xl">
          {t("about.globalTitle")}
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-photo-muted max-w-3xl">
          <p>{t("about.globalP1")}</p>
          <p>{t("about.globalP2")}</p>
        </div>
      </section>

      <section className="glass mt-16 rounded-2xl p-8 sm:p-10" aria-labelledby="who-we-are-heading">
        <h2
          id="who-we-are-heading"
          className="font-display text-2xl font-light text-[var(--color-text)] sm:text-3xl"
        >
          {t("about.whoTitle")}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-[var(--color-muted)] max-w-3xl">{t("about.whoP")}</p>
      </section>

      <section className="mt-16" aria-labelledby="standards-heading">
        <h2 id="standards-heading" className="font-display text-2xl font-light text-photo sm:text-3xl">
          {t("about.standardsTitle")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-photo-muted max-w-3xl">{t("about.standardsP")}</p>
      </section>

      <Link href="/services" className="nav-link-slide mt-14 inline-flex text-sm font-medium text-photo">
        {t("about.explore")}
      </Link>
    </div>
  );
}
