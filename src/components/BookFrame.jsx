import React, { useState } from 'react';

const BookFrame = ({ imageUrl }) => {
  // http -> https 변환
  const safeUrl = imageUrl?.startsWith('http://')
    ? imageUrl.replace('http://', 'https://')
    : imageUrl;

  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        border: '0.5px solid #B0B0B0', // AppColors.black300에 맞게 색상 조정
        borderRadius: 0,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        background: imgError || !imageUrl ? '#E0E0E0' : '#F5F5F5', // placeholder, error 색상
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {imageUrl && !imgError ? (
        <img
          src={safeUrl}
          alt="book"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          width="48"
          height="48"
          fill="#B0B0B0"
          viewBox="0 0 24 24"
        >
          <path d="M21 5v14H3V5h18m0-2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-6 10l-2.5 3.01L8 13l-5 6h18l-7-9z"/>
        </svg>
      )}
    </div>
  );
};

export default BookFrame; 