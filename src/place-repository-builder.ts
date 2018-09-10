import DynamoDB = require('aws-sdk/clients/dynamodb');
import { DynamoPlaceRepository } from './dynamo-place-repository';
import { PlaceRepository } from '@ournet/places-domain';

const VERSION_SUFFIX = 'v0';

export class PlaceRepositoryBuilder {
    static build(client: DynamoDB.DocumentClient, esHost: string, tableSuffix?: string): PlaceRepository {
        return new DynamoPlaceRepository(client, esHost, tableSuffix || VERSION_SUFFIX);
    }
}