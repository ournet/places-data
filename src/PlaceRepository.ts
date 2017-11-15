
import { RepAccessOptions, RepUpdateData, RepUpdateOptions, DataValidationError, IAnyDictionary } from '@ournet/domain';
import { IPlace, IOldPlaceId, IPlaceRepository, PlaceValidator } from '@ournet/places-domain';
import { PlaceModel, OldPlaceIdModel } from './db/models';
import { IDataPlace } from './entities';
import { DataPlaceMapper } from './mappers/DataPlaceMapper';

export class PlaceRepository implements IPlaceRepository {
    delete(id: number): Promise<boolean> {
        try {
            checkParam(id, 'id', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            PlaceModel.destroy(id, { ReturnValues: true }, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(!!result);
            });
        });
    }
    getById(id: number, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        try {
            checkParam(id, 'id', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);

            PlaceModel.get(id, params, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && <IDataPlace>result.get());
            });
        });
    }
    getByIds(ids: number[], options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        try {
            checkParam(ids, 'ids', 'array');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);

            PlaceModel.getItems(ids, params, (error: Error, result: any[]) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && result.map(item => <IDataPlace>item.get()));
            });
        });
    }
    exists(id: number): Promise<boolean> {
        try {
            checkParam(id, 'id', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            PlaceModel.get(id, { AttributesToGet: ['id'] }, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && !!result.get());
            });
        });
    }
    create(data: IPlace, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        try {
            PlaceValidator.instance.create(data);
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);
            params.overwrite = false;

            const dataPlace = DataPlaceMapper.transform(data);

            PlaceModel.create(dataPlace, params, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && <IDataPlace>result.get());
            });
        });
    }
    update(data: RepUpdateData<IPlace>, options?: RepUpdateOptions<IPlace>): Promise<IPlace> {
        try {
            PlaceValidator.instance.update(data);
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);
            params.expected = { id: data.item.id };

            const dataPlace = DataPlaceMapper.transform(data.item);

            if (data.delete && data.delete.length) {
                data.delete.forEach(item => dataPlace[item] = null);
            }

            PlaceModel.update(dataPlace, params, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && <IDataPlace>result.get());
            });
        });
    }
    search(data: { query: string; country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        throw new Error("Method not implemented.");
    }
    getAdmin1s(data: { country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        throw new Error("Method not implemented.");
    }
    getAdmin1(data: { country: string; admin1Code: string; }, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        throw new Error("Method not implemented.");
    }
    getPlacesInAdmin1(data: { country: string; admin1Code: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        throw new Error("Method not implemented.");
    }
    getOldPlaceId(id: number): Promise<IOldPlaceId> {
        try {
            checkParam(id, 'id', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            OldPlaceIdModel.get(id, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && <IOldPlaceId>result.get());
            });
        });
    }

}

function accessOptionsToDynamoParams<T>(options?: RepAccessOptions<T>): IAnyDictionary {
    const params: IAnyDictionary = {};
    if (options && options.fields && options.fields.length) {
        params.AttributesToGet = options.fields;
    }

    return params;
}

function checkParam<T>(param: T, name: string, type: 'number' | 'string' | 'object' | 'array') {
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
