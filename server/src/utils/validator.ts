import _ from "lodash";
import validator from "validator";

type validators = (value: any, ...params: any[]) => boolean;

type LastType<T extends any[]> = T extends [value: any, ...e: infer e]
  ? e
  : never;

class Validator {
  private value: any;
  private valid: boolean;

  constructor(value: any) {
    this.value = value;
    this.valid = true;
  }

  apply<T extends validators>(
    func: T,
    ...params: LastType<Parameters<T>>
  ): void {
    if (!func(this.value, ...params)) {
      this.valid = false;
    }
  }

  validate(): boolean {
    return this.valid;
  }

  static isNotNil(value: any): boolean {
    if (_.isNil(value)) {
      return false;
    }

    return true;
  }

  static isRequired(value: any): boolean {
    if (!Validator.isNotNil(value)) {
      return false;
    }

    if (_.isString(value) && value.length === 0) {
      return false;
    }

    if (_.isArray(value) && value.length === 0) {
      return false;
    }

    return true;
  }

  static isRequiredArray(value: any): boolean {
    if (!_.isArray(value) || value.length === 0) {
      return false;
    }

    return true;
  }

  static isRequiredString(value: any): boolean {
    if (!_.isString(value) || value.length === 0) {
      return false;
    }

    return true;
  }

  static isString(value: any): boolean {
    return _.isString(value);
  }

  static isEmail(value: any): boolean {
    if (!_.isString(value) || !validator.isEmail(value)) {
      return false;
    }

    return true;
  }

  static isURL(value: any): boolean {
    if (!_.isString(value) || !validator.isURL(value)) {
      return false;
    }

    return true;
  }

  static isUUID(value: any, version: 3 | 4 | 5 = 4): boolean {
    if (!_.isString(value) || !validator.isUUID(value, version)) {
      return false;
    }

    return true;
  }

  static isIn(value: any, list: any): boolean {
    if (_.isArray(list) && !list.includes(value)) {
      return false;
    } else if (!_.isObject(list) || !Object.keys(list).includes(value)) {
      return false;
    }

    return true;
  }

  static isArray(
    value: any,
    check: (value: any) => boolean = () => true
  ): boolean {
    if (!_.isArray(value)) {
      return false;
    } else if (_.some(value, (val) => !check(val))) {
      return false;
    }

    return true;
  }

  static isArraySizeMaximum(
    value: any,
    maximum: number | null | undefined
  ): boolean {
    if (!_.isArray(value)) {
      return false;
    } else if (!_.isNil(maximum)) {
      if (value.length > maximum) {
        return false;
      }
    }

    return true;
  }

  static isArraySizeMinimum(
    value: any,
    minimum: number | null | undefined
  ): boolean {
    if (!_.isArray(value)) {
      return false;
    } else if (!_.isNil(minimum)) {
      if (value.length < minimum) {
        return false;
      }
    }

    return true;
  }

  static isBool(value: any): boolean {
    return _.isBoolean(value);
  }

  static isBoolOrUndefined(value: any): boolean {
    return _.isBoolean(value) || _.isUndefined(value);
  }

  static isNilOrInteger(value: any): boolean {
    return _.isNil(value) || _.isInteger(value);
  }

  static isNilOrPositiveInteger(value: any): boolean {
    return _.isNil(value) || Validator.isPositiveInteger(value);
  }

  static isNullOrString(value: any): boolean {
    return _.isNull(value) || _.isString(value);
  }

  static isNilOrNumber(value: any): boolean {
    return _.isNil(value) || _.isNumber(value);
  }

  static isNumberOrNull(value: any, isInt = false): boolean {
    return (
      _.isNil(value) ||
      (isInt && _.isInteger(value)) ||
      (!isInt && _.isNumber(value))
    );
  }

  static isStringArray(value: any): boolean {
    return Validator.isArray(value, (val) => _.isString(val) && val.length > 0);
  }

  static isIntegerArray(value: any): boolean {
    return Validator.isArray(value, (val) => _.isInteger(val));
  }

  static isInteger(value: any): boolean {
    return _.isInteger(value);
  }

  static isNumeric(value: any, isInt = false): boolean {
    if (isInt) {
      return Validator.isInteger(value);
    }

    return _.isNumber(value);
  }

  static isNotHavingDuplicates(value: any): boolean {
    if (!_.isArray(value)) {
      return false;
    } else {
      if (_.uniq(value).length !== value.length) {
        return false;
      }
    }

    return true;
  }

  static isMaximum(value: any, maximum: number | null | undefined): boolean {
    if (!_.isNumber(value)) {
      return false;
    } else {
      if (!_.isNil(maximum)) {
        if (value > maximum) {
          return false;
        }
      }
    }

    return true;
  }

  static isMinimum(value: any, minimum: number | null | undefined): boolean {
    if (!_.isNumber(value)) {
      return false;
    } else {
      if (!_.isNil(minimum)) {
        if (value < minimum) {
          return false;
        }
      }
    }

    return true;
  }

  static isPositiveInteger(value: any): boolean {
    return Validator.isInteger(value) && Validator.isMinimum(value, 1);
  }

  static isNonNegativeInteger(value: any): boolean {
    return Validator.isInteger(value) && Validator.isMinimum(value, 0);
  }

  static isBigIntString(value: any): boolean {
    return Validator.isString(value) && validator.isInt(value);
  }

  static isISODateString(value: any): boolean {
    return (
      Validator.isString(value) && validator.isISO8601(value, { strict: true })
    );
  }

  static isObject(value: any): boolean {
    return _.isObjectLike(value) && !_.isArray(value);
  }
}

export default Validator;
