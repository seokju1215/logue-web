import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, User, MoreVertical } from '../components/icons'
import './PostDetailPage.css'

function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [post, setPost] = useState(location.state?.post || null)
  const [loading, setLoading] = useState(!post)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!post) {
      // post가 없으면 에러 처리
      setError('포스트를 찾을 수 없습니다.')
      setLoading(false)
    }
  }, [post])

  const handleBack = () => {
    navigate(-1)
  }

  const handleProfileClick = () => {
    if (post?.userName) {
      navigate(`/u/${post.userName}`)
    }
  }

  const handleBookExplore = () => {
    // 책 둘러보기 기능 (향후 구현)
    console.log('책 둘러보기 클릭')
  }

  const handleMoreClick = () => {
    // 더보기 메뉴 (향후 구현)
    console.log('더보기 클릭')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>포스트를 불러오는 중...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="error-container">
        <h2>포스트를 찾을 수 없습니다</h2>
        <p>{error}</p>
        <button onClick={handleBack} className="back-button">
          뒤로 가기
        </button>
      </div>
    )
  }

  const imageUrl = post.image || ''
  const avatarUrl = post.avatarUrl || ''
  const userName = post.userName || ''
  const reviewTitle = post.reviewTitle || ''
  const reviewContent = post.reviewContent || ''

  return (
    <div className="post-detail-page">
      {/* 헤더 */}
      <header className="post-detail-header">
        <button onClick={handleBack} className="header-button">
          <ArrowLeft size={20} />
        </button>
        <h1>{userName}</h1>
        <div></div> {/* 빈 공간으로 중앙 정렬 */}
      </header>

      <main className="post-detail-main">
        {/* 프로필 + 책 둘러보기 + 더보기 */}
        <section className="post-actions">
          <div className="profile-section" onClick={handleProfileClick}>
            <div className="profile-avatar">
              {avatarUrl && avatarUrl !== 'basic' ? (
                <img src={avatarUrl} alt={userName} />
              ) : (
                <div className="default-avatar">
                  <User size={24} />
                </div>
              )}
            </div>
            <span className="profile-name">{userName}</span>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleBookExplore} className="book-explore-button">
              책 둘러보기 →
            </button>
            <button onClick={handleMoreClick} className="more-button">
              <MoreVertical size={20} />
            </button>
          </div>
        </section>

        {/* 리뷰 제목 */}
        {reviewTitle && (
          <section className="review-title-section">
            <h2>{reviewTitle}</h2>
          </section>
        )}

        {/* 리뷰 내용 */}
        <section className="review-content-section">
          <p>{reviewContent}</p>
        </section>
      </main>
    </div>
  )
}

export default PostDetailPage 