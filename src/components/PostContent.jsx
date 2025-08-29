import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LinesEllipsis from 'react-lines-ellipsis'

function PostContent({ post, onTapMore }) {
  const [showFull, setShowFull] = useState(false)
  const navigate = useNavigate()

  if (!post.reviewContent) {
    return <div style={{ height: 0 }}></div>
  }

  if (showFull) {
    return (
      <div style={{ 
        whiteSpace: 'pre-line', 
        fontSize: '14px', 
        color: '#858585', 
        lineHeight: '2', 
        letterSpacing: '-0.32px', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' 
      }}>
        {post.reviewContent}
      </div>
    )
  }

  const handleMoreClick = async () => {
    // PostDetailPage로 이동
    const result = await navigate(`/post/${post.id}`, { 
      state: { post },
      replace: false
    })
    
    // 상세 화면에서 삭제 후 반영할 콜백
    if (result && onTapMore) {
      onTapMore()
    }
  }

  return (
    <div style={{ 
      fontSize: '14px', 
      color: '#858585', 
      lineHeight: '2', 
      letterSpacing: '-0.32px', 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' 
    }}>
      <LinesEllipsis
        text={post.reviewContent}
        maxLine={5}
        ellipsis="... "
        trimRight={false}
        basedOn="words"
        component="span"
        style={{
          whiteSpace: 'pre-line',
          wordWrap: 'break-word'
        }}
      />
      <span
        onClick={handleMoreClick}
        style={{
          fontSize: '14px',
          color: '#858585',
          lineHeight: '1',
          letterSpacing: '-0.32px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          cursor: 'pointer'
        }}
      >
        더보기
      </span>
    </div>
  )
}

export default PostContent 