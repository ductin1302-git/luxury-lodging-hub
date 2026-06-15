import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('MAIL_USER')?.trim();
    const pass = this.configService.get<string>('MAIL_PASS')?.replace(/\s/g, '');
    const timeoutMs = this.getTimeoutMs();

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT') || 587),
      secure: false,
      connectionTimeout: timeoutMs,
      greetingTimeout: timeoutMs,
      socketTimeout: timeoutMs,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private getTimeoutMs() {
    return Number(this.configService.get<string>('MAIL_TIMEOUT_MS') || 10000);
  }

  private async sendWithTimeout(options: nodemailer.SendMailOptions) {
    const timeoutMs = this.getTimeoutMs();
    return Promise.race([
      this.transporter.sendMail(options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Mail sending timed out after ${timeoutMs}ms`)), timeoutMs + 1000),
      ),
    ]);
  }

  async sendOtpEmail(to: string, otp: string) {
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('MAIL_USER');

    await this.sendWithTimeout({
      from,
      to,
      subject: 'Mã xác thực đăng ký LuxStay',
      html: `
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
      `,
    });
  }

  async sendPasswordResetOtpEmail(to: string, otp: string) {
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('MAIL_USER');

    await this.sendWithTimeout({
      from,
      to,
      subject: 'Ma dat lai mat khau LuxStay',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
          <h2 style="color: #1d4ed8; text-align: center;">Dat lai mat khau LuxStay</h2>
          <p>Xin chao,</p>
          <p>Ban vua yeu cau dat lai mat khau tai <b>LuxStay</b>. Vui long dung ma duoi day de xac thuc:</p>
          <div style="text-align: center; background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
          </div>
          <p>Ma co hieu luc trong <b>10 phut</b>.</p>
          <p style="color: #6b7280; font-size: 14px;">Neu ban khong thuc hien yeu cau nay, vui long bo qua email nay.</p>
        </div>
      `,
    });
  }
}
