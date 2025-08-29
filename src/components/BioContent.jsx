import { useState } from 'react'
import './BioContent.css'

function BioContent({ bio }) {
  const [showFull, setShowFull] = useState(false)
  // 2줄이 넘는지 판단하는 간단한 fallback (글자수 기준)
  const isLong = bio && bio.length > 40

  if (!bio) {
    return <div className="bio-content empty-bio" style={{ minHeight: '33.5px' }}></div>
  }

  if (showFull || !isLong) {
    return (
      <div className="bio-content full" style={{ whiteSpace: 'pre-line' }}>
        {bio}
      </div>
    )
  }

  // bio가 길면 ...만 보이고, 클릭 시 전체 bio 표시
  return (
    <div
      className="bio-content clickable"
      onClick={() => setShowFull(true)}
      title="전체 보기"
      style={{ cursor: 'pointer' }}
    >
      <span
        className="bio-truncated"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'pre-line', // 줄바꿈 적용
        }}
      >
        {bio}
      </span>
    </div>
  )
}

export default BioContent 