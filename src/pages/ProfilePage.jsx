import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User } from '../components/icons'
import { getProfileByUsername, getUserBooks, getArchivedBooks } from '../lib/supabase'
import './ProfilePage.css'
import BioContent from '../components/BioContent'
import DownloadDialog from '../components/DownloadDialog'
import React from 'react'
import basicAvatar from '../assets/basic_avatar.png'

function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [books, setBooks] = useState([])
  const [archivedBooks, setArchivedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [imageLoadingStates, setImageLoadingStates] = useState({})
  const [imageErrorStates, setImageErrorStates] = useState({})
  const [activeTab, setActiveTab] = useState(0) // 0: 대표, 1: 책장
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [containerWidth, setContainerWidth] = useState(430) // 기본 너비
  
  // 스와이프 관련 상태
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStartY, setTouchStartY] = useState(null)
  const [touchEndY, setTouchEndY] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [username])

  // 화면 크기 변경 감지
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector('.profile-page')
      if (container) {
        // iOS에서 정확한 너비 계산을 위해 여러 방법 시도
        const rect = container.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(container)
        const width = rect.width || parseFloat(computedStyle.width) || container.offsetWidth
        
        // iOS에서 안정적인 너비 보장
        const stableWidth = Math.max(width, 320) // 최소 너비 보장
        setContainerWidth(stableWidth)
      }
    }

    // 컴포넌트 마운트 시 즉시 실행
    updateContainerWidth()
    
    // iOS에서 추가 이벤트 리스너
    window.addEventListener('resize', updateContainerWidth)
    window.addEventListener('orientationchange', updateContainerWidth)
    window.addEventListener('load', updateContainerWidth)
    
    // iOS Safari에서 DOM이 완전히 로드된 후 실행
    if (document.readyState === 'complete') {
      setTimeout(updateContainerWidth, 100)
    }
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth)
      window.removeEventListener('orientationchange', updateContainerWidth)
      window.removeEventListener('load', updateContainerWidth)
    }
  }, [])

  // 프로필이 로드된 후에도 컨테이너 너비 업데이트
  useEffect(() => {
    if (profile && !loading) {
      const updateContainerWidth = () => {
        const container = document.querySelector('.profile-page')
        if (container) {
          // iOS에서 정확한 너비 계산을 위해 여러 방법 시도
          const rect = container.getBoundingClientRect()
          const computedStyle = window.getComputedStyle(container)
          const width = rect.width || parseFloat(computedStyle.width) || container.offsetWidth
          
          // iOS에서 안정적인 너비 보장
          const stableWidth = Math.max(width, 320) // 최소 너비 보장
          setContainerWidth(stableWidth)
        }
      }
      
      // iOS에서 더 긴 지연 시간 적용
      setTimeout(updateContainerWidth, 100)
      setTimeout(updateContainerWidth, 300)
      setTimeout(updateContainerWidth, 500)
      setTimeout(updateContainerWidth, 1000) // iOS에서 추가 지연
    }
  }, [profile, loading])

  // 스크롤 이벤트 감지 (책장 탭에서만)
  useEffect(() => {
    if (activeTab === 1 && profile?.show_archived_books) {
      const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        setIsScrolled(scrollTop > 100)
      }

      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    } else {
      setIsScrolled(false)
    }
  }, [activeTab, profile?.show_archived_books])

  // GA 방문자 추적
  useEffect(() => {
    if (profile && !loading) {
      // GA 이벤트 전송
      if (window.gtag) {
        gtag('event', 'profile_view', {
          'profile_user_id': profile.id,
          'profile_username': username,
          'profile_name': profile.name || ''
        })
      }
    }
  }, [profile, username, loading])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const profileData = await getProfileByUsername(username)
      setProfile(profileData)
      
      // 사용자의 책들 가져오기
      const booksData = await getUserBooks(profileData.id)
      setBooks(booksData)

      // show_archived_books가 true이면 보관된 책들도 가져오기
      if (profileData.show_archived_books) {
        await fetchArchivedBooks(profileData.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchArchivedBooks = async (userId) => {
    try {
      setArchivedLoading(true)
      const archivedData = await getArchivedBooks(userId)
      setArchivedBooks(archivedData)
    } catch (err) {
      console.error('보관된 책 가져오기 실패:', err)
    } finally {
      setArchivedLoading(false)
    }
  }

  const handleBookClick = (book) => {
    console.log('책 클릭됨:', book)
    // 책장 탭에서는 클릭 비활성화
    if (activeTab === 1) {
      return
    }
    
    const bookId = book.book_id || book.id || (book.books && book.books.id)
    if (bookId && username) {
      navigate(`/${username}/posts`, { state: { bookId } })
    }
  }

  // 이미지 URL 안전화 (http -> https)
  const getSafeImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    return imageUrl.startsWith('http://') 
      ? imageUrl.replaceFirst('http://', 'https://')
      : imageUrl
  }

  // 이미지 로딩 시작
  const handleImageLoadStart = (bookId) => {
    setImageLoadingStates(prev => ({ ...prev, [bookId]: true }))
    setImageErrorStates(prev => ({ ...prev, [bookId]: false }))
  }

  // 이미지 로딩 완료
  const handleImageLoad = (bookId) => {
    setImageLoadingStates(prev => ({ ...prev, [bookId]: false }))
  }

  // 이미지 로딩 에러
  const handleImageError = (bookId) => {
    setImageLoadingStates(prev => ({ ...prev, [bookId]: false }))
    setImageErrorStates(prev => ({ ...prev, [bookId]: true }))
  }

  // 프로필 사진 클릭 시 모달 오픈
  const handleAvatarClick = () => {
    setShowAvatarModal(true)
  }
  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false)
  }

  const handleTabClick = (tabIndex) => {
    if (isTransitioning) return
    setActiveTab(tabIndex)
  }

  // 터치 시작
  const handleTouchStart = (e) => {
    if (!profile?.show_archived_books) return
    setTouchEnd(null)
    setTouchEndY(null)
    setTouchStart(e.targetTouches[0].clientX)
    setTouchStartY(e.targetTouches[0].clientY)
  }

  // 터치 이동
  const handleTouchMove = (e) => {
    if (!profile?.show_archived_books) return
    
    const currentX = e.targetTouches[0].clientX
    const currentY = e.targetTouches[0].clientY
    
    // 항상 터치 위치 업데이트
    setTouchEnd(currentX)
    setTouchEndY(currentY)
  }

  // 터치 종료 - 스와이프 감지
  const handleTouchEnd = () => {
    if (!profile?.show_archived_books || !touchStart || !touchEnd || !touchStartY || !touchEndY) return
    
    const distanceX = touchStart - touchEnd
    const distanceY = touchStartY - touchEndY
    const isLeftSwipe = distanceX > 30
    const isRightSwipe = distanceX < -30

    console.log('스와이프 감지:', { distanceX, distanceY, isLeftSwipe, isRightSwipe, activeTab })

    // 수평 스와이프만 탭 전환으로 처리 (수직은 스크롤)
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 30) {
      if (isLeftSwipe && activeTab === 0) {
        // 왼쪽으로 스와이프 - 대표에서 책장으로
        console.log('왼쪽 스와이프 - 책장으로 전환')
        setIsTransitioning(true)
        setActiveTab(1)
        setTimeout(() => setIsTransitioning(false), 300)
      } else if (isRightSwipe && activeTab === 1) {
        // 오른쪽으로 스와이프 - 책장에서 대표로
        console.log('오른쪽 스와이프 - 대표로 전환')
        setIsTransitioning(true)
        setActiveTab(0)
        setTimeout(() => setIsTransitioning(false), 300)
      }
    }
    
    // 터치 상태 초기화
    setTouchStart(null)
    setTouchEnd(null)
    setTouchStartY(null)
    setTouchEndY(null)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>프로필을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>프로필을 찾을 수 없습니다</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="back-button">
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  const avatarUrl = profile?.avatar_url && profile.avatar_url !== 'basic'
    ? profile.avatar_url
    : '/assets/basic_avatar.png'

  return (
    <div className="profile-page">
      {/* 헤더 */}
      <header className={`profile-header ${activeTab === 1 && isScrolled ? 'scrolled' : ''}`} style={{ 
        padding: '16px 25px',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1>{profile?.username || '사용자'}</h1>
      </header>

      {/* 프로필 사진 확대 모달 */}
      {showAvatarModal && (
        <div className="avatar-modal" onClick={handleCloseAvatarModal}>
          <div className="avatar-modal-backdrop" />
          <div className="avatar-modal-content">
            <img 
              src={profile?.avatar_url && profile.avatar_url !== 'basic' ? profile.avatar_url : basicAvatar} 
              alt="프로필 확대" 
              width={250} 
              height={250} 
              style={{borderRadius: '50%'}} 
            />
          </div>
        </div>
      )}

      {/* DownloadDialog */}
      {showDownloadDialog && (
        <DownloadDialog 
          onClose={() => setShowDownloadDialog(false)}
          onEdit={() => {
            console.log('Edit clicked')
            setShowDownloadDialog(false)
          }}
          onDelete={() => {
            console.log('Delete clicked')
            setShowDownloadDialog(false)
          }}
        />
      )}

      <main className="profile-main" style={{ padding: '10px 0px 20px' }}>
        {/* 프로필 정보 */}
        <section className={`profile-info ${activeTab === 1 && isScrolled ? 'scrolled' : ''}`}>
          <div className="profile-details">
            <div style={{
              fontSize: '22px',
              color: '#1A1A1A', // AppColors.black900
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              {profile?.name || ''}
            </div>
            
            {/* SizedBox(height: 3) */}
            <div style={{ height: '3px' }}></div>
            
            {/* job이 비어있을 때 */}
            {(!profile?.job || profile.job === '') && (
              <div style={{ height: '4px' }}></div>
            )}
            
            {/* job이 있을 때 */}
            {profile?.job && profile.job !== '' && (
              <>
                <div style={{
                  fontSize: '15px',
                  color: '#858585', // AppColors.black500
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  {profile.job}
                </div>
                <div style={{ height: '9px' }}></div>
              </>
            )}
            
            <BioContent bio={profile?.bio || ''} />
            
            {/* job이 비어있을 때 */}
            {(!profile?.job || profile.job === '') && (
              <>
                <div style={{ height: '27.5px' }}></div>
              </>
            )}
            
            <div style={{ height: '9px' }}></div>
          </div>
          <div className="profile-avatar" onClick={handleAvatarClick}>
            {profile?.avatar_url && profile.avatar_url !== 'basic' ? (
              <img src={profile.avatar_url} alt={profile.name} />
            ) : (
              <img src={basicAvatar} alt="기본 아바타" />
            )}
          </div>
        </section>

        {/* 팔로워/팔로잉 카운트 */}
        <section className={`follow-stats ${activeTab === 1 && isScrolled ? 'scrolled' : ''}`}>
          <div className="stat-item">
            <span className="stat-label" onClick={() => setShowDownloadDialog(true)} style={{cursor: 'pointer'}}>팔로워</span>
            <span className="stat-number" onClick={() => setShowDownloadDialog(true)} style={{cursor: 'pointer'}}>{profile?.followers || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" onClick={() => setShowDownloadDialog(true)} style={{cursor: 'pointer'}}>팔로잉</span>
            <span className="stat-number" onClick={() => setShowDownloadDialog(true)} style={{cursor: 'pointer'}}>{profile?.following || 0}</span>
          </div>
          <button 
            className="follow-btn-ui" 
            type="button"
            onClick={() => setShowDownloadDialog(true)}
          >
            팔로우 +
          </button>
        </section>

        {/* 책장 */}
        <section className="books-section">
          {/* show_archived_books가 true이면 탭바 표시 */}
          {profile?.show_archived_books ? (
            <div 
              className="books-tab-container"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* 탭바 */}
              <div className="books-tabs">
                <button
                  className={`tab-button ${activeTab === 0 ? 'active' : ''}`}
                  onClick={() => handleTabClick(0)}
                >
                  대표
                </button>
                <button
                  className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
                  onClick={() => handleTabClick(1)}
                >
                  책장
                </button>
              </div>

              {/* 탭 내용 */}
              <div className={`tab-content ${isTransitioning ? 'swiping' : ''}`}>
                {activeTab === 0 ? (
                  // 대표 탭 - 기존 책들
                  books.length > 0 ? (
                    <div className="books-grid" style={{ 
                      columnGap: '23px',
                      rowGap: '30px'
                    }}>
                      {books.map((book, index) => {
                        const bookId = book.id
                        const imageUrl = book.books?.image || ''
                        const safeImageUrl = getSafeImageUrl(imageUrl)
                        const isLoading = imageLoadingStates[bookId]
                        const hasError = imageErrorStates[bookId]

                        return (
                          <div 
                            key={bookId} 
                            className="book-item"
                            onClick={() => handleBookClick(book)}
                          >
                            <div className="book-cover">
                              {safeImageUrl && !hasError ? (
                                <>
                                  {isLoading && (
                                    <div className="book-loading">
                                      <div className="loading-spinner-small"></div>
                                    </div>
                                  )}
                                  <img 
                                    src={safeImageUrl} 
                                    alt={book.books?.title || '책 표지'}
                                    onLoadStart={() => handleImageLoadStart(bookId)}
                                    onLoad={() => handleImageLoad(bookId)}
                                    onError={() => handleImageError(bookId)}
                                    style={{ 
                                      display: isLoading ? 'none' : 'block',
                                      borderRadius: '0 !important',
                                      border: 'none'
                                    }}
                                  />
                                </>
                              ) : (
                                <div className="book-placeholder">
                                  <span>📚</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="empty-books">
                      <p>저장된 책이 없습니다.</p>
                    </div>
                  )
                ) : (
                  // 책장 탭 - 보관된 책들 (5열 그리드)
                  archivedLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>책장을 불러오는 중...</p>
                    </div>
                  ) : archivedBooks.length > 0 ? (
                    <div className="bookshelf-container">
                      {/* 책들과 선반을 함께 렌더링 */}
                      <div className="bookshelf-rows">
                        {Array.from({ length: Math.ceil(archivedBooks.length / 5) }, (_, rowIndex) => {
                          const startIndex = rowIndex * 5;
                          const endIndex = Math.min(startIndex + 5, archivedBooks.length);
                          const rowBooks = archivedBooks.slice(startIndex, endIndex);
                          
                          return (
                            <div key={rowIndex} className="bookshelf-row">
                              {/* 책들 */}
                              <div className="books-row">
                                {rowBooks.map((book, bookIndex) => {
                                  const bookId = book.id
                                  const imageUrl = book.books?.image || ''
                                  const safeImageUrl = getSafeImageUrl(imageUrl)
                                  const isLoading = imageLoadingStates[bookId]
                                  const hasError = imageErrorStates[bookId]

                                  return (
                                    <div 
                                      key={bookId} 
                                      className="archived-book-item"
                                      onClick={() => handleBookClick(book)}
                                    >
                                      <div className="book-cover">
                                        {safeImageUrl && !hasError ? (
                                          <>
                                            {isLoading && (
                                              <div className="book-loading">
                                                <div className="loading-spinner-small"></div>
                                              </div>
                                            )}
                                            <img 
                                              src={safeImageUrl} 
                                              alt={book.books?.title || '책 표지'}
                                              onLoadStart={() => handleImageLoadStart(bookId)}
                                              onLoad={() => handleImageLoad(bookId)}
                                              onError={() => handleImageError(bookId)}
                                              style={{ 
                                                display: isLoading ? 'none' : 'block',
                                                borderRadius: '0 !important',
                                                border: 'none'
                                              }}
                                            />
                                          </>
                                        ) : (
                                          <div className="book-placeholder">
                                            <span>📚</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              
                              {/* 선반 */}
                              <div className="shelf-row">
                                <div className="shelf"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-books">
                      <p>보관된 책이 없습니다.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            // show_archived_books가 false이면 기존 책장 표시
            books.length > 0 ? (
              <div className="books-grid" style={{ 
                columnGap: '23px',
                rowGap: '30px'
              }}>
              {books.map((book, index) => {
                const bookId = book.id
                const imageUrl = book.books?.image || ''
                const safeImageUrl = getSafeImageUrl(imageUrl)
                const isLoading = imageLoadingStates[bookId]
                const hasError = imageErrorStates[bookId]

                return (
                  <div 
                    key={bookId} 
                    className="book-item"
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="book-cover">
                      {safeImageUrl && !hasError ? (
                        <>
                          {isLoading && (
                            <div className="book-loading">
                              <div className="loading-spinner-small"></div>
                            </div>
                          )}
                          <img 
                            src={safeImageUrl} 
                            alt={book.books?.title || '책 표지'}
                            onLoadStart={() => handleImageLoadStart(bookId)}
                            onLoad={() => handleImageLoad(bookId)}
                            onError={() => handleImageError(bookId)}
                            style={{ 
                              display: isLoading ? 'none' : 'block',
                              borderRadius: '0 !important',
                              border: 'none'
                            }}
                          />
                        </>
                      ) : (
                        <div className="book-placeholder">
                          <span>📚</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-books">
              <p>저장된 책이 없습니다.</p>
            </div>
            )
          )}
        </section>
      </main>
    </div>
  )
}

export default ProfilePage 