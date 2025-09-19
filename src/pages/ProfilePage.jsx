import { useState, useEffect, useRef } from 'react'
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
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [bioHeight, setBioHeight] = useState(0) // BioContent 높이
  const [headerHeight, setHeaderHeight] = useState(0) // 헤더 높이
  const [profileHeaderHeight, setProfileHeaderHeight] = useState(0) // 프로필 헤더 높이
  const [isTabPinned, setIsTabPinned] = useState(false) // 탭바 고정 상태
  const [swipeProgress, setSwipeProgress] = useState(0) // 스와이프 진행도 (0-1)
  const [isSwipeActive, setIsSwipeActive] = useState(false) // 스와이프 활성 상태
  const bookshelfTabRef = useRef(null) // 책장탭 ref

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

  // 탭 변경 시 헤더 상태 초기화
  useEffect(() => {
    if (activeTab === 0) {
      setIsScrolled(false)
    }
  }, [activeTab])

  // NestedScrollView 스타일 스크롤 이벤트 핸들러 - SliverPersistentHeader pinned: true와 동일
  useEffect(() => {
    if (!profile?.show_archived_books) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const direction = currentScrollY > lastScrollY ? 'down' : 'up'
      
      setScrollDirection(direction)
      setLastScrollY(currentScrollY)

      // 프로필 헤더 높이 계산 (헤더 + 프로필 정보 + 팔로워/팔로잉)
      const profileHeaderElement = document.querySelector('.profile-header-section')
      if (profileHeaderElement) {
        const profileHeaderRect = profileHeaderElement.getBoundingClientRect()
        const profileHeaderHeightValue = profileHeaderRect.height
        setProfileHeaderHeight(profileHeaderHeightValue)
        
        // 탭바가 고정되어야 하는지 확인 (SliverPersistentHeader pinned: true와 동일)
        const isTabPinned = currentScrollY >= profileHeaderHeightValue - 30 // 30px 여유
        setIsTabPinned(isTabPinned)
        
        // 전체 헤더 높이 계산 (프로필 헤더 + 탭바)
        const totalHeaderHeight = profileHeaderHeightValue + 30 // 탭바 높이 30px
        setHeaderHeight(totalHeaderHeight)
        
        // 프로필 헤더 섹션 숨김/표시 로직 적용
        if (direction === 'down' && currentScrollY > totalHeaderHeight) {
          setIsScrolled(true)
          // profile-header-section에 scrolled 클래스 추가
          profileHeaderElement.classList.add('scrolled')
        } else if (direction === 'up' || currentScrollY <= totalHeaderHeight - 50) {
          setIsScrolled(false)
          // profile-header-section에서 scrolled 클래스 제거
          profileHeaderElement.classList.remove('scrolled')
        }
      }
    }

    // 책장탭의 스크롤 이벤트 핸들러
    const handleBookshelfScroll = (e) => {
      if (activeTab === 1) {
        const scrollTop = e.target.scrollTop
        const direction = scrollTop > lastScrollY ? 'down' : 'up'
        
        setScrollDirection(direction)
        setLastScrollY(scrollTop)
        
        // 프로필 헤더 높이 계산
        const profileHeaderElement = document.querySelector('.profile-header-section')
        if (profileHeaderElement) {
          const profileHeaderRect = profileHeaderElement.getBoundingClientRect()
          const profileHeaderHeightValue = profileHeaderRect.height
          
          // 대표탭과 동일한 로직 사용 - 책장탭의 스크롤 위치를 프로필 헤더 높이와 비교
          const isTabPinned = scrollTop >= profileHeaderHeightValue - 30
          setIsTabPinned(isTabPinned)
          
          // 전체 헤더 높이 계산 (프로필 헤더 + 탭바)
          const totalHeaderHeight = profileHeaderHeightValue + 30 // 탭바 높이 30px
          
          // 헤더 숨김/표시 로직 - 대표탭과 동일
          if (direction === 'down' && scrollTop > totalHeaderHeight) {
            setIsScrolled(true)
            // profile-header-section에 scrolled 클래스 추가
            profileHeaderElement.classList.add('scrolled')
          } else if (direction === 'up' || scrollTop <= totalHeaderHeight - 50) {
            setIsScrolled(false)
            // profile-header-section에서 scrolled 클래스 제거
            profileHeaderElement.classList.remove('scrolled')
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // 책장탭의 스크롤 이벤트 리스너 추가
    const bookshelfTab = bookshelfTabRef.current
    if (bookshelfTab) {
      bookshelfTab.addEventListener('scroll', handleBookshelfScroll, { passive: true })
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (bookshelfTab) {
        bookshelfTab.removeEventListener('scroll', handleBookshelfScroll)
      }
    }
  }, [activeTab, lastScrollY, profile?.show_archived_books, profileHeaderHeight, bookshelfTabRef])

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

  // BioContent 높이 측정
  useEffect(() => {
    if (profile && !loading) {
      const measureBioHeight = () => {
        const bioElement = document.querySelector('.bio-content')
        if (bioElement) {
          const height = bioElement.offsetHeight
          setBioHeight(height)
        }
      }
      
      // 초기 측정 (약간의 지연을 두어 DOM이 완전히 렌더링된 후 측정)
      setTimeout(measureBioHeight, 100)
      
      // ResizeObserver로 동적 측정
      const resizeObserver = new ResizeObserver(() => {
        setTimeout(measureBioHeight, 50)
      })
      
      const bioElement = document.querySelector('.bio-content')
      if (bioElement) {
        resizeObserver.observe(bioElement)
      }
      
      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [profile, loading])

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
    // 대표 탭으로 전환할 때는 헤더를 항상 표시
    if (tabIndex === 0) {
      setIsScrolled(false)
    }
  }

  // 터치 시작
  const handleTouchStart = (e) => {
    if (!profile?.show_archived_books) return
    
    // iOS에서 터치 이벤트 캡처
    const touch = e.touches[0] || e.changedTouches[0]
    if (!touch) return
    
    // 이전 터치 상태 즉시 초기화
    setTouchStart(touch.clientX)
    setTouchStartY(touch.clientY)
    setTouchEnd(null)
    setTouchEndY(null)
    setSwipeProgress(0)
    setIsSwipeActive(false)
  }

  // 터치 이동
  const handleTouchMove = (e) => {
    if (!profile?.show_archived_books || !touchStart) return
    
    // iOS에서 터치 이벤트 캡처
    const touch = e.touches[0] || e.changedTouches[0]
    if (!touch) return
    
    const currentX = touch.clientX
    const currentY = touch.clientY
    
    // 항상 터치 위치 업데이트
    setTouchEnd(currentX)
    setTouchEndY(currentY)
    
    // 수평 스와이프 감지 및 실시간 애니메이션
    const distanceX = touchStart - currentX
    const distanceY = touchStartY - currentY
    
    // 수평 스와이프가 수직 스크롤보다 클 때만 처리
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 15) {
      setIsSwipeActive(true)
      
      // 스와이프 진행도 계산 (0-1)
      const maxSwipeDistance = 150 // 최대 스와이프 거리
      const progress = Math.min(Math.abs(distanceX) / maxSwipeDistance, 1)
      setSwipeProgress(progress)
    }
  }

  // 터치 종료 - 스와이프 감지
  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return
    
    // iOS에서 터치 이벤트 캡처
    const touch = e.touches[0] || e.changedTouches[0]
    if (touch) {
      setTouchEnd(touch.clientX)
      setTouchEndY(touch.clientY)
    }
    
    const distanceX = touchStart - touchEnd
    const distanceY = touchStartY - touchEndY
    const isLeftSwipe = distanceX > 50  // 스와이프 임계값을 50px로 증가
    const isRightSwipe = distanceX < -50

    // 수평 스와이프 - 탭 전환
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 50) {
      if (isLeftSwipe && activeTab === 0) {
        // 왼쪽으로 스와이프 - 대표에서 책장으로
        setIsTransitioning(true)
        setActiveTab(1)
        setTimeout(() => {
          setIsTransitioning(false)
          setIsSwipeActive(false)
          setSwipeProgress(0)
        }, 300)
      } else if (isRightSwipe && activeTab === 1) {
        // 오른쪽으로 스와이프 - 책장에서 대표로
        setIsTransitioning(true)
        setActiveTab(0)
        setIsScrolled(false) // 대표 탭으로 전환할 때 헤더 표시
        setTimeout(() => {
          setIsTransitioning(false)
          setIsSwipeActive(false)
          setSwipeProgress(0)
        }, 300)
      } else {
        // 스와이프가 충분하지 않으면 원래 위치로 복귀
        setIsSwipeActive(false)
        setSwipeProgress(0)
      }
    } else {
      // 스와이프가 아니면 상태 초기화
      setIsSwipeActive(false)
      setSwipeProgress(0)
    }
    
    // 터치 상태 즉시 초기화 (다음 터치를 위해)
    setTimeout(() => {
      setTouchStart(null)
      setTouchEnd(null)
      setTouchStartY(null)
      setTouchEndY(null)
    }, 0)
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
    <div 
      className="profile-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* NestedScrollView의 headerSliverBuilder와 동일한 구조 */}
      
       {/* 고정 헤더 */}
       <header className="profile-header" style={{ 
         position: 'fixed',
         top: 0,
         left: 0,
         right: 0,
         zIndex: 1000,
         padding: '16px 25px',
         minHeight: '56px',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         backgroundColor: '#ffffff',
         maxWidth: '600px',
         margin: '0 auto',
       }}>
         <h1 style={{
           fontWeight: '600',
           fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
           margin: 0,
           fontSize: '16px'
         }}>{profile?.username || '사용자 '}</h1>
       </header>

       {/* 헤더 높이만큼 스페이서 */}
       <div style={{ height: '56px' }} />

       {/* 1. SliverToBoxAdapter - 프로필 헤더 */}
       <div className={`profile-header-section ${activeTab === 1 && isScrolled ? 'scrolled' : ''}`}>

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
            <div style={{ height: '1px' }}></div>
            
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
                <div style={{ height: '6px' }}></div>
              </>
            )}
            
            <div className="bio-content">
              <BioContent bio={profile?.bio || ''} />
            </div>
            
            {/* job이 비어있을 때 */}
            {(!profile?.job || profile.job === '') && (
              <>
                <div style={{ height: '25.5px' }}></div>
              </>
            )}
            
            <div style={{ height: '7px' }}></div>
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
      </div>

      {/* 2. SliverPersistentHeader - 탭바 (pinned: true) */}
      {profile?.show_archived_books && (
        <div className={`books-tabs ${isTabPinned ? 'pinned' : ''}`}>
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
      )}


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
            setShowDownloadDialog(false)
          }}
          onDelete={() => {
            setShowDownloadDialog(false)
          }}
        />
      )}

      <main className="profile-main" style={{ 
        padding: profile?.show_archived_books 
          ? (activeTab === 0 ? '0px 0px 20px' : `${isTabPinned ? 30 : 0}px 0px 20px`)
          : '0px 0px 20px',
        backgroundColor: '#ffffff',
        minHeight: '100vh'
      }}>

        {/* 책장 */}
        <section className="books-section">
          {/* show_archived_books가 true이면 탭바 표시 */}
          {profile?.show_archived_books ? (
            <div className="books-tab-container">
              {/* 탭 내용 */}
              <div className={`tab-content ${isTransitioning ? 'swiping' : ''}`}>
                <div 
                  className={`tab-content-wrapper tab-${activeTab} ${isSwipeActive ? 'swiping' : ''}`}
                  style={{
                    transform: isSwipeActive ? 
                      (activeTab === 0 && touchStart && touchEnd ? 
                        `translateX(${Math.max(-50, (touchEnd - touchStart) / window.innerWidth * 50)}%)` :
                        activeTab === 1 && touchStart && touchEnd ?
                        `translateX(${Math.min(0, -50 + (touchEnd - touchStart) / window.innerWidth * 50)}%)` :
                        `translateX(${activeTab === 0 ? '0%' : '-50%'})`
                      ) : 
                      `translateX(${activeTab === 0 ? '0%' : '-50%'})`
                  }}
                >
                  {/* 대표 탭 */}
                  <div className="tab-panel representative-tab">
                    {books.length > 0 ? (
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
                        <p>인생 책이 없어요.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 책장 탭 */}
                  <div className="tab-panel bookshelf-tab" ref={bookshelfTabRef}>
                    {archivedLoading ? (
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
                        <p>책장이 비어있어요.</p>
                      </div>
                    )}
                  </div>
                </div>
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