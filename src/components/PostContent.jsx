import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function PostContent({ post, onTapMore }) {
  const [displayText, setDisplayText] = useState('')
  const [shouldShowMoreButton, setShouldShowMoreButton] = useState(false)
  const [isCalculated, setIsCalculated] = useState(false)
  const textRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    calculateTextLayout()
  }, [post.reviewContent])

  const calculateTextLayout = () => {
    const fullText = post.reviewContent || ''
    if (fullText === '') {
      setDisplayText('')
      setShouldShowMoreButton(false)
      setIsCalculated(true)
      return
    }

    const maxLines = 5
    const moreText = '더보기'
    const ellipsis = '... '
    
    // 간단한 문자 수 기반 계산으로 성능 향상
    const estimatedCharsPerLine = 35 // 대략적인 한 줄당 문자 수
    const estimatedMaxChars = estimatedCharsPerLine * maxLines

    if (fullText.length <= estimatedMaxChars) {
      // 예상 5줄 이하면 전체 텍스트 표시
      setDisplayText(fullText)
      setShouldShowMoreButton(false)
      setIsCalculated(true)
    } else {
      // 예상 5줄 초과면 자르기
      const truncatedText = fullText.substring(0, estimatedMaxChars - 10) + '... '
      setDisplayText(truncatedText)
      setShouldShowMoreButton(true)
      setIsCalculated(true)
    }
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

  const content = post.reviewContent || ''
  
  if (content === '') {
    return <div style={{ height: 0 }}></div>
  }

  const textStyle = {
    fontSize: '14px',
    color: '#858585', // AppColors.black500
    lineHeight: '2',
    letterSpacing: '-0.32px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  }

  // 계산이 완료되지 않았으면 전체 텍스트를 표시 (레이아웃 안정성 확보)
  if (!isCalculated) {
    return (
      <div style={textStyle}>
        {content}
      </div>
    )
  }

  return shouldShowMoreButton ? (
    <div style={textStyle}>
      {displayText}
      <span
        onClick={handleMoreClick}
        style={{
          fontSize: '14px',
          color: '#858585', // AppColors.black500
          lineHeight: '1',
          letterSpacing: '-0.32px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          cursor: 'pointer'
        }}
      >
        더보기
      </span>
    </div>
  ) : (
    <div style={textStyle}>
      {displayText || ''}
    </div>
  )
}

export default PostContent 