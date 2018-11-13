#!/bin/bash

yarn remove @ournet/domain
yarn remove @ournet/places-domain
yarn remove dynamo-item

yarn link @ournet/domain
yarn link @ournet/places-domain
yarn link dynamo-item

yarn test
