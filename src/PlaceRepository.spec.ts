
// require('dotenv').load();

import test from 'ava';
import { PlaceRepository } from './PlaceRepository';
import { DbConfig, createDbTables } from './db';
import { IPlace } from '../../places-domain/types/entities/Place';
const DynamoDB = require('aws-sdk').DynamoDB;
const DYNAMO_PORT = 8001;

DbConfig.db(new DynamoDB({
    endpoint: 'http://localhost:' + DYNAMO_PORT,
    accessKeyId: '1',
    secretAccessKey: '1',
    region: 'eu-central-1'
}));

const DynamoDbLocal = require('dynamodb-local');

DynamoDbLocal.configureInstaller({
    installPath: './temp',
    downloadUrl: 'https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.tar.gz'
});

test.before(async () => {
    await DynamoDbLocal.stop(DYNAMO_PORT);
    await DynamoDbLocal.launch(DYNAMO_PORT, null, ['-sharedDb', '-inMemory']);
    await createDbTables();
});

test.after.always(async () => {
    await DynamoDbLocal.stop(DYNAMO_PORT);
});

const repository = new PlaceRepository();

test('#create', async t => {
    await t.throws(repository.create({ id: 1 }), /"name" is required/, '"name" is required');
    await t.throws(repository.create({ id: 1, name: 'Name 1' }), /"asciiname" is required/, '"asciiname" is required');

    const id1: IPlace = { id: 1, name: 'Name 1 ', asciiname: 'Name 1', latitude: 11.1, longitude: 111.1, countryCode: 'ro', featureClass: 'P', featureCode: 'PPL', timezone: 'TZ' };

    await t.notThrows(repository.create(id1));
    await t.throws(repository.create(id1), /conditional request failed/, 'Place with id=1 exists!');
});

test('#getById', async t => {
    const id200 = await repository.getById(200);
    t.is(id200, null, 'Not found place id=1');
    const id1 = await repository.getById(1);
    t.is(id1.id, 1, 'Found place with id=1');
});
