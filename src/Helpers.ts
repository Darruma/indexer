import { LiquidityPoolEntity, TokenEntity } from "./src/Types.gen";

import {
  WHITELISTED_TOKENS,
  TEN_TO_THE_18_BI,
  STABLECOIN_POOL_ADDRESSES,
} from "./Constants";

import { MinimalPool } from "./CustomTypes";

import { createdPools } from "./Store";

// Helper function to normalize token amounts to 1e18
export const normalizeTokenAmountTo1e18 = (
  token_address: string,
  amount: bigint
): bigint => {
  let token = WHITELISTED_TOKENS.find(
    (token) => token.address.toLowerCase() === token_address.toLowerCase()
  );
  if (token) {
    return (amount * TEN_TO_THE_18_BI) / BigInt(10 ** token.decimals);
  } else {
    return amount;
  }
};

// Function to calculate the price of ETH as the weighted average of ETH price from the stablecoin vs ETH pools
export const calculateETHPriceInUSD = (
  stablecoin_pools: LiquidityPoolEntity[]
): bigint => {
  let totalWeight = 0n;
  let weightedPriceSum = 0n;

  // TODO check that each stablecoin pool has sufficient liquidity for it to be used in the calculation
  for (let pool of stablecoin_pools) {
    // Use token0 price of pool as ETH price
    // assumption is that all stablecoin pools are token0 = ETH, token1 = stablecoin
    const ethPrice = pool.token0Price;

    // Use reserve0 as weight numerator
    const weight = pool.reserve0;

    // Calculate weighted average of ETH price
    weightedPriceSum += ethPrice * weight;

    // Sum weight denominator
    totalWeight += weight;
  }

  let ethPriceInUSD = totalWeight > 0n ? weightedPriceSum / totalWeight : 0n;

  return ethPriceInUSD;
};

// Helper function to check if a pool is a stablecoin pool
export const isStablecoinPool = (pool_address: string): boolean => {
  return STABLECOIN_POOL_ADDRESSES.some(
    (address) => address.toLowerCase() === pool_address
  );
};

// Function to return the relevant pool addresses for pricing
export const findRelevantPoolAddresses = (
  token_address: string
): MinimalPool[] => {
  let relevant_pools: MinimalPool[] = [];
  // Search through createdPools and add the relevant pools to relevant_pools list
  for (let pool of createdPools) {
    if (
      pool.token0_address.toLowerCase() === token_address.toLowerCase() ||
      pool.token1_address.toLowerCase() === token_address.toLowerCase()
    ) {
      relevant_pools.push(pool);
    }
  }

  return relevant_pools;
};

// Helper function to extract the Token entity from a list of Token entities
export const extractTokenEntity = (
  tokenEntities: TokenEntity[],
  tokenAddress: string
): TokenEntity => {
  // Try to find the token entity by matching given address against the id of the token
  let token_entity = tokenEntities.find((token) => token.id === tokenAddress);

  // if token entity is found, return it
  if (token_entity) {
    return token_entity;
  } else {
    // if token entity is not found, throw an error
    throw new Error("Token entity not found");
  }
};
