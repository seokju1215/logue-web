import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getProfileByUsername, getUserBooksWithProfiles } from '../lib/supabase'
import PostItem from '../components/PostItem'
import DownloadDialog from '../components/DownloadDialog'
import './MyPostsPage.css'
import React from 'react'

function MyPostsPage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const bookId = location.state?.bookId
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [initialIndex, setInitialIndex] = useState(0)
  const [hasDeleted, setHasDeleted] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const itemRefs = useRef([])

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line
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
      
      // posts 데이터에 프로필 정보 추가
      const postsWithProfile = userPosts.map(post => {
        console.log('Original post data:', post) // 디버깅용
        const mappedPost = {
          ...post,
          avatarUrl: profileData.avatar_url || '',
          userName: profileData.username || username,
          image: post.image || '',
          reviewTitle: post.review_title || '',
          reviewContent: post.review_content || ''
        }
        console.log('Mapped post data:', mappedPost) // 디버깅용
        return mappedPost
      })
      
      console.log('All posts with profile:', postsWithProfile) // 디버깅용
      
      // bookId가 있으면 해당 책의 인덱스 찾기
      let index = 0
      if (bookId) {
        const foundIndex = postsWithProfile.findIndex(post => 
          post.book_id === bookId || post.books?.id === bookId
        )
        if (foundIndex !== -1) {
          index = foundIndex
        }
      }
      
      setPosts(postsWithProfile)
      setInitialIndex(index)
      itemRefs.current = Array(postsWithProfile.length).fill(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const scrollToInitialIndex = async () => {
    await new Promise(resolve => setTimeout(resolve, 120))
    
    if (initialIndex < itemRefs.current.length && itemRefs.current[initialIndex]) {
      itemRefs.current[initialIndex].scrollIntoView({ 
        behavior: 'auto', 
        block: 'start',
        inline: 'nearest'
      })
    }
  }

  useEffect(() => {
    if (!loading && posts.length > 0) {
      scrollToInitialIndex()
    }
  }, [loading, posts, initialIndex])

  const handleBack = () => {
      navigate(`/${username}`, { state: { hasDeleted } })
  }

  const handleDeleteSuccess = (index) => {
    setPosts(prev => prev.filter((_, i) => i !== index))
    setHasDeleted(true)
    navigate(`/${username}`, { state: { hasDeleted: true } })
  }

  const handleEditSuccess = () => {
    fetchPosts()
  }

  const handlePostTap = async (post) => {
    // 포스트 상세 페이지로 이동
    const result = await navigate(`/post/${post.id}`, { 
      state: { post },
      replace: false
    })
    
    if (result === true) {
      await fetchPosts()
      setHasDeleted(true)
    }
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

  const appBarTitle = posts.length > 0 && posts[initialIndex]?.userName 
    ? posts[initialIndex].userName 
    : '사용자'

  return (
    <div className="my-posts-page">
      {/* AppBar */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px 22px',
        minHeight: '56px',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button onClick={handleBack} style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1a1a1a',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          marginLeft: '-4px'
        }}>
          <img src="/back_arrow.svg" alt="뒤로가기" width="20" height="20" />
        </button>
        <h1 style={{ 
          flex: 1, 
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '500',
          color: '#1a1a1a',
          margin: 0
        }}>
          {appBarTitle}
        </h1>
        <div style={{ width: '36px' }}></div>
      </header>

      {/* DownloadDialog */}
      {showDownloadDialog && (
        <DownloadDialog 
          onClose={() => setShowDownloadDialog(false)}
          onEdit={() => setShowDownloadDialog(false)}
          onDelete={() => setShowDownloadDialog(false)}
        />
      )}

      {/* ListView */}
      <main className="my-posts-main" style={{ 
        padding: '16px 0',
        overflowY: 'auto',
        height: 'calc(100vh - 56px)'
      }}>
        {posts.map((post, index) => {
          const currentUserId = profile?.id // 실제로는 현재 로그인한 사용자 ID
          const isMyPost = currentUserId && currentUserId === post.user_id

          return (
            <div
              key={post.id}
              ref={el => itemRefs.current[index] = el}
              style={{
                paddingLeft: 22,
                paddingRight: 22,
                paddingTop: 51,
                paddingBottom: 27,
              }}
            >
              <PostItem
                isMyPost={isMyPost}
                post={post}
                onDeleteSuccess={() => handleDeleteSuccess(index)}
                onEditSuccess={handleEditSuccess}
                onTap={() => handlePostTap(post)}
                onBookExplore={() => setShowDownloadDialog(true)}
              />
            </div>
          )
        })}
      </main>
    </div>
  )
}

export default MyPostsPage 