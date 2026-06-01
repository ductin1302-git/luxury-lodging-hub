import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { user_role_enum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.appUser.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.appUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    return user;
  }

  async findPublicById(id: string) {
    const user = await this.prisma.appUser.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        authProvider: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    const { passwordHash, ...publicUser } = user;
    return {
      ...publicUser,
      hasPassword: Boolean(passwordHash),
    };
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
  }) {
    const existed = await this.findByEmail(data.email);
    if (existed) {
      throw new ConflictException('Email đã tồn tại');
    }

    const userCount = await this.prisma.appUser.count();
    const role = userCount === 0 ? 'admin' : 'customer';

    return this.prisma.appUser.create({
      data: {
        fullName: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        role: role as any,
        avatar: data.name.charAt(0).toUpperCase(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    // Manually map fields if UpdateProfileDto still uses 'name'
    const updateData: any = { ...data };
    if (updateData.name) {
      updateData.fullName = updateData.name;
      delete updateData.name;
    }

    const updatedUser = await this.prisma.appUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        authProvider: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { passwordHash, ...publicUser } = updatedUser;
    return {
      ...publicUser,
      hasPassword: Boolean(passwordHash),
    };
  }

  async findAll() {
    return this.prisma.appUser.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserByAdmin(userId: string, data: any) {
    const existing = await this.prisma.appUser.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('User khong ton tai');
    }

    const updateData: any = {};
    if (typeof data.name === 'string' || typeof data.fullName === 'string') {
      updateData.fullName = (data.name || data.fullName).trim();
    }
    if (typeof data.phone === 'string') {
      updateData.phone = data.phone.trim() || null;
    }
    if (typeof data.isActive === 'boolean') {
      updateData.isActive = data.isActive;
    }
    if (typeof data.role === 'string') {
      const normalizedRole = data.role === 'user' ? 'customer' : data.role;
      const allowedRoles: user_role_enum[] = ['customer', 'staff', 'admin'];
      if (!allowedRoles.includes(normalizedRole as user_role_enum)) {
        throw new BadRequestException('Vai tro khong hop le');
      }
      updateData.role = normalizedRole as user_role_enum;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Khong co du lieu cap nhat');
    }

    return this.prisma.appUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivateUserByAdmin(userId: string, currentUserId?: string) {
    if (currentUserId && userId === currentUserId) {
      throw new ConflictException('Khong the khoa chinh tai khoan dang dang nhap');
    }

    const existing = await this.prisma.appUser.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('User khong ton tai');
    }

    return this.prisma.appUser.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new ConflictException('Tài khoản không hỗ trợ đổi mật khẩu theo cách này');
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
}
