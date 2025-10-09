export default async function handler(req, res) {
  try {
    const TTB_KEY = process.env.ALADIN_TTB_KEY
    if (!TTB_KEY) {
      return res.status(500).json({ error: 'Missing ALADIN_TTB_KEY env' })
    }

    // 원본 알라딘 API
    const base = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx'

    // 프런트에서 넘어온 쿼리들을 그대로 전달 + ttbkey/output/version 보정
    const params = new URLSearchParams(req.query)
    if (!params.has('ttbkey')) params.set('ttbkey', TTB_KEY)
    if (!params.has('output')) params.set('output', 'js')
    if (!params.has('Version')) params.set('Version', '20131101')

    const upstream = await fetch(`${base}?${params.toString()}`)
    const text = await upstream.text()

    // CORS 허용(원하면 특정 도메인으로 제한)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8')

    return res.status(upstream.status).send(text)
  } catch (e) {
    return res.status(500).json({ error: 'Proxy failed', detail: String(e) })
  }
}

// (옵션) 사전 플라이트 대응
export const config = {
  api: {
    bodyParser: false,
  },
}
