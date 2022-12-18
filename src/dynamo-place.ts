import DynamoDB = require("aws-sdk/clients/dynamodb");
import { DataPlace } from "./entities/data-place";
import { DynamoItem } from "dynamo-item";
import { OldPlaceId } from "@ournet/places-domain";

export type PlaceItemKey = {
  id: string;
};

export class DynamoPlaceModel extends DynamoItem<PlaceItemKey, DataPlace> {
  static mainPlacesIndexName() {
    return "main-places-index";
  }
  static inAdmin1IndexName() {
    return "in-admin1-index";
  }
  static admin1IndexName() {
    return "admin1-index";
  }

  constructor(client: DynamoDB.DocumentClient, tableSuffix: string) {
    super(
      {
        hashKey: {
          name: "id",
          type: "S"
        },
        name: "places",
        tableName: `ournet_places_${tableSuffix}`,
        indexes: [
          {
            name: DynamoPlaceModel.mainPlacesIndexName(),
            hashKey: {
              name: "keyMain",
              type: "S"
            },
            rangeKey: {
              name: "population",
              type: "N"
            },
            type: "GLOBAL",
            projection: {
              type: "ALL"
            }
          },
          {
            name: DynamoPlaceModel.inAdmin1IndexName(),
            hashKey: {
              name: "keyInAdmin1",
              type: "S"
            },
            rangeKey: {
              name: "population",
              type: "N"
            },
            type: "GLOBAL",
            projection: {
              type: "KEYS_ONLY"
            }
          },
          {
            name: DynamoPlaceModel.admin1IndexName(),
            hashKey: {
              name: "keyAdmin1",
              type: "S"
            },
            rangeKey: {
              name: "admin1Code",
              type: "S"
            },
            type: "GLOBAL",
            projection: {
              type: "KEYS_ONLY"
            }
          }
        ]
      },
      client as any
    );
  }
}

export class DynamoOldPlaceIdModel extends DynamoItem<
  { id: number },
  OldPlaceId
> {
  constructor(client: DynamoDB.DocumentClient) {
    super(
      {
        hashKey: {
          name: "id",
          type: "N"
        },
        name: "GeoOldIds",
        tableName: `GeoOldIds`
      },
      client as any
    );
  }
}
