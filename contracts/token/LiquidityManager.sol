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

    IUniswapV3Pool public pool;
    uint256 public liquidityTokenId;
    uint128 public currentLiquidity;
    uint24 public constant POOL_FEE = 10000;

    uint160 internal sqrtPriceRatio = 1461446703485210103287273052203988822378723970341;
    int24 tickUpper = 870000;
    int24 tickLower = -870000;
    int24 tickInit = 276300;

    bool private _mutexLocked;
    bool public started = false;

    event Started();
    event Cleanup(uint256 modlBurned);
    event LiquidityDecreased(uint128 liquidityRemoved);

    constructor(address modl_, address usdc_) {

        USDC = IERC20(usdc_);
        MODL = IModl(modl_);

    }

    modifier lock() {
        require(!_mutexLocked, "CMERR: mutex locked");
        _mutexLocked = true;
        _;
        _mutexLocked = false;
    }

    function start() external lock() {

        require(!started, "CMERR: Pool already Started");
        require(
            MODL.balanceOf(address(this)) > 0,
            "CMERR: Can't start without Tokens"
        );

        address poolAddress = FACT.createPool(
            address(MODL),
            address(USDC),
            POOL_FEE
        );

        require(poolAddress != address(0), "CMERR: Couldn't create uniswap pool.");

        pool = IUniswapV3Pool(poolAddress);

        if (pool.token0() == address(MODL)){
            tickLower = tickInit + 100;
        } else {
            tickInit = -tickInit;
            tickUpper = tickInit - 100;
        }

        pool.initialize(
            TickMath.getSqrtRatioAtTick(tickInit)
        );

        require(address(pool) != address(0), "CMERR: Pool Not Created Successfully");

        TransferHelper.safeApprove(address(MODL), address(NFPM), MODL.balanceOf(address(this)));

        (uint256 tokenId, uint128 liquidity, , ) = NFPM.mint(
            INonfungiblePositionManager.MintParams({
                token0: pool.token0(),
                token1: pool.token1(),
                fee: pool.fee(),
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: IERC20(pool.token0()).balanceOf(address(this)),
                amount1Desired: IERC20(pool.token1()).balanceOf(address(this)),
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            }));

        liquidityTokenId = tokenId;
        currentLiquidity = liquidity;
        started = true;
        emit Started();
    }


    function clean() external lock() {
        require(started, "CMERR: Pool not started");
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
                sqrtPriceLimitX96: 0
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
