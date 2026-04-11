require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(express.json());

// ─── YouTube 검색 ────────────────────────────────────────────
app.get("/api/youtube/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "query required" });

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "6");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const results = (data.items ?? []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url,
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "YouTube API 요청 실패" });
  }
});

// ─── Todo CRUD ───────────────────────────────────────────────

// 오른쪽 패널용: 미완료 + 오늘 완료된 투두
app.get("/api/todos", async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .or(`completed_at.is.null,completed_at.gte.${todayStart.toISOString()}`)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 왼쪽 히스토리용: 전체 투두를 날짜별로 그룹핑
app.get("/api/todos/history", async (req, res) => {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // created_at 날짜(YYYY-MM-DD)로 그룹핑
  const grouped = {};
  data.forEach((todo) => {
    const date = todo.created_at.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(todo);
  });

  res.json(grouped);
});

// 생성
app.post("/api/todos", async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "content required" });

  const { data, error } = await supabase
    .from("todos")
    .insert({ content: content.trim() })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// 완료 토글 (completed_at 기반)
app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const updates = {
    is_done: completed,
    completed_at: completed ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("todos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 집중 시간 누적
app.patch("/api/todos/:id/focus", async (req, res) => {
  const { id } = req.params;
  const { seconds } = req.body;
  if (!seconds || seconds <= 0) return res.status(400).json({ error: "seconds required" });

  const { data: current, error: fetchErr } = await supabase
    .from("todos")
    .select("focused_seconds")
    .eq("id", id)
    .single();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });

  const { data, error } = await supabase
    .from("todos")
    .update({ focused_seconds: (current.focused_seconds ?? 0) + seconds })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 삭제
app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
