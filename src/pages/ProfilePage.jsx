import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User } from '../components/icons'
import { getProfileByUsername, getUserBooks } from '../lib/supabase'
import './ProfilePage.css'
import BioContent from '../components/BioContent'
import DownloadDialog from '../components/DownloadDialog'
import React from 'react'

function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [imageLoadingStates, setImageLoadingStates] = useState({})
  const [imageErrorStates, setImageErrorStates] = useState({})

  useEffect(() => {
    fetchProfile()
  }, [username])

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
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBookClick = (book) => {
    // 책 클릭 시 /u/{username}/posts로 이동, bookId는 state로만 전달
    const bookId = book.book_id || book.id || (book.books && book.books.id)
    if (bookId && username) {
      navigate(`/u/${username}/posts`, { state: { bookId } })
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
            <img src={avatarUrl} alt="프로필 확대" width={250} height={250} style={{borderRadius: '50%'}} />
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

      <main className="profile-main" style={{ padding: '10px 25px 20px' }}>
        {/* 프로필 정보 */}
        <section className="profile-info">
          <div className="profile-details">
            <h2>{profile?.name || '이름 없음'}</h2>
            <p className="job">{profile?.job || '직업 정보 없음'}</p>
            <BioContent bio={profile?.bio || ''} />
          </div>
          <div className="profile-avatar" onClick={handleAvatarClick}>
            {profile?.avatar_url && profile.avatar_url !== 'basic' ? (
              <img src={profile.avatar_url} alt={profile.name} />
            ) : (
              <img src="/assets/basic_avatar.png" alt="기본 아바타" />
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
              <p>저장된 책이 없습니다.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default ProfilePage 