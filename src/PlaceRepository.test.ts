
// require('dotenv').load();

import test from 'ava';
import { stub } from 'sinon';
import { PlaceRepository } from './PlaceRepository';
import { DbConfig, createDbTables } from './db';
import { IPlace } from '@ournet/places-domain';
// const DynamoDB = require('aws-sdk').DynamoDB;
const DYNAMO_PORT = 8001;

process.env.AWS_ACCESS_KEY_ID = '1'
process.env.AWS_SECRET_ACCESS_KEY = '1'
process.env.AWS_REGION = 'eu-central-1'

DbConfig.config({
    endpoint: 'http://localhost:' + DYNAMO_PORT,
    accessKeyId: '1',
    secretAccessKey: '1',
    region: 'eu-central-1'
});

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

const repository = new PlaceRepository({ esHost: 'http://localhost:9001' });

const placeId1: IPlace = { id: 1, name: 'Name 1 ', asciiname: 'Name 1', latitude: 11.1, longitude: 111.1, countryCode: 'ro', featureClass: 'P', featureCode: 'PPL', timezone: 'TZ', admin1Code: 'VS', population: 1000000 };
const adm1Id1: IPlace = { id: 10, name: 'Admin 1 ', asciiname: 'Admin 1', latitude: 11.1, longitude: 111.1, countryCode: 'ro', featureClass: 'A', featureCode: 'ADM1', timezone: 'TZ', admin1Code: 'VS' };

// type NodeCallback = (error: Error, result?: any) => never;

stub(repository['searchService']['client'], 'create').callsFake(function (params: any) {
    // console.log('create params', params);
    return Promise.resolve(true);
});

stub(repository['searchService']['client'], 'delete').callsFake(function (params: any) {
    // console.log('delete params', params);
    return Promise.resolve(true);
});

test('#create', async t => {
    await t.throws(repository.create({ id: 1 }), /"name" is required/, '"name" is required');
    await t.throws(repository.create({ id: 1, name: 'Name 1' }), /"asciiname" is required/, '"asciiname" is required');

    await t.notThrows(repository.create(placeId1));
    await t.notThrows(repository.create(adm1Id1));

    await t.throws(repository.create(placeId1), /conditional request failed/, `Place with id=${placeId1.id} exists!`);
});

test('#exists', async t => {
    let exists = await repository.exists(placeId1.id);
    t.is(exists, true, `Place with id=${placeId1.id} exists`);
    exists = await repository.exists(adm1Id1.id);
    t.is(exists, true, `Place with id=${adm1Id1.id} exists`);
    exists = await repository.exists(3434343);
    t.is(exists, false, `Not found place with id=3434343`);
});

test('#update', async t => {
    await t.throws(repository.update({ item: { id: -1 } }), /"id" must be a positive number/, '"id" must be a positive number');
    await t.throws(repository.update({ item: { id: placeId1.id }, delete: ['asciiname'] }), /"asciiname" must be a string/, '"asciiname" must be a string');

    const updatedPlaceId1 = await repository.update({ item: { id: placeId1.id, name: 'Name 1 updated' } });
    t.is(updatedPlaceId1.name, 'Name 1 updated', 'retur updated name');
});

test('#getById', async t => {
    const id200 = await repository.getById(200);
    t.is(id200, null, 'Not found place id=1');
    const id1 = await repository.getById(placeId1.id);
    t.is(id1.id, placeId1.id, 'Found place with id=1');
    t.is(Object.keys(id1).length > 2, true, 'Get all fields');
    const id1Attrs = await repository.getById(placeId1.id, { fields: ['id'] });
    t.is(Object.keys(id1Attrs).length, 1, 'Filter getById fields');
});

test('#getByIds', async t => {
    const ids200_1 = await repository.getByIds([200, placeId1.id], { fields: ['id', 'name'] });
    t.is(ids200_1.length, 1, 'Found just placeId1');
    t.is(Object.keys(ids200_1[0]).length, 2, 'Filter getByIds fields');
});

test('#getAdmin1s', async t => {
    const adm1s = await repository.getAdmin1s({ country: 'ro', limit: 10 }, { fields: ['id', 'name'] });
    t.is(adm1s.length, 1, 'Got one Admin1 by country');
    t.is(Object.keys(adm1s[0]).length, 2, 'Filter getByIds fields');

    const nos = await repository.getAdmin1s({ country: 'FS', limit: 10 });
    t.is(nos.length, 0, 'Got empty admin1s');
});

test('#getAdmin1', async t => {
    const adm1 = await repository.getAdmin1({ country: 'ro', admin1Code: 'VS' });
    t.is(adm1.id, adm1Id1.id, 'Got Admin1 by country & admin1Code');
    t.is(Object.keys(adm1).length > 2, true, 'Get all fields');
    const adm1Attrs = await repository.getAdmin1({ country: 'ro', admin1Code: 'VS' }, { fields: ['id', 'name'] });
    t.is(Object.keys(adm1Attrs).length, 2, 'Filter fields to get');
    const adm1Invalid = await repository.getAdmin1({ country: 'ro', admin1Code: 'AA' });
    t.is(adm1Invalid, null, 'Not found Admin1 by country=ro & admin1Code=AA');
});

test('#getPlacesInAdmin1', async t => {
    const places = await repository.getPlacesInAdmin1({ country: 'ro', limit: 10, admin1Code: 'VS' }, { fields: ['id', 'name'] });
    t.is(places.length, 1, 'Got one places in Admin1');
    t.is(Object.keys(places[0]).length, 2, 'Filter getPlacesInAdmin1 fields');

    const nos = await repository.getPlacesInAdmin1({ country: 'FS', limit: 10, admin1Code: 'VS' });
    t.is(nos.length, 0, 'Got empty paces');
});

test('#getMainPlaces', async t => {
    const places = await repository.getMainPlaces({ country: 'ro', limit: 10 }, { fields: ['id', 'name'] });
    t.is(places.length, 1, 'Got one main places');
    t.is(Object.keys(places[0]).length, 2, 'Filter getMainPlaces fields');

    const nos = await repository.getMainPlaces({ country: 'FS', limit: 10 });
    t.is(nos.length, 0, 'Got empty paces');
});
