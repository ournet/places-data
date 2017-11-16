
import { IPlace } from '@ournet/places-domain';

export interface IDataPlace extends IPlace {
    /**
     * Places in a admin1: 
     * key: COUNTRY_CODE-ADMIN1_CODE
     * range: pupulation
     */
    keyInAdmin1?: string
    /**
     * Admin1 places by country: 
     * key: COUNTRY_CODE
     * range: admin1Code
     */
    keyAdmin1?: string
    /**
     * Main places by country:
     * key: COUNTRY_CODE
     * range: population
     */
    keyMain?: string
    /**
     * Places of interest:
     * key: COUNTRY_CODE-AIRPORT | COUNTRY_CODE-MOUNTAIN
     * range: population
     */
    // keyPOI?: string

    [name: string]: any
}

export type KeyFormatResult = {
    key?: string
    /**
     * Provided valid data for creating key or not.
     */
    validData: boolean
}

export class DataPlace {
    /**
     * Create key InAdmin1
     * @param place Place data. required countryCode & admin1Code
     * @returns KeyAdmin1 if param place has defined `countryCode` and `admin1Code`, or undefined.
     */
    static createKeyInAdmin1(place: IPlace): KeyFormatResult {
        const result: KeyFormatResult = {
            validData: !!(place && place.countryCode && place.admin1Code && place.featureCode)
        }
        if (result.validData && place.featureCode.trim().toUpperCase() !== 'ADM1') {
            result.key = DataPlace.formatKetInAdmin1(place.countryCode, place.admin1Code);
        }

        return result;
    }

    static formatKetInAdmin1(countryCode: string, admin1Code: string) {
        return [countryCode.trim().toUpperCase(), admin1Code.trim().toUpperCase()].join('.');
    }

    /**
     * Create key Admin1 for place of type Admin1.
     * @param place Place data.
     */
    static createKeyAdmin1(place: IPlace): KeyFormatResult {
        const result: KeyFormatResult = {
            validData: !!(place && place.countryCode && place.featureClass && place.featureCode)
        }
        if (result.validData && place.featureClass === 'A' && place.featureCode.trim().toUpperCase() === 'ADM1') {
            result.key = DataPlace.formatKeyAdmin1(place.countryCode);
        }

        return result;
    }

    static formatKeyAdmin1(countryCode: string) {
        return countryCode.trim().toUpperCase();
    }
    /**
     * Create key Main for main places.
     * @param place Place data.
     */
    static createKeyMain(place: IPlace): KeyFormatResult {
        const result: KeyFormatResult = {
            validData: !!(place && place.countryCode && place.featureClass && place.featureCode)
        }
        // is place & is PPLC, PPLA or has population >= 1 mil
        if (result.validData && place.featureClass === 'P' &&
            (['PPLC', 'PPLA'].indexOf(place.featureCode.trim().toUpperCase()) > -1 || place.population && place.population >= 1000000)
        ) {
            result.key = DataPlace.formatKeyMain(place.countryCode);
        }

        return result;
    }

    static formatKeyMain(countryCode: string) {
        return countryCode.trim().toUpperCase();
    }
}
