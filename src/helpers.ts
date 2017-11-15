
import { IAnyDictionary, RepAccessOptions, DataValidationError } from '@ournet/domain';

export function accessOptionsToDynamoParams<T>(options?: RepAccessOptions<T>): IAnyDictionary {
    const params: IAnyDictionary = {};
    if (options && options.fields && options.fields.length) {
        params.AttributesToGet = options.fields;
    }

    return params;
}

export function checkParam<T>(param: T, name: string, type: 'number' | 'string' | 'object' | 'array') {
    if (param === undefined) {
        throw new DataValidationError(`param '${name}' is required`);
    }
    if (type === 'array') {
        if (!Array.isArray(param)) {
            throw new DataValidationError(`param '${name}' must be an ${type}`);
        }
    }
    else if (typeof param !== type) {
        throw new DataValidationError(`param '${name}' must be a ${type}`);
    }
}
