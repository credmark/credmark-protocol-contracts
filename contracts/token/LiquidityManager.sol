// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "../external/uniswap/v3-core/contracts/libraries/TickMath.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../external/uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "./IModl.sol";

contract LiquidityManager {
    INonfungiblePositionManager private constant NFPM =
        INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    ISwapRouter private constant SWAP =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IUniswapV3Factory private constant FACT =
        IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);

    IERC20 private USDC;
    IModl private MODL;

    address public UNISWAP_POOL_ADDR;
    uint256 public liquidityTokenId;
    uint128 public currentLiquidity;
    uint24 public constant POOL_FEE = 10000;
    int24 public constant TICK_0 = -280000;

    bool private _mutexLocked;

    event Started(address poolAddress);
    event Cleanup(uint256 modlBurned);
    event LiquidityDecreased(uint128 liquidityRemoved);

    constructor(address modl_, address usdc_) {
        //TODO: The CMK Twap is for token 0 status i think...
        // I think these may be inverted.
        // Also the fact that usdc is 6 decimals makes all these numbers super fucked up.
        // :(
        require(modl_ > usdc_, "ERROR: Modl must be token 1");

        USDC = IERC20(usdc_);
        MODL = IModl(modl_);
    }

    modifier lock() {
        require(!_mutexLocked, "ERROR: mutex locked");
        _mutexLocked = true;
        _;
        _mutexLocked = false;
    }

    function start() external {
        require(
            MODL.balanceOf(address(this)) > 0,
            "Can't start until I've got Modl, bb"
        );

        UNISWAP_POOL_ADDR = FACT.createPool(
            address(this),
            address(USDC),
            POOL_FEE
        );

        IUniswapV3Pool(UNISWAP_POOL_ADDR).initialize(
            TickMath.getSqrtRatioAtTick(TICK_0)
        );

        (uint256 tokenId, uint128 liquidity, , ) = NFPM.mint(
            INonfungiblePositionManager.MintParams({
                token0: address(USDC),
                token1: address(MODL),
                fee: POOL_FEE,
                tickLower: TickMath.MIN_TICK,
                tickUpper: TICK_0,
                amount0Desired: 0,
                amount1Desired: MODL.balanceOf(address(this)),
                amount0Min: 0,
                amount1Min: 1,
                recipient: address(this),
                deadline: block.timestamp
            })
        );
        liquidityTokenId = tokenId;
        currentLiquidity = liquidity;

        emit Started(UNISWAP_POOL_ADDR);
    }

    function cleanup() external lock {
        (uint256 amount0, uint256 amount1) = NFPM.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: liquidityTokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        TransferHelper.safeApprove(
            address(USDC),
            address(SWAP),
            USDC.balanceOf(address(this))
        );

        SWAP.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(USDC),
                tokenOut: address(MODL),
                fee: POOL_FEE,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: USDC.balanceOf(address(this)),
                amountOutMinimum: 0,
                sqrtPriceLimitX96: TickMath.MIN_SQRT_RATIO + 1
            })
        );

        uint256 modlBalanceToBurn = MODL.balanceOf(address(this));
        MODL.burn(modlBalanceToBurn);

        emit Cleanup(modlBalanceToBurn);
    }

    function decreaseLiquidity() external lock {
        // TODO: figure out when we'd want to do this, if ever.
        uint128 liquidityToRemove = currentLiquidity / 50;

        (, uint256 amount1) = NFPM.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: liquidityTokenId,
                liquidity: liquidityToRemove,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp + 120
            })
        );

        currentLiquidity -= liquidityToRemove;
        emit LiquidityDecreased(liquidityToRemove);
    }
}
