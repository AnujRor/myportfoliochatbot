import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ArrowUp, Bot, CircleAlert, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Role = 'assistant' | 'user';
type Message = { id: string; role: Role; content: string };

const STORAGE_KEY = 'anuj-ai-assistant-messages';
const FIRST_MESSAGE =
  'Namaste! 👋 Main Anuj ka AI assistant hoon. Aap mujhse Anuj ke baare mein kuch bhi pooch sakte ho: unki story, projects, skills ya contact.';
const SUGGESTIONS = [
  'Anuj kaun hai?',
  'Projects dikhao',
  'AI Dost kya hai?',
  'Contact kaise karein?',
];

function createMessage(role: Role, content: string): Message {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, content };
}

function initialMessages(): Message[] {
  return [createMessage('assistant', FIRST_MESSAGE)];
}

function InlineMarkdown({ content }: { content: string }) {
  const renderInline = (text: string) => {
    const tokens = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean);
    return tokens.map((token, index) => {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        return (
          <a key={`${token}-${index}`} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        );
      }
      const bold = token.match(/^\*\*([^*]+)\*\*$/);
      return bold ? <strong key={`${token}-${index}`}>{bold[1]}</strong> : <span key={`${token}-${index}`}>{token}</span>;
    });
  };

  const blocks = content.split(/\n+/);
  const rendered: ReactNode[] = [];
  let bullets: string[] = [];
  const flushBullets = () => {
    if (bullets.length) {
      rendered.push(
        <ul key={`list-${rendered.length}`}>
          {bullets.map((item, index) => <li key={`${item}-${index}`}>{renderInline(item)}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };
  blocks.forEach((line, index) => {
    if (/^\s*[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^\s*[-*]\s+/, ''));
      return;
    }
    flushBullets();
    if (line.trim()) rendered.push(<p key={`paragraph-${index}`}>{renderInline(line)}</p>);
  });
  flushBullets();
  return <div className="message-copy">{rendered}</div>;
}

function AssistantMark({ small = false }: { small?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#2c568e,#1e3a8a)] text-[#f8f2e7] shadow-[0_4px_13px_rgba(30,58,138,.22)] ${small ? 'h-7 w-7' : 'h-9 w-9'}`}
    >
      {small ? <Bot size={15} strokeWidth={2.2} /> : <span className="font-mono text-[11px] font-bold tracking-[-.08em]">AR</span>}
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const assistant = message.role === 'assistant';
  return (
    <div className={`chat-message-in flex w-full gap-2.5 ${assistant ? 'items-end' : 'items-start justify-end'}`} data-testid={`message-${message.id}`}>
      {assistant && <AssistantMark small />}
      <div
        className={`max-w-[82%] px-4 py-3 text-[14px] leading-[1.55] shadow-[0_2px_8px_rgba(38,74,70,.07)] ${
          assistant
             ? 'rounded-[17px_17px_17px_5px] border border-[#d5ebe5] bg-[linear-gradient(145deg,#f7fffd,#edf9f5)] text-[#204541]'
             : 'rounded-[17px_17px_5px_17px] bg-[linear-gradient(145deg,#159a8c,#087f78)] text-[#f5fffd] shadow-[0_5px_13px_rgba(8,127,120,.2)]'
        }`}
      >
        {assistant ? <InlineMarkdown content={message.content} /> : <p className="m-0 whitespace-pre-wrap">{message.content}</p>}
      </div>
      {!assistant && (
        <div aria-hidden="true" className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8c17b] text-[#213f69]">
          <UserRound size={14} strokeWidth={2.3} />
        </div>
      )}
    </div>
  );
}

function Home() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) as Message[] : initialMessages();
    } catch {
      return initialMessages();
    }
  });
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }));
  }, [messages, isLoading]);

  const sendMessage = async (rawContent: string, history: Message[] = messages) => {
    const content = rawContent.trim();
    if (!content || isLoading) return;
    const userMessage = createMessage('user', content);
    const nextMessages = [...history, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setError(false);
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })) }),
      });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json() as { reply?: string };
      if (!data.reply) throw new Error('Empty reply');
      setMessages(current => [...current, createMessage('assistant', data.reply as string)]);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    const lastUser = [...messages].reverse().find(message => message.role === 'user');
    if (lastUser) {
      const lastIndex = messages.findIndex(message => message.id === lastUser.id);
      const historyWithoutFailedMessage = messages.slice(0, lastIndex);
      setMessages(historyWithoutFailedMessage);
      setError(false);
      void sendMessage(lastUser.content, historyWithoutFailedMessage);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  const newChat = () => {
    setMessages(initialMessages());
    setDraft('');
    setError(false);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <main className="chat-shell flex min-h-[100dvh] flex-col overflow-hidden text-[#293448]">
      <header className="header-in z-10 flex shrink-0 items-center justify-between border-b border-[#e6dfd3] bg-[#faf7f0]/90 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <AssistantMark />
          <div>
            <h1 className="font-['Space_Grotesk'] text-[15px] font-bold tracking-[-.025em] text-[#1f3049]">Anuj&apos;s AI Assistant</h1>
             <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[#6d756f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#55a36a] shadow-[0_0_0_3px_rgba(85,163,106,.12)]" />
               Online · Ask me about Anuj
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={newChat}
          data-testid="button-new-chat"
           className="inline-flex items-center gap-1.5 rounded-full border border-[#d9d3c8] bg-[#fffdf9]/70 px-3.5 py-2 text-[12px] font-semibold text-[#40506a] transition-all hover:-translate-y-0.5 hover:border-[#213f69] hover:bg-[#f0ece4] hover:shadow-[0_4px_12px_rgba(54,67,86,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4c84bd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f0]"
        >
           <RotateCcw size={13} aria-hidden="true" />
           <span>New</span>
        </button>
      </header>

      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-5">
        <div className="space-y-4">
          {messages.map(message => <ChatMessage key={message.id} message={message} />)}
          {messages.length === 1 && !isLoading && (
            <div className="ml-11 flex max-w-[86%] flex-wrap gap-2 pt-1" data-testid="suggestion-list">
              {SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  data-testid={`button-suggestion-${suggestion.toLowerCase().replaceAll(' ', '-')}`}
                   className="rounded-full border border-[#dfd7ca] bg-[#fffdf9]/80 px-3.5 py-2 text-left text-[12px] font-medium text-[#42516a] shadow-[0_2px_6px_rgba(63,57,46,.035)] transition-all hover:-translate-y-0.5 hover:border-[#c59a56] hover:bg-[#fff6e7] hover:shadow-[0_5px_12px_rgba(197,154,86,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4c84bd]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="chat-message-in flex items-end gap-2.5" data-testid="status-typing">
              <AssistantMark small />
              <div className="flex h-10 items-center gap-1 rounded-[17px_17px_17px_5px] border border-[#d5ebe5] bg-[#f3fbf8] px-4 shadow-[0_2px_8px_rgba(38,74,70,.06)]" aria-label="Assistant is typing">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#66748a]" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#66748a]" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#66748a]" />
              </div>
            </div>
          )}
          {error && (
            <div className="ml-11 flex items-center gap-2 rounded-xl border border-[#e8b8ad] bg-[#fff4f0] px-3 py-2.5 text-[12px] text-[#9e4d40]" role="alert" data-testid="status-error">
              <CircleAlert size={15} />
               <span className="flex-1">Something went wrong. Please try again.</span>
              <button type="button" onClick={retry} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b96d5d]" data-testid="button-retry">
                <RotateCcw size={13} /> Retry
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="safe-bottom shrink-0 border-t border-[#e6dfd3] bg-[#faf7f0] px-4 pt-3 sm:px-5">
        <form onSubmit={submit} className="flex items-center gap-2 rounded-[18px] border border-[#d9d3c8] bg-[#fffdf9] p-1.5 pl-4 shadow-[0_3px_13px_rgba(62,57,48,.06)] focus-within:border-[#88a5c7] focus-within:ring-2 focus-within:ring-[#d7e3f0]" data-testid="form-chat">
          <input
            ref={inputRef}
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="Anuj ke baare mein poochiye..."
            aria-label="Ask Anuj's AI Assistant"
            data-testid="input-chat"
            className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-[#293448] outline-none placeholder:text-[#9a9d9d]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!draft.trim() || isLoading}
            aria-label="Send message"
            data-testid="button-send"
             className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#3f86cb,#1e5da1)] text-white shadow-[0_4px_10px_rgba(47,112,183,.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(47,112,183,.3)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4c84bd] focus-visible:ring-offset-2"
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </button>
        </form>
        <p className="flex items-center justify-center gap-1.5 py-2 text-center text-[10px] tracking-[.01em] text-[#92928d]">
          <Sparkles size={11} className="text-[#c49a55]" /> AI assistant of Anuj Ror
        </p>
      </div>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
