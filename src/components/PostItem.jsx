import React from 'react'
import { useNavigate } from 'react-router-dom'
import BookFrame from './BookFrame'
import PostContent from './PostContent'
import basicAvatar from '../assets/basic_avatar.png'

function PostItem({ post, isMyPost, onDeleteSuccess, onEditSuccess, onTap, onBookExplore }) {
  const navigate = useNavigate()
  
  const imageUrl = post.image || ''
  const avatarUrl = post.avatarUrl || ''
  const userName = post.userName || ''
  const reviewTitle = post.reviewTitle || ''

  const handleUserProfileClick = () => {
    navigate(`/${post.userName}`, { 
      state: { userId: post.userId },
      replace: false
    })
  }

  const handleBookDetailClick = () => {
    navigate(`/book/${post.bookId}`, { 
      state: { bookId: post.bookId },
      replace: false
    })
  }

  const handleEditClick = async () => {
    const result = await navigate(`/edit-review/${post.id}`, { 
      state: { post },
      replace: false
    })
    if (result && onEditSuccess) {
      onEditSuccess()
    }
  }

  const handleDeleteClick = async () => {
    if (window.confirm('정말로 이 책을 삭제하시겠습니까?')) {
      try {
        // TODO: 실제 API 호출로 변경
        // const userBookApi = new UserBookApi(supabase.client)
        // await userBookApi.deleteBook(post.id)
        console.log('Delete book:', post.id)
        if (onDeleteSuccess) {
          onDeleteSuccess()
        }
      } catch (error) {
        alert('책 삭제 중 오류가 발생했어요')
      }
    }
  }

  const handleMoreClick = async () => {
    const action = window.confirm('작업을 선택하세요:\n1. 편집\n2. 삭제\n\n취소를 누르면 편집, 확인을 누르면 삭제됩니다.')
    
    if (action === null) {
      // 편집
      handleEditClick()
    } else {
      // 삭제
      handleDeleteClick()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {/* Center - 책 이미지 */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        {imageUrl === '' ? (
          <div style={{
            width: '206px',
            height: '306px',
            backgroundColor: '#E0E0E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="50" height="50" fill="#B0B0B0" viewBox="0 0 24 24">
              <path d="M21 5v14H3V5h18m0-2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-6 10l-2.5 3.01L8 13l-5 6h18l-7-9z"/>
            </svg>
          </div>
        ) : (
          <div style={{ width: '206px', height: '306px' }}>
            <BookFrame imageUrl={imageUrl} />
          </div>
        )}
      </div>
      
      {/* SizedBox(height: 15) */}
      <div style={{ height: '15px' }}></div>
      
      {/* Row - 사용자 정보 및 버튼 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%'
      }}>
        {/* GestureDetector - 사용자 정보 */}
        <div 
          onClick={handleUserProfileClick}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {(avatarUrl === '' || avatarUrl === 'basic') ? (
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                backgroundColor: '#E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img 
                  src={basicAvatar} 
                  alt="기본 아바타"
                  style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
                <div style={{ 
                  width: '45px', 
                  height: '45px', 
                  backgroundColor: '#E0E0E0',
                  display: 'none'
                }}></div>
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
            
            {/* SizedBox(width: 9) */}
            <div style={{ width: '9px' }}></div>
            
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
        
        {/* Spacer */}
        <div style={{ flex: 1 }}></div>
        
        {/* 조건부 버튼들 */}
        <button
          onClick={typeof onBookExplore === 'function' ? onBookExplore : handleBookDetailClick}
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
      </div>
      
      {/* SizedBox(height: 10) */}
      <div style={{ height: '10px' }}></div>
      
      {/* 조건부 리뷰 제목 */}
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
          {/* SizedBox(height: 4) */}
          <div style={{ height: '4px' }}></div>
        </>
      )}
      
      {/* Container with constraints and AnimatedSize */}
      <div style={{ 
        minHeight: '0',
        width: '100%',
        transition: 'all 200ms ease-in-out'
      }}>
        <PostContent 
          post={post} 
          onTapMore={onTap}
        />
      </div>
    </div>
  )
}

export default PostItem 