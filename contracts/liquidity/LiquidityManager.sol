// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../external/uniswap/v3-core/contracts/libraries/TickMath.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

import "../interfaces/ILiquidityManager.sol";
import "../configuration/CLiquidityManager.sol";

contract LiquidityManager is
    ILiquidityManager,
    CLiquidityManager,
    ReentrancyGuard
{
    constructor(ConstructorParams memory params) CLiquidityManager(params) {}

    INonfungiblePositionManager private constant NFPM =
        INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    ISwapRouter private constant SWAP =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IUniswapV3Factory private constant FACT =
        IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);

    IUniswapV3Pool public pool;
    uint256 public liquidityTokenId;
    uint128 public currentLiquidity;
    uint24 public constant POOL_FEE = 10000;

    int24 tickUpper = 870000;
    int24 tickLower = -870000;
    int24 tickInit = -276300;

    bool private _mutexLocked;
    uint256 public started = 0;

    uint160 sqrtPriceLimitSnap;
    uint256 sqrtPriceLimitSnapTimestamp;

    function start() external override nonReentrant manager {
        require(started == 0, "S");
        require(modl.balanceOf(address(this)) > 0, "ZB");

        address poolAddress = FACT.createPool(
            address(modl),
            address(usdc),
            POOL_FEE
        );
        require(poolAddress != address(0), "VE:poolAddress");

        pool = IUniswapV3Pool(poolAddress);
        address token0 = pool.token0();
        address token1 = pool.token1();

        if (token0 == address(modl)) {
            tickLower = tickInit + 100;
        } else {
            tickInit = -tickInit;
            tickUpper = tickInit - 100;
        }

        pool.initialize(TickMath.getSqrtRatioAtTick(tickInit));

        modl.approve(address(NFPM), modl.balanceOf(address(this)));

        (uint256 tokenId, uint128 liquidity, , ) = NFPM.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: POOL_FEE,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: IERC20(token0).balanceOf(address(this)),
                amount1Desired: IERC20(token1).balanceOf(address(this)),
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            })
        );

        liquidityTokenId = tokenId;
        currentLiquidity = liquidity;
        started = block.timestamp;
        emit Start(poolAddress);
    }

    function clean(uint160 sqrtPriceLimitX96_)
        external
        override
        nonReentrant
        manager
    {
        require(started != 0, "NS");

        (uint160 sqrtPriceLimitX96Check, , , , , , ) = pool.slot0();
        require(
            sqrtPriceLimitX96Check == sqrtPriceLimitX96_,
            "VE:sqrtPriceLimitX96Check"
        );

        NFPM.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: liquidityTokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        uint256 usdcBalance = usdc.balanceOf(address(this));
        require(usdc.approve(address(SWAP), usdcBalance));

        SWAP.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(usdc),
                tokenOut: address(modl),
                fee: POOL_FEE,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: usdcBalance,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );

        uint256 modlBalance = modl.balanceOf(address(this));
        require(modl.transfer(revenueTreasury, modlBalance));

        emit Clean(sqrtPriceLimitX96_, usdcBalance, modlBalance);
    }

    function transferPosition() external configurer {
        require(started != 0, "NS");
        require(block.timestamp > started + lockup, "TL");
        NFPM.transferFrom(address(this), revenueTreasury, liquidityTokenId);
    }
}
