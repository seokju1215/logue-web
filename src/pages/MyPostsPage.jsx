import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, BookOpen, Heart, MessageCircle, Share } from '../components/icons'
import { getProfileByUsername, getUserBooksWithProfiles } from '../lib/supabase'
import PostContent from '../components/PostContent'
import './MyPostsPage.css'

function MyPostsPage() {
  const { username, bookId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [initialIndex, setInitialIndex] = useState(0)

  useEffect(() => {
    fetchPosts()
  }, [username, bookId])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      // 프로필 정보 가져오기
      const profileData = await getProfileByUsername(username)
      setProfile(profileData)
      
      // 사용자의 모든 책 리뷰 가져오기
      const postsData = await getUserBooksWithProfiles(profileData.id)
      
      // 현재 사용자의 포스트만 필터링
      const userPosts = postsData.filter(post => post.user_id === profileData.id)
      
      // bookId가 있으면 해당 책의 인덱스 찾기
      let index = 0
      if (bookId) {
        const foundIndex = userPosts.findIndex(post => 
          post.book_id === bookId || post.books?.id === bookId
        )
        if (foundIndex !== -1) {
          index = foundIndex
        }
      }
      
      setPosts(userPosts)
      setInitialIndex(index)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/u/${username}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePostClick = (post) => {
    // 포스트 상세 페이지로 이동 (향후 구현)
    console.log('포스트 클릭:', post)
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

  if (posts.length === 0) {
    return (
      <div className="error-container">
        <h2>책 리뷰가 없습니다</h2>
        <button onClick={handleBack} className="back-button">
          프로필로 돌아가기
        </button>
      </div>
    )
  }

  const currentPost = posts[initialIndex] || posts[0]
  const book = currentPost.books || {}

  return (
    <div className="my-posts-page">
      {/* 헤더 */}
      <header className="my-posts-header">
        <button onClick={handleBack} className="header-button">
          <ArrowLeft size={20} />
        </button>
        <h1>{profile?.name || username}</h1>
        <div></div> {/* 빈 공간으로 중앙 정렬 */}
      </header>

      <main className="my-posts-main">
        {posts.map((post, index) => {
          const book = post.books || {}
          const isActive = index === initialIndex
          
          return (
            <article 
              key={post.id} 
              className={`post-item ${isActive ? 'active' : ''}`}
              onClick={() => handlePostClick(post)}
            >
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

              {/* 리뷰 제목 */}
              {post.review_title && (
                <section className="review-title-section">
                  <h3 className="review-title">{post.review_title}</h3>
                </section>
              )}

              {/* 리뷰 내용 - PostContent 컴포넌트 사용 */}
              <section className="review-content-section">
                <PostContent post={post} onTapMore={fetchPosts} />
              </section>

              {/* 포스트 메타 정보 */}
              <section className="post-meta">
                <div className="post-date">
                  {formatDate(post.created_at)}
                </div>
                
                <div className="post-actions">
                  <button className="action-button">
                    <Heart size={16} />
                    <span>0</span>
                  </button>
                  <button className="action-button">
                    <MessageCircle size={16} />
                    <span>0</span>
                  </button>
                  <button className="action-button">
                    <Share size={16} />
                  </button>
                </div>
              </section>
            </article>
          )
        })}
      </main>
    </div>
  )
}

export default MyPostsPage 