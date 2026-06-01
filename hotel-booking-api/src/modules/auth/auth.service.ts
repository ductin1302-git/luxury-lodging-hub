import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { user_role_enum } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const userCount = await this.prisma.appUser.count();
    const role = userCount === 0 ? 'admin' : 'customer';

    const user = await this.prisma.appUser.create({
      data: {
        fullName: dto.name,
        email: dto.email,
        passwordHash: hashedPassword,
        phone: dto.phone || null,
        role: role as any,
        authProvider: 'local',
        avatar: dto.name.charAt(0).toUpperCase(),
      },
    });

    if (!user.isActive) {
      throw new UnauthorizedException('Tai khoan da bi khoa.');
    }

    return this.buildAuthResponse(user as any);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.buildAuthResponse(user as any);
  }

  async handleGoogleRedirect(profile: any) {
    const email = profile.email;
    const googleId = profile.googleId;
    const fullName =
      profile.fullName ||
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
      'Google User';

    const avatar = this.getAvatarInitial(fullName);

    let user = await this.prisma.appUser.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    if (!user) {
      const userCount = await this.prisma.appUser.count();
      const role = userCount === 0 ? 'admin' : 'customer';

      user = await this.prisma.appUser.create({
        data: {
          fullName,
          email,
          avatar,
          googleId,
          authProvider: 'google',
          isEmailVerified: true,
          passwordHash: null,
          role: role as any,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.appUser.update({
        where: { id: user.id },
        data: {
          googleId,
          avatar: user.avatar || avatar,
          authProvider: 'google',
          isEmailVerified: true,
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tai khoan da bi khoa.');
    }

    return this.buildAuthResponse(user as any);
  }

  async requestEmailOtp(dto: RequestEmailOtpDto) {
    try {
      const email = dto.email.trim().toLowerCase();
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('Email đã được sử dụng');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Clean old OTPs for this email to avoid confusion
      await this.prisma.otp.deleteMany({
        where: { email, purpose: 'register' }
      });
      
      await this.prisma.otp.create({
        data: {
          email,
          otpCode: otp,
          purpose: 'register',
          expiresAt,
        }
      });

      // In production, send Email here
      try {
        await this.mailService.sendOtpEmail(email, otp);
      } catch (mailError) {
        console.error('MAIL SENDING FAILED:', mailError);
        throw new BadRequestException('Không gửi được email xác thực. Vui lòng kiểm tra cấu hình mail.');
      }
      
      console.log(`REQUEST OTP:`, { email, otp, expiresAt });

      return { 
        success: true, 
        message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.' 
      };
    } catch (error) {
      console.error('ERROR in requestEmailOtp:', error);
      throw error;
    }
  }

  async verifyEmailOtp(dto: VerifyEmailOtpDto) {
    try {
      const email = dto.email.trim().toLowerCase();
      const otp = dto.otp.replace(/\s/g, '').trim();

      console.log('VERIFY INPUT:', { email, otp });

      const latestOtp = await this.prisma.otp.findFirst({
        where: {
          email,
          otpCode: otp,
          purpose: 'register',
          verified: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log('LATEST OTP RECORD:', latestOtp);

      if (!latestOtp) {
        throw new BadRequestException('Mã xác thực không đúng hoặc đã được sử dụng');
      }

      if (new Date(latestOtp.expiresAt) < new Date()) {
        throw new BadRequestException('Mã xác thực đã hết hạn');
      }

      await this.prisma.otp.update({
        where: { id: latestOtp.id },
        data: { verified: true }
      });

      return {
        success: true,
        message: 'Xác thực email thành công',
      };
    } catch (error) {
      console.error('ERROR in verifyEmailOtp:', error);
      throw error;
    }
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    try {
      const email = dto.email.trim().toLowerCase();
      const otp = dto.otp.replace(/\s/g, '').trim();

      if (dto.password !== dto.confirmPassword) {
        throw new BadRequestException('Mat khau nhap lai khong khop.');
      }

      // Check if OTP was verified for this email
      const otpRecord = await this.prisma.otp.findFirst({
        where: {
          email,
          otpCode: otp,
          purpose: 'register',
          verified: true, // Must be verified in step 2
        },
      });

      if (!otpRecord) {
        throw new BadRequestException('Mã xác thực không hợp lệ hoặc bạn chưa xác thực bước 2.');
      }

      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('Email đã được đăng ký.');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const userCount = await this.prisma.appUser.count();
      const role = userCount === 0 ? 'admin' : 'customer';

      const user = await this.prisma.appUser.create({
        data: {
          fullName: dto.fullName,
          email,
          passwordHash: hashedPassword,
          phone: dto.phone || null,
          role: role as any,
          authProvider: 'local',
          isEmailVerified: true,
          avatar: dto.fullName.charAt(0).toUpperCase(),
        },
      });

      // Optionally: delete OTP record after success
      await this.prisma.otp.delete({ where: { id: otpRecord.id } }).catch(() => {});

      return this.buildAuthResponse(user as any);
    } catch (error) {
      console.error('ERROR in completeRegistration:', error);
      throw error;
    }
  }

  async requestOtp(dto: RequestOtpDto) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.prisma.otp.create({
      data: {
        phone: dto.phone,
        otpCode: otp,
        purpose: 'phone_auth',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      }
    });

    // In production, send SMS here
    console.log(`Phone OTP for ${dto.phone}: ${otp}`);

    return { message: 'Mã OTP đã được gửi đến số điện thoại của bạn' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const record = await this.prisma.otp.findFirst({
      where: {
        phone: dto.phone,
        otpCode: dto.otp,
        purpose: 'phone_auth',
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || new Date(record.expiresAt) < new Date()) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }

    await this.prisma.otp.update({
      where: { id: record.id },
      data: { verified: true }
    });

    let user = await this.prisma.appUser.findFirst({
      where: { phone: dto.phone }
    });

    if (!user) {
       const userCount = await this.prisma.appUser.count();
       const role = userCount === 0 ? 'admin' : 'customer';

       user = await this.prisma.appUser.create({
         data: {
           fullName: `User ${dto.phone.slice(-4)}`,
           email: `${dto.phone}@phone.auth`, // Placeholder email
           phone: dto.phone,
           authProvider: 'phone',
           isPhoneVerified: true,
           role: role as any,
         }
       });
    }

    return this.buildAuthResponse(user as any);
  }

  async me(userId: string) {
    return this.usersService.findPublicById(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Tài khoản không hỗ trợ đổi mật khẩu theo cách này');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new ConflictException('Mật khẩu hiện tại không đúng. Vui lòng kiểm tra và nhập lại.');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.appUser.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async setPassword(userId: string, dto: SetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mat khau nhap lai khong khop.');
    }

    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Tai khoan khong ton tai.');
    }

    if (user.passwordHash) {
      throw new ConflictException('Tai khoan da co mat khau. Vui long dung chuc nang doi mat khau.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.appUser.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        avatar: user.avatar || this.getAvatarInitial(user.fullName),
      },
    });

    return this.buildAuthResponse(updated as any);
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.prisma.otp.deleteMany({
        where: { email, purpose: 'reset_password' },
      });

      await this.prisma.otp.create({
        data: {
          email,
          otpCode: otp,
          purpose: 'reset_password',
          expiresAt,
        },
      });

      await this.mailService.sendPasswordResetOtpEmail(email, otp);
      console.log(`RESET PASSWORD OTP:`, { email, otp, expiresAt });
    }

    return {
      success: true,
      message: 'Neu email ton tai, ma xac thuc da duoc gui den hop thu cua ban.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const otp = dto.otp.replace(/\s/g, '').trim();

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mat khau nhap lai khong khop.');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Ma xac thuc khong dung hoac da het han.');
    }

    const record = await this.prisma.otp.findFirst({
      where: {
        email,
        otpCode: otp,
        purpose: 'reset_password',
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || new Date(record.expiresAt) < new Date()) {
      throw new BadRequestException('Ma xac thuc khong dung hoac da het han.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.appUser.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        avatar: user.avatar || this.getAvatarInitial(user.fullName),
      },
    });

    await this.prisma.otp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return { success: true, message: 'Dat lai mat khau thanh cong.' };
  }

  public async buildAuthResponse(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: user_role_enum;
    authProvider?: string;
    passwordHash?: string | null;
    hasPassword?: boolean;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        authProvider: user.authProvider,
        hasPassword: user.hasPassword ?? Boolean(user.passwordHash),
      },
    };
  }

  public async buildAuthResponseFromJwtUser(jwtUser: any) {
    const user = await this.usersService.findPublicById(jwtUser.userId);
    return this.buildAuthResponse(user as any);
  }

  private getAvatarInitial(name?: string | null) {
    const trimmedName = name?.trim();
    return (trimmedName?.charAt(0) || 'U').toUpperCase();
  }
}
