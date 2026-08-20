"use client";

import { useState } from "react";
import { faqs } from "@/lib/site";

export default function FaqList() {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-white/8 border-y border-white/8">
      {faqs.map((item, index) => {
        const isOpen = open === index;
        const n = String(index + 1).padStart(2, "0");
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center gap-4 py-5 text-left sm:gap-6"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : index)}
            >
              <span className="w-8 shrink-0 font-mono text-sm text-muted">
                {n}
              </span>
              <span className="flex-1 text-lg font-medium tracking-tight sm:text-xl">
                {item.q}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`size-5 shrink-0 text-muted transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isOpen ? (
              <div className="pb-6 pl-12 pr-8 text-[15px] leading-relaxed text-muted sm:pl-14">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
