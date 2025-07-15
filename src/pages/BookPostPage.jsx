import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, BookOpen } from '../components/icons'
import { getProfileByUsername, getBookPost } from '../lib/supabase'
import './BookPostPage.css'

function BookPostPage() {
  const { username, bookId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [bookPost, setBookPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBookPost()
  }, [username, bookId])

  const fetchBookPost = async () => {
    try {
      setLoading(true)
      
      // 프로필 정보 가져오기
      const profileData = await getProfileByUsername(username)
      setProfile(profileData)
      
      // 책 리뷰 정보 가져오기
      const postData = await getBookPost(profileData.id, bookId)
      if (!postData) {
        throw new Error('책 리뷰를 찾을 수 없습니다.')
      }
      setBookPost(postData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/u/${username}`)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>책 리뷰를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>책 리뷰를 찾을 수 없습니다</h2>
        <p>{error}</p>
        <button onClick={handleBack} className="back-button">
          프로필로 돌아가기
        </button>
      </div>
    )
  }

  if (!bookPost) {
    return (
      <div className="error-container">
        <h2>책 리뷰가 없습니다</h2>
        <button onClick={handleBack} className="back-button">
          프로필로 돌아가기
        </button>
      </div>
    )
  }

  const book = bookPost.books || {}
  const review = bookPost

  return (
    <div className="book-post-page">
      {/* 헤더 */}
      <header className="book-post-header">
        <button onClick={handleBack} className="header-button">
          <ArrowLeft size={20} />
        </button>
        <h1>{profile?.name || username}</h1>
        <div></div> {/* 빈 공간으로 중앙 정렬 */}
      </header>

      <main className="book-post-main">
        {/* 책 정보 */}
        <section className="book-info-section">
          <div className="book-cover-container">
            {book.image ? (
              <img src={book.image} alt={book.title} className="book-cover" />
            ) : (
              <div className="book-cover-placeholder">
                <BookOpen size={60} />
              </div>
            )}
          </div>
          
          <div className="book-details">
            <h2>{book.title || '제목 없음'}</h2>
            <p className="book-author">{book.author || '저자 정보 없음'}</p>
            {book.publisher && (
              <p className="book-publisher">{book.publisher}</p>
            )}
            {book.published_date && (
              <p className="book-date">{book.published_date}</p>
            )}
          </div>
        </section>

        {/* 작성자 정보 */}
        <section className="author-section">
          <div className="author-info">
            <div className="author-avatar">
              {profile?.avatar_url && profile.avatar_url !== 'basic' ? (
                <img src={profile.avatar_url} alt={profile.name} />
              ) : (
                <div className="default-avatar">
                  <User size={24} />
                </div>
              )}
            </div>
            <div className="author-details">
              <h3>{profile?.name || username}</h3>
              {profile?.job && <p className="author-job">{profile.job}</p>}
            </div>
          </div>
        </section>

        {/* 리뷰 내용 */}
        <section className="review-section">
          {review.review_title && (
            <h3 className="review-title">{review.review_title}</h3>
          )}
          
          {review.review_content && (
            <div className="review-content">
              <p>{review.review_content}</p>
            </div>
          )}
          
          {!review.review_title && !review.review_content && (
            <div className="no-review">
              <p>아직 리뷰가 작성되지 않았습니다.</p>
            </div>
          )}
        </section>

        {/* 책 둘러보기 버튼 */}
        <section className="book-actions">
          <button className="book-explore-button">
            책 둘러보기 →
          </button>
        </section>
      </main>
    </div>
  )
}

export default BookPostPage 