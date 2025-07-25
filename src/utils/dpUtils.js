// dp를 px로 변환하는 유틸리티 함수
export const dpToPx = (dp) => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  return dp * devicePixelRatio;
};

// px를 dp로 변환하는 함수
export const pxToDp = (px) => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  return px / devicePixelRatio;
};

// Flutter와 동일한 크기로 변환하는 함수
export const flutterSize = (dp) => {
  // Flutter의 1dp는 보통 1px이지만, 모바일에서는 2-3px로 렌더링됨
  // 실제 테스트를 통해 조정된 값
  const baseRatio = 1;
  return dp * baseRatio;
}; 