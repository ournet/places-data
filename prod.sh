#!/bin/bash

yarn unlink @ournet/domain
yarn unlink @ournet/places-domain
yarn unlink dynamo-model

yarn add @ournet/domain
yarn add @ournet/places-domain
yarn add dynamo-model

yarn test
