
// const debug = require('debug')('ournet:places-data');

import DynamoDB = require('aws-sdk/clients/dynamodb');
import {
    BaseRepository,
    RepositoryUpdateData,
    RepositoryAccessOptions,
} from '@ournet/domain';

import {
    Place,
    PlaceRepository,
    PlaceValidator,
    PlaceSearchData,
    CountryPlacesData,
    PlaceAdminData,
    PlacesAdminData,
} from '@ournet/places-domain';
import { DynamoPlaceModel, DynamoOldPlaceIdModel } from './dynamo-place';
import { PlaceSearcher } from './place-searcher';
import { DataPlaceMapper } from './entities/data-place-mapper';
import { sortEntitiesByIds } from './helpers';
import { DataPlaceHelper } from './entities/data-place-helper';
import { DynamoQueryResult } from 'dynamo-item';
import { DataPlace } from './entities/data-place';


export class DynamoPlaceRepository extends BaseRepository<Place> implements PlaceRepository {

    protected model: DynamoPlaceModel
    protected oldIdModel: DynamoOldPlaceIdModel
    protected searcher: PlaceSearcher

    constructor(client: DynamoDB.DocumentClient, esHost: string, tableSuffix: string) {
        super(new PlaceValidator());
        this.model = new DynamoPlaceModel(client, tableSuffix);
        this.oldIdModel = new DynamoOldPlaceIdModel(client);
        this.searcher = new PlaceSearcher(esHost);
    }

    async getAdmin1s(data: CountryPlacesData, options?: RepositoryAccessOptions<Place>): Promise<Place[]> {
        const hashKey = DataPlaceHelper.formatKeyAdmin1(data.country);

        const result = await this.model.query({
            index: DynamoPlaceModel.admin1IndexName(),
            hashKey,
            limit: data.limit,
            order: 'DESC',
        });

        if (!result.items || result.items.length === 0) {
            return [];
        }

        const ids = result.items.map(item => item.id);

        return this.getByIds(ids, options);
    }
    async getAdmin1(data: PlaceAdminData, options?: RepositoryAccessOptions<Place>) {
        const hashKey = DataPlaceHelper.formatKeyAdmin1(data.country);

        const result = await this.model.query({
            index: DynamoPlaceModel.admin1IndexName(),
            hashKey,
            rangeKey: {
                operation: '=',
                value: data.admin1Code,
            },
            limit: 1,
        });

        if (!result.items || result.items.length === 0) {
            return null;
        }

        return this.getById(result.items[0].id, options);
    }
    async getPlacesInAdmin1(data: PlacesAdminData, options?: RepositoryAccessOptions<Place>): Promise<Place[]> {
        const hashKey = DataPlaceHelper.formatKetInAdmin1(data.country, data.admin1Code);
        const maxSegment = 100;
        const countSegments = data.limit / maxSegment + 1;

        const segmentLimits: number[] = [];
        for (let i = 0; i < countSegments; i++) {
            if (i * maxSegment >= data.limit) {
                break;
            }
            const rest = data.limit - i * maxSegment;
            const limit = rest > maxSegment ? maxSegment : rest;
            segmentLimits.push(limit);
        }

        const indexResults: DynamoQueryResult<DataPlace> = { items: [], count: 0 };
        let results: Place[] = []
        for (const limit of segmentLimits) {
            const lastItem = !!indexResults.items ? indexResults.items[indexResults.items.length - 1] : null;
            const startKey = !!lastItem ? ({ keyInAdmin1: lastItem.keyInAdmin1, population: lastItem.population, id: lastItem.id }) : null;
            const indexResult = await this.model.query({
                index: DynamoPlaceModel.inAdmin1IndexName(),
                hashKey,
                limit: limit,
                order: 'DESC',
                startKey: startKey || undefined,
            });

            if (!indexResult.items || indexResult.items.length === 0) {
                break;
            }
            indexResults.items = (indexResults.items || []).concat(indexResult.items);
            const ids = indexResult.items.map(item => item.id);
            const result = await this.getByIds(ids, options);
            results = results.concat(result);
        }

        return results;
    }
    getOldPlaceId(id: number) {
        return this.oldIdModel.get({ id });
    }
    async getMainPlaces(data: CountryPlacesData, options?: RepositoryAccessOptions<Place>): Promise<Place[]> {
        const hashKey = DataPlaceHelper.formatKeyMain(data.country);

        const result = await this.model.query({
            index: DynamoPlaceModel.mainPlacesIndexName(),
            hashKey,
            limit: data.limit,
            order: 'DESC',
        });

        if (!result.items || result.items.length === 0) {
            return [];
        }

        return DataPlaceMapper.toPlaces(result.items);
    }

    async innerCreate(data: Place) {
        const createdItem = await this.model.create(DataPlaceMapper.fromPlace(data));

        const item = DataPlaceMapper.toPlace(createdItem);

        await this.searcher.index(item);

        return item;
    }

    async innerUpdate(data: RepositoryUpdateData<Place>) {
        const updatedItem = await this.model.update({
            remove: data.delete,
            key: { id: data.id },
            set: data.set && DataPlaceMapper.fromPartialPlace(data.set),
        });

        const item = DataPlaceMapper.toPlace(updatedItem);

        return item;
    }

    async delete(id: string) {
        const oldItem = await this.model.delete({ id });
        return !!oldItem;
    }

    async exists(id: string) {
        const item = await this.getById(id, { fields: ['id'] });

        return !!item;
    }

    async getById(id: string, options?: RepositoryAccessOptions<Place>) {
        const item = await this.model.get({ id }, options && { attributes: options.fields });

        if (!item) {
            return item;
        }

        return DataPlaceMapper.toPlace(item);
    }

    async getByIds(ids: string[], options?: RepositoryAccessOptions<Place>) {
        const items = await this.model.getItems(ids.map(id => ({ id })), options && { attributes: options.fields });

        return sortEntitiesByIds(ids, DataPlaceMapper.toPlaces(items));
    }

    async search(params: PlaceSearchData, options?: RepositoryAccessOptions<Place>): Promise<Place[]> {
        const ids = await this.searcher.search(params);

        if (!ids.length) {
            return [];
        }

        return this.getByIds(ids, options);
    }

    async deleteStorage(): Promise<void> {
        await Promise.all([
            this.oldIdModel.deleteTable(),
            this.model.deleteTable(),
        ]);
    }
    async createStorage(): Promise<void> {
        await Promise.all([
            this.searcher.init(),
            this.oldIdModel.createTable(),
            this.model.createTable(),
        ]);
    }
}
