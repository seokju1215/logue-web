import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BookFrame from '../components/BookFrame'
import DownloadDialog from '../components/DownloadDialog'
import { searchBooksByAuthor } from '../lib/aladinApi'
import basicAvatar from '../assets/basic_avatar.png'
import './BookDetailPage.css'

const BookDetailPage = () => {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // 상태 관리
  const [book, setBook] = useState(null)
  const [lifebookUsers, setLifebookUsers] = useState([])
  const [authorBooks, setAuthorBooks] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLifebookUsers, setIsLoadingLifebookUsers] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showFullToc, setShowFullToc] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [showAllAuthors, setShowAllAuthors] = useState(false)

  // 책 정보 가져오기
  useEffect(() => {
    // 상태 초기화
    setShowAllAuthors(false)
    setLifebookUsers([])  // 인생책 사용자 목록 초기화
    setIsLoadingLifebookUsers(true)  // 로딩 상태 초기화
    setAuthorBooks({})  // 저자별 책 목록 초기화
    setErrorMessage('')  // 에러 메시지 초기화
    window.scrollTo(0, 0)
    
    fetchBookDetail()
  }, [bookId, location.state])

  const fetchBookDetail = async () => {
    try {
      setIsLoading(true)
      
      // 책 정보 가져오기
      let bookData = null
      
      // 1. location.state에 책 데이터가 있는지 먼저 확인 (다른 작품에서 넘어온 경우)
      if (location.state?.bookData) {
        bookData = location.state.bookData
        console.log('전달받은 책 데이터 사용:', bookData)
      }
      // 2. DB에서 검색
      else if (bookId?.length === 36) {
        // book_id로 검색
        const { data, error } = await supabase
          .from('user_books')
          .select('*, books(*)')
          .eq('book_id', bookId)
          .limit(1)
          .single()
        
        if (!error && data?.books) {
          bookData = data.books
        }
      } else {
        // ISBN으로 검색
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .or(`isbn.eq.${bookId},isbn13.eq.${bookId}`)
          .limit(1)
          .single()
        
        if (!error && data) {
          bookData = data
        }
      }

      if (!bookData) {
        throw new Error('책 정보를 찾을 수 없습니다.')
      }

      setBook(bookData)
      setIsLoading(false)

      // 인생책으로 설정한 사용자들 가져오기
      await fetchLifebookUsers(bookData)
      
      // 저자별 다른 작품 가져오기
      if (bookData?.author) {
        const authors = extractAuthors(bookData.author)
        await fetchOtherBooks(authors)
      }
    } catch (error) {
      console.error('책 정보 가져오기 실패:', error)
      setErrorMessage(error.message)
      setIsLoading(false)
      setIsLoadingLifebookUsers(false)
    }
  }

  const fetchLifebookUsers = async (bookData) => {
    try {
      setIsLoadingLifebookUsers(true)
      
      let query = supabase
        .from('user_books')
        .select(`
          *,
          profiles (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq('is_archived', false)

      // bookData.id가 있으면 UUID로 검색, 없으면 ISBN으로 직접 검색
      if (bookData.id) {
        query = query.eq('book_id', bookData.id)
      } else if (bookData.isbn13 || bookData.isbn) {
        const isbn = bookData.isbn13 || bookData.isbn
        query = query.eq('isbn', isbn)
      } else {
        console.log('책 ID 또는 ISBN이 없어서 인생책 사용자를 가져올 수 없습니다.')
        setLifebookUsers([])
        setIsLoadingLifebookUsers(false)
        return
      }

      const { data: userBooks, error } = await query

      if (error) throw error

      // 중복 제거 및 정렬
      const seenIds = new Set()
      const uniqueUsers = (userBooks || [])
        .filter(userBook => {
          if (!userBook.profiles || seenIds.has(userBook.profiles.id)) return false
          seenIds.add(userBook.profiles.id)
          return true
        })
        .map(userBook => userBook.profiles)

      setLifebookUsers(uniqueUsers)
      setIsLoadingLifebookUsers(false)
    } catch (error) {
      console.error('인생책 사용자 가져오기 실패:', error)
      setIsLoadingLifebookUsers(false)
    }
  }

  const extractAuthors = (authorString) => {
    if (!authorString) return []
    
    const endIdx = authorString.indexOf('(지은이)')
    const onlyAuthors = endIdx !== -1 
      ? authorString.substring(0, endIdx).trim()
      : authorString

    const cleanAuthors = onlyAuthors.endsWith(',') 
      ? onlyAuthors.substring(0, onlyAuthors.length - 1).trim()
      : onlyAuthors

    return cleanAuthors.split(',').map(author => author.trim()).filter(author => author.length > 0)
  }

  const fetchOtherBooks = async (authors) => {
    if (authors.length === 0) return

    const result = {}
    
    for (const author of authors) {
      try {
        console.log(`저자 "${author}"의 책 검색 시작 (알라딘 API)`)
        
        // 알라딘 API로 저자의 책 검색
        const aladinBooks = await searchBooksByAuthor(author)

        console.log(`저자 "${author}"의 알라딘 검색 결과:`, aladinBooks)

        if (aladinBooks && aladinBooks.length > 0) {
          // 현재 보고 있는 책 제외
          const filteredBooks = aladinBooks.filter(book => {
            const bookIsbn = book.isbn13 || book.isbn
            const currentIsbn = bookId
            return bookIsbn !== currentIsbn
          })
          
          if (filteredBooks.length > 0) {
            result[author] = filteredBooks
          }
        }
      } catch (error) {
        console.error(`저자 "${author}"의 책 검색 실패:`, error)
      }
    }

    console.log('저자별 책 결과:', result)
    setAuthorBooks(result)
  }

  const cleanToc = (rawToc) => {
    if (!rawToc || rawToc.trim() === '') return ''
    return rawToc.replace(/<[^>]+>/g, '').trim()
  }

  const cleanDescription = (rawDescription) => {
    if (!rawDescription || rawDescription.trim() === '') return ''
    return rawDescription.trim()
  }

  const launchAladinLink = (link) => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  const handleBookClick = (book) => {
    const bookId = book.isbn13 || book.isbn || ''
    if (bookId) {
      // 책 데이터를 state로 함께 전달
      navigate(`/book/${bookId}`, { state: { bookData: book } })
    }
  }

  const handleUserClick = (e) => {
    e.preventDefault()
    setShowDownloadDialog(true)
  }

  if (isLoading) {
    return (
      <div className="book-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="book-detail-page">
        <div className="error-container">
          <p>{errorMessage || '책 정보를 불러오지 못했어요.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="book-detail-page">
      {/* 헤더 */}
      <header className="book-detail-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <img src="/back_arrow.svg" alt="뒤로가기" />
        </button>
        <h1>책 정보</h1>
      </header>

      <main className="book-detail-main">
        {/* 책 정보 헤더 */}
        <section className="book-header">
          <div className="book-info">
            <h2 className="book-title">{book.title || ''}</h2>
            {book.subtitle && book.subtitle.trim() && (
              <>
                <p className="book-subtitle">{book.subtitle}</p>
                <div style={{ height: '10px' }}></div>
              </>
            )}
            <p className="book-author">{book.author || ''}</p>
            <p className="book-publisher">
              {book.publisher || ''} | {(book.published_date || '').split('-').slice(0, 2).join('. ')}
            </p>
            {book.page_count && (
              <p className="book-pages">{book.page_count} P</p>
            )}
            <p className="book-source">도서 정보: 알라딘 제공</p>
            <button 
              className="aladin-link"
              onClick={() => launchAladinLink(book.link)}
            >
              알라딘에서 보기 &gt;
            </button>
          </div>
          <div className="book-cover">
            <BookFrame imageUrl={book.image || ''} />
          </div>
        </section>

        {/* 인생책 친구 섹션 */}
        {lifebookUsers.length > 0 && (
          <>
            <div style={{ height: '37px' }}></div>
            <section className="lifebook-users">
              <div className="section-header">
                <h3>이 책을 인생 책으로 설정한 친구</h3>
                <span className="user-count">{lifebookUsers.length}명</span>
              </div>
              <div style={{ height: '12px' }}></div>
              <div className="users-list">
                {lifebookUsers.slice(0, 3).map((user) => (
                  <div key={user.id} className="user-item" onClick={handleUserClick}>
                    <img 
                      src={user.avatar_url && user.avatar_url !== 'basic' ? user.avatar_url : basicAvatar} 
                      alt={user.name || user.username}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <p className="user-name">{user.name || user.username}</p>
                      <p className="user-username">@{user.username}</p>
                    </div>
                    <button className="follow-button">팔로우</button>
                  </div>
                ))}
              </div>
              <div>
                {lifebookUsers.length > 3 && (
                  <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button className="more-button" onClick={() => setShowDownloadDialog(true)}>더보기</button>
                  </div>
                )}
                <div style={{ height: lifebookUsers.length > 3 ? '0px' : '30px' }}></div>
                <div className="divider"></div>
              </div>
            </section>
          </>
        )}

        {/* 책 정보 섹션 */}
        <ExpandableText
          title="책 정보"
          content={cleanDescription(book.description)}
          maxLines={5}
          expanded={showFullDescription}
          onToggle={() => setShowFullDescription(true)}
        />

        {/* 목차 섹션 */}
        {book.toc && book.toc !== '' && (
          <ExpandableText
            title="목차"
            content={cleanToc(book.toc)}
            maxLines={7}
            expanded={showFullToc}
            onToggle={() => setShowFullToc(true)}
          />
        )}

        {/* 저자별 다른 작품 섹션 */}
        {Object.keys(authorBooks).length > 0 && (
          <>
            <div style={{ height: '37px' }}></div>
            <section className="other-works">
              <div className="other-works-header">
                <h3>저자의 다른 작품</h3>
              </div>
              <div style={{ height: '16px' }}></div>
              {(() => {
                const authors = Object.keys(authorBooks)
                const displayAuthors = showAllAuthors ? authors : [authors[0]]
                
                return (
                  <>
                    {displayAuthors.map((author, authorIndex) => {
                      const authorBooksForAuthor = authorBooks[author] || []
                      
                      return (
                        <div key={author}>
                          {authorIndex > 0 && <div style={{ height: '24px' }}></div>}
                          <div className="author-name">
                            <h4>{author}</h4>
                          </div>
                          <div style={{ height: '16px' }}></div>
                          <div className="books-scroll">
                            {authorBooksForAuthor.map((book, index) => {
                              const screenWidth = window.innerWidth <= 450 ? window.innerWidth : 400
                              const horizontalPadding = 26
                              const spacing = 23
                              const itemCountPerRow = 3

                              const totalSpacing = (itemCountPerRow - 1) * spacing
                              const availableWidth = screenWidth - (2 * horizontalPadding) - totalSpacing
                              const bookWidth = availableWidth / itemCountPerRow
                              const bookHeight = bookWidth * 1.5

                              return (
                                <div 
                                  key={book.isbn || index}
                                  className="book-card"
                                  onClick={() => handleBookClick(book)}
                                  style={{ width: `${bookWidth}px` }}
                                >
                                  <div style={{ width: `${bookWidth}px`, height: `${bookHeight}px` }}>
                                    <BookFrame imageUrl={book.image || ''} />
                                  </div>
                                  <div style={{ height: '8px' }}></div>
                                  <p className="book-card-title">{book.title || ''}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    {authors.length > 1 && !showAllAuthors && (
                      <>
                        <div style={{ height: '16px' }}></div>
                        <div className="more-authors-button">
                          <button className="more-button" onClick={() => setShowAllAuthors(true)}>더보기</button>
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
              <div style={{ height: '12px' }}></div>
              <div className="divider"></div>
            </section>
          </>
        )}

        <div style={{ height: '40px' }}></div>
      </main>

      {/* DownloadDialog */}
      {showDownloadDialog && (
        <DownloadDialog
          onClose={() => setShowDownloadDialog(false)}
          onEdit={() => {}}
          onDelete={() => setShowDownloadDialog(false)}
        />
      )}
    </div>
  )
}

// 확장 가능한 텍스트 컴포넌트
const ExpandableText = ({ title, content, maxLines, expanded, onToggle }) => {
  const contentRef = useRef(null)
  const [shouldShowMore, setShouldShowMore] = useState(false)

  useEffect(() => {
    if (contentRef.current) {
      const maxHeight = maxLines * 2 * 14 // line-height: 2, font-size: 14px
      const actualHeight = contentRef.current.scrollHeight
      setShouldShowMore(actualHeight > maxHeight)
    }
  }, [content, maxLines])

  if (!content || content.trim() === '') return null

  return (
    <div className="expandable-text">
      <div className="text-content">
        <div style={{ height: title === "목차" ? '39px' : '22px' }}></div>
        <h3>{title}</h3>
        <div style={{ height: '12px' }}></div>
        <p 
          ref={contentRef}
          className="expandable-text-content"
          style={{
            display: 'block',
            overflow: expanded ? 'visible' : 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'keep-all',
            maxHeight: expanded ? 'none' : `${maxLines * 2 * 14}px` // line-height: 2, font-size: 14px
          }}
        >
          {content}
        </p>
      </div>
      <div>
        {shouldShowMore && !expanded && (
          <div style={{  height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="expand-button" onClick={onToggle}>
              더보기
            </button>
          </div>
        )}
        <div style={{ height: shouldShowMore && !expanded ? '0px' : '30px' }}></div>
        <div className="divider"></div>
      </div>
    </div>
  )
}

export default BookDetailPage