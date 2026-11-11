// 챗봇 화면과 서버가 같은 제한값을 쓰도록 한 곳에 둔다.
export const MAX_MESSAGE_LENGTH = 500; // 사용자가 입력하는 질문
// AI 답변은 최대 출력 토큰(1024)만큼 길어질 수 있으므로 기록 검증 시 넉넉히 허용
export const MAX_ASSISTANT_LENGTH = 4000;
