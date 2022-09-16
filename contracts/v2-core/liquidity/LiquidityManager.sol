// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../../external/uniswap/v3-core/contracts/libraries/TickMath.sol";
import "../../external/uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../../external/uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

import "../interfaces/ILiquidityManager.sol";
import "../configuration/CLiquidityManager.sol";
import "../util/permissions/Manager.sol";
import "../util/permissions/Configurer.sol";

contract LiquidityManager is
    ILiquidityManager,
    CLiquidityManager,
    ReentrancyGuard,
    Manager,
    Configurer
{
    using SafeERC20 for IERC20;
    IUniswapV3Factory private constant FACT =
        IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);
    INonfungiblePositionManager private constant NFPM =
        INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    ISwapRouter private constant SWAP =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    IUniswapV3Pool public immutable pool;
    uint256 public liquidityTokenId;
    uint128 public currentLiquidity;
    uint24 public constant POOL_FEE = 10000;

    int24 private immutable tickUpper;
    int24 private immutable tickLower;
    int24 private immutable tickInit;
    address private immutable token0;
    address private immutable token1;

    uint256 public started = 0;

    constructor(ConstructorParams memory params) CLiquidityManager(params) {
        bool ist0 = params.modlAddress < params.usdcAddress;
        token0 = ist0 ? address(modl) : address(usdc);
        token1 = ist0 ? address(usdc) : address(modl);
        tickUpper = ist0 ? int24(870000) : int24(276200);
        tickLower = ist0 ? int24(-276200) : int24(-870000);
        tickInit = ist0 ? int24(-276300) : int24(276300);

        address poolAddress = FACT.createPool(
            address(modl),
            address(usdc),
            POOL_FEE
        );

        pool = IUniswapV3Pool(poolAddress);

        require(poolAddress != address(0), "VE:poolAddress");
        pool.initialize(TickMath.getSqrtRatioAtTick(tickInit));
    }

    function start() external override nonReentrant manager {
        require(started == 0, "S");
        uint256 currentBlockTimestamp = block.timestamp;

        uint256 modlBalance = modl.balanceOf(address(this));
        require(modlBalance > 0, "ZB");

        IERC20(modl).safeApprove(address(NFPM), modlBalance);

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
                deadline: currentBlockTimestamp
            })
        );

        liquidityTokenId = tokenId;
        currentLiquidity = liquidity;
        started = currentBlockTimestamp;
        emit Start(address(pool));
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
        usdc.safeApprove(address(SWAP), usdcBalance);

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
        IERC20(modl).safeTransfer(revenueTreasury, modlBalance);

        emit Clean(sqrtPriceLimitX96_, usdcBalance, modlBalance);
    }

    function transferPosition() external configurer {
        require(started != 0, "NS");
        require(block.timestamp > started + lockup, "TL");
        NFPM.transferFrom(address(this), revenueTreasury, liquidityTokenId);
    }
}
