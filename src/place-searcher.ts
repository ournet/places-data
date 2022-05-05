import { Client, SearchResponse } from "elasticsearch";
import { PlaceSearchData, Place, PlaceHelper } from "@ournet/places-domain";
import { atonic, uniq } from "@ournet/domain";

const ES_PLACE_INDEX = "v0_places";
const ES_PLACE_TYPE = "v0_place";

export type SearchItem = {
  id: string;
  name: string;
  countryCode: string;
  asciiname: string;
  names?: string;
  admin1Code?: string;
  atonic: string;
};

export class PlaceSearcher {
  private client: Client;
  constructor(host: string) {
    this.client = new Client({
      host,
      ssl: { rejectUnauthorized: false, pfx: [] },
      apiVersion: "5.6"
    });
  }

  async search(params: PlaceSearchData) {
    const body: any = {
      query: {
        filtered: {
          query: {
            multi_match: {
              query: params.query,
              fields: ["names", "name", "atonic", "asciiname"]
            }
          }
        }
      }
    };

    if (params.type) {
      body.query.filtered.query.multi_match.type = params.type;
    }

    if (params.country) {
      body.query.filtered.filter = {
        term: {
          countryCode: params.country
        }
      };
    }

    const response = await this.client.search<SearchItem>({
      index: ES_PLACE_INDEX,
      type: ES_PLACE_TYPE,
      body: body,
      size: params.limit
    });

    return parseResponse(response);
  }

  async index(data: Place, refresh?: "true" | "false" | "wait_for") {
    const item = normalizeItem(data);

    await this.client.index<SearchItem>({
      index: ES_PLACE_INDEX,
      type: ES_PLACE_TYPE,
      id: item.id,
      body: item,
      ttl: "24h",
      refresh
    });
  }

  async update(data: Place, refresh?: "true" | "false" | "wait_for") {
    const item = normalizeItem(data);

    await this.client.update({
      index: ES_PLACE_INDEX,
      type: ES_PLACE_TYPE,
      id: item.id,
      body: item,
      refresh
    });
  }

  async refresh() {
    await this.refresh();
  }

  async init() {
    const exists = await this.client.indices.exists({
      index: ES_PLACE_INDEX
    });

    if (exists) {
      return;
    }

    await this.client.indices.create({
      index: ES_PLACE_INDEX,
      body: {
        mappings: {
          v0_place: {
            properties: {
              name: {
                type: "string"
              },
              countryCode: {
                type: "string"
              },
              asciiname: {
                type: "string"
              },
              names: {
                type: "string"
              },
              admin1Code: {
                type: "string"
              },
              atonic: {
                type: "string"
              }
            }
          }
        }
      }
    });
  }
}

function parseResponse(response: SearchResponse<SearchItem>): string[] {
  if (!response.hits || !response.hits.total) {
    return [];
  }

  return uniq(response.hits.hits.map((item: any) => item._id));
}

function normalizeItem(data: Place) {
  const item: SearchItem = {
    id: data.id,
    name: data.name,
    countryCode: data.countryCode,
    asciiname: data.asciiname,
    names: data.names,
    admin1Code: data.admin1Code,
    atonic: ""
  };

  if (item.names) {
    item.names = uniq(
      PlaceHelper.parseNames(item.names).map((item) => item.name)
    ).join("|");
  } else {
    delete item.names;
  }
  if (!item.admin1Code) {
    delete item.admin1Code;
  }
  let atonicNames = [item.name, item.asciiname].concat(
    (item.names && item.names.split("|")) || []
  );
  atonicNames = uniq(
    atonicNames.map((item) => atonic(item.trim().toLowerCase()))
  );

  item.atonic = atonicNames.join("|");

  return item;
}
