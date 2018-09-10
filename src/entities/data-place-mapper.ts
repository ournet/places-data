
import { Place } from '@ournet/places-domain';
import { DataPlace } from './data-place';
import { DataPlaceHelper } from './data-place-helper';

export class DataPlaceMapper {
    static fromPartialPlace(place: Partial<Place>) {
        const data: Partial<DataPlace> = { ...place };

        const inAdm1Key = DataPlaceHelper.createKeyInAdmin1(place);
        if (inAdm1Key) {
            data.keyInAdmin1 = inAdm1Key;
        }
        const adm1Key = DataPlaceHelper.createKeyAdmin1(place);
        if (adm1Key) {
            data.keyAdmin1 = adm1Key;
        }
        const mainKey = DataPlaceHelper.createKeyMain(place);
        if (mainKey) {
            data.keyMain = mainKey;
        }

        return data;
    }
    static fromPlace(place: Place): DataPlace {
        const data: DataPlace = { ...place };

        const inAdm1Key = DataPlaceHelper.createKeyInAdmin1(place);
        if (inAdm1Key) {
            data.keyInAdmin1 = inAdm1Key;
        }
        const adm1Key = DataPlaceHelper.createKeyAdmin1(place);
        if (adm1Key) {
            data.keyAdmin1 = adm1Key;
        }
        const mainKey = DataPlaceHelper.createKeyMain(place);
        if (mainKey) {
            data.keyMain = mainKey;
        }

        return data;
    }

    static fromPlaces(places: Place[]): DataPlace[] {
        return places.map(DataPlaceMapper.fromPlace);
    }

    static toPlace(data: DataPlace) {
        delete data.keyAdmin1;
        delete data.keyInAdmin1;
        delete data.keyMain;

        return data as Place;
    }

    static toPlaces(data: DataPlace[]) {
        return data.map(DataPlaceMapper.toPlace);
    }
}
