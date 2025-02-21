# 공통 프로젝트

## 카테고리

| Application | Domain | Language | Framework |
| ---- | ---- | ---- | ---- |
| :white_check_mark: Desktop Web | :white_check_mark: AI | :white_check_mark: JavaScript | :white_check_mark: Vue.js |
| :black_square_button: Mobile Web | :black_square_button: Big Data | :black_square_button: TypeScript | :black_square_button: React |
| :white_check_mark: Responsive Web | :black_square_button: Blockchain | :black_square_button: C/C++ | :black_square_button: Angular |
| :black_square_button: Android App | :black_square_button: IoT | :black_square_button: C# | :white_check_mark: Node.js |
| :black_square_button: iOS App | :black_square_button: AR/VR/Metaverse | :white_check_mark: Python | :white_check_mark: Flask/Django |
| :black_square_button: Desktop App | :black_square_button: Game | :white_check_mark: Java | :white_check_mark: Spring/Springboot |
| | | :black_square_button: Kotlin | |

## 프로젝트 소개

* 프로젝트명: 통합 생성형 AI와 마인드맵 프로젝트
* 서비스 특징: 통합형 LLM 채팅 서비스와 대화 요약 마인드맵 생성 서비스
* 주요 기능
  - 채팅 중 LLM 모델 변경 (Google Gemini, CLOVA, ChatGPT, Claude 지원)
  - 채팅 내용 요약 및 마인드맵 자동 생성
  - 채팅방 즐겨찾기 및 검색 기능
  - 실시간 스트리밍 응답 제공 (WebSocket & LLM Streaming)
  - 마인드맵 그래프 생성 및 수정 기능 (Neo4j 기반)
* 주요 기술
  - LangChain
  - WebSocket
  - JWT Authentication
  - REST API
  - Redis
  - Docker
* 배포 환경
  - URL: // [마인드플로우](https://mindflow.ddns.net/)
  - 테스트 계정: love / love

## 팀 소개
* 우성윤: 팀장, LLM 채팅 기능 백엔드 담당
* 곽희섭: 부팀장, 인프라 담당
* 김세현: 채팅 및 메인 페이지 프론트엔드 담당
* 류현석: 미안드맵 기능 백엔드 담당
* 김동욱: 미안드맵 기능 프론트엔드 담당
* 이강민: 인가 시스템 백엔드 담당

## 프로젝트 상세 설명

#### 아키텍처

![아키텍처](docs/Architecture.png)

#### ERD

![ERD](docs/erd.png)

#### 랜딩페이지

![landing](/uploads/15548579676534074b55eaeddc5e809e/landing.gif)

#### 로그인

![login](/uploads/dc7850ee51704d57b36f987315d9b65d/login.gif)

#### 회원가입

![회원가입](docs/register.png)

#### 새채팅

![newchat](/uploads/7d6eec21941d0898fb49b993d237ea35/newchat.gif)

#### 모델 선택

![modelselect](/uploads/86990fd2eeb7e49f007dc5c3e297d4f2/modelselect.gif)

#### 채팅 검색

![Search](/uploads/a5affcd1701cc14b8c30a1e175a60da0/Search.gif)

#### 마인드맵 2D

![mindmap2d](/uploads/6ab3d4fa44884b336e18f162ab272468/mindmap2d.gif)

#### 마인드맵 3D

![mindmap3d](/uploads/02fbc00500c86afddcc1b9d5f02e90e6/mindmap3d.gif)
