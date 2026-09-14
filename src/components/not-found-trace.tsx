"use client";

import { usePathname } from "next/navigation";

/** The path that was actually requested, reported the way a runtime would. */
export function NotFoundTrace() {
  const pathname = usePathname();

  return (
    <pre className="specular overflow-x-auto rounded-lg p-6 text-left font-mono text-[0.8125rem] leading-relaxed sm:text-sm">
      <code>
        <span className="text-gold">
          site:1: attempt to index nil (field {"'"}
          {pathname}
          {"'"})
        </span>
        {"\n"}
        <span className="text-text-2">stack traceback:</span>
        {"\n"}
        <span className="text-text-2/70">
          {"  "}severrir.site:1: in function {"'navigate'"}
          {"\n"}
          {"  "}[C]: in ?
        </span>
      </code>
    </pre>
  );
}
