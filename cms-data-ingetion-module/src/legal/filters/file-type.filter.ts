import { BadRequestException } from '@nestjs/common';

export const fileTypeFilter = (
  req: any,
  file: any,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc'];

  // Check MIME type
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }

  // Check file extension as fallback
  const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (allowedExtensions.includes(extension)) {
    callback(null, true);
    return;
  }

  // Reject file
  callback(
    new BadRequestException(
      `File type not allowed. Allowed types: PDF, JPG, JPEG, PNG, DOCX, DOC. Received: ${file.mimetype || extension}`,
    ),
    false,
  );
};
