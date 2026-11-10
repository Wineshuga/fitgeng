import { ImageResponse } from 'next/og';
import { brand, theme } from '@/config/brand';

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Social share card in brand colours (from theme.ts). Used by the
 * opengraph-image routes, so every shared link previews consistently.
 */
export function renderOgImage({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const p = theme.palette;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: p.neutral[950],
          color: p.neutral[0],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: p.brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            {brand.name.charAt(0)}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{brand.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eyebrow && <div style={{ fontSize: 28, color: p.brand, fontWeight: 700 }}>{eyebrow}</div>}
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 30, color: p.neutral[300] }}>{subtitle}</div>}
        </div>
        <div style={{ height: 12, width: 160, borderRadius: 6, background: p.accent }} />
      </div>
    ),
    OG_SIZE,
  );
}
