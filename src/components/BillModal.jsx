import { useEffect, useRef, useState } from 'react'
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'
import { toJpeg } from 'html-to-image'
import { numberToThaiText } from '../hooks/bathText'


const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

function BillModal({ bill, info, onClose }) {
    const billRef = useRef()
    const [qrUrl, setQrUrl] = useState('')

    useEffect(() => {
        if (info.promptpay) {
            try {
                const payload = generatePayload(info.promptpay, { amount: bill.total })
                QRCode.toDataURL(payload, { width: 200, margin: 1 })
                    .then((url) => setQrUrl(url))
            } catch (e) {
                console.error('QR error:', e)
            }
        }
    }, [info.promptpay, bill.total])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    function getBillHTML() {
        return `
      <div class="bill">
        <div class="bh">
          <h1>${info.dorm_name || 'หอพัก'}</h1>
          <p>${info.dorm_address || ''}</p>
          <p>เบอร์โทร : 063-546-2928</p>
        </div>
        <div class="bm">
          <span>ห้อง <b>${bill.roomNumber}</b></span>
          <span>ประจำเดือน <b>${MONTHS[bill.month - 1]} ${bill.year}</b></span>
          
        </div>

        <div class="sl">ค่าใช้จ่ายคงที่</div>
        <div class="row"><span>ค่าเช่าห้อง</span><span>${bill.rent.toLocaleString()} ฿</span></div>
        <div class="row"><span>ค่าส่วนกลาง</span><span>${bill.commonFee > 0 ? bill.commonFee.toLocaleString() + ' ฿' : '0' + ' ฿'}</span></div>
        <div class="row"><span>ค่าที่จอดรถ</span><span>${bill.parkingFee > 0 ? bill.parkingFee.toLocaleString() + ' ฿' : '0' + ' ฿'}</span></div>
        ${bill.extraFee > 0 ? `<div class="row"><span>ค่าอื่นๆ</span><span>${bill.extraFee.toLocaleString()} ฿</span></div>` : ''}

        <div class="sl">ค่าน้ำ</div>
        <div class="row"><span>ค่าน้ำ (${bill.usedWater ?? '?'} หน่วย × ${info.waterRate ?? 18} ฿)</span><span>${bill.billWater?.toFixed(0) ?? '0'} ฿</span></div>
        ${bill.prevWater !== null ? `<div class="row sub"><span>มิเตอร์เก่า ${bill.prevWater} → ใหม่ ${bill.newWater}</span></div>` : ''}

        <div class="sl">ค่าไฟ</div>
        <div class="row"><span>ค่าไฟ (${bill.usedElec ?? '?'} หน่วย × ${info.elecRate ?? 8} ฿)</span><span>${bill.billElec?.toFixed(0) ?? '0'} ฿</span></div>
        ${bill.prevElec !== null ? `<div class="row sub"><span>มิเตอร์เก่า ${bill.prevElec} → ใหม่ ${bill.newElec}</span></div>` : ''}

        <div class="total"><span>รวมทั้งหมด</span>
            <div style="text-align:right;">
                <div>${bill.total.toLocaleString()} ฿</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">
                (${numberToThaiText(Number(bill.total))})
            </div>
        </div></div>

        <div class="ft">
          <div class="ft-text">
            ${info.promptpay ? `<p>🙏🙏 รบกวนโอน</p>` : ''}
            ${info.bank_name ? `<p>ธนาคาร : ${info.bank_name}</p>` : ''}
            ${info.bank_number ? `<p>เลขที่บัญชี : ${info.bank_number}</p>` : ''}
            ${info.bank_account ? `<p>ชื่อบัญชี : ${info.bank_account}</p>` : ''}
            ${info.promptpay ? `<p>ขอบคุณค่ะ 🙏🙏</p>` : ''}
            </div>
          
        </div>
      </div>
    `
    }

    function handlePrint() {
        const billHTML = getBillHTML()
        const win = window.open('', '_blank')
        win.document.write(`
      <html><head>
      <meta charset="utf-8">
      <title>ใบบิล ห้อง ${bill.roomNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #1a1a1a; background: white; }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .half {
          height: 138.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4mm 0;
        }

        .cut-line {
          border-top: 1.5px dashed #cbd5e1;
          position: relative;
          margin: 0 -10mm;
        }
        .cut-label {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 0 8px;
          font-size: 9px;
          color: #94a3b8;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .bill { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; width: 100%; }
        .bh { background: #1e3a8a; color: white; padding: 12px 16px; }
        .bh h1 { font-size: 15px; font-weight: 600; }
        .bh p { font-size: 10px; opacity: 0.75; margin-top: 2px; }
        .bm { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
        .bm b { color: #1e293b; }
        .status { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 500; }
        .status.paid { background: #dcfce7; color: #15803d; }
        .status.unpaid { background: #fef3c7; color: #b45309; }
        .sl { font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 16px 3px; }
        .row { display: flex; justify-content: space-between; padding: 4px 16px; font-size: 12px; color: #334155; }
        .row.sub { padding: 2px 16px 5px 28px; font-size: 10px; color: #94a3b8; }
        .total { display: flex; justify-content: space-between; margin: 4px 16px 0; padding: 10px 0; border-top: 2px solid #1e3a8a; font-size: 15px; font-weight: 700; color: #1e3a8a; }
        .ft { display: flex; gap: 12px; align-items: center; padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .ft-text { flex: 1; }
        .ft-text p { font-size: 10px; color: #64748b; margin-bottom: 2px; }
        .qr-wrap { text-align: center; flex-shrink: 0; }
        .qr-wrap img { width: 80px; height: 80px; display: block; border: 1px solid #e2e8f0; border-radius: 4px; }
        .qr-wrap p { font-size: 9px; color: #64748b; margin-top: 3px; font-weight: 500; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 0; }
        }
      </style>
      </head>
      <body>
        <div class="page">
          <div class="half">${billHTML}</div>
          <div class="cut-line"><div class="cut-label">✂ ตัดตรงนี้</div></div>
          <div class="half">${billHTML}</div>
        </div>
      </body></html>
    `)
        win.document.close()
        win.focus()
        setTimeout(() => { win.print(); win.close() }, 600)
    }

    async function handleDownloadJPG() {
        try {
            const element = billRef.current.querySelector('.bill')
            if (!element) return

            const dataUrl = await toJpeg(element, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                skipFonts: true
            })

            const link = document.createElement('a')
            link.download = `bill${bill.roomNumber}.jpg`
            link.href = dataUrl
            link.click()

        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

                {/* Modal header */}
                <div className="flex justify-between items-center px-5 py-4 border-b">
                    <h2 className="font-semibold text-slate-700">ใบบิล — ห้อง {bill.roomNumber}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
                </div>

                {/* Preview */}
                <div className="p-5" ref={billRef}>
                    <div className="bill border border-slate-200 rounded-lg overflow-hidden">

                        <div className="bg-blue-800 text-white p-4">
                            <h1 className="text-base font-semibold">{info.dorm_name || 'หอพัก'}</h1>
                            <p className="text-xs text-blue-200 mt-0.5">{info.dorm_address}</p>
                            <p className="text-xs text-blue-200 mt-0.5">เบอร์โทร : 063-546-2928</p>
                        </div>

                        <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b text-xs text-slate-500">
                            <span>ห้อง <span className="font-semibold text-slate-700">{bill.roomNumber}</span></span>
                            <span>ประจำเดือน <span className="font-semibold text-slate-700">{MONTHS[bill.month - 1]} {bill.year}</span></span>
                            {/* <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bill.paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-600'}`}>
                                {bill.paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                            </span> */}
                        </div>

                        {/* เปลี่ยนจาก conditional render เป็นแสดงทุกบรรทัดเสมอ */}
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1">ค่าใช้จ่ายคงที่</p>
                        <div className="flex justify-between px-4 py-1 text-sm">
                            <span>ค่าเช่าห้อง</span>
                            <span className="font-medium">{bill.rent.toLocaleString()} ฿</span>
                        </div>
                        <div className="flex justify-between px-4 py-1 text-sm">
                            <span>ค่าส่วนกลาง</span>
                            <span className="font-medium">
                                {bill.commonFee > 0 ? `${bill.commonFee.toLocaleString()} ฿` : '0' + ' ฿'}
                            </span>
                        </div>
                        <div className="flex justify-between px-4 py-1 text-sm">
                            <span>ค่าที่จอดรถ</span>
                            <span className="font-medium">
                                {bill.parkingFee > 0 ? `${bill.parkingFee.toLocaleString()} ฿` : '0' + ' ฿'}
                            </span>
                        </div>
                        {bill.extraFee > 0 && (
                            <div className="flex justify-between px-4 py-1 text-sm">
                                <span>ค่าอื่นๆ</span>
                                <span className="font-medium">{bill.extraFee.toLocaleString()} ฿</span>
                            </div>
                        )}

                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-2 pb-1">ค่าน้ำ</p>
                        <div className="flex justify-between px-4 py-1 text-sm">
                            <span>ค่าน้ำ ({bill.usedWater ?? '?'} หน่วย × {info.waterRate ?? 18} ฿)</span>
                            <span className="font-medium">{bill.billWater?.toFixed(0) ?? '—'} ฿</span>
                        </div>
                        {bill.prevWater !== null && <p className="px-4 pb-1 text-xs text-slate-400 pl-8">มิเตอร์เก่า {bill.prevWater} - ใหม่ {bill.newWater}</p>}

                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-2 pb-1">ค่าไฟ</p>
                        <div className="flex justify-between px-4 py-1 text-sm">
                            <span>ค่าไฟ ({bill.usedElec ?? '?'} หน่วย × {info.elecRate ?? 8} ฿)</span>
                            <span className="font-medium">{bill.billElec?.toFixed(0) ?? '—'} ฿</span>
                        </div>

                        {bill.prevElec !== null && <p className="px-4 pb-1 text-xs text-slate-400 pl-8">มิเตอร์เก่า {bill.prevElec} - ใหม่ {bill.newElec}</p>}


                        <div className="flex justify-between mx-4 py-3 border-t-2 border-blue-800 text-blue-800 font-bold text-base mt-2">

                            <span>รวมทั้งหมด</span>

                            <div className="flex flex-col gap-1 items-end leading-none">
                                <span>{bill.total.toLocaleString()} ฿</span>
                                <span className="text-xs text-slate-500">
                                    ({numberToThaiText(Number(bill.total))})
                                </span>
                            </div>

                        </div>



                        <div className="flex gap-3 items-center px-4 py-3 bg-slate-50 border-t">
                            <div className="flex-1 space-y-1">

                                {info.bank_name && <p className="text-xs text-slate-500">🙏🙏 รบกวนโอน</p>}
                                {info.bank_number && <p className="text-xs text-slate-500">เลขที่บัญชี : {info.bank_number}</p>}
                                {info.bank_account && <p className="text-xs text-slate-500">ชื่อบัญชี : {info.bank_account}</p>}
                                {info.promptpay && <p className="text-xs text-slate-500">ขอบคุณค่ะ 🙏🙏</p>}
                            </div>
                            {/* {qrUrl && (
                                <div className="text-center flex-shrink-0">
                                    <p className="text-xs text-slate-500 mt-1 font-medium">จ่ายแบบรวดเร็ว</p>
                                    <img src={qrUrl} alt="QR PromptPay" className="w-20 h-20 border border-slate-200 rounded" />
                                    <p className="text-xs text-slate-500 mt-1 font-medium">จ่ายพร้อมเพย์</p>
                                </div>
                            )} */}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 px-5 py-4 border-t">
                    <button onClick={handleDownloadJPG}
                        className="w-full py-2 bg-blue-800 text-white text-sm rounded-lg font-medium">
                        ดาวน์โหลดรูปภาพ
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handlePrint}
                            className="flex-1 py-2 border border-blue-800 text-blue-800 text-sm rounded-lg hover:bg-blue-50 font-medium">
                            ปริ้นใบบิล
                        </button>
                        <button onClick={handlePrint}
                            className="flex-1 py-2 bg-blue-800 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
                            บันทึก PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BillModal