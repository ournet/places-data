#!/bin/bash

yarn unlink @ournet/domain
yarn unlink @ournet/places-domain
yarn unlink dynamo-item

yarn add @ournet/domain
yarn add @ournet/places-domain
yarn add dynamo-item

yarn test
