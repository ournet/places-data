
const debug = require('debug')('ournet-places-data');

const atonic = require('atonic');
import { IAnyDictionary } from '@ournet/domain';
import { IPlace } from '@ournet/places-domain';

import { Client } from 'elasticsearch';

const INDEX = 'v0_places';
const TYPE = 'v0_place';

export type SearchPlace = {
    id: number
    countryCode: string
    name: string
    asciiname: string
    names: string[]
    admin1Code: string
    atonic: string[]
    [name: string]: any
}

export class PlaceSearchService {
    // for tests
    [name: string]: any
    private client: Client

    constructor(esOptions: any) {
        this.client = new Client(esOptions);
    }

    create(place: IPlace): Promise<boolean> {
        const body = mapSearchPlace(place);
        delete body.id;

        return this.client.index({
            index: INDEX,
            type: TYPE,
            id: place.id.toString(),
            body: body
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
                            'fields': ['name', 'asciiname', 'names', 'atonic']
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

    init(): Promise<boolean> {
        return this.client.indices.exists({
            index: INDEX
        })
            .then((exists: boolean) => {
                debug(`index ${INDEX} exists: ${exists}`);
                if (exists) {
                    return exists;
                }
                return this.client.indices.create(
                    {
                        index: INDEX,
                        body: {
                            "mappings": {
                                'v0_place': {
                                    "properties": {
                                        "name": {
                                            "type": "string"
                                        },
                                        "countryCode": {
                                            "type": "string"
                                        },
                                        "asciiname": {
                                            "type": "string"
                                        },
                                        "names": {
                                            "type": "string"
                                        },
                                        "admin1Code": {
                                            "type": "string"
                                        },
                                        "atonic": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    }).then(() => true);
            });
    }
}

function getPlaces(response: any) {
    const places: IPlace[] = [];
    // console.log(response);
    if (response.hits && response.hits.total > 0) {
        response.hits.hits.forEach(function (item: any) {
            const place: IPlace = {
                id: parseInt(item._id),
                name: item._source.name,
                asciiname: item._source.asciiname,
                // names: item._source.names && item._source.names.join('|'),
                countryCode: item._source.countryCode,
                admin1Code: item._source.admin1Code
            };

            places.push(place);
        });
    }

    return places;
}

export function mapSearchPlace(place: IPlace): SearchPlace {
    const data: SearchPlace = {
        id: place.id,
        countryCode: place.countryCode,
        name: place.name,
        asciiname: place.asciiname,
        names: place.names && place.names.split(/\|/g).map(name => name.substr(0, name.length - 4)),
        admin1Code: place.admin1Code,
        atonic: []
    };

    if (data.names) {
        data.names = data.names.filter((v, i, a) => a.indexOf(v) === i).filter(name => name !== data.name && name !== data.asciiname);
        if (!data.names.length) {
            delete data.names;
        }
    }

    data.atonic = ([data.name].concat(data.names || [])).map(item => (atonic(item) as string)).filter((v, i, a) => a.indexOf(v) === i);
    data.atonic = data.atonic.filter(name => name !== data.name && name !== data.asciiname && data.names && data.names.indexOf(name) < 0);

    if (data.asciiname === data.name) {
        delete data.asciiname;
    }

    if (!data.atonic.length) {
        delete data.atonic;
    }

    return data;
}
