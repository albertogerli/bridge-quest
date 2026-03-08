import { ReactNode } from "react";

export function StepShell({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-[#d8d0c0] bg-[#fffaf0] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="mb-4 inline-flex rounded-full border border-[#c8a44e]/30 bg-[#c8a44e]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6b16]">
        {kicker}
      </div>
      <h1 className="max-w-[16ch] text-3xl font-bold leading-[1.05] text-[#12305f] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#44536d]">{body}</p>
      {children}
    </div>
  );
}
