export default async function handler(req, res) {
  try {
    const TTB_KEY = process.env.ALADIN_TTB_KEY
    if (!TTB_KEY) {
      console.error('ALADIN_TTB_KEY 환경변수가 설정되지 않았습니다')
      return res.status(500).json({ error: 'Missing ALADIN_TTB_KEY env' })
    }

    // 원본 알라딘 API
    const base = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx'

    // 프런트에서 넘어온 쿼리들을 그대로 전달 + ttbkey/output/version 보정
    const params = new URLSearchParams(req.query)
    if (!params.has('ttbkey')) params.set('ttbkey', TTB_KEY)
    if (!params.has('output')) params.set('output', 'js')
    if (!params.has('Version')) params.set('Version', '20131101')

    const url = `${base}?${params.toString()}`
    console.log('알라딘 API 요청:', url.replace(TTB_KEY, '***'))

    // Node.js 18+ 환경에서는 global fetch 사용
    const upstream = await fetch(url)
    
    if (!upstream.ok) {
      console.error('알라딘 API 응답 오류:', upstream.status, upstream.statusText)
    }
    
    const text = await upstream.text()
    console.log('알라딘 API 응답:', text.substring(0, 200))

    // CORS 허용(원하면 특정 도메인으로 제한)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8')

    return res.status(upstream.status).send(text)
  } catch (e) {
    console.error('서버리스 함수 에러:', e)
    return res.status(500).json({ error: 'Proxy failed', detail: String(e), message: e.message })
  }
}

// (옵션) 사전 플라이트 대응
export const config = {
  api: {
    bodyParser: false,
  },
}
