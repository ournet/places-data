
const vogels = require('vogels');

import { PlaceSchema, OldPlaceIdSchema } from './schemas';

export const NAMES = ['OurnetPlace', 'OldPlaceId'];

export const PlaceModel = vogels.define('OurnetPlace', {
    tableName: 'OurnetPlaces',
    hashKey: 'id',
    schema: PlaceSchema,
    timestamps: false,
    indexes: [{
        hashKey: 'keyInAdmin1',
        rangeKey: 'population',
        type: 'global',
        name: 'OurnetPlaces_InAdmin1Index',
        projection: {
            id: 'id',
            keyInAdmin1: 'keyInAdmin1',
            population: 'population',
            name: 'name',
            names: 'names',
            asciiname: 'asciiname'
        }
    }, {
        hashKey: 'keyAdmin1',
        rangeKey: 'admin1Code',
        type: 'global',
        name: 'OurnetPlaces_Admin1Index'
    }, {
        hashKey: 'keyMain',
        rangeKey: 'population',
        type: 'global',
        name: 'OurnetPlaces_MainIndex'
    }]
});

export const OldPlaceIdModel = vogels.define('OldPlaceId', {
    tableName: 'GeoOldIds',
    timestamps: false,
    hashKey: 'id',
    schema: OldPlaceIdSchema
});

export function getModel(name: string) {
    switch (name) {
        case 'Place': return PlaceModel;
        case 'OldPlaceId': return OldPlaceIdModel;
    }
    throw new Error('Invalid model name ' + name);
}
