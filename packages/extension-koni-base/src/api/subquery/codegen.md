## Run this after change query from folder extension-koni-base
- Generate code for SubQuery crowdloans: `npx apollo codegen:generate --endpoint=https://api.subquery.network/sq/subvis-io/polkadot-auctions-and-crowdloans --includes=./src/api/subquery/crowdloan.ts --target=typescript --tagName=gql --globalTypesFile="./src/api/subquery/crowdloanTypes.ts"`