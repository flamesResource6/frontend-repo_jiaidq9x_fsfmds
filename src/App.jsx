import { useEffect, useMemo, useRef, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

function useWebSocket(topic) {
  const wsRef = useRef(null)
  const [events, setEvents] = useState([])
  useEffect(() => {
    if (!topic) return
    const url = new URL('/ws', BACKEND || window.location.origin)
    url.searchParams.set('topic', topic)
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try { setEvents((prev) => [...prev, JSON.parse(e.data)]) } catch {}
    }
    ws.onopen = () => {
      // keep alive
      const id = setInterval(() => { try { ws.send('ping') } catch {} }, 15000)
      ws._keepAlive = id
    }
    ws.onclose = () => {
      if (ws._keepAlive) clearInterval(ws._keepAlive)
    }
    return () => { try { ws.close() } catch {} }
  }, [topic])
  return events
}

function QuickMatchDemo() {
  const [lat, setLat] = useState(24.8607)
  const [lng, setLng] = useState(67.0011)
  const [category, setCategory] = useState('plumbing')
  const [userId, setUserId] = useState('u123')
  const [taskId, setTaskId] = useState('')
  const [searching, setSearching] = useState(false)

  const taskEvents = useWebSocket(taskId ? `task:${taskId}` : null)
  const userEvents = useWebSocket(userId ? `user:${userId}` : null)

  const startQuickMatch = async () => {
    setSearching(true)
    const res = await fetch(`${BACKEND}/tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, category, lat: Number(lat), lng: Number(lng), quick_match: true })
    })
    const data = await res.json()
    setTaskId(data.task_id)
  }

  return (
    <div className="max-w-2xl w-full space-y-4">
      <h1 className="text-2xl font-semibold">Servisca — Quick Match Demo</h1>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Lat</label>
          <input className="w-full border rounded px-3 py-2" value={lat} onChange={e=>setLat(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Lng</label>
          <input className="w-full border rounded px-3 py-2" value={lng} onChange={e=>setLng(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-sm text-gray-600">Category</label>
          <select className="w-full border rounded px-3 py-2" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="moving">Moving</option>
            <option value="cleaning">Cleaning</option>
            <option value="furniture">Furniture</option>
          </select>
        </div>
      </div>
      <button onClick={startQuickMatch} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded">
        Quick Match — Find a tasker now
      </button>
      {taskId && (
        <div className="p-3 rounded border bg-white">
          <div className="text-sm text-gray-700">Task ID: <span className="font-mono">{taskId}</span></div>
          <div className="mt-2">
            <div className="font-semibold">Task events</div>
            <pre className="text-xs bg-gray-50 p-2 rounded max-h-44 overflow-auto">{JSON.stringify(taskEvents, null, 2)}</pre>
          </div>
        </div>
      )}
      <div className="p-3 rounded border bg-white">
        <div className="font-semibold">User events</div>
        <pre className="text-xs bg-gray-50 p-2 rounded max-h-44 overflow-auto">{JSON.stringify(userEvents, null, 2)}</pre>
      </div>
      <Tips />
    </div>
  )
}

function Tips() {
  return (
    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
      <li>Open another tab and connect as a tasker to accept offers: use topic tasker:tsk1 in the tester below.</li>
      <li>Use the Nearby Taskers API to seed online taskers via MongoDB if available.</li>
      <li>This is a minimal demo to validate the Quick Match loop and realtime events.</li>
    </ul>
  )
}

function WsTester() {
  const [topic, setTopic] = useState('tasker:tsk1')
  const events = useWebSocket(topic)
  return (
    <div className="p-3 rounded border bg-white">
      <div className="font-semibold mb-2">WebSocket Tester</div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" value={topic} onChange={e=>setTopic(e.target.value)} />
      </div>
      <pre className="text-xs bg-gray-50 p-2 rounded max-h-40 overflow-auto mt-2">{JSON.stringify(events, null, 2)}</pre>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-10">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-6">
        <QuickMatchDemo />
        <WsTester />
      </div>
    </div>
  )
}

export default App
