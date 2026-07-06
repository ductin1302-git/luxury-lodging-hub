import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private async sendViaBrevoApi(to: string, subject: string, htmlContent: string) {
    // Ưu tiên dùng BREVO_API_KEY, nếu không có thì lấy đỡ từ MAIL_PASS
    const apiKey = this.configService.get<string>('BREVO_API_KEY') || this.configService.get<string>('MAIL_PASS')?.replace(/\s/g, '');
    const senderEmail = this.configService.get<string>('MAIL_USER') || 'no-reply@luxstay.com';
    const senderName = this.configService.get<string>('MAIL_FROM') || 'LuxStay';

    if (!apiKey) {
      throw new Error('Missing Brevo API Key');
    }

    // Tách lấy phần tên từ "LuxStay <email@example.com>"
    const nameMatch = senderName.match(/^(.+?)(?:\s*<|$)/);
    const cleanSenderName = nameMatch ? nameMatch[1].trim() : 'LuxStay';

    const payload = {
      sender: { name: cleanSenderName, email: senderEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Brevo API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        throw new Error(`Brevo API returned status ${response.status}`);
      }
      
      const data = await response.json();
      this.logger.log(`Email sent successfully via Brevo HTTP API. Message ID: ${data.messageId}`);
      return data;
    } catch (error) {
      this.logger.error('Failed to send email via Brevo HTTP API:', error);
      throw error;
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    const subject = 'Mã xác thực đăng ký LuxStay';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #1d4ed8; text-align: center;">Xác thực email đăng ký LuxStay</h2>
        <p>Xin chào,</p>
        <p>Bạn vừa yêu cầu đăng ký tài khoản tại <b>LuxStay</b>. Vui lòng sử dụng mã dưới đây để hoàn tất quá trình xác thực:</p>
        <div style="text-align: center; background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
        </div>
        <p>Mã có hiệu lực trong <b>5 phút</b>.</p>
        <p style="color: #6b7280; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ nếu thấy có dấu hiệu nghi ngờ.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">© 2026 LuxStay Team. Trân trọng.</p>
      </div>
    `;
    return this.sendViaBrevoApi(to, subject, html);
  }

  async sendPasswordResetOtpEmail(to: string, otp: string) {
    const subject = 'Mã đặt lại mật khẩu LuxStay';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #1d4ed8; text-align: center;">Đặt lại mật khẩu LuxStay</h2>
        <p>Xin chào,</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu tại <b>LuxStay</b>. Vui lòng dùng mã dưới đây để xác thực:</p>
        <div style="text-align: center; background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
        </div>
        <p>Mã có hiệu lực trong <b>10 phút</b>.</p>
        <p style="color: #6b7280; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      </div>
    `;
    return this.sendViaBrevoApi(to, subject, html);
  }
}
