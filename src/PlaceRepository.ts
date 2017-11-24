
// const debug = require('debug')('ournet-places-data');

import { RepAccessOptions, RepUpdateOptions, RepUpdateData } from '@ournet/domain';
import { IPlace, IPlaceRepository, IOldPlaceId } from '@ournet/places-domain';
import { DynamoPlaceStorage } from './DynamoPlaceStorage';
import { PlaceSearchService } from './PlaceSearchService';

export class PlaceRepository implements IPlaceRepository {
    // for tests
    [name: string]: any
    private searchService: PlaceSearchService
    private storage: DynamoPlaceStorage

    constructor(options: { esOptions: any }) {
        this.storage = new DynamoPlaceStorage();
        this.searchService = new PlaceSearchService(options.esOptions);
    }

    init() {
        return this.searchService.init();
    }

    create(data: IPlace, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        return this.storage.create(data, options)
            .then(place => {
                return this.searchService.create(place).then(() => place);
            });
    }

    update(data: RepUpdateData<IPlace>, options?: RepUpdateOptions<IPlace>): Promise<IPlace> {
        return this.storage.update(data, options)
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
        return this.storage.delete(id).then(result => {
            return this.searchService.delete(id).then(() => result);
        });
    }

    search(data: { query: string; country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        return this.searchService.search(data);
    }

    getAdmin1s(data: { country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        return this.storage.getAdmin1s(data, options);
    }
    getAdmin1(data: { country: string; admin1Code: string; }, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        return this.storage.getAdmin1(data, options);
    }
    getPlacesInAdmin1(data: { country: string; admin1Code: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        return this.storage.getPlacesInAdmin1(data, options);
    }
    getOldPlaceId(id: number): Promise<IOldPlaceId> {
        return this.storage.getOldPlaceId(id);
    }
    getMainPlaces(data: { country: string; limit: number; }, options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        return this.storage.getMainPlaces(data, options);
    }
    getById(id: number, options?: RepAccessOptions<IPlace>): Promise<IPlace> {
        return this.storage.getById(id, options);
    }
    getByIds(ids: number[], options?: RepAccessOptions<IPlace>): Promise<IPlace[]> {
        return this.storage.getByIds(ids, options);
    }
    exists(id: number): Promise<boolean> {
        return this.storage.exists(id);
    }
}
