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

  useEffect(() => {
    fetchProfile()
  }, [username])

  // 화면 크기 변경 감지
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector('.profile-page')
      if (container) {
        setContainerWidth(container.offsetWidth)
      }
    }

    // 컴포넌트 마운트 시 즉시 실행
    updateContainerWidth()
    
    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', updateContainerWidth)
    
    return () => window.removeEventListener('resize', updateContainerWidth)
  }, [])

  // 프로필이 로드된 후에도 컨테이너 너비 업데이트
  useEffect(() => {
    if (profile && !loading) {
      const updateContainerWidth = () => {
        const container = document.querySelector('.profile-page')
        if (container) {
          setContainerWidth(container.offsetWidth)
        }
      }
      
      // 약간의 지연을 두고 실행 (DOM이 완전히 렌더링된 후)
      setTimeout(updateContainerWidth, 100)
    }
  }, [profile, loading])

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
    // 책 클릭 시 이동 비활성화
    console.log('책 클릭됨:', book)
    // const bookId = book.book_id || book.id || (book.books && book.books.id)
    // if (bookId && username) {
    //   navigate(`/u/${username}/posts`, { state: { bookId } })
    // }
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
    
    // 수직 스크롤이 더 크면 기본 스크롤 동작을 허용
    if (touchStart && touchStartY) {
      const deltaX = Math.abs(currentX - touchStart)
      const deltaY = Math.abs(currentY - touchStartY)
      
      // 수직 스크롤이 수평 스와이프보다 크면 이벤트를 막지 않음
      if (deltaY > deltaX) {
        return
      }
    }
    
    setTouchEnd(currentX)
    setTouchEndY(currentY)
  }

  // 터치 종료 - 스와이프 감지
  const handleTouchEnd = () => {
    if (!profile?.show_archived_books || !touchStart || !touchEnd) return
    
    const distanceX = touchStart - touchEnd
    const distanceY = touchStartY - touchEndY
    const isLeftSwipe = distanceX > 50
    const isRightSwipe = distanceX < -50

    // 수평 스와이프만 탭 전환으로 처리 (수직은 스크롤)
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe && activeTab === 0) {
        // 왼쪽으로 스와이프 - 대표에서 책장으로
        setIsTransitioning(true)
        setActiveTab(1)
        setTimeout(() => setIsTransitioning(false), 300)
      } else if (isRightSwipe && activeTab === 1) {
        // 오른쪽으로 스와이프 - 책장에서 대표로
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
      <header className="profile-header" style={{ 
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
        <section className="profile-info">
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
        <section className="follow-stats">
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
            <div className="books-tab-container">
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
              <div 
                className={`tab-content ${isTransitioning ? 'swiping' : ''}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
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
                      {/* 선반들 */}
                      <div className="shelves">
                        {Array.from({ length: Math.ceil(archivedBooks.length / 5) }, (_, rowIndex) => {
                          // Flutter의 _buildBookshelfLayout과 동일한 계산
                          const crossAxisCount = 5;
                          const crossAxisSpacing = 11.7;
                          const itemAspectRatio = 98 / 138; // Flutter와 동일
                          const bookPadding = 22.0;
                          
                          // 실제 화면 너비 계산 (동적 너비 - 패딩)
                          const availableWidth = containerWidth - (bookPadding * 2);
                          const totalSpacing = crossAxisSpacing * (crossAxisCount - 1);
                          const itemWidth = (availableWidth - totalSpacing) / crossAxisCount;
                          const itemHeight = itemWidth / itemAspectRatio;
                          
                          // 책과 선반 사이의 간격을 유동적으로 계산 (최소값 증가)
                          const bookShelfSpacing = Math.max(38.15, Math.min(30, itemHeight * 0.5));
                          const firstShelfY = Math.max(50, Math.min(120, itemHeight));
                          const shelfY = firstShelfY+16 + (itemHeight + bookShelfSpacing-3.15) * rowIndex;
                          
                          return (
                            <div 
                              key={rowIndex} 
                              className="shelf"
                              style={{
                                top: `${shelfY}px`
                              }}
                            />
                          );
                        })}
                      </div>
                      
                      {/* 책들 */}
                      <div 
                        className="archived-books-grid"
                        style={{
                          gap: `${Math.max(35, Math.min(60, ((containerWidth - 44) / 5 - 11.7 * 4) / (98/138) * 0.4))}px 11.7px` // 최소값 증가
                        }}
                      >
                        {archivedBooks.map((book, index) => {
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