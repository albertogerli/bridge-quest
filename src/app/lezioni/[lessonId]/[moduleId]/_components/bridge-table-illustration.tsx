/** Bridge table illustration for visual fill on short steps */
export function BridgeTableIllustration() {
  return (
    <div className="flex justify-center pt-8 pb-4 opacity-[0.07]" aria-hidden="true">
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        {/* Table */}
        <rect x="30" y="30" width="140" height="140" rx="16" fill="#003DA5" />
        <rect x="38" y="38" width="124" height="124" rx="12" stroke="#0052CC" strokeWidth="1.5" fill="none" />
        {/* N */}
        <text x="100" y="58" textAnchor="middle" fill="#F7F5F0" fontSize="14" fontWeight="700">N</text>
        {/* S */}
        <text x="100" y="158" textAnchor="middle" fill="#F7F5F0" fontSize="14" fontWeight="700">S</text>
        {/* E */}
        <text x="158" y="106" textAnchor="middle" fill="#F7F5F0" fontSize="14" fontWeight="700">E</text>
        {/* O */}
        <text x="44" y="106" textAnchor="middle" fill="#F7F5F0" fontSize="14" fontWeight="700">O</text>
        {/* Card shapes */}
        <rect x="82" y="68" width="16" height="22" rx="2.5" fill="#F7F5F0" opacity="0.5" transform="rotate(-8 90 79)" />
        <rect x="92" y="66" width="16" height="22" rx="2.5" fill="#F7F5F0" opacity="0.6" transform="rotate(4 100 77)" />
        <rect x="102" y="68" width="16" height="22" rx="2.5" fill="#F7F5F0" opacity="0.4" transform="rotate(12 110 79)" />
        {/* Suit symbols */}
        <text x="76" y="130" fill="#F7F5F0" fontSize="16" opacity="0.3">&#9824;</text>
        <text x="96" y="126" fill="#F7F5F0" fontSize="16" opacity="0.3">&#9829;</text>
        <text x="116" y="130" fill="#F7F5F0" fontSize="16" opacity="0.3">&#9830;</text>
        <text x="96" y="142" fill="#F7F5F0" fontSize="16" opacity="0.3">&#9827;</text>
      </svg>
    </div>
  );
}
