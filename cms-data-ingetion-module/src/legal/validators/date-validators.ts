import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureOrToday', async: false })
export class IsFutureOrTodayConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value || value === '' || value === null || value === undefined) {
      return true; // Allow empty values (optional fields)
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return false; // Invalid date format
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    return date >= today;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be today or later`;
  }
}

@ValidatorConstraint({ name: 'isAfterOrEqualDate', async: false })
export class IsAfterOrEqualDateConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value || value === '' || value === null || value === undefined) {
      return true; // Allow empty values (optional fields)
    }

    const object = args.object as any;
    const compareField = args.constraints[0];
    const compareValue = object[compareField];

    if (
      !compareValue ||
      compareValue === '' ||
      compareValue === null ||
      compareValue === undefined
    ) {
      return true; // If compare field is empty, allow this field
    }

    const date = new Date(value);
    const compareDate = new Date(compareValue);

    if (isNaN(date.getTime()) || isNaN(compareDate.getTime())) {
      return false; // Invalid date format
    }

    return date >= compareDate;
  }

  defaultMessage(args: ValidationArguments) {
    const compareField = args.constraints[0];
    return `${args.property} must be greater than or equal to ${compareField}`;
  }
}

export function IsFutureOrToday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureOrTodayConstraint,
    });
  };
}

export function IsAfterOrEqualDate(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterOrEqualDateConstraint,
    });
  };
}
