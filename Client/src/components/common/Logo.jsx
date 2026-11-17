import React from 'react';

export const Logo = ({ size = 32, showWordmark = true }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {/* Primary Logo Mark: "The Ledger Facade" from DESIGN.md */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BariLog Logo"
      >
        {/* Outer Architectural Frame */}
        <rect x="4" y="3" width="28" height="30" rx="5" fill="#0F172A" />

        {/* Floor 4 (Top Ledger Bar + Unit Block) */}
        <rect x="9" y="8" width="12" height="3.2" rx="1.6" fill="#F8FAFC" />
        <rect x="23" y="8" width="4" height="3.2" rx="1.6" fill="#D97706" />

        {/* Floor 3 (Split Apartment Units) */}
        <rect x="9" y="13.8" width="7.5" height="3.2" rx="1.6" fill="#94A3B8" />
        <rect x="18.5" y="13.8" width="8.5" height="3.2" rx="1.6" fill="#F8FAFC" />

        {/* Floor 2 (Full-Width Ledger Entry) */}
        <rect x="9" y="19.6" width="18" height="3.2" rx="1.6" fill="#F8FAFC" />

        {/* Ground Floor (Lobby Threshold & Entrance Pillar) */}
        <rect x="9" y="25.4" width="6" height="3.2" rx="1.6" fill="#0D9488" />
        <rect x="17" y="25.4" width="10" height="3.2" rx="1.6" fill="#64748B" />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#0F172A',
            userSelect: 'none',
          }}
        >
          Bari<span style={{ color: 'var(--brand-primary)' }}>Log</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
