import { type FormEvent, type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Camera, Check, ChevronLeft, Clock3, History as HistoryIcon, Home as HomeIcon, Plus, RotateCcw, Trophy, Users, X } from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import NotFound from '@/pages/not-found';

type Round = { number: number; winnerTeam: 0 | 1 | null; points: number; source: 'manual' | 'camera' | 'tie' };
type Team = { name: string; players: [string, string]; totalScore: number };
type Game = { id: string; createdAt: string; completedAt: string | null; winningTeam: 0 | 1 | null; teams: [Team, Team]; rounds: Round[] };
type ModalMode = 'menu' | 'manual' | 'camera' | null;

const STORAGE_KEY = 'domino-scorekeeper-games-v1';
const queryClient = new QueryClient();

function readGames(): Game[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as Game[] : [];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));
}

const GamesContext = createContext<{ games: Game[]; createGame: (names: string[]) => Game; updateGame: (game: Game) => void; removeGame: (id: string) => void } | null>(null);

function useGames() {
  const context = useContext(GamesContext);
  if (!context) throw new Error('Games context is unavailable');
  return context;
}

function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>(readGames);
  const persist = (next: Game[]) => {
    setGames(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const createGame = (names: string[]) => {
    const game: Game = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      winningTeam: null,
      teams: [
        { name: 'Team Sun', players: [names[0], names[1]], totalScore: 0 },
        { name: 'Team Moss', players: [names[2], names[3]], totalScore: 0 },
      ],
      rounds: [],
    };
    persist([game, ...games]);
    return game;
  };
  const updateGame = (game: Game) => persist(games.map((item) => item.id === game.id ? game : item));
  const removeGame = (id: string) => persist(games.filter((game) => game.id !== id));
  return <GamesContext.Provider value={{ games, createGame, updateGame, removeGame }}>{children}</GamesContext.Provider>;
}

function Brand() {
  return <Link href="/" className="brand" data-testid="link-brand">
    <span className="brand-mark" aria-hidden="true"><span className="mono-font" style={{ fontSize: 12 }}>P</span></span>
    <span className="brand-name">Pollona</span>
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <div className="app-shell">
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/" className={`nav-link ${location === '/' ? 'active' : ''}`} data-testid="link-home">Home</Link>
          <Link href="/history" className={`nav-link ${location.startsWith('/history') ? 'active' : ''}`} data-testid="link-history">Past games</Link>
          <Link href="/new-game" className="btn btn-primary btn-small" data-testid="link-new-game"><Plus size={16} /> New game</Link>
        </nav>
      </div>
    </header>
    {children}
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <Link href="/" className={location === '/' ? 'active' : ''} data-testid="mobile-link-home"><HomeIcon size={16} /> Home</Link>
      <Link href="/new-game" className={location === '/new-game' ? 'active' : ''} data-testid="mobile-link-new-game"><Plus size={17} /> New game</Link>
      <Link href="/history" className={location.startsWith('/history') ? 'active' : ''} data-testid="mobile-link-history"><HistoryIcon size={16} /> History</Link>
    </nav>
  </div>;
}

function Home() {
  const { games } = useGames();
  const recent = games.slice(0, 3);
  return <main className="page">
    <section className="reveal" style={{ maxWidth: 680, paddingTop: '1rem' }}>
      <p className="eyebrow">The table is ready</p>
      <h1 className="headline" style={{ fontSize: 'clamp(3.4rem, 14vw, 7.5rem)', margin: '.7rem 0 1.4rem' }}>
        Keep score.<br /><span style={{ color: 'hsl(var(--primary))' }}>Keep playing.</span>
      </h1>
      <p className="muted" style={{ fontSize: '1.08rem', lineHeight: 1.55, maxWidth: 470 }}>
        A warm little scorekeeper for the loudest table in the house. No paper, no math, no “wait, whose turn?”
      </p>
      <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap', marginTop: '1.6rem' }}>
        <Link href="/new-game" className="btn btn-primary" data-testid="button-start-game"><Plus size={19} /> Start a new game</Link>
        {games.length > 0 && <Link href="/history" className="btn btn-outline" data-testid="button-browse-games">Browse saved games</Link>}
      </div>
    </section>

    <section className="reveal delay-1" style={{ marginTop: '4rem' }}>
      <div className="card" style={{ overflow: 'hidden', background: 'hsl(var(--sidebar))', color: 'hsl(var(--sidebar-foreground))', border: 0 }}>
        <div style={{ padding: '1.4rem 1.35rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p className="eyebrow" style={{ color: 'hsl(var(--accent))' }}>How it works</p>
             <h2 className="display-font" style={{ fontSize: '2rem', marginTop: '.45rem' }}>Reach 100.<br />Leave zero behind.</h2>
          </div>
          <div style={{ width: 66, height: 66, border: '2px solid hsl(var(--accent))', borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'hsl(var(--accent))', flexShrink: 0 }}>
            <span className="mono-font" style={{ fontSize: 20 }}>100</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid hsl(var(--sidebar-border))' }}>
          {[
            ['01', 'Name your teams'],
            ['02', 'Tap the winner'],
             ['03', 'Race to 100'],
          ].map(([number, copy]) => <div key={number} style={{ padding: '1rem .8rem', borderRight: '1px solid hsl(var(--sidebar-border))' }}>
            <span className="mono-font" style={{ color: 'hsl(var(--primary))', fontSize: '.7rem' }}>{number}</span>
            <p style={{ marginTop: '.45rem', fontSize: '.78rem', lineHeight: 1.25 }}>{copy}</p>
          </div>)}
        </div>
      </div>
    </section>

    <section className="reveal delay-2" style={{ marginTop: '3.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
        <h2 className="section-title">Recent games</h2>
        {games.length > 0 && <Link href="/history" style={{ color: 'hsl(var(--secondary))', fontWeight: 700, fontSize: '.8rem' }} data-testid="link-see-all-history">See all</Link>}
      </div>
      {recent.length === 0 ? <div className="card" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'hsl(var(--accent))', display: 'grid', placeItems: 'center' }}><Trophy size={19} /></div>
        <div><p style={{ fontWeight: 700 }}>Your table is waiting.</p><p className="muted" style={{ fontSize: '.84rem', marginTop: '.2rem' }}>Finish your first game and it will live here.</p></div>
      </div> : <div style={{ display: 'grid', gap: '.75rem' }}>{recent.map((game) => <GameRow key={game.id} game={game} />)}</div>}
    </section>
  </main>;
}

function GameRow({ game }: { game: Game }) {
  return <Link href={`/game/${game.id}`} className="card lift" style={{ padding: '1rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }} data-testid={`card-game-${game.id}`}>
    <div>
      <p style={{ fontWeight: 700 }}>{game.teams[0].players[0]} & {game.teams[1].players[0]}</p>
      <p className="muted" style={{ fontSize: '.75rem', marginTop: '.25rem' }}>{formatShortDate(game.createdAt)} · {game.rounds.length} {game.rounds.length === 1 ? 'round' : 'rounds'}</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
      <span className="mono-font" style={{ fontSize: '.84rem' }}>{game.teams[0].totalScore} — {game.teams[1].totalScore}</span>
      <ChevronLeft size={16} style={{ transform: 'rotate(180deg)', color: 'hsl(var(--muted-foreground))' }} />
    </div>
  </Link>;
}

function NewGame() {
  const { createGame } = useGames();
  const [, setLocation] = useLocation();
  const [names, setNames] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const updateName = (index: number, value: string) => setNames((current) => current.map((item, i) => i === index ? value : item));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (names.some((name) => !name.trim())) { setError('Give every player a name before you deal.'); return; }
    const game = createGame(names.map((name) => name.trim()));
    setLocation(`/game/${game.id}`);
  };
  return <main className="page" style={{ maxWidth: 760 }}>
    <Link href="/" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.8rem', textDecoration: 'none', fontWeight: 700 }} data-testid="link-back-home"><ChevronLeft size={16} /> Home</Link>
    <div className="reveal" style={{ marginTop: '2.7rem' }}>
      <p className="eyebrow">New table</p>
      <h1 className="headline" style={{ fontSize: 'clamp(3rem, 12vw, 5.7rem)', marginTop: '.55rem' }}>Who’s<br /><span style={{ color: 'hsl(var(--primary))' }}>dealing?</span></h1>
      <p className="muted" style={{ marginTop: '1rem', lineHeight: 1.5 }}>Two teams, two names each. Pick your partners, then let the tiles do the talking.</p>
    </div>
    <form onSubmit={submit} style={{ marginTop: '2.3rem' }}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <TeamNameFields team={0} names={names} updateName={updateName} />
        <TeamNameFields team={1} names={names} updateName={updateName} />
      </div>
      {error && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: '.84rem', fontWeight: 700, marginTop: '1rem' }} data-testid="status-new-game-error">{error}</p>}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.4rem' }} type="submit" data-testid="button-create-game"><span>Deal the first round</span><ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} /></button>
    </form>
  </main>;
}

function TeamNameFields({ team, names, updateName }: { team: 0 | 1; names: string[]; updateName: (index: number, value: string) => void }) {
  const labels = team === 0 ? ['Player one', 'Player two'] : ['Player one', 'Player two'];
  return <section className={`card team-accent-${team}`} style={{ padding: '1.25rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'hsl(var(--team))' }} />
        <h2 style={{ fontWeight: 700 }}>{team === 0 ? 'Team Sun' : 'Team Moss'}</h2>
      </div>
      <span className="mono-font muted" style={{ fontSize: '.7rem' }}>TEAM {team + 1}</span>
    </div>
    <div style={{ display: 'grid', gap: '.8rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
      {[0, 1].map((slot) => {
        const index = team * 2 + slot;
        return <label key={index}><span className="input-label">{labels[slot]}</span><input className="field" value={names[index]} onChange={(event) => updateName(index, event.target.value)} placeholder={slot === 0 ? 'e.g. Rosa' : 'e.g. Mateo'} data-testid={`input-player-${index + 1}`} /></label>;
      })}
    </div>
  </section>;
}

function Scoreboard({ game }: { game: Game }) {
  return <div style={{ display: 'grid', gap: '.75rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
    {game.teams.map((team, index) => {
      const isWinner = game.completedAt !== null && game.winningTeam === index;
      return <div key={team.name} className={`card team-accent-${index}`} style={{ padding: '1.15rem', borderTop: `4px solid hsl(var(--team))`, position: 'relative', overflow: 'hidden' }} data-testid={`score-team-${index}`}>
        {isWinner && <div style={{ position: 'absolute', top: 11, right: 11, color: 'hsl(var(--team))' }}><Trophy size={16} /></div>}
        <p className="muted" style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{team.name}</p>
        <p className="score-number" style={{ fontSize: 'clamp(2.9rem, 13vw, 5rem)', lineHeight: 1, color: 'hsl(var(--foreground))', margin: '.55rem 0 .7rem' }} data-testid={`text-score-${index}`}>{team.totalScore}</p>
        <p className="muted" style={{ fontSize: '.73rem', lineHeight: 1.35 }}>{team.players[0]}<br />{team.players[1]}</p>
        <div style={{ height: 5, marginTop: '.9rem', background: 'hsl(var(--muted))', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${Math.min(team.totalScore, 100)}%`, height: '100%', background: 'hsl(var(--team))', transition: 'width .35s ease' }} /></div>
        <p className="mono-font muted" style={{ fontSize: '.62rem', marginTop: '.35rem' }}>{team.totalScore >= 100 ? 'FINISHED' : `${Math.max(100 - team.totalScore, 0)} to go`}</p>
      </div>;
    })}
  </div>;
}

function GamePage() {
  const { id } = useParams<{ id: string }>();
  const { games, updateGame } = useGames();
  const game = games.find((item) => item.id === id);
  const [modal, setModal] = useState<ModalMode>(null);
  const [showAllRounds, setShowAllRounds] = useState(false);
  if (!game) return <main className="page"><EmptyState title="That game wandered off." copy="It may have been cleared from this device." action="Back home" href="/" /></main>;
  const rounds = [...game.rounds].reverse();
  return <main className="page" style={{ maxWidth: 900 }}>
    <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: '1.6rem' }}>
      <div>
        <Link href="/" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.76rem', textDecoration: 'none', fontWeight: 700 }} data-testid="link-game-home"><ChevronLeft size={15} /> All games</Link>
        <p className="eyebrow" style={{ marginTop: '1.25rem' }}>{game.completedAt ? 'Game complete' : 'In play'}</p>
        <h1 className="headline" style={{ fontSize: 'clamp(2.5rem, 10vw, 4.8rem)', marginTop: '.35rem' }}>{game.teams[0].players[0]} <span style={{ color: 'hsl(var(--primary))' }}>vs.</span><br />{game.teams[1].players[0]}</h1>
      </div>
      <div className="card" style={{ padding: '.7rem .8rem', textAlign: 'center', minWidth: 68 }}>
        <span className="mono-font muted" style={{ fontSize: '.62rem' }}>ROUND</span>
        <strong className="mono-font" style={{ display: 'block', fontSize: '1.45rem', marginTop: '.15rem' }}>{game.rounds.length + 1}</strong>
      </div>
    </div>
     {game.completedAt && <div className="card reveal delay-1" style={{ padding: '1rem 1.1rem', marginBottom: '1rem', background: 'hsl(var(--accent))', borderColor: 'hsl(var(--foreground) / .14)', display: 'flex', alignItems: 'center', gap: '.75rem' }} data-testid="status-game-complete"><Trophy size={21} /><div><p style={{ fontWeight: 700 }}>{game.teams[game.winningTeam === 0 ? 1 : 0].totalScore === 0 ? 'Pollona.' : 'That’s game.'}</p><p style={{ fontSize: '.78rem', marginTop: '.15rem' }}>{game.teams[game.winningTeam ?? 0].name} took it to 100 first{game.teams[game.winningTeam === 0 ? 1 : 0].totalScore === 0 ? ' with a shutout.' : '.'}</p></div></div>}
    <div className="reveal delay-1"><Scoreboard game={game} /></div>
    {!game.completedAt && <button className="btn btn-primary reveal delay-2" style={{ width: '100%', marginTop: '1rem', minHeight: '3.8rem', fontSize: '1rem' }} onClick={() => setModal('menu')} data-testid="button-add-round"><Plus size={20} /> Add round</button>}
    <section className="reveal delay-2" style={{ marginTop: '2.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.8rem' }}>
        <h2 className="section-title">Round log</h2>
        {rounds.length > 4 && <button className="btn btn-quiet btn-small" onClick={() => setShowAllRounds(!showAllRounds)} data-testid="button-toggle-rounds">{showAllRounds ? 'Show less' : `All ${rounds.length}`}</button>}
      </div>
      {rounds.length === 0 ? <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}><p style={{ fontWeight: 700 }}>No rounds yet.</p><p className="muted" style={{ fontSize: '.82rem', marginTop: '.3rem' }}>The first score is always the sweetest.</p></div> : <div className="card" style={{ overflow: 'hidden' }}>{(showAllRounds ? rounds : rounds.slice(0, 4)).map((round) => <RoundRow game={game} round={round} key={round.number} />)}</div>}
    </section>
    {modal && <RoundModal mode={modal} game={game} close={() => setModal(null)} save={(points, winner, source) => {
      const nextRound: Round = { number: game.rounds.length + 1, winnerTeam: winner, points, source };
      const totals: [number, number] = [game.teams[0].totalScore, game.teams[1].totalScore];
      if (winner !== null) totals[winner] += points;
      const completed = winner !== null && totals[winner] >= 100;
      updateGame({
        ...game,
        rounds: [...game.rounds, nextRound],
        teams: game.teams.map((team, index) => ({ ...team, totalScore: totals[index] })) as [Team, Team],
        completedAt: completed ? new Date().toISOString() : game.completedAt,
        winningTeam: completed ? winner : game.winningTeam,
      });
      setModal(null);
    }} />}
  </main>;
}

function RoundRow({ game, round }: { game: Game; round: Round }) {
  const winnerName = round.winnerTeam === null ? 'Tie round' : game.teams[round.winnerTeam].name;
  return <div style={{ padding: '.85rem 1rem', borderBottom: '1px solid hsl(var(--border) / .7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }} data-testid={`row-round-${round.number}`}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
      <span className="mono-font muted" style={{ fontSize: '.7rem', width: 22 }}>#{round.number}</span>
      <div><p style={{ fontWeight: 700, fontSize: '.85rem' }}>{winnerName}</p><p className="muted" style={{ fontSize: '.68rem', marginTop: '.1rem' }}>{round.source === 'tie' ? 'No points awarded' : `${round.source === 'camera' ? 'Camera' : 'Manual'} score`}</p></div>
    </div>
    <strong className="mono-font" style={{ fontSize: '.95rem', color: round.winnerTeam === null ? 'hsl(var(--muted-foreground))' : 'hsl(var(--secondary))' }}>{round.winnerTeam === null ? '—' : `+${round.points}`}</strong>
  </div>;
}

function RoundModal({ mode, game, close, save }: { mode: ModalMode; game: Game; close: () => void; save: (points: number, winner: 0 | 1 | null, source: 'manual' | 'camera' | 'tie') => void }) {
  const [activeMode, setActiveMode] = useState<Exclude<ModalMode, null>>(mode ?? 'menu');
  const [points, setPoints] = useState('');
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [error, setError] = useState('');
  if (!mode) return null;
  const isTie = winner === null;
  const submit = () => {
    if (isTie) { save(0, null, 'tie'); return; }
    const amount = Number(points);
    if (!Number.isFinite(amount) || amount <= 0) { setError('Add the points from this round.'); return; }
    save(amount, winner, activeMode === 'camera' ? 'camera' : 'manual');
  };
  return <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(49, 33, 50, .55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '.75rem' }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} data-testid="dialog-round">
    <div className="card" style={{ width: 'min(100%, 560px)', padding: '1.25rem', maxHeight: '90dvh', overflowY: 'auto', animation: 'reveal .25s both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><p className="eyebrow">Round {game.rounds.length + 1}</p><h2 className="display-font" style={{ fontSize: '2rem', marginTop: '.25rem' }}>{activeMode === 'menu' ? 'How did it land?' : activeMode === 'camera' ? 'Camera score' : 'Add the score'}</h2></div><button className="btn btn-quiet btn-small" onClick={close} aria-label="Close" data-testid="button-close-round"><X size={18} /></button></div>
      {activeMode === 'menu' ? <div style={{ display: 'grid', gap: '.7rem', marginTop: '1.35rem' }}>
        <button className="btn btn-primary" onClick={() => setActiveMode('manual')} data-testid="button-modal-manual" style={{ justifyContent: 'flex-start', padding: '1rem', minHeight: '4.2rem' }}><Plus size={20} /><span><strong style={{ display: 'block' }}>Enter manually</strong><small style={{ opacity: .75 }}>Tap a team, type the points</small></span></button>
        <button className="btn btn-outline" onClick={() => setActiveMode('camera')} data-testid="button-modal-camera" style={{ justifyContent: 'flex-start', padding: '1rem', minHeight: '4.2rem' }}><Camera size={20} /><span><strong style={{ display: 'block' }}>Use camera</strong><small className="muted">Capture the table, confirm the score</small></span></button>
        <button className="btn btn-quiet" onClick={() => save(0, null, 'tie')} data-testid="button-record-tie" style={{ justifyContent: 'flex-start', padding: '1rem', minHeight: '4rem' }}><RotateCcw size={19} /><span><strong style={{ display: 'block' }}>Tie round</strong><small className="muted">No points for either team</small></span></button>
      </div> : activeMode === 'camera' ? <CameraFlow game={game} points={points} setPoints={setPoints} winner={winner} setWinner={setWinner} submit={submit} error={error} /> : <ManualFlow game={game} points={points} setPoints={setPoints} winner={winner} setWinner={setWinner} submit={submit} error={error} />}
    </div>
  </div>;
}

function ManualFlow({ game, points, setPoints, winner, setWinner, submit, error }: { game: Game; points: string; setPoints: (value: string) => void; winner: 0 | 1 | null; setWinner: (value: 0 | 1 | null) => void; submit: () => void; error: string }) {
  return <div style={{ marginTop: '1.35rem' }}><p className="input-label">Who won the round?</p><div style={{ display: 'grid', gap: '.65rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>{game.teams.map((team, index) => <button key={team.name} className="btn" onClick={() => setWinner(index as 0 | 1)} style={{ minHeight: '4.1rem', flexDirection: 'column', alignItems: 'flex-start', padding: '.75rem', background: winner === index ? 'hsl(var(--team-soft))' : 'hsl(var(--muted))', border: winner === index ? '2px solid hsl(var(--team))' : '2px solid transparent', color: 'hsl(var(--foreground))', textAlign: 'left' }} data-testid={`button-winner-${index}`}><span style={{ fontSize: '.78rem', fontWeight: 700 }}>{team.name}</span><span className="muted" style={{ fontSize: '.68rem' }}>{team.players.join(' + ')}</span></button>)}</div><label style={{ display: 'block', marginTop: '1.1rem' }}><span className="input-label">Points won</span><input type="number" min="1" inputMode="numeric" autoFocus className="field mono-font" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="0" data-testid="input-round-points" /></label>{error && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: '.78rem', marginTop: '.5rem', fontWeight: 700 }} data-testid="status-round-error">{error}</p>}<button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={submit} data-testid="button-save-round"><Check size={18} /> Save round</button></div>;
}

function countDominoPips(image: ImageData) {
  const { width, height, data } = image;
  const visited = new Uint8Array(width * height);
  const candidates: { area: number; minX: number; maxX: number; minY: number; maxY: number }[] = [];
  const pixelIsDark = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    const brightness = (data[offset] * 0.299) + (data[offset + 1] * 0.587) + (data[offset + 2] * 0.114);
    return brightness < 70;
  };

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (visited[index] || !pixelIsDark(x, y)) continue;
      const queue = [index];
      visited[index] = 1;
      let area = 0;
      let minX = x, maxX = x, minY = y, maxY = y;
      while (queue.length) {
        const current = queue.pop()!;
        const currentX = current % width;
        const currentY = Math.floor(current / width);
        area += 1;
        minX = Math.min(minX, currentX); maxX = Math.max(maxX, currentX);
        minY = Math.min(minY, currentY); maxY = Math.max(maxY, currentY);
        for (const [nextX, nextY] of [[currentX - 1, currentY], [currentX + 1, currentY], [currentX, currentY - 1], [currentX, currentY + 1]]) {
          if (nextX < 1 || nextX >= width - 1 || nextY < 1 || nextY >= height - 1) continue;
          const next = nextY * width + nextX;
          if (!visited[next] && pixelIsDark(nextX, nextY)) { visited[next] = 1; queue.push(next); }
        }
      }
      const componentWidth = maxX - minX + 1;
      const componentHeight = maxY - minY + 1;
      const fill = area / (componentWidth * componentHeight);
      const ratio = componentWidth / componentHeight;
      const ringRadius = Math.max(componentWidth, componentHeight) * 1.1;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      let ringPixels = 0;
      let brightRingPixels = 0;
      let ringBrightness = 0;
      for (let ringY = Math.max(1, Math.floor(centerY - ringRadius)); ringY < Math.min(height - 1, Math.ceil(centerY + ringRadius)); ringY += 2) {
        for (let ringX = Math.max(1, Math.floor(centerX - ringRadius)); ringX < Math.min(width - 1, Math.ceil(centerX + ringRadius)); ringX += 2) {
          if (ringX >= minX && ringX <= maxX && ringY >= minY && ringY <= maxY) continue;
          const ringOffset = (ringY * width + ringX) * 4;
          const brightness = (data[ringOffset] * 0.299) + (data[ringOffset + 1] * 0.587) + (data[ringOffset + 2] * 0.114);
          ringPixels += 1;
          ringBrightness += brightness;
          if (brightness > 140) brightRingPixels += 1;
        }
      }
      const brightRingRatio = ringPixels ? brightRingPixels / ringPixels : 0;
      const averageRingBrightness = ringPixels ? ringBrightness / ringPixels : 0;
      const normalPip = brightRingRatio > .38 && averageRingBrightness > 125;
      const seamSafePip = brightRingRatio > .16 && ratio > .72 && ratio < 1.4 && fill > .62 && area >= 55;
      if (area >= 30 && area <= width * height * .012 && ratio > .62 && ratio < 1.6 && fill > .48 && fill < .94 && (normalPip || seamSafePip)) {
        candidates.push({ area, minX, maxX, minY, maxY });
      }
    }
  }
  return Math.min(candidates.length, 168);
}

function CameraFlow({ game, points, setPoints, winner, setWinner, submit, error }: { game: Game; points: string; setPoints: (value: string) => void; winner: 0 | 1 | null; setWinner: (value: 0 | 1 | null) => void; submit: () => void; error: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState('');
  const [detectedPips, setDetectedPips] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live camera access is unavailable here. Use the photo button below instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access was blocked. Allow camera access in Safari, then try again or choose a photo.');
    }
  };

  const analyzeCanvas = (canvas: HTMLCanvasElement) => {
    const guideX = Math.round(canvas.width * .19);
    const guideY = Math.round(canvas.height * .12);
    const guideWidth = Math.round(canvas.width * .62);
    const guideHeight = Math.round(canvas.height * .76);
    const maxDimension = 900;
    const scale = Math.min(1, maxDimension / Math.max(guideWidth, guideHeight));
    const scanCanvas = document.createElement('canvas');
    scanCanvas.width = Math.max(1, Math.round(guideWidth * scale));
    scanCanvas.height = Math.max(1, Math.round(guideHeight * scale));
    const scanContext = scanCanvas.getContext('2d');
    if (!scanContext) return;
    scanContext.drawImage(canvas, guideX, guideY, guideWidth, guideHeight, 0, 0, scanCanvas.width, scanCanvas.height);
    const result = countDominoPips(scanContext.getImageData(0, 0, scanCanvas.width, scanCanvas.height));
    setDetectedPips(result);
    if (result > 0) setPoints(String(result));
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('The camera is still starting. Wait a moment, then try Capture again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', .88));
    analyzeCanvas(canvas);
    stopCamera();
  };

  const readPhoto = (file: File) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg', .88));
      analyzeCanvas(canvas);
      URL.revokeObjectURL(image.src);
    };
    image.src = URL.createObjectURL(file);
  };

  return <div style={{ marginTop: '1.2rem' }}>
    <div style={{ borderRadius: '1rem', overflow: 'hidden', background: 'hsl(var(--sidebar))', color: 'hsl(var(--sidebar-foreground))', border: '1px dashed hsl(var(--accent) / .55)' }}>
      {photo ? <div style={{ position: 'relative' }}><img src={photo} alt="Captured domino" style={{ display: 'block', width: '100%', maxHeight: 280, objectFit: 'cover' }} /><button className="btn btn-quiet btn-small" onClick={() => { setPhoto(''); setDetectedPips(null); setPoints(''); }} style={{ position: 'absolute', top: 10, right: 10, background: 'hsl(var(--sidebar) / .88)', color: 'hsl(var(--sidebar-foreground))' }} data-testid="button-retake-camera"><RotateCcw size={15} /> Retake</button></div> : <div style={{ position: 'relative', minHeight: 205, display: 'grid', placeItems: 'center', padding: '1rem' }}>
        <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} />
        {cameraActive ? <><div style={{ position: 'absolute', width: '62%', height: '76%', border: '2px solid hsl(var(--accent))', borderRadius: '.85rem', boxShadow: '0 0 0 999px hsl(var(--sidebar) / .3)' }} /><button className="btn btn-primary" onClick={capture} style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', minWidth: 150 }} data-testid="button-capture-camera"><Camera size={17} /> Capture</button></> : <div style={{ textAlign: 'center' }}><Camera size={28} color="hsl(var(--accent))" /><p style={{ fontWeight: 700, marginTop: '.5rem' }}>Scan the scoring tiles</p><p style={{ fontSize: '.75rem', color: 'hsl(var(--sidebar-foreground) / .68)', margin: '.3rem auto .9rem', maxWidth: 270 }}>Apple devices use the rear camera. Lay the scoring dominoes flat, apart, and inside the guide on a clear, well-lit surface.</p><button className="btn btn-primary" onClick={startCamera} data-testid="button-start-camera"><Camera size={17} /> Open camera</button></div>}
      </div>}
    </div>
    <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) readPhoto(file); }} style={{ display: 'none' }} data-testid="input-camera-photo" />
    {!cameraActive && !photo && <button className="btn btn-outline" onClick={() => fileRef.current?.click()} style={{ width: '100%', marginTop: '.65rem' }} data-testid="button-upload-camera-photo"><Camera size={17} /> Choose a photo instead</button>}
    {cameraError && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: '.76rem', marginTop: '.55rem', fontWeight: 700 }} data-testid="status-camera-error">{cameraError}</p>}
    {photo && <div className="card" style={{ marginTop: '.8rem', padding: '.75rem 1rem', background: 'hsl(var(--accent) / .38)' }}><p style={{ fontWeight: 700 }}>{detectedPips ? `${detectedPips} pip${detectedPips === 1 ? '' : 's'} detected` : 'No pips detected yet'}</p><p className="muted" style={{ fontSize: '.72rem', marginTop: '.2rem' }}>Check the count below and correct it if lighting or angle affected the scan.</p></div>}
    <p className="input-label" style={{ marginTop: '1.1rem' }}>Confirm the winning team</p><div style={{ display: 'grid', gap: '.65rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>{game.teams.map((team, index) => <button key={team.name} className="btn btn-quiet" onClick={() => setWinner(index as 0 | 1)} style={{ minHeight: '3.1rem', background: winner === index ? 'hsl(var(--team-soft))' : undefined, border: winner === index ? '2px solid hsl(var(--team))' : '2px solid transparent' }} data-testid={`button-camera-winner-${index}`}>{team.name}</button>)}</div>
    <label style={{ display: 'block', marginTop: '1rem' }}><span className="input-label">Confirmed points</span><input type="number" min="1" inputMode="numeric" className="field mono-font" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="0" data-testid="input-camera-points" /></label>
    {error && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: '.78rem', marginTop: '.5rem', fontWeight: 700 }} data-testid="status-camera-submit-error">{error}</p>}
    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={submit} data-testid="button-confirm-camera"><Check size={18} /> Confirm score</button>
  </div>;
}

function History() {
  const { games } = useGames();
  const [, setLocation] = useLocation();
  return <main className="page" style={{ maxWidth: 900 }}>
    <div className="reveal"><p className="eyebrow">Your table’s scrapbook</p><h1 className="headline" style={{ fontSize: 'clamp(3rem, 11vw, 5.5rem)', marginTop: '.55rem' }}>Past<br /><span style={{ color: 'hsl(var(--primary))' }}>games.</span></h1><p className="muted" style={{ marginTop: '1rem', maxWidth: 430 }}>Every comeback, clean sweep, and suspiciously lucky last round. Kept on this device.</p></div>
    {games.length === 0 ? <div style={{ marginTop: '2.5rem' }}><EmptyState title="No games in the book yet." copy="Start a table and your finished scores will be saved here." action="Start a game" href="/new-game" /></div> : <div style={{ display: 'grid', gap: '.8rem', marginTop: '2.4rem' }}>{games.map((game) => <button key={game.id} className="card lift" style={{ border: '1px solid hsl(var(--card-border))', padding: '1.15rem', display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit' }} onClick={() => setLocation(`/history/${game.id}`)} data-testid={`button-history-game-${game.id}`}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>{game.completedAt ? <Trophy size={16} color="hsl(var(--primary))" /> : <Clock3 size={16} color="hsl(var(--secondary))" />}<span className="mono-font muted" style={{ fontSize: '.68rem' }}>{formatDate(game.createdAt)}</span></div><h2 style={{ fontWeight: 700, marginTop: '.7rem' }}>{game.teams[0].players.join(' & ')} <span className="muted">vs</span> {game.teams[1].players.join(' & ')}</h2></div><span className="score-number" style={{ fontSize: '1.45rem' }}>{game.teams[0].totalScore} — {game.teams[1].totalScore}</span></div><div className="muted" style={{ fontSize: '.75rem', marginTop: '.9rem', display: 'flex', justifyContent: 'space-between' }}><span>{game.completedAt ? `Won by ${game.teams[game.winningTeam ?? 0].name}` : 'Game in progress'}</span><span>{game.rounds.length} rounds</span></div></button>)}</div>}
  </main>;
}

function HistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { games, removeGame } = useGames();
  const [, setLocation] = useLocation();
  const game = games.find((item) => item.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!game) return <main className="page"><EmptyState title="Game not found." copy="This game may have been removed from your table book." action="Back to history" href="/history" /></main>;
  return <main className="page" style={{ maxWidth: 900 }}>
    <Link href="/history" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.76rem', textDecoration: 'none', fontWeight: 700 }} data-testid="link-back-history"><ChevronLeft size={15} /> Past games</Link>
    <div className="reveal" style={{ marginTop: '2.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}><div><p className="eyebrow">{game.completedAt ? 'Final score' : 'Saved game'}</p><h1 className="headline" style={{ fontSize: 'clamp(2.7rem, 10vw, 5rem)', marginTop: '.45rem' }}>{formatDate(game.createdAt)}</h1></div><button className="btn btn-outline btn-small" onClick={() => setConfirmDelete(true)} data-testid="button-delete-game">Delete</button></div>
    <div style={{ marginTop: '1.8rem' }}><Scoreboard game={game} /></div>
    <div className="card" style={{ marginTop: '1.4rem', overflow: 'hidden' }}><div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between' }}><h2 style={{ fontWeight: 700 }}>Round by round</h2><span className="mono-font muted" style={{ fontSize: '.7rem' }}>{game.rounds.length} total</span></div>{game.rounds.length ? game.rounds.map((round) => <RoundRow game={game} round={round} key={round.number} />) : <p className="muted" style={{ padding: '1.2rem', fontSize: '.85rem' }}>No rounds recorded yet.</p>}</div>
    {!game.completedAt && <Link href={`/game/${game.id}`} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} data-testid="button-resume-game">Resume game</Link>}
    {confirmDelete && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(49, 33, 50, .55)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div className="card" style={{ padding: '1.3rem', width: 'min(100%, 400px)' }}><h2 className="display-font" style={{ fontSize: '1.8rem' }}>Remove this game?</h2><p className="muted" style={{ fontSize: '.84rem', lineHeight: 1.45, marginTop: '.45rem' }}>This scorecard will disappear from this device. There’s no undo.</p><div style={{ display: 'flex', gap: '.6rem', marginTop: '1.3rem' }}><button className="btn btn-quiet" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)} data-testid="button-cancel-delete">Keep it</button><button className="btn" style={{ flex: 1, background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }} onClick={() => { removeGame(game.id); setLocation('/history'); }} data-testid="button-confirm-delete">Delete</button></div></div></div>}
  </main>;
}

function EmptyState({ title, copy, action, href }: { title: string; copy: string; action: string; href: string }) {
  return <div className="card" style={{ padding: '2rem 1.3rem', textAlign: 'center' }} data-testid="empty-state"><div style={{ width: 50, height: 50, margin: '0 auto 1rem', borderRadius: '50%', background: 'hsl(var(--accent))', display: 'grid', placeItems: 'center' }}><Users size={21} /></div><h2 className="display-font" style={{ fontSize: '1.65rem' }}>{title}</h2><p className="muted" style={{ fontSize: '.84rem', lineHeight: 1.45, margin: '.4rem auto 1.2rem', maxWidth: 300 }}>{copy}</p><Link href={href} className="btn btn-primary btn-small" data-testid="link-empty-action">{action}</Link></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch>
    <Route path="/" component={Home} />
    <Route path="/new-game" component={NewGame} />
    <Route path="/game/:id" component={GamePage} />
    <Route path="/history/:id" component={HistoryDetail} />
    <Route path="/history" component={History} />
    <Route component={NotFound} />
  </Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><GamesProvider><Router /></GamesProvider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;