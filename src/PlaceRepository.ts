
// const debug = require('debug')('ournet-places-data');

import { RepAccessOptions, RepUpdateOptions, RepUpdateData } from '@ournet/domain';
import { IPlace, IOldPlaceId, IPlaceRepository } from '@ournet/places-domain';
import { PlaceModel, OldPlaceIdModel, PLACE_ADMIN1_INDEX, PLACE_IN_ADMIN1_INDEX, PLACE_MAIN_INDEX } from './db/models';
import { IDataPlace, DataPlace } from './entities';
import { checkParam, accessOptionsToDynamoParams } from './helpers';
import { BasePlaceRepository } from './BasePlaceRepository';
import { PlaceSearchService } from './PlaceSearchService';

export class PlaceRepository extends BasePlaceRepository implements IPlaceRepository {
    // for tests
    [name: string]: any
    private searchService: PlaceSearchService

    constructor(options: { esHost: string }) {
        super();

        this.searchService = new PlaceSearchService({ host: options.esHost });
    }

    create(data: IPlace, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        return super.create(data, options)
            .then(place => {
                return this.searchService.create(place).then(() => place);
            });
    }

    update(data: RepUpdateData<IPlace>, options?: RepUpdateOptions<IPlace>): Promise<IPlace> {
        return super.update(data, options)
            .then(place => {
                return this.getById(place.id)
                    .then(dataPlace => {
                        return this.searchService.delete(dataPlace.id)
                            .catch()
                            .then(() => this.searchService.create(dataPlace));
                    })
                    .then(() => place);
            });
    }

    delete(id: number): Promise<boolean> {
        return super.delete(id).then(result => {
            return this.searchService.delete(id).then(() => result);
        });
    }

    search(data: { query: string; country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        return this.searchService.search(data);
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
