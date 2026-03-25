import { useState, useEffect } from 'react'
import RoomRow from '../components/RoomRow'
import { supabase } from '../lib/supabase'
import { useRates } from '../hooks/useRates'
const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const now = new Date()

function EntryPage() {
    const { waterRate, elecRate } = useRates()
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())

    useEffect(() => { fetchRooms() }, [])

    async function fetchRooms() {
        setLoading(true)
        const { data } = await supabase
            .from('rooms').select('*').order('room_number')
        setRooms(data ?? [])
        setLoading(false)
    }

    if (loading) return <div className="text-sm text-slate-400 py-8 text-center">กำลังโหลด...</div>

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[800px] sm:min-w-[900px]">
                    {/* Card header */}
                    <div className="px-5 py-4 border-b bg-slate-50 flex gap-3 items-center">
                        <span className="text-sm text-slate-500 font-medium">เดือน:</span>
                        <select value={month} onChange={(e) => setMonth(+e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                            {MONTHS.map((name, i) => (
                                <option key={i + 1} value={i + 1}>{name}</option>
                            ))}
                        </select>
                        <select value={year} onChange={(e) => setYear(+e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <span className="ml-auto text-xs text-slate-400">{rooms.length} ห้อง</span>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-blue-800 text-white text-xs font-medium">
                        <span>ห้อง</span>
                        <span>น้ำ (ก่อน)</span>
                        <span>น้ำ (ใหม่)</span>
                        <span>ไฟ (ก่อน)</span>
                        <span>ไฟ (ใหม่)</span>
                        <span>ค่าน้ำ+ไฟ</span>
                    </div>

                    {/* Rows */}
                    {rooms.map((room, i) => (
                        <RoomRow
                            key={room.id}
                            roomId={room.id}
                            roomNumber={room.room_number}
                            month={month}
                            year={year}
                            stripe={i % 2 === 1}
                            waterRate={waterRate}
                            elecRate={elecRate}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default EntryPage