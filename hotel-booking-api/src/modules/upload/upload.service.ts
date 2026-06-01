import { Injectable } from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class UploadService {
  handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new Error('File logic error: No file provided');
    }
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
    };
  }

  handleBulkUpload(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }
    return files.map(file => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname,
    }));
  }
}
