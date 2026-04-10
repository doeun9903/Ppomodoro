import { useEffect, useRef, useState } from "react";
import { CheckSquare, Square, Trash2, Plus, X, ListTodo, Timer } from "lucide-react";

interface Todo {
  id: string;
  content: string;
  is_done: boolean;
  created_at: string;
  focused_seconds: number;
}

interface SelectedTodo {
  id: string;
  content: string;
}

interface Props {
  selectedTodoId: string | null;
  onSelect: (todo: SelectedTodo | null) => void;
  sessionSeconds: number;
  syncedTodo: { id: string; focused_seconds: number } | null;
}

const API = "http://localhost:3001/api/todos";

const formatFocusTime = (seconds: number) => {
  if (seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m > 0 ? ` ${m}분` : ""}`;
  if (m > 0) return `${m}분`;
  return `${seconds}초`;
};

export default function TodoPanel({ selectedTodoId, onSelect, sessionSeconds, syncedTodo }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchTodos();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // 동기화 완료 시 → 해당 투두의 focused_seconds만 로컬에서 업데이트
  useEffect(() => {
    if (!syncedTodo) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === syncedTodo.id ? { ...t, focused_seconds: syncedTodo.focused_seconds } : t
      )
    );
  }, [syncedTodo]);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setTodos(data);
    } catch {
      console.error("투두 불러오기 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async () => {
    const content = input.trim();
    if (!content || isAdding) return;
    setIsAdding(true);
    setInput("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const newTodo = await res.json();
      setTodos((prev) => [...prev, newTodo]);
    } catch {
      console.error("투두 추가 실패");
      setInput(content);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_done: !t.is_done } : t))
    );
    try {
      await fetch(`${API}/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: !todo.is_done }),
      });
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, is_done: todo.is_done } : t))
      );
    }
  };

  const deleteTodo = async (id: string) => {
    if (selectedTodoId === id) onSelect(null);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
    } catch {
      console.error("투두 삭제 실패");
    }
  };

  const handleSelect = (todo: Todo) => {
    if (selectedTodoId === todo.id) {
      onSelect(null); // 다시 누르면 해제
    } else {
      onSelect({ id: todo.id, content: todo.content });
    }
  };

  const doneCnt = todos.filter((t) => t.is_done).length;

  return (
    <div className="absolute top-6 right-6 z-40">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-full text-white/90 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        {isOpen ? <X size={20} /> : <ListTodo size={20} />}
      </button>

      {/* 패널 */}
      <div
        className={`absolute top-14 right-0 w-72 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 transition-all duration-300 origin-top-right ${
          isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white/90 font-semibold">
            <ListTodo size={16} className="text-white/60" />
            <span>투두리스트</span>
          </div>
          {todos.length > 0 && (
            <span className="text-xs text-white/40">
              {doneCnt}/{todos.length} 완료
            </span>
          )}
        </div>

        {/* 입력창 */}
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.nativeEvent.isComposing && addTodo()
            }
            placeholder="할 일 추가..."
            className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-xl outline-none placeholder-white/30 border border-white/10 focus:border-white/30"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim() || isAdding}
            className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* 목록 */}
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {isLoading && (
            <p className="text-white/30 text-xs text-center py-4">불러오는 중...</p>
          )}
          {!isLoading && todos.length === 0 && (
            <p className="text-white/30 text-xs text-center py-4">
              할 일을 추가해보세요 :)
            </p>
          )}

          {todos.map((todo) => {
            const isSelected = selectedTodoId === todo.id;
            const totalSeconds =
              todo.focused_seconds + (isSelected ? sessionSeconds : 0);
            const timeLabel = formatFocusTime(totalSeconds);

            return (
              <div
                key={todo.id}
                className={`flex items-center gap-2 p-2 rounded-xl transition-colors group ${
                  isSelected
                    ? "bg-white/10 border border-white/15"
                    : "hover:bg-white/5"
                }`}
              >
                {/* 타이머 선택 버튼 */}
                <button
                  onClick={() => handleSelect(todo)}
                  title={isSelected ? "집중 해제" : "이 항목에 집중"}
                  className="shrink-0 transition-colors"
                >
                  <Timer
                    size={15}
                    className={
                      isSelected
                        ? "text-[#ff6b6b]"
                        : "text-white/20 group-hover:text-white/50"
                    }
                  />
                </button>

                {/* 체크박스 */}
                <button
                  onClick={() => toggleTodo(todo)}
                  className="shrink-0 text-white/60 hover:text-white transition-colors"
                >
                  {todo.is_done ? (
                    <CheckSquare size={17} className="text-[#4ecdc4]" />
                  ) : (
                    <Square size={17} />
                  )}
                </button>

                {/* 내용 + 집중 시간 */}
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`text-sm leading-snug ${
                      todo.is_done
                        ? "line-through text-white/30"
                        : "text-white/85"
                    }`}
                  >
                    {todo.content}
                  </p>
                  {timeLabel && (
                    <p className="text-[11px] text-white/35 mt-0.5 flex items-center gap-1">
                      <Timer size={9} />
                      {timeLabel}
                      {isSelected && sessionSeconds > 0 && " (진행 중)"}
                    </p>
                  )}
                </div>

                {/* 삭제 */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* 완료 항목 일괄 삭제 */}
        {doneCnt > 0 && (
          <button
            onClick={() =>
              todos.filter((t) => t.is_done).forEach((t) => deleteTodo(t.id))
            }
            className="mt-3 w-full text-xs text-white/30 hover:text-red-400 transition-colors pt-3 border-t border-white/10"
          >
            완료된 항목 삭제 ({doneCnt}개)
          </button>
        )}
      </div>
    </div>
  );
}
