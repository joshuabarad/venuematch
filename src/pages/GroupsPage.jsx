import { useState } from 'react';
import { useStore } from '../store/index.js';
import { NYC_VENUES } from '../data/venues.js';
import { VenueCard } from '../components/venue/VenueCard.jsx';
import { Users, Plus, Copy, Check, X, ChevronRight, Trash2, UserPlus, Music, Zap } from 'lucide-react';

function InviteCode({ code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-xs font-mono tracking-widest text-brand-purple">
      {code}
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-muted" />}
    </button>
  );
}

function MemberChip({ member, onRemove, isMe }) {
  const seedNames = NYC_VENUES.filter(v => (member.seedVenues || []).includes(v.id)).map(v => v.name);
  return (
    <div className="glass rounded-xl p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-purple">
        {member.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{member.name}{isMe && <span className="ml-1.5 text-xs text-muted">(you)</span>}</p>
        {seedNames.length > 0 && (
          <p className="text-xs text-muted mt-0.5 truncate">{seedNames.slice(0, 3).join(', ')}</p>
        )}
        {member.seedArtists?.length > 0 && (
          <p className="text-xs text-muted truncate">{member.seedArtists.slice(0, 2).join(', ')}</p>
        )}
      </div>
      {!isMe && onRemove && (
        <button onClick={onRemove} className="text-muted hover:text-red-400 transition-colors p-1">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function AddMemberModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [selectedVenues, setSelectedVenues] = useState([]);

  function toggle(id) {
    setSelectedVenues(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 5 ? [...s, id] : s);
  }

  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), seedVenues: selectedVenues, seedArtists: [] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0d0d18] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <p className="font-semibold">Add member</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted">
            <X size={13} />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-xs text-muted mb-2 uppercase tracking-widest font-semibold">Name</p>
            <input
              autoFocus
              type="text"
              placeholder="Friend's name…"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
          </div>
          <div>
            <p className="text-xs text-muted mb-2 uppercase tracking-widest font-semibold">
              Their seed venues <span className="normal-case text-muted/60">(up to 5)</span>
            </p>
            <div className="space-y-2">
              {NYC_VENUES.map(v => (
                <button key={v.id} onClick={() => toggle(v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border
                    ${selectedVenues.includes(v.id)
                      ? 'border-brand-purple bg-brand-purple/10'
                      : 'glass border-transparent hover:border-white/10'}`}>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${v.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)` }}>
                    {v.photo && <img src={v.photo} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.name}</p>
                    <p className="text-xs text-muted truncate">{v.neighborhood}</p>
                  </div>
                  {selectedVenues.includes(v.id) && <Check size={14} className="text-brand-purple flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 pt-3 border-t border-white/5">
          <button onClick={submit} disabled={!name.trim()}
            className="w-full py-3 rounded-2xl bg-brand-purple text-white font-medium text-sm disabled:opacity-40 hover:bg-purple-600 transition-all">
            Add {name.trim() || 'member'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose }) {
  const { createGroup } = useStore();
  const [name, setName] = useState('');
  const [created, setCreated] = useState(null);

  function submit() {
    if (!name.trim()) return;
    createGroup(name.trim());
    const { groups } = useStore.getState();
    setCreated(groups[groups.length - 1]);
  }

  if (created) return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0d0d18] rounded-3xl border border-white/10 p-8 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center mx-auto">
          <Users size={22} className="text-brand-purple" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{created.name}</h2>
          <p className="text-sm text-muted mt-1">Share this code with friends so they can join</p>
        </div>
        <div className="flex justify-center">
          <InviteCode code={created.code} />
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Friends enter this code in their Groups tab to join and blend their taste with yours.
        </p>
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl bg-brand-purple text-white font-medium text-sm hover:bg-purple-600 transition-all">
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0d0d18] rounded-3xl border border-white/10 p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">New group</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted">
            <X size={13} />
          </button>
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Group name (e.g. Friday Squad)…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="w-full glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted"
        />
        <button onClick={submit} disabled={!name.trim()}
          className="w-full py-3 rounded-2xl bg-brand-purple text-white font-medium text-sm disabled:opacity-40 hover:bg-purple-600 transition-all">
          Create group
        </button>
      </div>
    </div>
  );
}

function JoinGroupModal({ onClose }) {
  const { groups, user, seedVenues, seedArtists, addGroupMember } = useStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const upper = code.trim().toUpperCase();
    const group = groups.find(g => g.code === upper);
    if (!group) { setError('No group found with that code.'); return; }
    const alreadyIn = group.members.some(m => m.id === 'me');
    if (alreadyIn) { setError('You\'re already in this group.'); return; }
    addGroupMember(group.id, {
      id: 'me',
      name: user?.name?.split(' ')[0] || 'You',
      seedVenues,
      seedArtists,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0d0d18] rounded-3xl border border-white/10 p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Join a group</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted">
            <X size={13} />
          </button>
        </div>
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Enter invite code…"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted font-mono tracking-widest uppercase"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <button onClick={submit} disabled={!code.trim()}
          className="w-full py-3 rounded-2xl bg-brand-purple text-white font-medium text-sm disabled:opacity-40 hover:bg-purple-600 transition-all">
          Join group
        </button>
      </div>
    </div>
  );
}

function GroupCard({ group, onViewVenue }) {
  const { deleteGroup, addGroupMember, removeGroupMember, getGroupVibeVector } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const groupVibe = getGroupVibeVector(group.id);

  const dims = [
    { key: 'music', label: 'Music', icon: Music, color: '#534AB7' },
    { key: 'energy', label: 'Energy', icon: Zap, color: '#0F6E56' },
  ];

  const topVenues = NYC_VENUES
    .map(v => {
      if (!groupVibe) return { venue: v, score: 50 };
      const keys = ['music', 'energy', 'dance', 'demo'];
      const dims2 = ['music_score', 'energy_score', 'dance_score', 'demo_score'];
      let s = 0;
      dims2.forEach((d, i) => { s += 1 - Math.abs((groupVibe[keys[i]] || 3) - v[d]) / 5; });
      return { venue: v, score: Math.round((s / 4) * 100) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <>
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-brand-purple" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{group.name}</p>
                <p className="text-xs text-muted mt-0.5">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <InviteCode code={group.code} />
              <button onClick={() => setExpanded(e => !e)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-white transition-all">
                <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-1.5 mt-4">
            {group.members.map(m => (
              <div key={m.id} title={m.name}
                className="w-7 h-7 rounded-full bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center text-xs font-bold text-brand-purple">
                {m.name[0]?.toUpperCase()}
              </div>
            ))}
            <button onClick={() => setShowAddMember(true)}
              className="w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-muted hover:text-white transition-all">
              <Plus size={11} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-white/5 p-5 space-y-5">
            {/* Combined vibe */}
            {groupVibe && (
              <div>
                <p className="text-xs text-muted mb-3 uppercase tracking-widest font-semibold">Combined vibe</p>
                <div className="space-y-2.5">
                  {[
                    { key: 'music', label: 'Music', color: '#534AB7' },
                    { key: 'energy', label: 'Energy', color: '#0F6E56' },
                    { key: 'dance', label: 'Dance', color: '#993C1D' },
                    { key: 'demo', label: 'Crowd', color: '#854F0B' },
                  ].map(d => (
                    <div key={d.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">{d.label}</span>
                        <span style={{ color: d.color }}>{(groupVibe[d.key] || 3).toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${((groupVibe[d.key] || 3) - 1) / 4 * 100}%`, background: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div>
              <p className="text-xs text-muted mb-3 uppercase tracking-widest font-semibold">Members</p>
              <div className="space-y-2">
                {group.members.map(m => (
                  <MemberChip key={m.id} member={m} isMe={m.id === 'me'}
                    onRemove={m.id !== 'me' ? () => removeGroupMember(group.id, m.id) : null} />
                ))}
              </div>
            </div>

            {/* Top picks */}
            <div>
              <p className="text-xs text-muted mb-3 uppercase tracking-widest font-semibold">Top picks for the group</p>
              <div className="space-y-2">
                {topVenues.map(({ venue, score }) => (
                  <div key={venue.id} onClick={() => onViewVenue(venue)}
                    className="glass rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/8 transition-all">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${venue.img_color || '#1a1a2e'} 0%, #0a0a0f 100%)` }}>
                      {venue.photo && <img src={venue.photo} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{venue.name}</p>
                      <p className="text-xs text-muted">{venue.neighborhood}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-purple flex-shrink-0">{score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete */}
            <button onClick={() => deleteGroup(group.id)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-red-400 transition-colors">
              <Trash2 size={12} /> Delete group
            </button>
          </div>
        )}
      </div>

      {showAddMember && (
        <AddMemberModal
          onAdd={member => addGroupMember(group.id, member)}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </>
  );
}

export function GroupsPage({ onViewVenue }) {
  const { groups } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-semibold">Collaborate</p>
          <h2 className="text-xl font-bold mt-0.5">Groups</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs text-soft hover:text-white transition-all">
            Join
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-purple text-white text-xs font-medium hover:bg-purple-600 transition-all">
            <Plus size={12} /> New group
          </button>
        </div>
      </div>

      {/* Coming soon notice */}
      <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-brand-purple/20">
        <div className="w-8 h-8 rounded-xl bg-brand-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Users size={14} className="text-brand-purple" />
        </div>
        <div>
          <p className="text-sm font-medium">Real-time collaboration coming soon</p>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">
            For now, add friends manually and pick their seed venues. Live sync — where friends join from their own devices — is on the way.
          </p>
        </div>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Users size={24} className="text-muted" />
          </div>
          <p className="font-medium text-soft mb-1">No groups yet</p>
          <p className="text-xs text-muted leading-relaxed mb-6">
            Create a group and add friends to surface venues everyone will love.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-purple text-white text-sm font-medium hover:bg-purple-600 transition-all">
            <Plus size={14} /> Create your first group
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <GroupCard key={g.id} group={g} onViewVenue={onViewVenue} />
          ))}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinGroupModal onClose={() => setShowJoin(false)} />}
    </div>
  );
}
