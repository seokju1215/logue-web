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
    
    console.log('🔍 환경 확인:', {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      baseUrl: baseUrl
    })
    
    // 개발 환경에서는 /aladin/ItemSearch.aspx로 요청
    // 프로덕션에서는 /api/aladin-search?Query=... 로 요청
    let url
    if (import.meta.env.DEV) {
      // Vite 프록시: /aladin/ItemSearch.aspx?...
      const ttbKey = import.meta.env.VITE_ALADIN_TTB_KEY
      console.log('🔑 개발 환경 TTB 키 확인:', ttbKey ? '✅ 있음' : '❌ 없음')
      url = `${baseUrl}/ItemSearch.aspx?ttbkey=${ttbKey}&Query=${encodeURIComponent(author)}&QueryType=Author&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101`
    } else {
      // Vercel API: /api/aladin-search?Query=... (ttbkey는 서버에서 자동 추가)
      console.log('🚀 프로덕션 환경 - 서버에서 TTB 키 추가')
      url = `${baseUrl}?Query=${encodeURIComponent(author)}&QueryType=Author&MaxResults=10&start=1&SearchTarget=Book`
    }
    
    console.log('📡 알라딘 API 요청 URL:', url)
    
    const response = await fetch(url)
    
    console.log('📥 응답 상태:', response.status, response.statusText)
    
    if (!response.ok) {
      // 에러 응답 본문 확인
      const errorText = await response.text()
      console.error('❌ 에러 응답:', errorText)
      throw new Error(`알라딘 API 요청 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('✅ 응답 데이터:', data.item?.length || 0, '개의 결과')
    
    if (!data.item || data.item.length === 0) {
      return []
    }
    
    // Flutter 형식과 동일하게 변환
    return data.item.map(book => {
      // 이미지 처리 (Flutter와 동일)
      let cover = book.cover || ''
      if (cover.startsWith('http://')) {
        cover = cover.replace('http://', 'https://')
      }
      // cover(sum|숫자)를 cover500으로 변경
      cover = cover.replace(/cover(sum|\d{2,3})/g, 'cover500')

      // 제목과 부제 분리 (Flutter와 동일)
      let rawTitle = book.title || ''
      let title = rawTitle
      let subtitle = ''

      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ')
        title = parts[0].trim()
        subtitle = parts.slice(1).join(' - ').trim()
      }

      // subInfo에서 subtitle 우선순위 적용
      const rawSub = book.subInfo?.subTitle?.toString().trim()
      if (rawSub && rawSub.length > 0) {
        subtitle = rawSub
      }

      // 목차 처리 (HTML 태그 제거)
      let toc = book.subInfo?.toc?.toString() || ''
      if (toc) {
        toc = toc
          .replace(/<[^>]*>/g, '') // HTML 태그 제거
          .replace(/&nbsp;/g, ' ') // 공백 문자 처리
          .trim()
      }

      return {
        isbn: book.isbn,
        isbn13: book.isbn13,
        title: title,
        subtitle: subtitle,
        author: book.author,
        publisher: book.publisher,
        published_date: book.pubDate,
        description: book.description,
        image: cover,
        link: book.link,
        page_count: book.subInfo?.itemPage || null,
        toc: toc
      }
    })
  } catch (error) {
    console.error('알라딘 API 검색 실패:', error)
    return []
  }
}

export const searchBooks = async (query) => {
  try {
    const baseUrl = getBaseUrl()
    
    console.log('🔍 환경 확인:', {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      baseUrl: baseUrl
    })
    
    let url
    if (import.meta.env.DEV) {
      const ttbKey = import.meta.env.VITE_ALADIN_TTB_KEY
      console.log('🔑 개발 환경 TTB 키 확인:', ttbKey ? '✅ 있음' : '❌ 없음')
      url = `${baseUrl}/ItemSearch.aspx?ttbkey=${ttbKey}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101`
    } else {
      console.log('🚀 프로덕션 환경 - 서버에서 TTB 키 추가')
      url = `${baseUrl}?Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book`
    }
    
    console.log('📡 알라딘 API 요청 URL:', url)
    
    const response = await fetch(url)
    
    console.log('📥 응답 상태:', response.status, response.statusText)
    
    if (!response.ok) {
      // 에러 응답 본문 확인
      const errorText = await response.text()
      console.error('❌ 에러 응답:', errorText)
      throw new Error(`알라딘 API 요청 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('✅ 응답 데이터:', data.item?.length || 0, '개의 결과')
    
    if (!data.item || data.item.length === 0) {
      return []
    }
    
    return data.item.map(book => {
      // 이미지 처리 (Flutter와 동일)
      let cover = book.cover || ''
      if (cover.startsWith('http://')) {
        cover = cover.replace('http://', 'https://')
      }
      // cover(sum|숫자)를 cover500으로 변경
      cover = cover.replace(/cover(sum|\d{2,3})/g, 'cover500')

      // 제목과 부제 분리 (Flutter와 동일)
      let rawTitle = book.title || ''
      let title = rawTitle
      let subtitle = ''

      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ')
        title = parts[0].trim()
        subtitle = parts.slice(1).join(' - ').trim()
      }

      // subInfo에서 subtitle 우선순위 적용
      const rawSub = book.subInfo?.subTitle?.toString().trim()
      if (rawSub && rawSub.length > 0) {
        subtitle = rawSub
      }

      // 목차 처리 (HTML 태그 제거)
      let toc = book.subInfo?.toc?.toString() || ''
      if (toc) {
        toc = toc
          .replace(/<[^>]*>/g, '') // HTML 태그 제거
          .replace(/&nbsp;/g, ' ') // 공백 문자 처리
          .trim()
      }

      return {
        isbn: book.isbn,
        isbn13: book.isbn13,
        title: title,
        subtitle: subtitle,
        author: book.author,
        publisher: book.publisher,
        published_date: book.pubDate,
        description: book.description,
        image: cover,
        link: book.link,
        page_count: book.subInfo?.itemPage || null,
        toc: toc
      }
    })
  } catch (error) {
    console.error('알라딘 API 검색 실패:', error)
    return []
  }
}
