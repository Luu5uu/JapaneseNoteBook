我想和你一起开发一个叫 **JapaneseNoteBook** 的日语学习项目。

这个项目未来可能扩展成一个完整的 Japanese Learning App，但目前只做第一个模块：

**Vocabulary Notebook**

当前目标是先解决我自己学习日语时记录和整理词汇的问题。

请保持架构清晰、可扩展，但不要为了未来功能过度设计。

---

# 1. 技术栈

Frontend:
- React
- TypeScript
- Vite

Backend:
- Python
- FastAPI

Database:
- PostgreSQL

可以根据需要使用：
- SQLAlchemy
- Pydantic
- Alembic

Version Control:
- Git
- GitHub

整体结构：

```text
React + TypeScript
        ↓
      REST API
        ↓
Python + FastAPI
        ↓
    PostgreSQL
```

当前不要加入 AI、Authentication、Cloud Sync、Spaced Repetition、Docker、Microservices 等额外功能。

---

# 2. 项目结构思想

Vocabulary Notebook 只是 JapaneseNoteBook 的第一个模块。

未来可能继续增加：

```text
JapaneseNoteBook
│
├── Vocabulary
├── Review
├── Pronunciation
├── Grammar
├── Quiz
└── AI
```

目前只实现 Vocabulary。

希望前端和后端都按照模块组织，例如：

```text
frontend/src/modules/vocabulary/
backend/app/modules/vocabulary/
```

但不要因为 modular architecture 拆出大量没有必要的层。

---

# 3. Category

Vocabulary 最外层是 Category。

Category 由用户自己创建，例如：

```text
Verb
Noun
Adjective
Particle
Expression
```

这些名字不能写死。

v0.1 中：

- 一个 Entry 只属于一个 Category
- 用户可以创建、查看、重命名、删除 Category
- 点击 Category 后进入该 Category 的 Vocabulary Workspace

例如：

```text
Verb

食べる
飲む
行く
帰る
```

---

# 4. Vocabulary Entry

每个 Entry 必须有：

```text
Word
```

Word 是唯一 required field。

例如：

```text
Word: 食べる
```

除此之外，可以选择添加以下 optional Labels：

```text
Kanji
Hiragana
Katakana
Romaji
Note
```

这里项目中所说的 **Label** 指的是这些可选字段名称。

不是 Food / Important / Lesson 3 这种 Tag。

例如：

```text
Word
食べる

Kanji
食べる

Hiragana
たべる

Romaji
taberu

Note
to eat
```

另一个 Entry 可以只有：

```text
Word
これ

Hiragana
これ

Romaji
kore
```

不同 Entry 可以拥有不同的 Label 组合。

---

# 5. Category Workspace

添加单词不使用独立页面。

例如用户进入：

```text
Verb
```

这个页面本身就是一个 Workspace，同时负责：

- 添加 Entry
- 浏览已有 Entries
- Card View
- Table View

页面顶部有 Add Entry Block：

```text
Verb

┌──────────────────────────┐
│ Add Entry                │
│                          │
│ Word *                   │
│ [                    ]   │
│                          │
│ Kanji                ×   │
│ [                    ]   │
│                          │
│ Hiragana             ×   │
│ [                    ]   │
│                          │
│ Romaji               ×   │
│ [                    ]   │
│                          │
│ Note                 ×   │
│ [                    ]   │
│                          │
│ + Add Label              │
│                          │
│ [ Add Word ]             │
└──────────────────────────┘

[ Card View ] [ Table View ]

...
```

因为用户已经位于 Verb Category，所以这里添加的新 Entry 自动属于 Verb。

不需要再次选择 Category。

---

# 6. Add Block 滚动行为

Add Entry Block 默认显示在 Category 页面顶部。

但 Category 中可能有很多单词。

当用户向下滚动，顶部 Add Block 离开视野后，希望它可以移动到页面侧边，成为一个：

**sticky / floating Add Block**

这样用户浏览下面的单词时，仍然可以随时添加新词，而不需要重新滚回页面顶部。

核心要求：

- 页面顶部时正常显示 Add Block
- 向下浏览时 Add Block 保持容易访问
- 可以采用侧边 sticky / floating 设计
- 不要遮挡主要 Vocabulary 内容
- 桌面端先做好，移动端以后再根据实际使用优化

具体实现方式可以在开发时讨论。

---

# 7. Default Entry Template

我不希望每次添加词都重新选择 Label。

所以需要一个全局：

**Default Entry Template**

例如：

```text
Word
Kanji
Hiragana
Romaji
Note
```

每次 Add Entry Block 默认加载这个结构。

规则：

- Word 永远存在
- Word 不能删除
- 其他 Labels 可以点击 × 从当前表单移除
- 可以通过 + Add Label 添加当前没有显示的 Label
- 同一种 Label 不能重复添加

例如当前有：

```text
Word
Hiragana
Romaji
Note
```

那么：

```text
+ Add Label
```

可以提供：

```text
Kanji
Katakana
```

---

# 8. Save as Default

修改当前 Add Block 的 Label 组合，只影响当前输入。

例如默认：

```text
Word
Kanji
Hiragana
Romaji
Note
```

这次我删除 Kanji：

```text
Word
Hiragana
Romaji
Note
```

添加当前 Entry 后，原来的 Default 不应该自动改变。

只有当我明确执行：

```text
Save current layout as default
```

才更新 Default Template。

另外：

**Default Template 只是决定默认显示哪些输入框，不代表这些字段 required。**

真正唯一 required 的是：

```text
Word
```

即使默认显示 Kanji / Hiragana / Note，这些也都可以留空。

---

# 9. Card View

Card View 是默认浏览模式。

每个 Entry 是独立的小块。

只显示该 Entry 实际有内容的 Labels。

例如：

```text
┌─────────────────────┐
│ 食べる              │
│                     │
│ Hiragana   たべる   │
│ Romaji     taberu   │
│ Note       to eat   │
└─────────────────────┘


┌─────────────────────┐
│ これ                │
│                     │
│ Romaji     kore     │
└─────────────────────┘
```

不同 Card 高度可以不同。

Card 之间需要有明显间隔，不要像表格一样连在一起。

---

# 10. Table View

Table View 用于统一浏览和管理。

例如：

```text
Word      Kanji     Hiragana    Katakana    Romaji     Note
----------------------------------------------------------------
食べる    食べる     たべる                   taberu     to eat
これ                 これ                     kore
コンビニ                        コンビニ      konbini
```

如果某个 Entry 没有对应值：

对应 cell 留空。

未来可以增加 Column 显示控制，但不需要在第一阶段实现。

---

# 11. 数据设计需要重点讨论的问题

Phase 1 中，请重点分析：

Vocabulary Entry 的 optional Labels 最适合怎么存。

至少比较：

### Option A

直接使用 nullable columns：

```text
id
category_id
word
kanji
hiragana
katakana
romaji
note
```

### Option B

Word 固定，其他 Label/value 使用更动态的结构。

请从以下角度比较：

- simplicity
- PostgreSQL querying
- React frontend usage
- Card View
- Table View
- future extensibility
- migrations
- over-engineering risk

当前 Labels 类型只有：

```text
Kanji
Hiragana
Katakana
Romaji
Note
```

未来可能增加其他字段，但目前没有 custom field creator。

请推荐最适合当前 v0.1 的设计。

---

# 12. Default Template Storage

还需要决定如何保存：

```text
Default Entry Template
```

例如：

```text
["kanji", "hiragana", "romaji", "note"]
```

请比较适合使用：

- PostgreSQL JSONB
- PostgreSQL array
- 单独的 settings/config table
- 其他简单方案

当前只有一个用户，所以不要设计复杂 multi-user settings。

---

# 13. 当前开发顺序

我们一步一步完成。

## Phase 1 — Architecture

现在只完成：

1. 总结你对 JapaneseNoteBook 当前需求的理解。
2. 检查需求中有没有明显逻辑或架构问题。
3. 确认 React + TypeScript + Vite + FastAPI + PostgreSQL 是否适合。
4. 设计简洁、可扩展的 frontend folder structure。
5. 设计简洁、可扩展的 backend folder structure。
6. 设计 PostgreSQL schema。
7. 比较 optional Labels 的数据库设计方案并给出推荐。
8. 设计主要 REST API endpoints。
9. 推荐 Default Entry Template 的存储方式。
10. 给出后续 Phase 的合理开发顺序。

完成 Phase 1 后停止。

不要开始大量写实现代码。

---

## Phase 2 — Project Setup

之后再做：

- 创建 repo structure
- React + TypeScript + Vite 初始化
- FastAPI 初始化
- PostgreSQL 连接
- frontend ↔ backend 基础通信

---

## Phase 3 — Category

实现：

- Create Category
- View Categories
- Rename Category
- Delete Category
- Enter Category Workspace

---

## Phase 4 — Vocabulary Workspace

实现：

- Add Entry Block
- required Word
- optional Labels
- Add Label
- Remove Label
- Add Entry
- View Entries
- sticky / floating Add Block

---

## Phase 5 — Default Template

实现：

- Load Default Template
- Save current layout as Default

---

## Phase 6 — Views

实现：

- Card View
- Table View
- view switching

---

## Phase 7 — Polish

最后再做：

- basic search
- edit/delete Entry
- validation
- error handling
- tests
- UI cleanup
- README
- deployment

---

当前最重要的目标：

**先做出一个我自己真的愿意每天使用的 Vocabulary Notebook。**

同时保持结构足够清楚，让 JapaneseNoteBook 以后可以继续增加新的学习模块。

现在请只执行 **Phase 1**。