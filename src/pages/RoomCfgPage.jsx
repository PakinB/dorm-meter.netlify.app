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
    const [toast, setToast] = useState(null)

    function showToast(msg, type = 'success') {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 2500)
    }

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
        let hasError = false

        for (const room of rooms) {
            const { error } = await supabase
                .from('rooms')
                .update({
                    rent: room.rent,
                    common_fee: room.common_fee,
                    parking_fee: room.parking_fee,
                    extra_fee: room.extra_fee,
                    note: room.note,
                })
                .eq('id', room.id)
            if (error) hasError = true
        }

        setSaving(false)
        showToast(hasError ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'บันทึกค่าห้องสำเร็จทั้งหมด', hasError ? 'error' : 'success')
    }

    if (loading) return <div className="py-8 text-center text-sm text-slate-400">กำลังโหลด...</div>

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm whitespace-nowrap">
            <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">
                <p className="text-sm font-medium text-slate-500">ค่าใช้จ่ายคงที่รายเดือนแต่ละห้อง</p>
                <button
                    onClick={saveAll}
                    disabled={saving}
                    className="rounded-lg bg-blue-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full text-sm">
                    <colgroup>
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '130px' }} />
                        <col style={{ width: '130px' }} />
                        <col style={{ width: '130px' }} />
                        <col style={{ width: '130px' }} />
                        <col />
                    </colgroup>
                    <thead>
                        <tr className="bg-blue-800 text-xs text-white">
                            <th className="sticky left-0 z-20 bg-blue-800 px-4 py-2 text-left shadow-[inset_-1px_0_0_#1d4ed8]">ห้อง</th>
                            <th className="px-4 py-2 text-right">ค่าเช่า (฿)</th>
                            <th className="px-4 py-2 text-right">ส่วนกลาง (฿)</th>
                            <th className="px-4 py-2 text-right">ที่จอดรถ (฿)</th>
                            <th className="px-4 py-2 text-right">อื่นๆ (฿)</th>
                            <th className="px-4 py-2 text-left">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((room, i) => {
                            const rowBackground = i % 2 === 1 ? '#eff6ff' : '#ffffff'

                            return (
                                <tr
                                    key={room.id}
                                    style={{ backgroundColor: rowBackground }}
                                    className="border-b transition-colors hover:bg-blue-100"
                                >
                                    <td
                                        style={{ backgroundColor: rowBackground }}
                                        className="sticky left-0 z-10 px-4 py-2 font-semibold text-blue-900 shadow-[inset_-1px_0_0_#dbeafe]"
                                    >
                                        {room.room_number}
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={formatNum(room.rent)}
                                            onChange={(e) => {
                                                const r = e.target.value.replace(/,/g, '')
                                                if (!isNaN(r)) updateRoom(room.id, 'rent', r)
                                            }}
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={formatNum(room.common_fee)}
                                            onChange={(e) => {
                                                const r = e.target.value.replace(/,/g, '')
                                                if (!isNaN(r)) updateRoom(room.id, 'common_fee', r)
                                            }}
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={formatNum(room.parking_fee)}
                                            onChange={(e) => {
                                                const r = e.target.value.replace(/,/g, '')
                                                if (!isNaN(r)) updateRoom(room.id, 'parking_fee', r)
                                            }}
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={formatNum(room.extra_fee)}
                                            onChange={(e) => {
                                                const r = e.target.value.replace(/,/g, '')
                                                if (!isNaN(r)) updateRoom(room.id, 'extra_fee', r)
                                            }}
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </td>
                                    <td className="w-[250px] px-4 py-2">
                                        <input
                                            type="text"
                                            value={room.note ?? ''}
                                            onChange={(e) => updateRoom(room.id, 'note', e.target.value)}
                                            placeholder="หมายเหตุ"
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '999px',
                    fontSize: '14px', fontWeight: '500',
                    whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    background: toast.type === 'success' ? '#1e3a8a' : '#dc2626',
                    color: 'white', animation: 'slideUp 0.2s ease',
                }}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
                </div>
            )}

            <style>{`
            @keyframes slideUp {
                from { opacity: 0; transform: translateX(-50%) translateY(12px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            `}</style>
        </div>
    )
}

export default RoomCfgPage
