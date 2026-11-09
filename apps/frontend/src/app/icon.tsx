import { ImageResponse } from 'next/og';
import { brand, theme } from '@/config/brand';

// Generated favicon, so the brand colour and initial come from config instead of a hand-made file.
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.brand,
          color: theme.palette.neutral[0],
          borderRadius: 16,
          fontSize: 40,
          fontWeight: 800,
        }}
      >
        {brand.name.charAt(0)}
      </div>
    ),
    size,
  );
}
