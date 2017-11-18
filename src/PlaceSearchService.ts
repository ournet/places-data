
import { IAnyDictionary } from '@ournet/domain';
import { IPlace } from '@ournet/places-domain';

import { Client } from 'elasticsearch';

const INDEX = 'v0_places';
const TYPE = 'v0_place';

type SearchPlace = {
    id: number
    countryCode: string
    name: string
    asciiname: string
    names: string[]
    admin1Code: string
    [name: string]: any
}

export class PlaceSearchService {
    // for tests
    [name: string]: any
    private client: Client

    constructor(options: { host: string }) {
        this.client = new Client({
            host: options.host,
            // connectionClass: require('http-aws-es'),
            requestTimeout: 1000 * 5
        });
    }

    create(place: IPlace): Promise<boolean> {
        return this.client.create({
            index: INDEX,
            type: TYPE,
            body: mapSearchPlace(place)
        }).then(doc => doc.created);
    }

    update(place: IPlace): Promise<boolean> {
        const doc = mapSearchPlace(place);
        delete doc.id;
        for (var prop in doc) {
            if (~[undefined].indexOf(doc[prop])) {
                delete doc[prop];
            }
        }

        return this.client.update({
            index: INDEX,
            type: TYPE,
            id: place.id.toString(),
            body: {
                doc: doc
            }
        }).then(response => !!console.log(JSON.stringify(response)));
    }

    delete(id: number): Promise<boolean> {
        return this.client.delete({
            index: INDEX,
            type: TYPE,
            id: id.toString()
        }).then(response => response.found);
    }

    search(params: { query: string, size?: number, country?: string, type?: 'phrase_prefix' }): Promise<IPlace[]> {
        const body: IAnyDictionary = {
            'query': {
                'filtered': {
                    'query': {
                        'multi_match': {
                            'query': params.query,
                            'fields': ['name', 'asciiname', 'names']
                        }
                    }
                }
            }
        };

        if (params.type === 'phrase_prefix') {
            body.query.filtered.query.multi_match.type = 'phrase_prefix';
        }

        if (params.size) {
            body.size = params.size;
        }

        if (params.country) {
            body.query.filtered.filter = {
                'term': {
                    'countryCode': params.country
                }
            };
        }

        return this.client.search({
            index: INDEX,
            type: TYPE,
            body: body
        }).then(getPlaces);
    }
}

function getPlaces(response: any) {
    const places: IPlace[] = [];
    // console.log(response);
    if (response.hits && response.hits.total > 0) {
        response.hits.hits.forEach(function (item: any) {
            const place: IPlace = {
                id: item._id,
                name: item._source.name,
                asciiname: item._source.asciiname,
                names: item._source.names && item._source.names.join('|'),
                countryCode: item._source.countryCode,
                admin1Code: item._source.admin1Code
            };

            places.push(place);
        });
    }

    return places;
}

function mapSearchPlace(place: IPlace): SearchPlace {
    return {
        id: place.id,
        countryCode: place.countryCode,
        name: place.name,
        asciiname: place.asciiname,
        names: place.names && place.names.split(/\|/g),
        admin1Code: place.admin1Code
    };
}