
// const debug = require('debug')('ournet-places-data');

import { RepAccessOptions, RepUpdateData, RepUpdateOptions } from '@ournet/domain';
import { IPlace, PlaceValidator, IPlaceRepository, IOldPlaceId } from '@ournet/places-domain';
import { IDataPlace, DataPlace } from './entities';
import { DataPlaceMapper } from './mappers/DataPlaceMapper';
import { checkParam, accessOptionsToDynamoParams } from './helpers';
import { PlaceModel, OldPlaceIdModel, PLACE_ADMIN1_INDEX, PLACE_IN_ADMIN1_INDEX, PLACE_MAIN_INDEX } from './db/models';

export class DynamoPlaceStorage implements IPlaceRepository {
    search(data: { query: string; country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        throw new Error("Method not implemented.");
    }
    delete(id: number): Promise<boolean> {
        try {
            checkParam(id, 'id', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            PlaceModel.destroy(id, (error: Error) => {
                if (error) {
                    return reject(error);
                }
                resolve(true);
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

        return new Promise<IPlace[]>((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);

            PlaceModel.getItems(ids, params, (error: Error, result: any[]) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && result.map(item => <IDataPlace>item.get()) || []);
            });
        })
            .then(items => {
                if (!items || !items.length) {
                    return [];
                }
                return items.reduce((list, place) => {
                    const i = ids.indexOf(place.id);
                    list[i] = place;
                    return list;
                }, [] as IPlace[]).filter(item => !!item);
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

                resolve(!!result);
            });
        });
    }
    create(data: IPlace, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        try {
            data = PlaceValidator.instance.create(data);
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);
            params.overwrite = false;

            const dataPlace = DataPlaceMapper.transform(data);

            // debug('creating place: ', dataPlace);

            PlaceModel.create(dataPlace, params, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && <IDataPlace>result.get());
            });
        });
    }
    update(data: RepUpdateData<IPlace>, options?: RepUpdateOptions<IPlace>): Promise<IPlace> {
        if (data && data.item) {
            data.item.updatedAt = Math.round(Date.now() / 1000);
        }

        try {
            data = PlaceValidator.instance.update(data);
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);
            params.expected = { id: data.item.id };

            let dataPlace = <IPlace>Object.assign({}, data.item);// DataPlaceMapper.transform(data.item);

            if (data.delete && data.delete.length) {
                data.delete.forEach(item => dataPlace[item] = null);
            }

            dataPlace = DataPlaceMapper.transform(dataPlace);

            PlaceModel.update(dataPlace, params, (error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && <IDataPlace>result.get());
            });
        });
    }

    getAdmin1s(data: { country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {

        try {
            checkParam(data, 'data', 'object');
            checkParam(data.country, 'data.country', 'string');
            checkParam(data.limit, 'data.limit', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);

            let query = PlaceModel
                .query(DataPlace.formatKeyAdmin1(data.country))
                .usingIndex(PLACE_ADMIN1_INDEX)
                .limit(data.limit)
                .descending();

            if (params.AttributesToGet) {
                query = query.attributes(params.AttributesToGet);
            }

            query.exec((error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && result.Items && result.Items.map((item: any) => <IDataPlace>item.get()) || []);
            });
        });
    }

    getAdmin1(data: { country: string; admin1Code: string; }, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        try {
            checkParam(data, 'data', 'object');
            checkParam(data.country, 'data.country', 'string');
            checkParam(data.admin1Code, 'data.admin1Code', 'string');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);

            let query = PlaceModel
                .query(DataPlace.formatKeyAdmin1(data.country))
                .usingIndex(PLACE_ADMIN1_INDEX)
                .where('admin1Code').equals(data.admin1Code);
            if (params.AttributesToGet) {
                query = query.attributes(params.AttributesToGet);
            }
            query.exec((error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                result = result && result.Items && result.Items.map((item: any) => <IDataPlace>item.get()) || [];

                resolve(result.length && result[0] || null);
            });
        });
    }

    getPlacesInAdmin1(data: { country: string; admin1Code: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        try {
            checkParam(data, 'data', 'object');
            checkParam(data.country, 'data.country', 'string');
            checkParam(data.admin1Code, 'data.admin1Code', 'string');
            checkParam(data.limit, 'data.limit', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);

            let query = PlaceModel
                .query(DataPlace.formatKetInAdmin1(data.country, data.admin1Code))
                .usingIndex(PLACE_IN_ADMIN1_INDEX)
                .limit(data.limit)
                .descending();

            if (params.AttributesToGet) {
                query = query.attributes(params.AttributesToGet);
            }

            query.exec((error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && result.Items && result.Items.map((item: any) => <IDataPlace>item.get()) || []);
            });
        });
    }

    getMainPlaces(data: { country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        try {
            checkParam(data, 'data', 'object');
            checkParam(data.country, 'data.country', 'string');
            checkParam(data.limit, 'data.limit', 'number');
        } catch (e) {
            return Promise.reject(e);
        }

        return new Promise((resolve, reject) => {
            const params = accessOptionsToDynamoParams<IPlace>(options);

            let query = PlaceModel
                .query(DataPlace.formatKeyMain(data.country))
                .usingIndex(PLACE_MAIN_INDEX)
                .limit(data.limit)
                .descending();

            if (params.AttributesToGet) {
                query = query.attributes(params.AttributesToGet);
            }

            query.exec((error: Error, result: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(result && result.Items && result.Items.map((item: any) => <IDataPlace>item.get()) || []);
            });
        });
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
