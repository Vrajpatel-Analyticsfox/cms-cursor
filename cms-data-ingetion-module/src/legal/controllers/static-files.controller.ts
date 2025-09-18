import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Static Files')
@Controller('legal/static')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
export class StaticFilesController {
  @Get('document/:caseId/:filename')
  @ApiOperation({ summary: 'Serve document file by case ID and filename' })
  @ApiParam({ name: 'caseId', description: 'Legal case ID' })
  @ApiParam({ name: 'filename', description: 'Document filename' })
  @ApiResponse({ status: 200, description: 'File served successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async serveDocument(
    @Param('caseId') caseId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Construct the file path
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'legal-case',
        caseId,
        '2025', // You might want to make this dynamic
        '09', // You might want to make this dynamic
        '13', // You might want to make this dynamic
        filename,
      );

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found');
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const mimeType = this.getMimeType(filename);

      // Set appropriate headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('File not found or error reading file');
    }
  }

  @Get('document-by-path/:caseId/:year/:month/:day/:filename')
  @ApiOperation({ summary: 'Serve document file by full path components' })
  @ApiParam({ name: 'caseId', description: 'Legal case ID' })
  @ApiParam({ name: 'year', description: 'Year' })
  @ApiParam({ name: 'month', description: 'Month' })
  @ApiParam({ name: 'day', description: 'Day' })
  @ApiParam({ name: 'filename', description: 'Document filename' })
  @ApiResponse({ status: 200, description: 'File served successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async serveDocumentByPath(
    @Param('caseId') caseId: string,
    @Param('year') year: string,
    @Param('month') month: string,
    @Param('day') day: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Construct the file path
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'legal-case',
        caseId,
        year,
        month,
        day,
        filename,
      );

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found');
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const mimeType = this.getMimeType(filename);

      // Set appropriate headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('File not found or error reading file');
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
