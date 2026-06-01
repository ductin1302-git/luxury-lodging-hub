import React from "react";
import { Booking } from "@/pages/admin/bookings/BookingListPage";

export const generateInvoiceHTML = (booking: Booking) => {
  const checkIn = new Date(booking.checkIn).toLocaleDateString("vi-VN");
  const checkOut = new Date(booking.checkOut).toLocaleDateString("vi-VN");
  const createdAt = new Date(booking.createdAt).toLocaleDateString("vi-VN");
  const total = Number(booking.total).toLocaleString("vi-VN");
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa đơn - ${booking.bookingCode || booking.id}</title>
        <style>
          body { font-family: 'DejaVu Sans', Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 40px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 14px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
          .logo-container { display: flex; align-items: center; gap: 15px; }
          .logo-img { width: 60px; height: 60px; object-fit: contain; }
          .logo-text { color: #D4AF37; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-info { text-align: right; }
          .invoice-info h1 { margin: 0; color: #D4AF37; font-size: 24px; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .details div { flex: 1; }
          .details h3 { margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #666; font-size: 12px; text-transform: uppercase; }
          table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; margin-bottom: 40px; }
          table th { background: #f8f8f8; padding: 12px; border-bottom: 2px solid #eee; font-weight: bold; }
          table td { padding: 12px; border-bottom: 1px solid #eee; }
          .total-section { float: right; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .total-row.grand-total { border-top: 2px solid #D4AF37; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #D4AF37; }
          .footer { margin-top: 100px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; }
          }
          .btn-print { background: #D4AF37; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: center;">
          <button class="btn-print" onclick="window.print()">Tải xuống / In Hóa đơn</button>
        </div>
        <div class="invoice-box">
          <div class="header">
            <div class="logo-container">
              <svg width="60" height="60" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="8" width="80" height="80" rx="18" fill="#07162B"/>
                <rect x="10.5" y="10.5" width="75" height="75" rx="15.5" stroke="#D4AF37" stroke-width="3"/>
                <path d="M48 18L67 31H29L48 18Z" fill="#D4AF37"/>
                <path d="M31 34H65V69H31V34Z" fill="#0E2546" stroke="#D4AF37" stroke-width="3"/>
                <path d="M37 69V44M48 69V40M59 69V44" stroke="#F4D875" stroke-width="4" stroke-linecap="round"/>
                <path d="M24 69H72" stroke="#D4AF37" stroke-width="4" stroke-linecap="round"/>
                <path d="M38 29L48 22L58 29" stroke="#F8E7A1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M39 78H57" stroke="#F4D875" stroke-width="3" stroke-linecap="round"/>
                <circle cx="48" cy="31" r="3" fill="#F8E7A1"/>
              </svg>
              <div class="logo-text">LUXURY STAY</div>
            </div>
            <div class="invoice-info">
              <h1>HÓA ĐƠN</h1>
              <p>Mã đơn: <strong>#${booking.bookingCode || booking.id.slice(0, 8)}</strong></p>
              <p>Ngày lập: ${createdAt}</p>
            </div>
          </div>

          <div class="details">
            <div>
              <h3>TỪ:</h3>
              <p><strong>Luxury Stay Hotel Group</strong><br>
              123 Đường Trần Phú, Lộc Thọ<br>
              Nha Trang, Khánh Hòa, Việt Nam<br>
              Email: contact@luxurystay.com</p>
            </div>
            <div style="text-align: right;">
              <h3>ĐẾN:</h3>
              <p><strong>${booking.guestName}</strong><br>
              SĐT: ${booking.guestPhone}<br>
              Email: ${booking.guestEmail}<br>
              ${booking.user ? 'Khách hàng thành viên' : 'Khách vãng lai'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Dịch vụ / Phòng</th>
                <th>Thời gian lưu trú</th>
                <th style="text-align: right;">Đơn giá</th>
                <th style="text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${booking.hotelNameSnapshot}</strong><br>
                  <span style="font-size: 12px; color: #666;">${booking.items?.[0]?.roomNameSnapshot || booking.items?.[0]?.room?.name || booking.items?.[0]?.roomName || "Phòng nghỉ cao cấp"}</span>
                </td>
                <td>${checkIn} - ${checkOut}<br>(${booking.nights} đêm)</td>
                <td style="text-align: right;">${(Number(booking.total) / booking.nights).toLocaleString("vi-VN")} ₫</td>
                <td style="text-align: right;">${total} ₫</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Tạm tính:</span>
              <span>${total} ₫</span>
            </div>
            <div class="total-row">
              <span>Thuế (VAT 10%):</span>
              <span>Đã bao gồm</span>
            </div>
            <div class="total-row grand-total">
              <span>TỔNG CỘNG:</span>
              <span>${total} ₫</span>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ tại Luxury Stay.</p>
            <p>Mọi thắc mắc vui lòng liên hệ hotline: +84 28 3888 9999</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
