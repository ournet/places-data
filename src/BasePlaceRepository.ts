
// const debug = require('debug')('ournet-places-data');

import { RepAccessOptions, RepUpdateData, RepUpdateOptions, IRepository } from '@ournet/domain';
import { IPlace, PlaceValidator } from '@ournet/places-domain';
import { PlaceModel } from './db/models';
import { IDataPlace } from './entities';
import { DataPlaceMapper } from './mappers/DataPlaceMapper';
import { checkParam, accessOptionsToDynamoParams } from './helpers';

export class BasePlaceRepository implements IRepository<number, IPlace> {
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
            PlaceValidator.instance.create(data);
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
            PlaceValidator.instance.update(data);
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
}
