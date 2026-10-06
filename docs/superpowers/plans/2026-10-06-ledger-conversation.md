# 对话记账工具第一版实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本次按当前会话顺序执行；未授权额外代理。

**Goal:** 在现有个人账本增加文字与图片对话录入、草稿修改、多笔一键确认与撤销，并按用户指定的全局 design-taste-frontend 打磨手机界面。

**Architecture:** React聊天页调用Spring Boot账本专用API。模型仅返回结构化识别建议，服务端持有草稿、校验归属、检查重复并以事务批量写入既有ledger_expense；识别请求不在数据库事务里等待网络。图片保存于独立私有目录。

**Tech Stack:** React 19、TypeScript、Vite、Tailwind 3、Playwright；Java 21、Spring Boot 3.2、JPA、Flyway、MySQL 8、Jackson、RestClient。沿用DashScope网关配置，新增独立账本多模态适配器。

## Global Constraints

- 规格：`../specs/2026-10-06-ledger-conversation-design.md`，包括第10节视觉要求。
- 第一版为文字与图片支出记账，无语音、账本问答、自动消费建议、收入、退款、转账、多币种。
- 手机优先，iPhone Safari、安卓手机浏览器；最多3图，每图10MB，JPEG/PNG/WebP，最多50笔草稿。
- 金额大于0且不超过999999.99、最多两位小数；说明最多500字；时区Asia/Shanghai，无具体时刻使用当天12:00。
- 一个用户一个持续会话、一份活动草稿；金额不猜、分类不自动新增，未解决问题禁止确认。
- 确认只由卡片按钮触发，整批成功或全部回滚；确认、消息重试及撤销幂等。
- 复用ledger_token与现有账本鉴权，消息、附件、草稿及正式账目始终校验用户归属。
- 图片私有，不存放在公开uploads目录，不在日志输出聊天、图片或密钥。
- 全局技能路径：`C:/Users/Admin/.codex/skills/design-taste-frontend/SKILL.md`。前端任务开始前读取该技能并遵循规格第10节，沿用既有品牌、CSS变量、字体、Tailwind 3。
- `DESIGN_VARIANCE: 3`、`MOTION_INTENSITY: 2`、`VISUAL_DENSITY: 5`，金额清晰与手机操作优先。
- 只在隔离的本地测试库测试写入，不把已有默认生产E2E地址作为新功能测试目标。上线部署单独交付可审阅结果。

## 工作目录与当前事实

以下文件路径以各自仓库根目录为基准：

- WEB = `D:/workSpace/digital-garden/digital-garden-site-web`
- SERVER = `D:/workSpace/digital-garden/digital-garden-site-server`
- DEPLOY = `D:/workSpace/digital-garden/deploy`

三个目录是独立Git仓库，父目录不是Git仓库。计划保存于WEB，后端提交在SERVER，部署配置提交在DEPLOY。执行前检查各自git status及AGENTS.md；本次读取时未发现AGENTS.md。

已检查：现有账本录入四个字段；LedgerExpenseService支持单笔新增，LedgerBudgetService根据消费月份创建预算；ledgerFetch固定JSON Content-Type；LedgerShell对所有子页添加月份条；Layout有博客页头/页脚；现有Playwright配置默认指向生产IP且只运行Chromium。这些衔接点在下面任务中逐一处理。

## 统一接口合同

新增Java包：`com.harvey.digitalgarden.ledger.chat`。小文件按单一职责拆分。REST控制器仍位于`controller/ledger`，鉴权用户只从LedgerPrincipal取得。

所有JSON接口保持现有`Result<T>`封装，业务错误检查body.code，不能仅检查HTTP状态。业务代码409表示版本冲突/处理中，404统一表示对象不存在或不属于本人。二进制附件接口成功时返回图像，失败时返回JSON错误。

### TypeScript DTO（Task 1同步定义Java record）

```ts
export type DraftStatus = "NEEDS_INPUT" | "READY" | "CONFIRMED" | "CANCELLED" | "REVOKED";
export type ChatIssue = {
  code: "AMOUNT_REQUIRED" | "AMOUNT_INVALID" | "DATE_CONFLICT" | "CATEGORY_REQUIRED"
    | "DUPLICATE_REVIEW" | "SPLIT_TOTAL_MISMATCH";
  message: string;
};
export type DraftItem = {
  id: number;
  ordinal: number;
  amount: string | null;
  categoryId: number | null;
  description: string;
  recordedAt: number | null;
  datePrecision: "DATE" | "DATETIME";
  defaultedToday: boolean;
  future: boolean;
  sourceMessageId: number;
  sourceAttachmentIds: number[];
  evidence: string;
  issues: ChatIssue[];
  duplicateExpenseIds: number[];
  duplicateAcknowledged: boolean;
};
export type SavedExpense = {
  id: number; amount: string; categoryId: number; description: string; recordedAt: number;
};
export type ChatDraft = {
  id: number; version: number; status: DraftStatus; items: DraftItem[];
  total: string; count: number; canConfirm: boolean; savedExpenses: SavedExpense[];
};
export type ChatMessage = {
  id: number; role: "user" | "assistant"; text: string;
  attachmentIds: number[]; createdAt: number; requestId: string | null;
  status: "PROCESSING" | "DONE" | "FAILED"; draftId: number | null;
};
export type ChatHistory = {
  messages: ChatMessage[]; drafts: ChatDraft[]; activeDraft: ChatDraft | null;
  nextBeforeId: number | null; processingRequestId: string | null;
  capabilities: { available: boolean; imageInput: boolean };
};
export type SendMessageRequest = {
  requestId: string; text: string; attachmentIds: number[];
  expectedDraftVersion: number | null;
};
export type ChatTurn = {
  userMessage: ChatMessage; assistantMessage: ChatMessage; draft: ChatDraft | null;
};
export type EditDraftItemRequest = {
  expectedVersion: number; amount: string | null; categoryId: number | null;
  description: string; recordedAt: number | null; datePrecision: "DATE" | "DATETIME";
  duplicateAcknowledged: boolean;
};
```

金额使用十进制字符串传输与汇总，现有账本VO不强制改类型；转为既有LedgerExpenseRequest时后端使用BigDecimal。来源、证据、问题列表只由服务端维护。

| 方法 | 路径（`/api/ledger/chat`前缀） | 入参 | 出参 |
|---|---|---|---|
| GET | `/history` | `beforeId`可选，`limit`默认30，最大100 | ChatHistory，当前页涉及的草稿及活动草稿，消息时间正序 |
| POST | `/attachments` | multipart `file`，每次一图 | `{id,contentType,width,height}` |
| GET | `/attachments/{id}/content` | 鉴权header | 私有图像bytes，Cache-Control: private,no-store |
| POST | `/messages` | SendMessageRequest | ChatTurn；同requestId重试复用结果 |
| GET | `/messages/by-request/{requestId}` | 无 | `{status,turn}`，turn在DONE时存在 |
| PUT | `/drafts/{draftId}/items/{itemId}` | EditDraftItemRequest | ChatDraft |
| DELETE | `/drafts/{draftId}/items/{itemId}` | `expectedVersion`查询参数 | ChatDraft |
| POST | `/drafts/{draftId}/cancel` | `{expectedVersion}` | ChatDraft |
| POST | `/drafts/{draftId}/confirm` | `{expectedVersion}` | ChatDraft，含正式记录 |
| POST | `/drafts/{draftId}/revoke` | `{expectedVersion}` | ChatDraft |

同一草稿只在最后一条关联助手消息下展示可编辑卡片；之前关联消息显示「草稿已更新」并跳到最新卡片。确认后的历史卡片显示保存快照，刷新也恢复，不重复渲染多张活动确认框。

## Task 1：数据持久化与合同

**Files（SERVER）：**
- Create: `src/main/resources/db/migration/V7__ledger_chat.sql`
- Create: `src/main/java/com/harvey/digitalgarden/ledger/chat/model/LedgerChatSession.java`
- Create: `src/main/java/com/harvey/digitalgarden/ledger/chat/model/LedgerChatMessage.java`
- Create: `src/main/java/com/harvey/digitalgarden/ledger/chat/model/LedgerChatAttachment.java`
- Create: `src/main/java/com/harvey/digitalgarden/ledger/chat/model/LedgerChatDraft.java`
- Create: `src/main/java/com/harvey/digitalgarden/ledger/chat/model/LedgerChatDraftItem.java`
- Create: `src/main/java/com/harvey/digitalgarden/ledger/chat/model/LedgerChatExpenseLink.java`
- Create: 同包`repository`目录下对应六个Repository接口；`dto`目录下上述每个合同独立record文件。
- Modify: `src/main/java/com/harvey/digitalgarden/entity/LedgerExpense.java`，增加`@Version Long recordVersion`。
- Create: `src/test/java/com/harvey/digitalgarden/ledger/chat/ChatSchemaIT.java`、`ChatMysqlTestSupport.java`
- Create: `compose.chat-test.yml`、`src/test/resources/application-chat-test.yml`

**Files（WEB）：** Create `src/types/ledgerChat.ts`，使用上述完整DTO。

**Interfaces:** SessionRepository按userId唯一查询/加锁；DraftRepository按userId与id查询/加锁；MessageRepository唯一(userId,requestId,role)，历史按id分页；附件按userId/id读取；Link唯一expenseId及draftItemId。

- [ ] 1. 建立隔离测试MySQL与profile；不使用现有.env里的生产凭证。

```yaml
# compose.chat-test.yml
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ledger_test_local
      MYSQL_DATABASE: ledger_chat_test
    ports:
      - "127.0.0.1:33079:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-pledger_test_local"]
      interval: 2s
      retries: 30
```

```yaml
# application-chat-test.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:33079/ledger_chat_test?serverTimezone=Asia/Shanghai&characterEncoding=utf8
    username: root
    password: ledger_test_local
  jpa:
    show-sql: false
app:
  ledger-chat:
    private-dir: ./target/chat-test-private
```

`ChatMysqlTestSupport`提供`@SpringBootTest`、`@ActiveProfiles("chat-test")`与JdbcTemplate，仅允许数据库名ledger_chat_test；子类在beforeEach清理聊天表、expense、budget、category、user（依赖顺序），用固定测试用户id101/202、分类id1001/2001和默认预算3000。仅测试事务/并发的IT使用真实库；普通单元测试不要求Docker。

- [ ] 2. 写schema测试，启动测试库后验证迁移、唯一性、expense版本初始化。

```java
@Test
void oneSessionPerUser() {
    jdbc.update("INSERT INTO ledger_chat_session(user_id) VALUES (101)");
    assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
        () -> jdbc.update("INSERT INTO ledger_chat_session(user_id) VALUES (101)"));
}
```

执行SERVER：`docker compose -f compose.chat-test.yml up -d --wait`；`mvn -Dtest=ChatSchemaIT test`。首次缺少迁移/表而失败。

- [ ] 3. 创建V7迁移，按以下字段明确实现，使用InnoDB、utf8mb4，不修改V0到V6。

```sql
ALTER TABLE ledger_expense ADD COLUMN record_version BIGINT NOT NULL DEFAULT 0;
CREATE TABLE ledger_chat_session (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  active_draft_id BIGINT UNSIGNED NULL,
  processing_request_id VARCHAR(64) NULL,
  processing_attempt VARCHAR(36) NULL,
  processing_until BIGINT NOT NULL DEFAULT 0,
  in_dtm BIGINT NOT NULL DEFAULT 0,
  update_dtm BIGINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_chat_session_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

其余五表：
- message：id/user_id/session_id/role VARCHAR(16)/request_id VARCHAR(64) NULL/text TEXT/status VARCHAR(16)/draft_id NULL/attachment_ids_json TEXT/response_json MEDIUMTEXT NULL/error_code VARCHAR(64) NULL/received_at BIGINT/attempt VARCHAR(36) NULL；唯一(user_id,request_id,role)，索引(session_id,id)。assistant的requestId也使用用户requestId。
- attachment：id/user_id/hash CHAR(64)/storage_key VARCHAR(128)/content_type VARCHAR(32)/width INT/height INT/in_dtm BIGINT；索引(user_id,hash)。哈希相同允许重复附件，上传本身不落账。
- draft：id/user_id/session_id/version BIGINT/status VARCHAR(16)/in_dtm BIGINT/update_dtm BIGINT；索引(user_id,status)。不持久化可重新计算的总额与canConfirm。
- draft_item：id/user_id/draft_id/ordinal INT/amount DECIMAL(12,2) NULL/category_id NULL/description VARCHAR(500)/recorded_at NULL/date_precision VARCHAR(16)/defaulted_today TINYINT/future TINYINT/source_message_id/source_attachment_ids_json TEXT/evidence TEXT/issues_json TEXT/duplicate_expense_ids_json TEXT/duplicate_acknowledged TINYINT/is_removed TINYINT/order_group_key VARCHAR(64) NULL/order_paid_total DECIMAL(12,2) NULL；索引(draft_id,ordinal)。移除行保留来源审计、汇总忽略。
- expense_link：id/user_id/draft_id/draft_item_id/expense_id/expense_version BIGINT/snapshot_json TEXT；唯一(draft_item_id)、唯一(expense_id)，索引(user_id,draft_id)。

上述新增实体按现有Lombok/JPA规范显式映射；金额字段BigDecimal，JSON用Jackson序列化，不依赖MySQL专属JSON查询。实体ID/关联ID只由服务端维护。

- [ ] 4. 重新运行schema测试及`mvn -DskipTests compile`，检查V7与JPA validate一致；WEB执行`npm run build`验证DTO。
- [ ] 5. 各仓库只提交本任务文件：SERVER `git commit -m "feat: persist ledger chat drafts and history"`；WEB `git commit -m "feat: define ledger chat API types"`。

## Task 2：私有图片上传、读取及格式校验

**Files（SERVER）：**
- Create: `ledger/chat/LedgerChatAttachmentService.java`、`ledger/chat/ChatImageNormalizer.java`（均位于src/main/java/com/harvey/digitalgarden）。
- Create: `controller/ledger/LedgerChatAttachmentController.java`
- Modify: `src/main/resources/application.yml`、`.env.example`、`pom.xml`
- Test: `ledger/chat/ChatImageNormalizerTest.java`、`ledger/chat/ChatAttachmentAccessIT.java`（src/test/java/com/harvey/digitalgarden前缀）。

**Interfaces:** `upload(long userId, MultipartFile file): AttachmentVO`；`loadOwned(long userId,long id): StoredImage`；StoredImage为`(byte[] bytes,String contentType,int width,int height,String hash)`；存储根目录独立于app.upload.dir。

- [ ] 1. 写实际图片bytes测试：有效PNG接受、伪装PNG文本拒绝、超10MB拒绝、超大像素图片拒绝。读取测试验证用户202无法读取101的附件；`/uploads/`无法读取私有storageKey。
- [ ] 2. 用ImageIO识别实际格式并重编码去EXIF；JPEG/PNG重编码到同格式，WebP解码后转PNG。增加经过依赖仓库核实的WebP ImageIO读取器，先查现有依赖再安装，不仅凭文件扩展名放行。图像解码前读取尺寸，最大2000万像素；私有存储保留完整分辨率的清理后图片，模型输入按长边2048px生成等比例副本，原始有效上传的SHA-256用于重复检测。HEIC和GIF明确返回不支持格式。
- [ ] 3. 写入`LEDGER_CHAT_PRIVATE_DIR`，默认`./ledger-private`；随机UUID文件名，文件名不接受用户路径；存储成功而DB保存失败时清理本次新文件。读取只接受附件ID，由数据库解析storageKey，规范化路径须位于根目录内。文件最大10MB校验在服务端再次执行。
- [ ] 4. 图像响应显式设置私有缓存与真实媒体类型；账本角色、启用状态和onboarding门禁沿用现有拦截器。应用SQL日志关闭以免聊天内容进入绑定参数日志。

```java
return org.springframework.http.ResponseEntity.ok()
    .header("Cache-Control", "private, no-store")
    .header("X-Content-Type-Options", "nosniff")
    .contentType(org.springframework.http.MediaType.parseMediaType(image.contentType()))
    .body(image.bytes());
```

- [ ] 5. 执行`mvn -Dtest=ChatImageNormalizerTest,ChatAttachmentAccessIT test`并检查未修改公共博客上传行为；提交`feat: add private ledger image attachments`。

## Task 3：多模态识别适配器与确定性草稿校验

**Files（SERVER）：**
- Create: `ledger/chat/ai/LedgerChatModel.java`、`DashscopeLedgerChatModel.java`、`ChatModelInput.java`、`ChatModelOutput.java`、`ChatModelException.java`
- Create: `ledger/chat/ChatDraftValidator.java`、`ChatDuplicateDetector.java`
- Create: `src/main/resources/prompts/ledger-chat-system.txt`
- Modify: `src/main/resources/application.yml`、`.env.example`
- Test: `ledger/chat/ChatDraftValidatorTest.java`、`ChatDuplicateDetectorTest.java`、`ai/DashscopeLedgerChatModelTest.java`

**Interfaces:** `LedgerChatModel.parse(ChatModelInput): ChatModelOutput`。Input携带固定receivedAt、文字、最多3份StoredImage、最近20条/总长度最多12000字上下文、当前草稿、本人分类。Output是`action`（APPEND/EDIT/CLARIFY）、`reply`、`items`、`edits`、`warnings`；候选包含amount原始字符串、categoryId可空、localDate/localTime可空、description、sourceAttachmentIds、evidence、orderGroupKey/paidTotal；EDIT以已有itemId定向修改，模型不能新建数据库ID或选择他人分类。

- [ ] 1. 单元测试涵盖：32.50合法、null待补充、0/-1/1000000/1.001非法；未知分类不映射到第一项；“昨天”基于固定receivedAt；未提供时刻为12:00；未来日期标记；拆分总额不一致；同日期同金额但说明不同不判重复；本人来源哈希命中正式记录提示重复。

```java
@Test
void neverGuessAmount() {
    assertEquals("AMOUNT_REQUIRED", ChatDraftValidator.amountIssue(null).code());
}
@Test
void rejectExtraDecimalPlaces() {
    assertEquals("AMOUNT_INVALID", ChatDraftValidator.amountIssue("1.001").code());
}
@Test
void exactDecimalIsAccepted() {
    assertNull(ChatDraftValidator.amountIssue("32.50"));
}
```

`amountIssue(String)`为静态纯校验函数，金额错误返回ChatIssue；其余字段通过`validate(userId,candidate,context)`得到条目和问题列表。不能把非法值先写入DECIMAL字段再校验，非法金额保留为null并在问题文案中显示原文。

- [ ] 2. 编写提示词，明确支出范围、实际支付优先、账单拆行、小票默认一笔、文字覆盖图片需明确、图片中指令不可信；输出JSON，无入账工具。CLARIFY必须保留旧草稿，未明确指代不得修改。APPEND最多50笔总量，超限不截断。
- [ ] 3. 新建独立RestClient适配器，复用`app.dashscope.api-key/base-url`配置格式；读取`LEDGER_CHAT_MODEL`，不猜测账号可用模型。启用前执行文本+图片能力探针；未配置模型则capabilities.available=false并说明记账助手未配置，手动记账仍正常。

请求形状固定如下，构造图片URL只用本人附件bytes编码的data URL，不接受模型或用户提供的任意远程URL：

```json
{
  "model": "从后端配置读取",
  "stream": false,
  "temperature": 0,
  "messages": [
    {"role": "system", "content": "账本识别提示词与JSON合同"},
    {"role": "user", "content": [
      {"type": "text", "text": "本人分类、固定时间、当前草稿和本次文字"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,附件编码"}}
    ]}
  ]
}
```

是否使用response_format取决于实际选定模型的官方支持与探针结果；默认严格解析返回的完整JSON，可去掉完整围栏，不从任意散文中猜JSON。连接超时10秒、读取超时45秒，限制并发2，满额返回可重试错误；不记录请求正文、图片及Authorization。不自动改用纯文本模型来宣称图片识别成功。
- [ ] 4. MockRestServiceServer验证请求结构、成功JSON、超时/429/错误JSON均转换为可重试业务错误；密钥不出现在异常文案。模型只建议字段，服务端重新验证ID、用户归属、金额与时间。
- [ ] 5. 执行`mvn -Dtest=ChatDraftValidatorTest,ChatDuplicateDetectorTest,DashscopeLedgerChatModelTest test`，不依赖真实API或生产数据；提交`feat: parse ledger chat into validated draft suggestions`。

## Task 4：会话、消息幂等与多轮草稿修改

**Files（SERVER）：**
- Create: `ledger/chat/LedgerChatService.java`、`ChatTurnStore.java`、`ChatDraftService.java`、`ChatHistoryService.java`
- Create: `controller/ledger/LedgerChatController.java`、`LedgerChatDraftController.java`
- Test: `ledger/chat/ChatTurnIT.java`、`ChatDraftEditingIT.java`

**Interfaces:** `ChatTurnStore.begin(userId,SendMessageRequest): TurnLease`，`complete(userId,TurnLease,ChatModelOutput): ChatTurn`，`fail(userId,TurnLease,errorCode)`；begin/complete/fail位于单独Bean的短事务，避免Spring自调用导致@Transactional失效。TurnLease含requestId、attempt UUID、固定receivedAt和草稿版本。`LedgerChatService.send`调用begin→模型→complete，不开启长事务。

- [ ] 1. 测试首次消息生成草稿但expense/budget仍为0；APPEND追加、EDIT只改目标itemId、CLARIFY不改草稿；第二个消息处理期间拒绝；同requestId DONE返回原结果；FAILED重试复用原消息和receivedAt；刷新恢复草稿。
- [ ] 2. begin锁本人session，校验3图归属、字数最多4000、非空文字或至少1图；客户端requestId最多64字符，重试payload必须与原消息相同，否则409。唯一(userId,requestId,role)处理双请求创建竞争。
- [ ] 3. 处理租约90秒、attempt UUID。complete只有attempt匹配、lease未过期且草稿版本未变时才能应用结果。过期租约可重试，旧模型迟到不能写入新结果。收到FAILED保留旧草稿与原附件；会话历史展示重试按钮。
- [ ] 4. begin期间禁止确认、手动编辑、取消和撤销；其他写操作同样锁session检查处理中，所有更新统一递增draft.version。编辑删除比较expectedVersion；冲突返回最新草稿并要求核对，模型建议不能直接覆盖用户随后修改。
- [ ] 5. 将文本“确认”“记上吧”处理成提示卡片按钮，不调用confirm。稳定itemId与ordinal分开，移除后按可见顺序重排ordinal供“第二笔”指代；模型上下文包含当前映射。取消清除session.activeDraftId，下一次录入新建草稿。
- [ ] 6. 历史每页默认30，草稿按draftId去重返回；恢复PROCESSING请求先查状态，租约过期后标为FAILED才允许重试。POST发送使用同requestId，不为网络超时重新生成ID。
- [ ] 7. 执行`mvn -Dtest=ChatTurnIT,ChatDraftEditingIT test`；提交`feat: support persistent ledger chat and draft revisions`。

## Task 5：整批确认、重复审核及撤销

**Files（SERVER）：**
- Create: `ledger/chat/ChatConfirmService.java`、`ChatRevokeService.java`
- Modify: `repository/LedgerExpenseRepository.java`、`LedgerUserRepository.java`、`service/ledger/LedgerBudgetService.java`、`LedgerExpenseService.java`
- Test: `ledger/chat/ChatConfirmIT.java`、`ChatRevokeIT.java`

**Interfaces:** `confirm(long userId,long draftId,long expectedVersion): ChatDraft`；`revoke(long userId,long draftId,long expectedVersion): ChatDraft`。返回服务端实际保存的记录，不接受客户端expenseIds。

- [ ] 1. 写真实MySQL事务测试：三笔中第二笔分类失效时expense/link/budget全部未新增；两线程确认同草稿只出现一批记录；成功后模拟客户端未收到响应，重试仍返回同一expenseIds；旧版本禁止保存。
- [ ] 2. confirm按本人用户→session→draft的固定顺序加锁，确认时重新验证全部有效条目、本人分类、疑似重复处理及总额。已CONFIRMED即返回保存快照；已CANCELLED/REVOKED不能重新确认；NEEDS_INPUT拒绝。
- [ ] 3. 保证已有预算创建不因同用户并发创建而导致事务回滚。LedgerUserRepository增加PESSIMISTIC_WRITE的findOwnedForUpdate；resolveBudget先锁用户再查询/创建。同服务所有新增预算路径（含activateMonth）遵循用户锁顺序。此修正限定于批量确认复用预算服务所需的并发问题。
- [ ] 4. 在一个@Transactional中逐笔调用现有LedgerExpenseService.createExpense并写唯一link，取得flush后的recordVersion和字段快照；草稿标记CONFIRMED并清除activeDraftId。异常向外抛出使全部回滚，不能每笔单独catch并继续。

```java
// 放在独立的ChatConfirmService事务方法中。
for (var item : readyItems) {
    var request = new com.harvey.digitalgarden.dto.ledger.LedgerExpenseRequest();
    request.setCategoryId(item.categoryId());
    request.setAmount(new java.math.BigDecimal(item.amount()));
    request.setDescription(item.description());
    request.setRecordedAt(item.recordedAt());
    var expense = expenseService.createExpense(userId, request);
    entityManager.flush();
    captureLink(userId, draft.getId(), item.id(), expense.getId());
}
draft.setStatus("CONFIRMED");
draft.setVersion(draft.getVersion() + 1);
session.setActiveDraftId(null);
```

`captureLink(long userId,long draftId,long itemId,long expenseId)`是ChatConfirmService私有方法：读取新expense实体，把recordVersion及四个记账字段序列化为snapshotJson，保存ChatExpenseLink。使用同一事务和EntityManager，不另增外部服务。

- [ ] 5. 将金额范围/精度限制添加到既有create/update共同校验以保持一致；继承已有说明长度校验与分类归属检查。正式expense加入@Version使手动编辑每次改变版本，包括改后又改回，不能只比较秒级update_dtm。
- [ ] 6. 确认前重跑消费重复检测，新发现重复时保存最新NEEDS_INPUT草稿并返回它，不写账目。用户“仍然记一笔”只确认当前匹配集合；相关金额/日期/说明/来源变更或候选重复ID变化时清除duplicateAcknowledged，重新审核。
- [ ] 7. 撤销锁用户/session/draft并按expenseId升序锁正式记录，核对版本、字段和未删除状态全部匹配后才整体软删除；任何一笔手动改动或已删除均拒绝整批撤销。成功状态REVOKED，重复返回原结果；多条记录不允许部分撤销成功。
- [ ] 8. 运行`mvn -Dtest=ChatConfirmIT,ChatRevokeIT,LedgerExpenseServiceTest,LedgerBudgetServiceTest,LedgerDashboardServiceTest test`。新增版本字段需更新原测试fixture。提交`feat: confirm and revoke ledger chat batches atomically`。

## Task 6：前端API、状态恢复与图片生命周期

**Files（WEB）：**
- Modify: `src/api/ledgerClient.ts`
- Create: `src/api/ledgerChat.ts`、`src/hooks/useLedgerChat.ts`、`src/hooks/useLedgerAttachment.ts`
- Create: `e2e/ledger-chat-contract.spec.ts`、`playwright.chat.config.ts`

**Interfaces:** API函数逐一对应统一接口合同，useLedgerChat提供history/draft/busy/error、send、retry、edit、remove、cancel、confirm、revoke、loadOlder。useLedgerAttachment鉴权fetch到blob object URL，依赖id/token变更或卸载时revokeObjectURL。

- [ ] 1. 新Playwright配置默认本地，独立于现有生产默认值；配置chromium移动宽度及桌面，WebKit可用时运行模拟项目但不宣称等于真机Safari。mock API的合同测试不要求后端真实模型。

```ts
// playwright.chat.config.ts
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: /ledger-chat.*\.spec\.ts/,
  use: { baseURL: "http://127.0.0.1:5173", locale: "zh-CN", screenshot: "only-on-failure" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chat-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chat-mobile", use: { ...devices["Pixel 7"] } },
  ],
});
```

- [ ] 2. 修改ledgerFetch仅在JSON body时设置Content-Type；附加getLedgerBlob(path,signal)共用auth header与错误封装。401业务码触发账本重新登录，同时清理旧用户状态；不能把JSON错误创建为图片blob。

```ts
const headers = new Headers(init.headers);
const token = getLedgerToken();
if (token) headers.set("Authorization", `Bearer ${token}`);
if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
  headers.set("Content-Type", "application/json");
}
```

- [ ] 3. 图片发送前校验3图、体积和格式，预览可移除；逐张上传并保留成功attachmentId，上传失败重试不重新上传已成功图片。send绑定固定requestId。刷新后从服务器恢复已发送消息和草稿，未发送本地文字不作为已保存消息展示。
- [ ] 4. 全部写操作从服务端ChatDraft更新状态，总额不用JS浮点加法。confirm超时先查询history；CONFIRMED显示成功，其余状态按原版本幂等重试。编辑冲突刷新草稿并提示「内容已更新，请重新核对」。
- [ ] 5. 上传/识别/修改/确认期间串行禁用冲突操作，AbortController取消读取；退出与切换用户清空history、附件objectURL、草稿与请求引用。大段历史用游标分页，保留滚动位置。
- [ ] 6. 运行`npm run build`和`npx playwright test -c playwright.chat.config.ts e2e/ledger-chat-contract.spec.ts`；提交`feat: connect ledger chat API and recover drafts`。

## Task 7：Taste 前端界面与账本入口

**Files（WEB）：**
- Create: `src/pages/ledger/LedgerChatPage.tsx`
- Create: `src/components/ledger/chat/ChatComposer.tsx`、`ChatMessageList.tsx`、`ChatDraftCard.tsx`、`ChatDraftItemRow.tsx`、`ChatItemEditor.tsx`、`ChatImagePreview.tsx`
- Create: `src/styles/ledger-chat.css`
- Modify: `src/App.tsx`、`src/components/Layout.tsx`、`src/components/ledger/LedgerShell.tsx`、`src/pages/ledger/LedgerDashboardPage.tsx`、`src/index.css`、`package.json`
- Test: `e2e/ledger-chat.spec.ts`

**Interfaces:** 展示组件接收Task6 hook数据与显式回调，不自行请求模型；ChatDraftCard使用服务端canConfirm；确认/撤销结果通过onConfirm/onRevoke返回更新的ChatDraft。

- [ ] 1. 调用指定全局design-taste-frontend；按规格第10节输出设计解读，审计现有实际页面与token。图标选`@phosphor-icons/react`单一库，先检查是否安装再安装；沿用现有字体和CSS主题，不更换全站设计系统。
- [ ] 2. 从已定义DTO构建真实可交互组件，mock接口只用于测试。卡片用纵向列表、金额等宽数字、持续可见的编辑/移除按钮、问题摘要和合计主操作；同draftId只有最新关联卡片可操作。
- [ ] 3. 手机编辑用底部面板、桌面用dialog，焦点进入首字段，Escape取消、保存后焦点回到原行；金额输入`inputMode="decimal"`，正文16px，触控面积44px。屏幕阅读器播报处理状态与保存结果，错误聚焦到摘要或相关字段。
- [ ] 4. 新增chat路由与导航、概览快捷按钮。LedgerShell在chat路由不设置month查询参数、不显示MonthPicker；其他页面行为保持现有月份合同。Layout在chat路由使用min-h-[100dvh]与更紧凑main，并隐藏博客Footer以给输入区域留空间；Navbar仍保留。桌面最大760px。
- [ ] 5. Composer与消息滚动容器共享聊天视口，单一底部输入栏；手机键盘变化时使用可视视口高度更新CSS变量但不把滚动值写入React状态。安全区底部留白，无页面横向溢出。

```css
.ledger-chat {
  --chat-radius: 16px;
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.ledger-chat__messages { min-height: 0; overflow-y: auto; }
.ledger-chat__composer { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
.ledger-chat__amount { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ledger-chat button { min-height: 44px; }
.ledger-chat input, .ledger-chat textarea { font-size: 16px; }
@media (prefers-reduced-motion: reduce) {
  .ledger-chat *, .ledger-chat *::before, .ledger-chat *::after {
    animation: none !important;
    transition-duration: 0s !important;
  }
}
```

具体height在页面测量Navbar、账本导航和页头后扣除；不写固定假设高度。用户上翻历史时停止自动跟随，新消息提供「查看新消息」。列表确认栏放卡片末尾，避免两个固定底栏。
- [ ] 6. 展示空白/上传/识别/可确认/待补充/保存/错误/已保存/已取消/已撤销全状态。暗色主按钮用深色文字搭配浅紫背景；语义问题色有专用token并搭配文本。不添加宣传区、装饰图、自动无限动效或GSAP。
- [ ] 7. 写用户流程Playwright，实际断言多笔、自然语言改第二笔、编辑/移除、图片多笔、未补齐禁用、撤销二次确认、历史恢复、失败重试。

```ts
test("手机界面不横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/ledger/chat");
  await expect(page.getByRole("heading", { name: "对话记账" })).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);
});
```

测试beforeEach需mock`/api/ledger/auth/me`返回onboardingDone=true并在localStorage存测试token；全部chat接口按统一合同返回fixture，禁用外部生产请求。不能让认证重定向后把上述断言当成通过。
- [ ] 8. 运行`npm run build`、`npm run lint`及新Playwright配置；若原有lint问题存在，分清基线与本任务引入问题。提交`feat: add refined mobile ledger chat interface`。

## Task 8：部署配置和模型能力验证

**Files（DEPLOY）：** Modify `docker-compose.yml`、`.env.example`、`README.md`。
**Files（WEB）：** Modify `nginx.conf`。
**Files（SERVER）：** Modify `.env.example`，Create `scripts/probe-ledger-chat.ps1`。

**Interfaces:** `LEDGER_CHAT_MODEL`指定图片理解模型；`LEDGER_CHAT_PRIVATE_DIR=/app/ledger-private`由独立volume持久化；模型密钥保持后端DASHSCOPE_API_KEY。可用性探针只读取配置是否存在并调用测试输入，不打印密钥。

- [ ] 1. 在Compose增加私有volume，传递LEDGER_CHAT_MODEL、DASHSCOPE_BASE_URL及私有路径；app.ledger-chat.model未配置时功能返回不可用，服务仍可启动。

```yaml
# server.environment追加
LEDGER_CHAT_MODEL: ${LEDGER_CHAT_MODEL:-}
LEDGER_CHAT_PRIVATE_DIR: /app/ledger-private
DASHSCOPE_BASE_URL: ${DASHSCOPE_BASE_URL:-https://dashscope.aliyuncs.com/compatible-mode/v1}
# server.volumes追加
- ledger_private_data:/app/ledger-private
# 顶层volumes追加
ledger_private_data:
```

- [ ] 2. HTTP默认server和HTTPS www server的`/api/ledger/chat/`专用location设置`client_max_body_size 11m`、`proxy_read_timeout 75s`，其他API保留既有设置。上传每次仅一图，应用multipart请求上限11MB、单文件10MB。不代理任何私有文件目录到公开路径。
- [ ] 3. 文档记录nginx已有www.harvey404.com证书配置是代码事实，发布前检查实际HTTPS域名是否可用。不得因为旧README只有IP而再假设没有HTTPS。
- [ ] 4. 在开发环境使用实际已配置模型，探针发送测试文字「今天午饭32元」及明确标注为测试的PNG付款截图，验证JSON形状与图片解析。模型名称与图像/JSON能力以官方文档和实际账户结果为准，记录所用模型与结果，失败则不标记图片可用。
- [ ] 5. 执行`docker compose --env-file .env config --quiet`（不输出展开后的含密钥配置）；构建镜像和`nginx -t`在本地/隔离环境完成。提交`chore: configure ledger chat model and private storage`，不自动更新生产。

## Task 9：整体验收与交付记录

**Files（WEB）：** Create `docs/superpowers/reports/2026-10-06-ledger-chat-verification.md`、`e2e/ledger-chat-live.spec.ts`。
**Files（SERVER）：** 测试fixtures在`src/test/resources/ledger-chat`，仅存人工生成或已脱敏样例。

- [ ] 1. 运行后端普通单元测试与所有新增MySQL IT，执行前检查测试profile数据库名；对话测试必须调用真实事务Bean，Mockito验证调用次数不能代替原子性测试。两线程确认/撤销与后续编辑冲突测试必须给出实际DB记录数量。
- [ ] 2. 前端mock测试确认交互正确，再用本地后端及测试库运行live流程：新测试用户→分类→文字三笔→修改→确认→明细/概览合计一致→撤销。配置live spec只在`CHAT_LIVE_TEST=1`且E2E_BASE_URL为localhost/127.0.0.1时执行，绝不自动写入生产个人账本。
- [ ] 3. 模型样例评估至少包括单笔付款截图、折扣小票、账单列表、失败订单、收入混合列表、模糊图、重复多图、图片内指令、日期冲突和同额不同消费；逐条记录正确字段与需追问结果，低置信结果不自动入账。
- [ ] 4. 使用taste技能验收实际运行页面：320/390/430px和桌面、浅色/深色、50笔长列表、长说明、未完成字段、重复提示、错误和恢复；保存截图，检查金额对齐、按钮对比度、字号、焦点和图片加载布局。仅将真实测试截图作为结果。
- [ ] 5. 运行Lighthouse记录性能/可访问性结果。iPhone Safari与安卓Chrome真机验证相册、拍照、软键盘、输入发送、底部编辑及确认操作。无真机时明确列出未验证项，桌面模拟不代替真机结论。
- [ ] 6. 报告记录：每条命令与退出结果、模型配置名称（不含密钥）、事务/隔离/幂等覆盖、截图路径、真机结果、未完成验证与部署步骤。停止测试容器`docker compose -f compose.chat-test.yml stop`，不删除用户数据或生产卷。
- [ ] 7. 对照规格1至10节自查覆盖，核对工作区改动、git diff --check与三仓库提交。交付实现和验证结果，生产部署另行根据用户明确指令执行。

## 计划自查结果

已覆盖：文字/图片混合、多笔列表、按行编辑与移除、自然语言指代、单活动草稿、缺失信息、分类归属、实际支付与拆分、日期精度、未来录入、重复上传/消费/确认、多轮与刷新恢复、原子保存、跨月预算、并发与撤销、私有附件、模型失败、用户切换、移动布局、双主题与taste验收。

执行顺序：数据合同→附件→识别规则→会话→确认撤销→前端数据→taste界面→配置→整体验收。整个第一版在一个计划内，任务间接口已定义；实施时在当前会话顺序执行，不要求用户再选择代理模式。
