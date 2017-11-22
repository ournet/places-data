
import * as Joi from 'joi';

import { getCreatePlaceSchema } from '@ournet/places-domain';
import { ObjectSchema } from 'joi';

const createPlaceSchema: ObjectSchema = getCreatePlaceSchema();

export const PlaceSchema = createPlaceSchema.keys({
    keyInAdmin1: Joi.string().regex(/^[A-Z]{2}\.[A-Z0-9]{1,10}$/),
    keyAdmin1: Joi.string().regex(/^[A-Z]{2}$/),
    keyMain: Joi.string().regex(/^[A-Z]{2}$/),
});

export const OldPlaceIdSchema = {
    id: Joi.number().integer().required(),
    geonameid: Joi.number().integer().required()
};
