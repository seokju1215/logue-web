// 환경에 따라 자동으로 로컬/프로덕션 URL 선택
const getBaseUrl = () => {
  // 개발 환경 (localhost): Vite 프록시 사용
  if (import.meta.env.DEV) {
    return '/aladin'
  }
  // 프로덕션: Vercel 서버리스 함수 사용
  return '/api/aladin-search'
}

export const searchBooksByAuthor = async (author) => {
  try {
    const baseUrl = getBaseUrl()
    
    // 개발 환경에서는 /aladin/ItemSearch.aspx로 요청
    // 프로덕션에서는 /api/aladin-search?Query=... 로 요청
    let url
    if (import.meta.env.DEV) {
      // Vite 프록시: /aladin/ItemSearch.aspx?...
      const ttbKey = import.meta.env.VITE_ALADIN_TTB_KEY
      url = `${baseUrl}/ItemSearch.aspx?ttbkey=${ttbKey}&Query=${encodeURIComponent(author)}&QueryType=Author&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101`
    } else {
      // Vercel API: /api/aladin-search?Query=... (ttbkey는 서버에서 자동 추가)
      url = `${baseUrl}?Query=${encodeURIComponent(author)}&QueryType=Author&MaxResults=10&start=1&SearchTarget=Book`
    }
    
    console.log('알라딘 API 요청 URL:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`알라딘 API 요청 실패: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.item || data.item.length === 0) {
      return []
    }
    
    // Flutter 형식과 동일하게 변환
    return data.item.map(book => ({
      isbn: book.isbn,
      isbn13: book.isbn13,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      published_date: book.pubDate,
      description: book.description,
      image: book.cover,
      link: book.link,
      page_count: book.subInfo?.itemPage || null,
      toc: book.fullDescription2 || null
    }))
  } catch (error) {
    console.error('알라딘 API 검색 실패:', error)
    return []
  }
}

export const searchBooks = async (query) => {
  try {
    const baseUrl = getBaseUrl()
    
    let url
    if (import.meta.env.DEV) {
      const ttbKey = import.meta.env.VITE_ALADIN_TTB_KEY
      url = `${baseUrl}/ItemSearch.aspx?ttbkey=${ttbKey}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101`
    } else {
      url = `${baseUrl}?Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book`
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`알라딘 API 요청 실패: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.item || data.item.length === 0) {
      return []
    }
    
    return data.item.map(book => ({
      isbn: book.isbn,
      isbn13: book.isbn13,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      published_date: book.pubDate,
      description: book.description,
      image: book.cover,
      link: book.link,
      page_count: book.subInfo?.itemPage || null,
      toc: book.fullDescription2 || null
    }))
  } catch (error) {
    console.error('알라딘 API 검색 실패:', error)
    return []
  }
}
