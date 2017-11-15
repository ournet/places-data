
const vogels = require('vogels');

import { PlaceSchema, OldPlaceIdSchema } from './schemas';

const PREFIX = process.env.OURNET_PLACES_TABLE_PREFIX || 'v0';

export const NAMES = ['Place', 'OldPlaceId'];

export const PLACE_IN_ADMIN1_INDEX = 'OurnetPlaces_InAdmin1Index';
export const PLACE_ADMIN1_INDEX = 'OurnetPlaces_Admin1Index';
export const PLACE_MAIN_INDEX = 'OurnetPlaces_MainIndex';

export const PlaceModel = vogels.define('OurnetPlace', {
    tableName: [PREFIX, 'OurnetPlaces'].join('_'),
    hashKey: 'id',
    schema: PlaceSchema,
    timestamps: false,
    indexes: [{
        hashKey: 'keyInAdmin1',
        rangeKey: 'population',
        type: 'global',
        name: PLACE_IN_ADMIN1_INDEX,
        projection: {
            NonKeyAttributes: [
                'id',
                'keyInAdmin1',
                'population',
                'name',
                'names',
                'asciiname'],
            ProjectionType: 'INCLUDE'
        }
    }, {
        hashKey: 'keyAdmin1',
        rangeKey: 'admin1Code',
        type: 'global',
        name: PLACE_ADMIN1_INDEX
    }, {
        hashKey: 'keyMain',
        rangeKey: 'population',
        type: 'global',
        name: PLACE_MAIN_INDEX
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
