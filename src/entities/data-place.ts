import { Place } from "@ournet/places-domain";

export interface DataPlace extends Place {
  /**
   * Places in a admin1:
   * key: COUNTRY_CODE-ADMIN1_CODE
   * range: pupulation
   */
  keyInAdmin1?: string;
  /**
   * Admin1 places by country:
   * key: COUNTRY_CODE
   * range: admin1Code
   */
  keyAdmin1?: string;
  /**
   * Main places by country:
   * key: COUNTRY_CODE
   * range: population
   */
  keyMain?: string;
  /**
   * Places of interest:
   * key: COUNTRY_CODE-AIRPORT | COUNTRY_CODE-MOUNTAIN
   * range: population
   */
  // keyPOI?: string
}
