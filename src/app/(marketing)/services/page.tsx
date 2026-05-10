import type { Metadata } from "next";
import { ServicesPageView } from "@/components/ServicesPageView";

export const metadata: Metadata = {
  title: "Services",
  description:
    "OGP delivers multi-discipline engineering services across strategic, technical & safety advisory, engineering & design, project execution, optimization, and energy transition — covering upstream, midstream, and downstream projects worldwide.",
};

export default function ServicesPage() {
  return <ServicesPageView />;
}
