import { useState } from 'react'
import LinesEllipsis from 'react-lines-ellipsis'
import './BioContent.css'

function BioContent({ bio }) {
  const [showFull, setShowFull] = useState(false)

  if (!bio) {
    return <div className="bio-content empty-bio" style={{ minHeight: '33.5px' }}></div>
  }

  if (showFull) {
    return (
      <div className="bio-content full" style={{ whiteSpace: 'pre-line' }}>
        {bio}
      </div>
    )
  }

  // react-lines-ellipsis를 사용해서 2줄 제한
  return (
    <div className="bio-content clickable" onClick={() => setShowFull(true)} style={{ cursor: 'pointer' }}>
      <LinesEllipsis
        text={bio}
        maxLine={2}
        ellipsis="..."
        trimRight={false}
        basedOn="words"
        style={{
          whiteSpace: 'pre-line',
          wordWrap: 'break-word',
          fontSize: '14px',
          lineHeight: '1.2',
          color: '#191A1C'
        }}
      />
    </div>
  )
}

export default BioContent 