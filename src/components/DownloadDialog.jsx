import React from 'react'
import './PostActionDialog.css'

function DownloadDialog({ onClose, onEdit, onDelete }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEditClick = () => {
    window.open('https://linkbio.co/loguelogue', '_blank')
    onClose()
  }

  const handleDeleteClick = () => {
    onDelete()
    onClose()
  }

  return (
    <div className="post-action-dialog-overlay" onClick={handleBackdropClick}>
      <div className="post-action-dialog-backdrop">
        <div className="post-action-dialog-container">
          <div className="post-action-dialog-content">
            <div style={{ height: '10px' }}></div>
            
            <div style={{
              fontSize: '20px',
              color: '#1A1A1A', // AppColors.black900
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              marginBottom: '7px'
            }}>
              Logue 앱 열기
            </div>
            
            <div style={{
              fontSize: '12px',
              color: '#858585', // AppColors.black500
              textAlign: 'center',
              lineHeight: '1.4',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              marginBottom: '20px'
            }}>
              앱에서 로그 프로필의<br />
              모든 콘텐츠를 이용해보세요.
            </div>
            
            <button
              onClick={handleEditClick}
              style={{
                backgroundColor: '#1A1A1A', // AppColors.black900
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 16px',
                fontSize: '16px',
                cursor: 'pointer',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                marginBottom: '8px',
                minWidth: '200px',
                whiteSpace: 'nowrap',
                width: '100%',
                maxWidth: '280px'
              }}
            >
              Logue 앱 열기
            </button>
            
            <button
              onClick={handleDeleteClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#191A1C', // AppColors.red500
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
              }}
            >
              모바일 웹으로 볼게요
            </button>
          </div>
          
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <svg width="26" height="26" fill="#1A1A1A" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DownloadDialog