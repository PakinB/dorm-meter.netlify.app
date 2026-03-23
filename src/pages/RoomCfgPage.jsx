import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
function formatNum(val) {
    if (val === '' || val === null || val === undefined) return ''
    return Number(val).toLocaleString()
}
function RoomCfgPage() {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchRooms() }, [])

    async function fetchRooms() {
        const { data } = await supabase
            .from('rooms')
            .select('*')
            .order('room_number')
        setRooms(data ?? [])
        setLoading(false)
    }

    function updateRoom(id, field, value) {
        setRooms((prev) =>
            prev.map((r) => r.id === id ? { ...r, [field]: value } : r)
        )
    }

    async function saveAll() {
        setSaving(true)
        for (const room of rooms) {
            await supabase
                .from('rooms')
                .update({
                    rent: room.rent,
                    common_fee: room.common_fee,
                    parking_fee: room.parking_fee,
                    extra_fee: room.extra_fee,
                    note: room.note,
                })
                .eq('id', room.id)
        }
        setSaving(false)
        alert('บันทึกเรียบร้อยแล้ว')
    }

    if (loading) return <div className="text-sm text-slate-400 py-8 text-center">กำลังโหลด...</div>

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Card header */}
            <div className="px-5 py-4 border-b bg-slate-50 flex justify-between items-center">
                <p className="text-sm text-slate-500 font-medium">ค่าใช้จ่ายคงที่รายเดือนแต่ละห้อง</p>
                <button
                    onClick={saveAll}
                    disabled={saving}
                    className="text-sm px-4 py-1.5 bg-blue-800 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '130px' }} />
                        <col style={{ width: '130px' }} />
                        <col style={{ width: '130px' }} />
                        <col style={{ width: '130px' }} />
                        <col />
                    </colgroup>
                    <thead>
                        <tr className="bg-blue-800 text-white text-xs">
                            <th className="text-left px-4 py-2">ห้อง</th>
                            <th className="text-right px-4 py-2">ค่าเช่า (฿)</th>
                            <th className="text-right px-4 py-2">ส่วนกลาง (฿)</th>
                            <th className="text-right px-4 py-2">ที่จอดรถ (฿)</th>
                            <th className="text-right px-4 py-2">อื่นๆ (฿)</th>
                            <th className="text-left px-4 py-2">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((room, i) => (
                            <tr key={room.id}
                                style={{ backgroundColor: i % 2 === 1 ? '#eff6ff' : '#ffffff' }}
                                className="border-b hover:bg-blue-100 transition-colors"
                            >
                                <td className="px-4 py-2 font-semibold text-blue-900">{room.room_number}</td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={formatNum(room.rent)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, '')
                                            if (!isNaN(raw)) updateRoom(room.id, 'rent', raw)
                                        }}
                                        className="border border-slate-300 rounded-md px-2 py-1 w-full text-right text-sm focus:outline-none focus:border-blue-400"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={formatNum(room.common_fee)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, '')
                                            if (!isNaN(raw)) updateRoom(room.id, 'common_fee', raw)
                                        }}
                                        className="border border-slate-300 rounded-md px-2 py-1 w-full text-right text-sm focus:outline-none focus:border-blue-400"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={formatNum(room.parking_fee)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, '')
                                            if (!isNaN(raw)) updateRoom(room.id, 'parking_fee', raw)
                                        }}
                                        className="border border-slate-300 rounded-md px-2 py-1 w-full text-right text-sm focus:outline-none focus:border-blue-400"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={formatNum(room.extra_fee)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, '')
                                            if (!isNaN(raw)) updateRoom(room.id, 'extra_fee', raw)
                                        }}
                                        className="border border-slate-300 rounded-md px-2 py-1 w-full text-right text-sm focus:outline-none focus:border-blue-400"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default RoomCfgPage