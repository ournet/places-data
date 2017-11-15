
import * as Joi from 'joi';

const placeNameMaxLength = 200;
const placeFeatureClasses = ['A', 'H', 'L', 'P', 'R', 'S', 'T', 'U', 'V'];

const wikiIdRegex = /^Q\d+$/;


export const PlaceSchema = {
    id: Joi.number().integer().positive().required(),
    name: Joi.string().trim().min(1).max(placeNameMaxLength).required(),
    asciiname: Joi.string().trim().min(1).max(placeNameMaxLength).required(),
    names: Joi.string().trim(),
    latitude: Joi.number().precision(4).required(),
    longitude: Joi.number().precision(4).required(),
    featureClass: Joi.string().allow(placeFeatureClasses).required(),
    featureCode: Joi.string().uppercase().min(1).max(10).required(),
    countryCode: Joi.string().length(2).lowercase().required(),
    admin1Code: Joi.string().trim().min(1).max(10),
    admin2Code: Joi.string().trim().min(1).max(10),
    admin3Code: Joi.string().trim().min(1).max(10),
    population: Joi.number().integer().positive(),
    elevation: Joi.string().trim().min(1).max(10),
    dem: Joi.number(),
    timezone: Joi.string().required(),
    wikiId: Joi.string().regex(wikiIdRegex),
    updatedAt: Joi.number().min(0),

    keyInAdmin1: Joi.string().regex(/^[A-Z]{2}\.[A-Z0-9]{1,10}$/),
    keyAdmin1: Joi.string().regex(/^[A-Z]{2}$/),
    keyMain: Joi.string().regex(/^[A-Z]{2}$/),
};

export const OldPlaceIdSchema = {
    id: Joi.number().integer().required(),
    geonameid: Joi.number().integer().required()
};
