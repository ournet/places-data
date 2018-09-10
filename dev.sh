#!/bin/bash

yarn remove @ournet/domain
yarn remove @ournet/places-domain
yarn remove dynamo-model

yarn link @ournet/domain
yarn link @ournet/places-domain
yarn link dynamo-model

yarn test
