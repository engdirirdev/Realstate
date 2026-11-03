"use client";

import dynamic from "next/dynamic";

const AIChatbot = dynamic(() => import("@/components/AIChatbot"), {
  ssr: false,
});

export default function LazyAIChatbot() {
  return <AIChatbot />;
}
