
import { IPlace } from '@ournet/places-domain';
import { IDataPlace, DataPlace } from '../entities';

export class DataPlaceMapper {
    static transform(place: IPlace): IDataPlace {
        const data: IDataPlace = Object.assign({}, place);

        const inAdm1Key = DataPlace.createKeyInAdmin1(place);
        if (inAdm1Key.key) {
            data.keyInAdmin1 = inAdm1Key.key;
        }
        const adm1Key = DataPlace.createKeyAdmin1(place);
        if (adm1Key.key) {
            data.keyAdmin1 = adm1Key.key;
        }
        const mainKey = DataPlace.createKeyMain(place);
        if (mainKey.key) {
            data.keyMain = mainKey.key;
        }

        return data;
    }

    static transformAll(places: IPlace[]): IDataPlace[] {
        return places.map(DataPlaceMapper.transform);
    }
}
