import React from 'react';
import {
  Bell,
  ChevronDown,
  Clock3,
  Flame,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Radio,
  Search,
  Send,
  Share2,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import '../components/flare/Flare.css';

type FlareStatus = 'Here now' | 'Leaving soon' | 'Come through';
type FlareAudience = 'East Village Friends' | 'Close Friends' | 'Private Invite';
type LaunchMode = 'staggered' | 'instant' | 'reduced';

type FlareItem = {
  id: string;
  creator: string;
  initials: string;
  placeName: string;
  neighborhood: string;
  x: number;
  y: number;
  createdAtLabel: string;
  expiresInMinutes: number;
  message: string;
  audience: FlareAudience;
  status: FlareStatus;
  attendeeCount: number;
  color: string;
};

type Group = {
  id: string;
  name: string;
  memberCount: number;
  activityLabel: string;
};

type Friend = {
  id: string;
  name: string;
  initials: string;
  status: string;
  distanceLabel: string;
};

type NotificationPreview = {
  id: string;
  text: string;
  flareId: string;
  urgency: 'now' | 'soon' | 'ambient';
};

const groups: Group[] = [
  { id: 'ev',     name: 'East Village Friends', memberCount: 18, activityLabel: '5 active tonight' },
  { id: 'close',  name: 'Close Friends',        memberCount: 7,  activityLabel: '2 nearby'         },
  { id: 'invite', name: 'Private Invite',        memberCount: 3,  activityLabel: 'quiet mode'       },
];

const friends: Friend[] = [
  { id: 'zach', name: 'Zach', initials: 'ZK', status: "At McSorley's",  distanceLabel: '0.4 mi' },
  { id: 'maya', name: 'Maya', initials: 'MR', status: 'Walking over',   distanceLabel: '8 min'  },
  { id: 'ana',  name: 'Ana',  initials: 'AP', status: 'Leaving soon',   distanceLabel: '0.6 mi' },
];

const initialFlares: FlareItem[] = [
  {
    id: 'mcsorleys',
    creator: 'Zach',
    initials: 'ZK',
    placeName: "McSorley's Old Ale House",
    neighborhood: 'East Village',
    x: 62, y: 31,
    createdAtLabel: '12 min ago',
    expiresInMinutes: 48,
    message: 'Inside by the front. Two seats open.',
    audience: 'East Village Friends',
    status: 'Here now',
    attendeeCount: 4,
    color: '#ff6b35',
  },
  {
    id: 'dba',
    creator: 'Will',
    initials: 'WF',
    placeName: 'DBA',
    neighborhood: 'East Village',
    x: 42, y: 58,
    createdAtLabel: '4 min ago',
    expiresInMinutes: 86,
    message: 'At DBA, come through.',
    audience: 'East Village Friends',
    status: 'Come through',
    attendeeCount: 2,
    color: '#12b886',
  },
  {
    id: 'tompkins',
    creator: 'Maya',
    initials: 'MR',
    placeName: 'Tompkins Square Park',
    neighborhood: 'East Village',
    x: 72, y: 67,
    createdAtLabel: '21 min ago',
    expiresInMinutes: 29,
    message: 'Pre-show hang before heading west.',
    audience: 'Close Friends',
    status: 'Leaving soon',
    attendeeCount: 6,
    color: '#4c6fff',
  },
];

const notifications: NotificationPreview[] = [
  { id: 'n1', text: "Zach sent a Flare at McSorley's.", flareId: 'mcsorleys', urgency: 'now'     },
  { id: 'n2', text: '3 friends are active within 0.5 miles.',  flareId: 'dba',       urgency: 'ambient' },
  { id: 'n3', text: "Will's Flare expires in 20 minutes.",     flareId: 'dba',       urgency: 'soon'    },
];

const places    = ['DBA', "McSorley's Old Ale House", 'Tompkins Square Park', 'Niagara', 'The Bowery Electric'];
const durations = [30, 60, 90];
const statuses: FlareStatus[]   = ['Here now', 'Leaving soon', 'Come through'];
const audiences: FlareAudience[] = ['East Village Friends', 'Close Friends', 'Private Invite'];

export function FlarePage() {
  const [flares, setFlares]               = React.useState<FlareItem[]>(initialFlares);
  const [selectedFlareId, setSelectedFlareId] = React.useState('dba');
  const [isComposerOpen, setIsComposerOpen]   = React.useState(false);
  const [launchMode, setLaunchMode]           = React.useState<LaunchMode>('staggered');
  const [launchCycle, setLaunchCycle]         = React.useState(1);
  const [launchIds, setLaunchIds]             = React.useState<string[]>(initialFlares.map(f => f.id));
  const [place, setPlace]     = React.useState('DBA');
  const [duration, setDuration] = React.useState(90);
  const [status, setStatus]   = React.useState<FlareStatus>('Come through');
  const [audience, setAudience] = React.useState<FlareAudience>('East Village Friends');
  const [message, setMessage] = React.useState('At DBA, come through.');

  const selectedFlare = flares.find(f => f.id === selectedFlareId) ?? flares[0];

  function replayFlares(mode = launchMode) {
    setLaunchMode(mode);
    setLaunchIds(flares.map(f => f.id));
    setLaunchCycle(c => c + 1);
  }

  function createFlare() {
    const id = `flare-${Date.now()}`;
    const newFlare: FlareItem = {
      id,
      creator: 'Will',
      initials: 'WF',
      placeName: place,
      neighborhood: 'East Village',
      x: place === 'DBA' ? 42 : 50 + Math.round(Math.random() * 16),
      y: place === 'DBA' ? 58 : 40 + Math.round(Math.random() * 24),
      createdAtLabel: 'just now',
      expiresInMinutes: duration,
      message,
      audience,
      status,
      attendeeCount: 1,
      color: '#e8590c',
    };
    setFlares(cur => [newFlare, ...cur]);
    setSelectedFlareId(id);
    setLaunchIds([id]);
    setLaunchCycle(c => c + 1);
    setIsComposerOpen(false);
  }

  return (
    <div className="flare-root">
      <main className="app-shell">

        {/* Left panel */}
        <section className="left-panel" aria-label="Flare controls">
          <div className="brand-row">
            <div className="brand-mark"><Flame size={22} /></div>
            <div>
              <h1>Flare</h1>
              <p>East Village live</p>
            </div>
          </div>

          <label className="search-box">
            <Search size={17} />
            <input aria-label="Search places or friends" placeholder="Search places or friends" />
          </label>

          <button className="send-flare-button" onClick={() => setIsComposerOpen(true)}>
            <Plus size={19} />
            Send Flare
          </button>

          <div className="panel-section">
            <div className="section-heading">
              <span>Groups</span>
              <ChevronDown size={16} />
            </div>
            {groups.map(group => (
              <button
                className={`group-row ${group.name === audience ? 'selected' : ''}`}
                key={group.id}
                onClick={() => setAudience(group.name as FlareAudience)}
              >
                <Users size={17} />
                <span>
                  <strong>{group.name}</strong>
                  <small>{group.memberCount} people · {group.activityLabel}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="panel-section">
            <div className="section-heading">
              <span>Nearby Friends</span>
              <Radio size={15} />
            </div>
            {friends.map(friend => (
              <div className="friend-row" key={friend.id}>
                <div className="avatar">{friend.initials}</div>
                <span>
                  <strong>{friend.name}</strong>
                  <small>{friend.status}</small>
                </span>
                <em>{friend.distanceLabel}</em>
              </div>
            ))}
          </div>
        </section>

        {/* Map stage */}
        <section className="map-stage" aria-label="Flare map">
          <div className="map-topbar">
            <div>
              <p className="eyebrow">Live map</p>
              <h2>Who is out right now?</h2>
            </div>
            <button className="icon-button" aria-label="Center on me">
              <Navigation size={18} />
            </button>
          </div>

          <div className="mock-map">
            <div className="street horizontal one" />
            <div className="street horizontal two" />
            <div className="street horizontal three" />
            <div className="street vertical one" />
            <div className="street vertical two" />
            <div className="street vertical three" />
            <span className="map-label label-a">St Marks Pl</span>
            <span className="map-label label-b">Avenue A</span>
            <span className="map-label label-c">Bowery</span>
            <div className="park-shape">Tompkins Square</div>
            <button className="you-pin" aria-label="Your location"><span /></button>
            <FlareLaunchLayer flares={flares} launchIds={launchIds} cycle={launchCycle} mode={launchMode} />
            {flares.map(flare => (
              <button
                key={flare.id}
                className={`flare-pin ${flare.id === selectedFlare.id ? 'active' : ''} ${launchIds.includes(flare.id) && launchMode !== 'instant' ? 'recently-launched' : ''}`}
                style={{ left: `${flare.x}%`, top: `${flare.y}%`, '--pin-color': flare.color } as React.CSSProperties}
                onClick={() => setSelectedFlareId(flare.id)}
                aria-label={`Open ${flare.creator}'s Flare at ${flare.placeName}`}
              >
                <Flame size={18} />
                <span>{flare.attendeeCount}</span>
              </button>
            ))}
          </div>

          <FlareDetail flare={selectedFlare} onShare={() => setSelectedFlareId(selectedFlare.id)} />
        </section>

        {/* Right panel */}
        <section className="right-panel" aria-label="Entry points">
          <div className="mini-card tonight-card">
            <div className="section-heading">
              <span>Tonight</span>
              <Sparkles size={15} />
            </div>
            <strong>{flares.length} active Flares nearby</strong>
            <p>East Village Friends are clustered around DBA, McSorley's, and Tompkins.</p>
          </div>

          <div className="animation-lab">
            <div className="section-heading">
              <span>Flare lab</span>
              <Flame size={15} />
            </div>
            <button className="replay-button" onClick={() => replayFlares()}>
              <Radio size={16} />
              Replay Flares
            </button>
            <div className="mode-grid" aria-label="Animation mode">
              <button className={launchMode === 'staggered' ? 'selected' : ''} onClick={() => replayFlares('staggered')}>Staggered</button>
              <button className={launchMode === 'instant'   ? 'selected' : ''} onClick={() => replayFlares('instant')}>Instant pins</button>
              <button className={launchMode === 'reduced'   ? 'selected' : ''} onClick={() => replayFlares('reduced')}>Reduced motion</button>
            </div>
          </div>

          <div className="panel-section flush">
            <div className="section-heading">
              <span>Notifications</span>
              <Bell size={15} />
            </div>
            {notifications.map(n => (
              <button
                className={`notification ${n.urgency}`}
                key={n.id}
                onClick={() => setSelectedFlareId(n.flareId)}
              >
                <Bell size={16} />
                <span>{n.text}</span>
              </button>
            ))}
          </div>

          <div className="message-preview">
            <div className="imessage-header">
              <MessageCircle size={17} />
              <span>East Village chat</span>
            </div>
            <div className="bubble">anyone out?</div>
            <button className="flare-message-card" onClick={() => setSelectedFlareId('dba')}>
              <span className="message-card-title">Will sent a Flare</span>
              <strong>DBA, East Village</strong>
              <small>"Here for the next hour"</small>
              <span className="message-actions">
                <span>Open Map</span>
                <span>I'm coming</span>
              </span>
            </button>
          </div>
        </section>

        {/* Composer modal */}
        {isComposerOpen && (
          <div className="modal-backdrop" role="presentation">
            <section className="composer" aria-label="Create Flare">
              <div className="composer-header">
                <div>
                  <p className="eyebrow">New Flare</p>
                  <h2>I'm here right now</h2>
                </div>
                <button className="icon-button" onClick={() => setIsComposerOpen(false)} aria-label="Close composer">
                  <X size={18} />
                </button>
              </div>

              <label>
                Place
                <select value={place} onChange={e => setPlace(e.target.value)}>
                  {places.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>

              <label>
                Message
                <textarea value={message} onChange={e => setMessage(e.target.value)} />
              </label>

              <fieldset>
                <legend>Audience</legend>
                <div className="segmented">
                  {audiences.map(item => (
                    <button type="button" className={item === audience ? 'selected' : ''} key={item} onClick={() => setAudience(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Duration</legend>
                <div className="segmented compact">
                  {durations.map(item => (
                    <button type="button" className={item === duration ? 'selected' : ''} key={item} onClick={() => setDuration(item)}>
                      {item}m
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Status</legend>
                <div className="segmented compact">
                  {statuses.map(item => (
                    <button type="button" className={item === status ? 'selected' : ''} key={item} onClick={() => setStatus(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button className="send-flare-button create" onClick={createFlare}>
                <Send size={18} />
                Send Flare
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function FlareLaunchLayer({
  flares, launchIds, cycle, mode,
}: {
  flares: FlareItem[];
  launchIds: string[];
  cycle: number;
  mode: LaunchMode;
}) {
  if (mode === 'instant') return null;
  const launchFlares = flares.filter(f => launchIds.includes(f.id));
  return (
    <div className={`flare-launch-layer ${mode}`} aria-hidden="true" key={`${cycle}-${mode}-${launchIds.join('-')}`}>
      {launchFlares.map((flare, index) => (
        <div
          className="flare-launch"
          key={`${cycle}-${flare.id}`}
          style={{
            left: `${flare.x}%`,
            top:  `${flare.y}%`,
            '--pin-color':    flare.color,
            '--launch-delay': mode === 'staggered' ? `${index * 260}ms` : '0ms',
            '--rise':  `${-150 - (index % 3) * 32}px`,
            '--drift': `${index % 2 === 0 ? 34 : -30}px`,
          } as React.CSSProperties}
        >
          <span className="launch-ground-glow" />
          <span className="smoke-puff puff-one" />
          <span className="smoke-puff puff-two" />
          <span className="smoke-puff puff-three" />
          <span className="flare-rocket"><Flame size={16} /></span>
          <span className="flare-bloom"><span /></span>
          <span className="ember ember-one" />
          <span className="ember ember-two" />
          <span className="ember ember-three" />
        </div>
      ))}
    </div>
  );
}

function FlareDetail({ flare, onShare }: { flare: FlareItem; onShare: () => void }) {
  return (
    <aside className="flare-detail" aria-label="Selected Flare detail">
      <div className="detail-main">
        <div className="detail-avatar">{flare.initials}</div>
        <div>
          <p className="eyebrow">{flare.status}</p>
          <h3>{flare.placeName}</h3>
          <p>{flare.message}</p>
        </div>
      </div>
      <div className="detail-meta">
        <span><MapPin size={15} /> {flare.neighborhood}</span>
        <span><Clock3 size={15} /> {flare.expiresInMinutes}m left</span>
        <span><Users size={15} /> {flare.audience}</span>
      </div>
      <div className="detail-actions">
        <button onClick={onShare}><Share2 size={16} /> Share</button>
        <button><MessageCircle size={16} /> I'm coming</button>
      </div>
    </aside>
  );
}
