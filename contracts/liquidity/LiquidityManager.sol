// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../configuration/CLiquidityManager.sol";

import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "../external/uniswap/v3-core/contracts/libraries/TickMath.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../external/uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "../token/Modl.sol";

contract LiquidityManager is CLiquidityManager {
    INonfungiblePositionManager private constant NFPM =
        INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    ISwapRouter private constant SWAP =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IUniswapV3Factory private constant FACT =
        IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);

    IERC20 private USDC;
    Modl private MODL;
    uint256 launchLiquidity;

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

    event Started();
    event Cleanup(uint256 modlBurned);

    constructor(ConstructorParams memory params) {
        USDC = IERC20(params.usdcAddress);
        MODL = Modl(params.modlAddress);
        launchLiquidity = params.launchLiquidity;
    }

    modifier lock() {
        require(!_mutexLocked, "CMERR: mutex locked");
        _mutexLocked = true;
        _;
        _mutexLocked = false;
    }

    function mint() external lock {
        require(started == 0, "CMERR: Pool already Started");
        require(launchLiquidity > 0, "CMERR: No liquidity");
        require(MODL.balanceOf(address(this)) == 0, "CMERR: Already minted");
        MODL.mint(address(this), launchLiquidity);
        require(MODL.balanceOf(address(this)) == launchLiquidity);
        MODL.renounceRole(MODL.MINTER_ROLE(), address(this));
        require(!MODL.hasRole(MODL.MINTER_ROLE(), address(this)));
    }

    function start() external lock manager {
        require(started == 0, "CMERR: Pool already Started");
        require(
            MODL.balanceOf(address(this)) > 0,
            "CMERR: Can't start without Tokens"
        );

        address poolAddress = FACT.createPool(
            address(MODL),
            address(USDC),
            POOL_FEE
        );

        require(
            poolAddress != address(0),
            "CMERR: Couldn't create uniswap pool."
        );

        pool = IUniswapV3Pool(poolAddress);

        if (pool.token0() == address(MODL)) {
            tickLower = tickInit + 100;
        } else {
            tickInit = -tickInit;
            tickUpper = tickInit - 100;
        }

        pool.initialize(TickMath.getSqrtRatioAtTick(tickInit));

        require(
            address(pool) != address(0),
            "CMERR: Pool Not Created Successfully"
        );

        TransferHelper.safeApprove(
            address(MODL),
            address(NFPM),
            MODL.balanceOf(address(this))
        );

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
            })
        );

        liquidityTokenId = tokenId;
        currentLiquidity = liquidity;
        started = block.timestamp;
        emit Started();
    }

    function clean(uint160 sqrtPriceLimitX96) external manager {
        require(started != 0, "CMERR: Pool not started");

        (uint160 sqrtPriceLimitX96Check, , , , , , ) = pool.slot0();
        require(
            sqrtPriceLimitX96Check == sqrtPriceLimitX96,
            "CMERR: sqrtPriceLimit doesn't match."
        );

        (uint256 amount0, ) = NFPM.collect(
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

    function transferPosition(address to) external configurer {
        require(started != 0, "CMERR: Not Started");
        require(
            block.timestamp > started + (365 * 2 * 86400),
            "CMERR: Cannot transfer ownership for 2 years."
        );
        NFPM.transferFrom(address(this), to, liquidityTokenId);
    }
}
