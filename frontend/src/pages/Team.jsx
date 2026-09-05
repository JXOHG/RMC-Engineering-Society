import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Team() {
  const [members, setMembers] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    api
      .getTeam()
      .then((data) => {
        setMembers(data.team || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="container-page py-14">
      <h1 className="text-4xl mb-2">The team</h1>
      <p className="text-steel mb-10">The cadets running the RMC Engineering Society.</p>

      {status === 'loading' && <p className="text-steel py-10">Loading the team&hellip;</p>}

      {status === 'error' && (
        <p className="text-steel py-10">Couldn&rsquo;t load the team page right now.</p>
      )}

      {status === 'ready' && members.length === 0 && (
        <p className="text-steel py-10">The team page hasn&rsquo;t been set up yet.</p>
      )}

      {status === 'ready' && members.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
          {members.map((member) => (
            <div key={member.id} className="group">
              <div className="overflow-hidden mb-3 border border-ink/10">
                <img
                  src={member.photoURL}
                  alt={member.name}
                  className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="font-display font-bold text-lg text-ink leading-tight">{member.name}</p>
              <p className="text-sm text-steel">{member.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
