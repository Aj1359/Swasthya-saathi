# SwasthyaSaathi Architectural & Codebase Audit (Step 0)

**Date**: 2026-10-15  
**Auditor**: Automated Quality & Performance Auditor  
**Repository**: SwasthyaSaathi (Spring Boot Backend + React Frontend + PostgreSQL / pgvector + Supabase)  
**Host Environment**: Local Machine (Windows 10/11 Home Single Language x64, OpenJDK 21.0.10 LTS / OpenJDK 25.0.4.1 LTS, Apache Maven 3.9.6, Node.js v22.19.0, npm 10.9.3)

---

## 1. Rate Limiter Audit
- **Implementation File**: [`backend/src/main/java/com/swasthyasaathi/ratelimit/RateLimitService.java`](file:///backend/src/main/java/com/swasthyasaathi/ratelimit/RateLimitService.java)
- **Controller Enforcement**: [`backend/src/main/java/com/swasthyasaathi/chat/ChatController.java`](file:///backend/src/main/java/com/swasthyasaathi/chat/ChatController.java#L29-L30)
- **Configured Limit**: 30 requests per minute (`MAX_REQUESTS_PER_MINUTE = 30`, window: `60000ms`).
- **Algorithm**: In-memory token bucket implementation (`RateLimitService.TokenBucket`) storing tokens per key in a `ConcurrentHashMap<String, TokenBucket>`.
- **Keying Scheme**: 
  - Authenticated requests: User ID (`userPrincipal.getId().toString()`).
  - Unauthenticated requests: Request `sessionId` (`request.sessionId()`).
  - Null/Blank fallback: Literal string `"anonymous"` (`RateLimitService.java` line 22).
  - **Verdict**: Per-user / Per-session rate limiting. It is **NOT** per-IP (client IP is not resolved or extracted from HTTP headers).
- **Failure Behavior**: Throws `RateLimitExceededException` handled by `GlobalExceptionHandler` returning HTTP 429 Too Many Requests.

---

## 2. Safety / Crisis Checker Audit
- **Implementation File**: [`backend/src/main/java/com/swasthyasaathi/chat/ChatService.java`](file:///backend/src/main/java/com/swasthyasaathi/chat/ChatService.java#L30-L33)
- **Matching Mechanism**: Regex word-boundary pattern matching (`Pattern.CASE_INSENSITIVE`):
  ```java
  private static final Pattern CRISIS_PATTERN = Pattern.compile(
      "\\b(suicide|suicidal|kill myself|end my life|want to die|self-harm|harm myself|hopeless|cannot go on|don't want to live|end it all)\\b",
      Pattern.CASE_INSENSITIVE
  );
  ```
- **Control Flow**:
  - Checked at Step 2 of `processChatRequest` (`detectIntent(sanitizedContent)`).
  - If `CRISIS` is detected, execution **immediately enters an isolated response path** (`ChatService.java` lines 101–115).
  - **Gemini LLM generation is completely bypassed** (no external AI call).
  - Returns a hardcoded, compassionate crisis intervention message providing toll-free 24/7 helplines:
    - **Tele-MANAS (India)**: `14416` or `1800-891-4416`
    - **KIRAN Helpline**: `1800-599-0019`
    - **Emergency Services**: `112`
  - Returns `crisisFlag: true` and `intent: "CRISIS"`.
- **Helpline Catalog Endpoint**: [`backend/src/main/java/com/swasthyasaathi/crisis/CrisisController.java`](file:///backend/src/main/java/com/swasthyasaathi/crisis/CrisisController.java#L13-L44) provides `GET /api/crisis/helplines` with static listings for India, United States, and United Kingdom.

---

## 3. RAG Retrieval & Vector Scoring Audit
- **Implementation Files**:
  - Service: [`backend/src/main/java/com/swasthyasaathi/rag/RagService.java`](file:///backend/src/main/java/com/swasthyasaathi/rag/RagService.java)
  - Repository: [`backend/src/main/java/com/swasthyasaathi/repository/KnowledgeChunkRepository.java`](file:///backend/src/main/java/com/swasthyasaathi/repository/KnowledgeChunkRepository.java)
  - Entity: [`backend/src/main/java/com/swasthyasaathi/model/KnowledgeChunk.java`](file:///backend/src/main/java/com/swasthyasaathi/model/KnowledgeChunk.java)
- **Embedding Pipeline**:
  - Query text is sent to Gemini via `GeminiClient.embedContent(queryText)` targeting `models/gemini-embedding-001` producing a 768-dimensional vector (`float[768]`).
  - Formatted as PostgreSQL vector string literal: `"[v1,v2,...,v768]"`.
- **Scoring & Similarity Math**:
  - Executed via native SQL on `public.knowledge_chunks` utilizing the `pgvector` cosine distance operator `<=>`:
    ```sql
    SELECT id, source, title, category, content, created_at, null as embedding
    FROM public.knowledge_chunks
    WHERE embedding IS NOT NULL
      AND (1 - (embedding <=> cast(:embeddingStr as vector))) > :threshold
    ORDER BY embedding <=> cast(:embeddingStr as vector)
    LIMIT :limit
    ```
  - **Similarity Score Formulation**: Cosine similarity is computed as `1 - cosine_distance`.
  - Default threshold is `0.3` (`30%` cosine similarity) and limit is `4`.
  - **Fallback Logic**: If zero chunks exceed `0.3`, `findTopSimilarChunks` is invoked, retrieving the top `min(limit, 2)` chunks ordered strictly by smallest cosine distance without a threshold filter.

---

## 4. JWT Filter & Security Configuration Audit
- **Implementation Files**:
  - Filter: [`backend/src/main/java/com/swasthyasaathi/auth/JwtFilter.java`](file:///backend/src/main/java/com/swasthyasaathi/auth/JwtFilter.java)
  - Token Utilities: [`backend/src/main/java/com/swasthyasaathi/auth/JwtUtil.java`](file:///backend/src/main/java/com/swasthyasaathi/auth/JwtUtil.java)
  - Security Config: [`backend/src/main/java/com/swasthyasaathi/config/SecurityConfig.java`](file:///backend/src/main/java/com/swasthyasaathi/config/SecurityConfig.java)
  - User Details: [`backend/src/main/java/com/swasthyasaathi/auth/CustomUserDetailsService.java`](file:///backend/src/main/java/com/swasthyasaathi/auth/CustomUserDetailsService.java)
- **Token Format & Verification**:
  - Uses JJWT (`0.12.6`) HMAC-SHA256 (`Keys.hmacShaKeyFor`) signed with secret (`${JWT_SECRET}`).
  - Access token expiry: 15 minutes (`900,000ms`); Refresh token expiry: 7 days (`604,800,000ms`).
  - Claims contain subject (email) and custom claim `userId`.
- **Request Filter Flow**:
  - `JwtFilter` extends `OncePerRequestFilter`. Intercepts incoming `Authorization` header.
  - Validates `Bearer ` prefix, extracts username, verifies expiry and signature, loads user via `CustomUserDetailsService`, and sets `SecurityContextHolder.getContext().setAuthentication(...)`.
- **Endpoint Authorization Matrix**:
  - Public / PermitAll: `/api/auth/**`, `/api/crisis/helplines`, `/actuator/**`, `/error`.
  - Protected / Authenticated: `anyRequest().authenticated()` (e.g., `/api/chat`, `/api/scan/face`, `/api/scan/voice`).
  - Session Creation Policy: `STATELESS`.

---

## 5. Tenant & User Data Isolation Audit
- **Controller / Service Findings**:
  - [`backend/src/main/java/com/swasthyasaathi/scan/ScanController.java`](file:///backend/src/main/java/com/swasthyasaathi/scan/ScanController.java#L49): Correctly scopes scan writes to `@AuthenticationPrincipal UserPrincipal userPrincipal.getProfile()`.
  - [`backend/src/main/java/com/swasthyasaathi/chat/ChatService.java`](file:///backend/src/main/java/com/swasthyasaathi/chat/ChatService.java#L153):
    ```java
    List<ChatMessage> recentHistoryDesc = chatMessageRepository.findTop20BySessionIdOrderByCreatedAtDesc(safeSessionId);
    ```
    **Vulnerability / Leak Risk Identified**: History retrieval is scoped strictly by `sessionId` without filtering by `profile.id` or `user_id`. If User A and User B share or guess an active `sessionId`, User B will receive User A's past 20 chat messages in their prompt context.
- **Database / Supabase Row-Level Security (RLS)**:
  - In Supabase migrations ([`supabase/migrations/20260701192420_fa9ec25e-c04a-47cd-9e40-81ae71e514f3.sql`](file:///supabase/migrations/20260701192420_fa9ec25e-c04a-47cd-9e40-81ae71e514f3.sql)), RLS is enabled with policies such as `CREATE POLICY "read own journal" ON private.journal_entries_enc FOR SELECT USING (auth.uid() = user_id);`.
  - However, the Spring Boot backend connects directly to the Supabase PostgreSQL instance via JDBC using administrative database credentials (`postgres.lgcojtbcokecqmtyvsey`), bypassing PostgreSQL RLS entirely. Tenant isolation is enforced solely at the application layer.

---

## 6. SSE Streaming Endpoint Audit
- **Status**: **NOT IMPLEMENTED IN BACKEND**.
- **Evidence**:
  - Grep across backend source for `SseEmitter`, `StreamingResponseBody`, `text/event-stream`, or `MediaType.TEXT_EVENT_STREAM_VALUE` yielded **0 occurrences**.
  - `ChatController.java` exposes a single POST endpoint returning standard `ResponseEntity<?>` with a JSON map (`reply`, `retrievedSources`, `sessionId`, `crisisFlag`, `intent`).
  - Frontend [`src/components/chat/FloatingChat.tsx`](file:///src/components/chat/FloatingChat.tsx#L273-L290) contains fallback code for both JSON and SSE, but because the backend returns `application/json`, the conversation flows entirely over synchronous HTTP POST.

---

## 7. Existing Test Suite Audit
The repository contains 6 test classes in [`backend/src/test/java/com/swasthyasaathi`](file:///backend/src/test/java/com/swasthyasaathi):
1. `com.swasthyasaathi.actuator.HealthCheckTest`: 1 test verifying `/actuator/health` returns status UP.
2. `com.swasthyasaathi.chat.ChatIntegrationTest`: 2 tests verifying end-to-end chat flow and isolated crisis response flow via MockMvc.
3. `com.swasthyasaathi.chat.ChatServiceTest`: 4 unit tests covering valid request, empty content rejection, 20-message history boundary, and Gemini error handling.
4. `com.swasthyasaathi.rag.RagServiceTest`: 4 unit tests covering 768-dim embedding dimension, relevant chunk retrieval, threshold fallback, and context payload assembly.
5. `com.swasthyasaathi.scan.ScanControllerTest`: 2 unit tests covering client-side preprocessed face scan and Gemini fallback scan.
6. `com.swasthyasaathi.security.SecurityTest`: 2 tests verifying unauthenticated request rejection (401/403) and invalid JWT rejection.
- **Total Test Count**: 15 tests.
- **Execution Status**: 15/15 passing (0 failures, 0 errors).
