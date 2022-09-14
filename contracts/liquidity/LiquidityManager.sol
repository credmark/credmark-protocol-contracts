// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../external/uniswap/v3-core/contracts/libraries/TickMath.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "../libraries/Time.sol";

import "../interfaces/ILiquidityManager.sol";
import "../configuration/CLiquidityManager.sol";

contract LiquidityManager is
    ILiquidityManager,
    CLiquidityManager,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

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

    int24 private tickUpper = 870000;
    int24 private tickLower = -870000;
    int24 private tickInit = -276300;

    uint256 public started = 0;

    function start() external override nonReentrant manager {
        require(started == 0, "S");
        uint256 currentBlockTimestamp = Time.now_u256();
        started = currentBlockTimestamp;

        uint256 modlBalance = modl.balanceOf(address(this));
        require(modlBalance > 0, "ZB");

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
        usdc.safeApprove(address(SWAP), usdcBalance);

        SWAP.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(usdc),
                tokenOut: address(modl),
                fee: POOL_FEE,
                recipient: address(this),
                deadline: Time.now_u256(),
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
        require(Time.now_u256() > started + lockup, "TL");
        NFPM.transferFrom(address(this), revenueTreasury, liquidityTokenId);
    }
}
