import { useEffect, useRef, useState } from "react";
import { CheckSquare, Square, Trash2, Plus, X, ListTodo } from "lucide-react";

interface Todo {
  id: string;
  content: string;
  is_done: boolean;
  created_at: string;
}

const API = "http://localhost:3001/api/todos";

export default function TodoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 패널 열릴 때 목록 불러오기
  useEffect(() => {
    if (!isOpen) return;
    fetchTodos();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

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
    if (!input.trim()) return;
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      const newTodo = await res.json();
      setTodos((prev) => [...prev, newTodo]);
      setInput("");
    } catch {
      console.error("투두 추가 실패");
    }
  };

  const toggleTodo = async (todo: Todo) => {
    // 낙관적 업데이트 (UI 먼저)
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
      // 실패하면 원복
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, is_done: todo.is_done } : t))
      );
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
    } catch {
      console.error("투두 삭제 실패");
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
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="할 일 추가..."
            className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-xl outline-none placeholder-white/30 border border-white/10 focus:border-white/30"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
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

          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 group transition-colors"
            >
              {/* 체크박스 */}
              <button
                onClick={() => toggleTodo(todo)}
                className="shrink-0 text-white/60 hover:text-white transition-colors"
              >
                {todo.is_done ? (
                  <CheckSquare size={18} className="text-[#4ecdc4]" />
                ) : (
                  <Square size={18} />
                )}
              </button>

              {/* 내용 */}
              <span
                className={`flex-1 text-sm leading-snug transition-colors ${
                  todo.is_done
                    ? "line-through text-white/30"
                    : "text-white/85"
                }`}
              >
                {todo.content}
              </span>

              {/* 삭제 */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* 완료 항목 일괄 삭제 */}
        {doneCnt > 0 && (
          <button
            onClick={() => todos.filter((t) => t.is_done).forEach((t) => deleteTodo(t.id))}
            className="mt-3 w-full text-xs text-white/30 hover:text-red-400 transition-colors pt-3 border-t border-white/10"
          >
            완료된 항목 삭제 ({doneCnt}개)
          </button>
        )}
      </div>
    </div>
  );
}
