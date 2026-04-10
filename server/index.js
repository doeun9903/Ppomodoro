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

app.use(cors({ origin: "http://localhost:5173" }));
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

// 전체 조회
app.get("/api/todos", async (req, res) => {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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

// 완료 토글
app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { is_done } = req.body;

  const { data, error } = await supabase
    .from("todos")
    .update({ is_done })
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
