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
    
    // DOM 기반 텍스트 측정으로 정확한 계산
    const textStyle = {
      fontSize: '14px',
      color: '#858585',
      lineHeight: '2',
      letterSpacing: '-0.32px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }

    // 임시 요소 생성하여 텍스트 측정
    const tempElement = document.createElement('div')
    tempElement.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: ${textStyle.fontSize};
      line-height: ${textStyle.lineHeight};
      letter-spacing: ${textStyle.letterSpacing};
      font-family: ${textStyle.fontFamily};
      width: calc(100vw - 44px);
      max-width: 386px;
    `
    document.body.appendChild(tempElement)

    // 전체 텍스트가 5줄을 넘는지 확인
    tempElement.textContent = fullText
    const fullTextHeight = tempElement.offsetHeight
    const lineHeight = parseInt(textStyle.lineHeight) * parseInt(textStyle.fontSize)
    const maxHeight = lineHeight * maxLines

    if (fullTextHeight <= maxHeight) {
      // 5줄 이하면 전체 텍스트 표시
      setDisplayText(fullText)
      setShouldShowMoreButton(false)
      setIsCalculated(true)
      document.body.removeChild(tempElement)
      return
    }

    // 5줄을 넘으면 정확한 위치 찾기
    let start = 0
    let end = fullText.length
    let result = ''

    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      const testText = fullText.substring(0, mid) + ellipsis + moreText
      tempElement.textContent = testText
      
      if (tempElement.offsetHeight <= maxHeight) {
        result = testText
        start = mid + 1
      } else {
        end = mid - 1
      }
    }

    // "더보기" 텍스트를 제외하고 다시 계산
    const finalText = result.replace(ellipsis + moreText, '')
    tempElement.textContent = finalText + ellipsis
    if (tempElement.offsetHeight <= maxHeight) {
      setDisplayText(finalText + ellipsis)
    } else {
      // 안전하게 더 짧게 자르기
      setDisplayText(fullText.substring(0, Math.floor(fullText.length * 0.7)) + ellipsis)
    }
    
    setShouldShowMoreButton(true)
    setIsCalculated(true)
    document.body.removeChild(tempElement)
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