import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRates } from '../hooks/useRates'
const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]


function HistoryPage() {
    const { waterRate, elecRate } = useRates()
    const [rooms, setRooms] = useState([])
    const [roomId, setRoomId] = useState(null)
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => { fetchRooms() }, [])

    async function fetchRooms() {
        const { data } = await supabase
            .from('rooms')
            .select('id, room_number')
            .order('room_number')
        setRooms(data ?? [])
        if (data?.length) setRoomId(data[0].id)
    }

    useEffect(() => {
        if (roomId) fetchHistory()
    }, [roomId])

    async function fetchHistory() {
        setLoading(true)

        const { data } = await supabase
            .from('meter_readings')
            .select('*')
            .eq('room_id', roomId)
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        if (!data?.length) { setRows([]); setLoading(false); return }


        const result = data.map((cur, i) => {

            const prev = data[i + 1] ?? null

            const usedWater = prev ? Math.max(0, cur.water_meter - prev.water_meter) : null
            const usedElec = prev ? Math.max(0, cur.elec_meter - prev.elec_meter) : null
            const billWater = usedWater !== null ? usedWater * waterRate : null
            const billElec = usedElec !== null ? usedElec * elecRate : null
            const total = billWater !== null ? billWater + billElec : null

            return {
                month: cur.month, year: cur.year,
                waterMeter: cur.water_meter,
                elecMeter: cur.elec_meter,
                usedWater, usedElec, billWater, billElec, total,
            }
        })

        setRows(result)
        setLoading(false)
    }

    const selectedRoom = rooms.find((r) => r.id === roomId)

    return (
        <div className="space-y-4">

            {/* Room picker */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-xs text-slate-400 font-medium mb-3">เลือกห้อง</p>
                <div className="flex flex-wrap gap-2">
                    {rooms.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => setRoomId(room.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${roomId === room.id
                                ? 'bg-blue-800 text-white border-blue-800'
                                : 'bg-white text-slate-500 border-slate-300 hover:border-blue-400 hover:text-blue-700'
                                }`}
                        >
                            {room.room_number}
                        </button>
                    ))}
                </div>
            </div>

            {/* History table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-3 border-b bg-slate-50">
                    <p className="text-sm font-medium text-slate-600">
                        ประวัติห้อง {selectedRoom?.room_number}
                    </p>
                </div>

                {loading && (
                    <div className="text-sm text-slate-400 py-8 text-center">กำลังโหลด...</div>
                )}

                {!loading && rows.length === 0 && (
                    <div className="text-sm text-slate-400 py-8 text-center">ยังไม่มีข้อมูลห้องนี้</div>
                )}

                {!loading && rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-blue-800 text-white text-xs">
                                    <th className="text-left px-4 py-2">เดือน</th>
                                    <th className="text-right px-4 py-2">มิเตอร์น้ำ</th>
                                    <th className="text-right px-4 py-2">น้ำ (หน่วย)</th>
                                    <th className="text-right px-4 py-2">ค่าน้ำ</th>
                                    <th className="text-right px-4 py-2">มิเตอร์ไฟ</th>
                                    <th className="text-right px-4 py-2">ไฟ (หน่วย)</th>
                                    <th className="text-right px-4 py-2">ค่าไฟ</th>
                                    <th className="text-right px-4 py-2">รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={`${row.year}-${row.month}`}
                                        style={{ backgroundColor: i % 2 === 1 ? '#eff6ff' : '#ffffff' }}
                                        className="border-b hover:bg-blue-100 transition-colors"
                                    >
                                        <td className="px-4 py-2 font-semibold text-blue-900">
                                            {MONTHS[row.month - 1]} {row.year}
                                        </td>
                                        <td className="px-4 py-2 text-right text-slate-500">
                                            {row.waterMeter?.toLocaleString() ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {row.usedWater?.toLocaleString() ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {row.billWater ? Math.round(row.billWater).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right text-slate-500">
                                            {row.elecMeter?.toLocaleString() ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {row.usedElec?.toLocaleString() ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {row.billElec ? Math.round(row.billElec).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-blue-700">
                                            {row.total ? Math.round(row.total).toLocaleString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HistoryPage