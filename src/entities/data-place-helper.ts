import { Place } from "@ournet/places-domain";

export class DataPlaceHelper {
  /**
   * Create key InAdmin1
   * @param place Place data. required countryCode & admin1Code
   * @returns KeyAdmin1 if param place has defined `countryCode` and `admin1Code`, or undefined.
   */
  static createKeyInAdmin1(place: Partial<Place>) {
    if (
      place.countryCode &&
      place.admin1Code &&
      place.featureCode &&
      place.featureCode.trim().toUpperCase() !== "ADM1"
    ) {
      return DataPlaceHelper.formatKetInAdmin1(
        place.countryCode,
        place.admin1Code
      );
    }
  }

  static formatKetInAdmin1(countryCode: string, admin1Code: string) {
    return [
      countryCode.trim().toUpperCase(),
      admin1Code.trim().toUpperCase()
    ].join(".");
  }

  /**
   * Create key Admin1 for place of type Admin1.
   * @param place Place data.
   */
  static createKeyAdmin1(place: Partial<Place>) {
    if (
      place.countryCode &&
      place.featureClass &&
      place.featureCode &&
      place.featureClass === "A" &&
      place.featureCode.trim().toUpperCase() === "ADM1"
    ) {
      return DataPlaceHelper.formatKeyAdmin1(place.countryCode);
    }
  }

  static formatKeyAdmin1(countryCode: string) {
    return countryCode.trim().toUpperCase();
  }
  /**
   * Create key Main for main places.
   * @param place Place data.
   */
  static createKeyMain(place: Partial<Place>) {
    // is place & is PPLC, PPLA or has population >= 1 mil
    if (
      place.countryCode &&
      place.featureClass &&
      place.featureCode &&
      place.featureClass === "P" &&
      (["PPLC", "PPLA"].includes(place.featureCode.trim().toUpperCase()) ||
        (place.population &&
          place.population >= 100000 &&
          ["PPL", "PPLA2"].includes(place.featureCode.trim().toUpperCase())))
    ) {
      return DataPlaceHelper.formatKeyMain(place.countryCode);
    }
  }

  static formatKeyMain(countryCode: string) {
    return countryCode.trim().toUpperCase();
  }
}
