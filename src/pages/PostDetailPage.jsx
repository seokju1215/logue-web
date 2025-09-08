import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, User, MoreVertical } from '../components/icons'
import DownloadDialog from '../components/DownloadDialog'
import './PostDetailPage.css'
import React from 'react'

function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [post, setPost] = useState(location.state?.post || null)
  const [loading, setLoading] = useState(!post)
  const [error, setError] = useState(null)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)

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
      navigate(`/${post.userName}`)
    }
  }

  const handleBookExplore = () => {
    setShowDownloadDialog(true)
  }

  const handleMoreClick = () => {
    // 더보기 메뉴 (삭제 다이얼로그)
    if (window.confirm('정말로 이 책을 삭제하시겠습니까?')) {
      // TODO: 실제 API 호출로 변경
      console.log('Delete book:', post.id)
      navigate(-1, { state: { deleted: true } })
    }
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
  const currentUserId = 'current-user-id' // 실제로는 현재 로그인한 사용자 ID
  const isMyPost = post.userId === currentUserId

  return (
    <div className="post-detail-page">
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
          {userName}
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

      <main className="post-detail-main" style={{ 
        padding: '9px 26px',
        overflowY: 'auto'
      }}>
        {/* 프로필 + 책 둘러보기 + 더보기 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%'
        }}>
          <div 
            onClick={handleProfileClick}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {(avatarUrl === '' || avatarUrl === 'basic') ? (
                <div style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  backgroundColor: '#F5F5F5', // AppColors.black100
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img 
                    src="/assets/basic_avatar.png" 
                    alt="기본 아바타"
                    style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  backgroundImage: `url(${avatarUrl})`,
                  backgroundColor: '#E0E0E0',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}></div>
              )}
              
              <div style={{ width: '8px' }}></div>
              
              <span style={{
                fontSize: '14px',
                color: '#1A1A1A', // AppColors.black900
                lineHeight: '1.5',
                letterSpacing: '-0.32px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                {userName}
              </span>
            </div>
          </div>
          
          <div style={{ flex: 1 }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={handleBookExplore}
              style={{
                border: '1px solid #B0B0B0', // AppColors.black300
                borderRadius: '5px',
                padding: '0 19px',
                height: '34px',
                fontSize: '14px',
                color: '#858585', // AppColors.black500
                lineHeight: '1',
                fontWeight: '400',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
              }}
            >
              책 둘러보기 →
            </button>
            
            {isMyPost && (
              <button
                onClick={handleMoreClick}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  marginLeft: '8px'
                }}
              >
                <svg width="24" height="24" fill="#858585" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div style={{ height: '10px' }}></div>
        
        {/* 리뷰 제목 */}
        {reviewTitle !== '' && (
          <>
            <div style={{
              fontSize: '16px',
              color: '#1A1A1A', // AppColors.black900
              lineHeight: '1.4',
              letterSpacing: '-0.32px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              {reviewTitle}
            </div>
            <div style={{ height: '12px' }}></div>
          </>
        )}
        
        {/* 리뷰 내용 */}
        <div style={{
          fontSize: '14px',
          color: '#858585', // AppColors.black500
          lineHeight: '2',
          letterSpacing: '-0.32px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          whiteSpace: 'pre-line'
        }}>
          {reviewContent}
        </div>
      </main>
    </div>
  )
}

export default PostDetailPage 