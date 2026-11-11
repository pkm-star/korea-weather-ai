import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 같은 와이파이의 휴대폰·다른 PC에서 http://192.168.x.x:3000 으로 접속하면
  // Next.js 16은 개발용 JS 청크를 기본 차단한다. 그러면 화면만 보이고
  // 버튼·챗봇 클릭이 전혀 동작하지 않으므로 사설망 주소를 허용한다.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
