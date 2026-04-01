import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hanja = searchParams.get('hanja') || '디지털 한옥 철학관';
    const mbti = searchParams.get('mbti') || '사주명리';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a', /* Dark background */
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #050505 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '80px',
              borderRadius: '24px',
              border: '2px solid #E5C07B', /* hanok-accent gold */
              boxShadow: '0 0 40px rgba(229,192,123,0.2)',
            }}
          >
            <h1
              style={{
                fontSize: 64,
                color: '#E5C07B',
                margin: 0,
                marginBottom: 20,
              }}
            >
              명리재 (命理齋)
            </h1>
            <h2
              style={{
                fontSize: 42,
                color: '#ffffff',
                margin: 0,
              }}
            >
              내 사주와 MBTI로 보는 나의 운명
            </h2>
            <p
              style={{
                fontSize: 28,
                color: '#ffffff',
                opacity: 0.7,
                marginTop: 60,
                letterSpacing: 8,
              }}
            >
              과거의 지혜, 현대의 통찰
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
