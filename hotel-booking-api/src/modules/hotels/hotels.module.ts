import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { UploadModule } from '../upload/upload.module';
import { TestHotelsController } from './test-hotels.controller';

@Module({
  imports: [UploadModule],
  controllers: [HotelsController, TestHotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
