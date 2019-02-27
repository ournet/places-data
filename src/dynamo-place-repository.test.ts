import test from 'ava';
import { launch, stop } from 'dynamodb-local';
import DynamoDB = require('aws-sdk/clients/dynamodb');
import { PlaceRepository } from '@ournet/places-domain';
import { DynamoPlaceRepository } from './dynamo-place-repository';

test.before('start dynamo', async t => {
    await t.notThrows(launch(8000, null, ['-inMemory', '-sharedDb']));
})

test.after('top dynamo', async t => {
    t.notThrows(() => stop(8000));
})

const client = new DynamoDB.DocumentClient({
    region: "eu-central-1",
    endpoint: "http://localhost:8000",
    accessKeyId: 'ID',
    secretAccessKey: 'Key',
});

const repository: PlaceRepository = new DynamoPlaceRepository(client, 'localhost', 'test');

test.skip('throw no table', async t => {
    await t.throws(repository.exists('id1'), /non-existent table/);
})

test.beforeEach('createStorage', async t => {
    await t.throws(repository.createStorage());
})

test.afterEach('deleteStorage', async t => {
    await t.notThrows(repository.deleteStorage());
})

test.serial('create', async t => {
    const country = 'us';
    const admin1Code = 'a';
    await t.throws(repository.create({ id: '1', name: 'name1', population: 2, countryCode: country, admin1Code, timezone: 'aaa', asciiname: 'name1', featureClass: 'P', featureCode: 'PPL', latitude: 1, longitude: 1 }), /No Living connections/i);
    await t.throws(repository.create({ id: '2', name: 'name2', population: 10, countryCode: country, admin1Code, timezone: 'aaa', asciiname: 'name2', featureClass: 'P', featureCode: 'PPL', latitude: 1, longitude: 1 }), /No Living connections/i);

    let result = await repository.getPlacesInAdmin1({ limit: 100, country, admin1Code });

    t.is(result.length, 2);

    result = await repository.getPlacesInAdmin1({ limit: 1, country, admin1Code });

    t.is(result.length, 1);
})
