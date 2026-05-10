import type { Metadata } from "next";
import { AboutPageView } from "@/components/AboutPageView";

export const metadata: Metadata = {
  title: "About",
  description:
    "OGP is a U.S.-based global engineering consultancy — delivering end-to-end expertise from feasibility through commissioning for upstream, midstream, and downstream energy projects worldwide.",
};

export default function AboutPage() {
  return <AboutPageView />;
}
