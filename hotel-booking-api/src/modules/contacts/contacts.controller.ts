import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async createContact(@Body() data: any) {
    return this.contactsService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyContacts(@CurrentUser() user: { email: string }) {
    return this.contactsService.findByEmail(user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/:id')
  async getMyContactDetail(
    @CurrentUser() user: { email: string },
    @Param('id') id: string,
  ) {
    return this.contactsService.findByEmailAndId(user.email, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Get()
  async getAllContacts() {
    return this.contactsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Get(':id')
  async getContactById(@Param('id') id: string) {
    return this.contactsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Put(':id')
  async updateContact(@Param('id') id: string, @Body() data: any) {
    return this.contactsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteContact(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
