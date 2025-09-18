import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidDocumentFileType', async: false })
export class IsValidDocumentFileTypeConstraint implements ValidatorConstraintInterface {
  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];

  private readonly allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc'];

  validate(value: any, args: ValidationArguments) {
    if (!value) return true; // Allow empty values (optional fields)

    // Handle file object
    if (value.mimetype) {
      return this.allowedMimeTypes.includes(value.mimetype);
    }

    // Handle filename string
    if (typeof value === 'string') {
      const extension = value.toLowerCase().substring(value.lastIndexOf('.'));
      return this.allowedExtensions.includes(extension);
    }

    // Handle file with originalname
    if (value.originalname) {
      const extension = value.originalname
        .toLowerCase()
        .substring(value.originalname.lastIndexOf('.'));
      return this.allowedExtensions.includes(extension);
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid document file (PDF, JPG, JPEG, PNG, DOCX, DOC)`;
  }
}

export function IsValidDocumentFileType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDocumentFileTypeConstraint,
    });
  };
}
